# Engage Referral Program — Implementation Plan

## Overview

A two-sided referral program where existing customers (Engage users) can refer new businesses to Engage. When a referred business subscribes to a paid plan, the referrer earns a reward. Two reward modes are supported:

1. **One-time reward** — A fixed percentage (50%) of the first subscription payment goes to the referrer.
2. **Recurring reward** — A smaller percentage (e.g., 10%) of each subscription payment as long as the business remains active.

Recurring is the recommended mode for both the referrer (ongoing income) and Engage (predictable, lower payout ratio).

## Key Clarifications

### User Flow
- The referrer is an existing Engage customer who has an account and can share their referral code
- The referred party (business owner) creates a business through the business signup flow. They must be logged in as an Engage user first (customer signup is required before business signup)
- The referral code is passed via URL params (`?ref=ENGXXXXXXXX`) on the business signup page, and forwarded to the business creation API
- The API looks up the referrer from the referral code and creates a `referrals` record linking `referrer_id` → `referred_business_id`

### Loyalty Points

Referrers receive two types of rewards when a referred business subscribes:

 1. **Commission money (USD)** — Tracked in `referral_commissions` table. The referrer earns a percentage of the referred business's payment (50% for one-time, 10% for recurring). This money can be **withdrawn** once the referrer reaches the **$100 minimum threshold**. Withdrawals are processed via **Paystack** or **M-Pesa** (manual payout by super admin initially).

2. **Loyalty points** — Equivalent to `commission_amount * 100` (1 point per $0.01). These are separate from the money and are awarded simultaneously via `award_engagement_points()`. Points go to the system "Engage" business entity (slug = `engage`) at `engagespin.com/admin/engage`, allowing the referrer to participate in Engage experiences just like any business customer would:
   - Spin the Engage wheel for prizes
   - Enter draws and promotions
   - Play trivia challenges
   - Get early access to new features

**Affiliate enrollment criteria:**
- Referrers **without an active business**: Use affiliate points directly at `engagespin.com/admin/engage`
- Referrers **with an active business**: Auto-enrolled in Engage experiences (opt-out available)
- **Top earning affiliates**: Can qualify to become admins of the Engage business, enabling them to run custom games for the community

## Current State

### Existing Infrastructure
- **`users` table** (`src/db/schema.sql:28`): Has `referral_code` column, auto-generated as `ENG` + 8 hex chars on signup via `generate_user_referral_code()` trigger.
- **`referrals` table** (`src/db/schema.sql:74`): Tracks customer-to-customer referrals. Has `referrer_id`, `referred_email`, `referred_user_id`, `referral_code`, `status`, `conversion_type`, `reward_points`.
- **`process_referral_on_activation()`** (`src/db/engagement_tool.sql:1052`): Processes customer referrals when a user activates with a business, awards loyalty points to the referrer.
- **`businesses` table** (`src/db/engagement_tool.sql:6`): Has `plan`, `subscription_status`, `payment_method`, `paystack_customer_code`, etc.
- **`business_payments` table** (`src/db/engagement_tool.sql:70`): Tracks payments with `amount`, `plan`, `billing_cycle`, `status`, `paid_at`.
- **`activateBusinessSubscription()`** (`src/lib/services/paystack.ts:119`): Called from Paystack and M-Pesa webhooks to activate subscriptions.
- **Pricing**: Starter $29/mo, Pro $79/mo, Enterprise $194/mo. Early bird: Bronze $697, Silver $1,797, Gold $4,997 (one-time/lifetime).

### Gaps
1. `referrals` table has no `referred_business_id` — can't track business referrals
2. No `referral_type` distinction (customer→customer vs customer→business)
3. No commission config (type, rate, plan-specific rates)
4. No subscription event processing for referral payouts
5. No UI for customers to view/share their referral code or earnings
6. No admin UI for configuring referral program

## Implementation Plan

### Phase 1: Database Schema

#### 1.1 Extend `referrals` table

Add columns to support business referrals:

```sql
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS referred_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_type TEXT NOT NULL DEFAULT 'customer'
    CHECK (referral_type IN ('customer', 'business')),
  ADD COLUMN IF NOT EXISTS commission_type TEXT NOT NULL DEFAULT 'one_time'
    CHECK (commission_type IN ('one_time', 'recurring')),
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,4) DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS first_commission_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_plan TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

#### 1.2 Create `referral_commissions` table

```sql
CREATE TABLE IF NOT EXISTS referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring')),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    plan TEXT,
    billing_cycle TEXT,
    
    payment_id UUID REFERENCES business_payments(id) ON DELETE SET NULL,
    
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 Create `process_business_referral` function

Called when a business becomes a paying subscriber:

```sql
CREATE OR REPLACE FUNCTION process_business_referral(p_business_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_business businesses%ROWTYPE;
    v_referrer users%ROWTYPE;
    v_referral referrals%ROWTYPE;
    v_commission_rate NUMERIC;
    v_commission_amount NUMERIC;
    v_total_paid NUMERIC;
    v_result JSON;
BEGIN
    -- Get business
    SELECT * INTO v_business FROM businesses WHERE id = p_business_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Business not found');
    END IF;

    -- Find the referral record linking this business
    SELECT * INTO v_referral
    FROM referrals
    WHERE referred_business_id = p_business_id
      AND status = 'joined'
      AND referral_type = 'business'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No pending business referral');
    END IF;

    -- Get referrer
    SELECT * INTO v_referrer FROM users WHERE id = v_referral.referrer_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Referrer not found');
    END IF;

    -- Determine commission rate (plan-specific or default)
    v_commission_rate := COALESCE(v_referral.commission_rate, 0.50);

    -- Get total amount paid by this business
    SELECT SUM(amount) INTO v_total_paid
    FROM business_payments
    WHERE business_id = p_business_id AND status = 'completed';

    IF v_total_paid IS NULL OR v_total_paid = 0 THEN
        RETURN json_build_object('success', false, 'error', 'No successful payments');
    END IF;

    -- Calculate commission
    -- One-time: first payment only
    -- Recurring: every payment
    IF v_referral.commission_type = 'one_time' THEN
        IF v_referral.first_commission_paid THEN
            -- Already paid one-time commission
            RETURN json_build_object('success', false, 'error', 'One-time commission already paid');
        END IF;
        -- Find the first payment
        SELECT amount INTO v_commission_amount
        FROM business_payments
        WHERE business_id = p_business_id AND status = 'completed'
        ORDER BY paid_at ASC LIMIT 1;
    ELSE
        -- Recurring: pay commission for all unpaid payments
        -- This will be called after each payment, so we only need to process the latest
        SELECT amount INTO v_commission_amount
        FROM business_payments
        WHERE business_id = p_business_id AND status = 'completed'
        ORDER BY paid_at DESC LIMIT 1;
    END IF;

    v_commission_amount := v_commission_amount * v_commission_rate;

    -- Award commission
    INSERT INTO referral_commissions (
        referral_id, referrer_id, referred_business_id,
        type, amount, currency, plan, billing_cycle,
        payment_id
    )
    SELECT
        v_referral.id, v_referrer.id, p_business_id,
        v_referral.commission_type, v_commission_amount,
        'USD', v_business.plan,
        (SELECT billing_cycle FROM business_payments WHERE business_id = p_business_id ORDER BY paid_at DESC LIMIT 1),
        (SELECT id FROM business_payments WHERE business_id = p_business_id AND status = 'completed' ORDER BY paid_at DESC LIMIT 1);

    -- Award loyalty points immediately to system "Engage" business entity
    -- Points = commission_amount * 100 (1 point per $0.01 of commission)
    -- These points let the referrer participate in Engage experiences
    -- (spins, draws, trivia, early access) at engagespin.com/admin/engage
    PERFORM award_engagement_points(
        v_referrer.id,
        get_system_business_id(),
        ROUND(v_commission_amount * 100),
        'referral_bonus',
        'Referral commission: ' || v_business.name || ' (' || v_referral.commission_type || ')',
        jsonb_build_object(
            'referral_id', v_referral.id,
            'business_id', p_business_id,
            'business_name', v_business.name,
            'commission_amount', v_commission_amount,
            'plan', v_business.plan
        )
    );

    -- Update referral record
    IF v_referral.commission_type = 'one_time' THEN
        UPDATE referrals
        SET first_commission_paid = TRUE,
            status = 'completed',
            updated_at = NOW()
        WHERE id = v_referral.id;
    ELSE
        UPDATE referrals
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = v_referral.id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'commission_amount', v_commission_amount,
        'commission_rate', v_commission_rate,
        'commission_type', v_referral.commission_type,
        'referrer_id', v_referrer.id,
        'business_name', v_business.name
    );
END;
$$;
```

#### 1.4 Create `get_user_referral_dashboard` function

```sql
CREATE OR REPLACE FUNCTION get_user_referral_dashboard(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_referral_code TEXT;
    v_referral_link TEXT;
    v_total_earned NUMERIC;
    v_pending_earnings NUMERIC;
    v_referred_business_count INTEGER;
    v_active_referrals INTEGER;
    v_result JSON;
BEGIN
    SELECT referral_code INTO v_referral_code
    FROM users WHERE id = p_user_id;

    v_referral_link := COALESCE(
        'https://engagespin.com/business/signup?ref=' || v_referral_code,
        'Not available'
    );

    -- Total earned (all paid commissions, in USD)
    SELECT COALESCE(SUM(rc.amount), 0) INTO v_total_earned
    FROM referral_commissions rc
    JOIN referrals r ON rc.referral_id = r.id
    WHERE r.referrer_id = p_user_id AND rc.status = 'paid';

    -- Pending earnings (commissions with status 'pending')
    SELECT COALESCE(SUM(rc.amount), 0) INTO v_pending_earnings
    FROM referral_commissions rc
    JOIN referrals r ON rc.referral_id = r.id
    WHERE r.referrer_id = p_user_id AND rc.status = 'pending';

    -- Total loyalty points earned from referrals
    -- (tracked separately under system "Engage" business entity)

    -- Count referred businesses (completed)
    SELECT COUNT(*) INTO v_referred_business_count
    FROM referrals
    WHERE referrer_id = p_user_id
      AND referral_type = 'business'
      AND status IN ('joined', 'completed');

    -- Count active referrals (businesses still subscribed)
    SELECT COUNT(*) INTO v_active_referrals
    FROM referrals r
    JOIN businesses b ON b.id = r.referred_business_id
    WHERE r.referrer_id = p_user_id
      AND r.referral_type = 'business'
      AND b.subscription_status = 'active';

    SELECT json_build_object(
        'referral_code', v_referral_code,
        'referral_link', v_referral_link,
        'total_earned', v_total_earned,
        'pending_earnings', v_pending_earnings,
        'referred_business_count', v_referred_business_count,
        'active_referrals', v_active_referrals
    ) INTO v_result;

    RETURN v_result;
END;
$$;
```

### Phase 2: Business Signup Integration

#### 2.1 Update business signup form (`src/app/(public)/business/signup/page.tsx`)

The business signup page already requires users to be logged in as Engage customers first (redirects to signup if no profile). Add:
- Read `referralCode` from URL search params (`?ref=ENGXXXXXXXX`)
- Pass `referralCode` to the business creation API as an optional field

#### 2.2 Update business creation API (`src/app/api/business/create/route.ts`)

1. Accept optional `referralCode` in the request body
2. If `referralCode` is provided, look up the referrer by `referral_code`
3. Create a `referrals` record with:
   - `referrer_id` = the user who shared the code
   - `referred_business_id` = the newly created business
   - `referral_type = 'business'`
   - `status = 'joined'`
   - `conversion_type = 'signup'`
4. Do NOT award commission yet — that happens when the business pays

#### 2.3 Update `activateBusinessSubscription` (`src/lib/services/paystack.ts`)

After successful subscription activation, call `process_business_referral(businessId)` to process any pending referral commissions.

### Phase 3: Customer-Facing UI

#### 3.1 Referral Dashboard Page (`src/app/(store)/referral/page.tsx`)

Displays:
- User's referral code + shareable link
- Total earnings (real money + loyalty points)
- Pending commissions
- Count of referred businesses
- Active vs completed referrals
- Commission mode toggle (one-time vs recurring) — let users choose their preference

#### 3.2 Navigation to Referral Dashboard

Add a link in the customer account navigation (`src/app/(store)/account/page.tsx`).

### Phase 4: Business Owner Referral Configuration

#### 4.1 Business Referral Settings (`src/app/(admin)/admin/[businessSlug]/referrals/page.tsx`)

For business owners to:
- See who referred them
- View referral terms (one-time vs recurring commission rates for their plan)

### Phase 5: Admin Panel

#### 5.1 Referral Program Admin (`src/app/(admin)/admin/referrals/page.tsx`)

For Engage platform admins to:
- View all business referrals
- Manually process/cancel commissions
- Configure default commission rates per plan
- Monitor payouts

## Commission Structure

| Plan | One-time Commission | Recurring Commission (monthly) |
|------|-------------------|-------------------------------|
| Starter ($29/mo) | $14.50 (50%) | $2.90 (10%) |
| Pro ($79/mo) | $39.50 (50%) | $7.90 (10%) |
| Enterprise ($194/mo) | $97.00 (50%) | $19.40 (10%) |
| Bronze ($697 one-time) | $348.50 (50%) | $69.70 (10%) |
| Silver ($1,797 one-time) | $898.50 (50%) | $179.70 (10%) |
| Gold ($4,997 one-time) | $2,498.50 (50%) | $499.70 (10%) |

Default: **50% one-time** is the high-value option for immediate reward. **10% recurring** is the long-term option for sustainable passive income.

## Reward Delivery

Referrers receive two types of rewards when a referred business subscribes:

1. **Commission money (USD)** — Tracked in `referral_commissions` table. Earned as a percentage of the referred business's payment (50% one-time, 10% recurring). Can be withdrawn once the referrer reaches a **$100 minimum threshold**. Withdrawals are processed via **Paystack** or **M-Pesa** (manual payout by admin initially).

2. **Loyalty points** — Equivalent to `commission_amount * 100` (1 point per $0.01). Awarded **immediately** when `process_business_referral` runs (not at payout time). These points are awarded to the system "Engage" business entity (slug = `engage`) at `engagespin.com/admin/engage`, allowing the referrer to:
   - Spin to win free subscriptions and prizes
   - Enter draws and promotions
   - Play trivia challenges
   - Get early access to new features

**Withdrawal flow:**
- Customer requests withdrawal via `/api/referral/request-withdrawal` (minimum $100)
- Request goes into `referral_withdrawals` table with status `pending`
- Super admin views and processes requests via `/api/referral/withdrawals`
- Admin approves (processes via Paystack/M-Pesa) and marks as `paid`

## Status Flow

```
Referred Business:
pending → joined (business created with ref code) → completed (first payment) → [recurring: active] / [cancelled: business downgraded/churned]

Referred Customer (existing flow):
pending → joined (signup with ref) → completed (first business activation)
```

## Edge Cases

- **Business downgraded**: Recurring commissions stop; referrer notified
- **Payment failed**: Commission not processed until payment succeeds
- **Duplicate referral**: Only first valid referral code counts; second business from same referrer gets separate referral record
- **Early bird (lifetime)**: One-time commission only (no recurring), since the business never pays again
- **Referrer not active**: Commission still awarded to their account (can be claimed later)

## Affiliates & Engagement

Affiliates (customers with referral codes) play a key role in Engage's growth strategy. They:
1. Share their referral link with local businesses
2. Engage with those businesses once they sign up (spinning wheels, playing trivia, entering draws)
3. Earn commissions as those businesses subscribe and retain

This creates a flywheel: more referrals → more business engagement → more affiliate earnings → more referrals.

## System Business Entity

The `get_system_business_id()` helper function returns the system "Engage" business ID (slug = `engage`), which runs at `engagespin.com/admin/engage`. This entity is used for:
- Awarding loyalty points that let referrers participate in Engage experiences (spins, draws, trivia, early access)
- Running internal games for the affiliate community
- System-wide promotions (e.g., spinning to win free subscriptions)

Points are awarded via `award_engagement_points()` and function exactly like business customer points. Top earning affiliates can qualify to become admins of this Engage business and run custom games for the community.

**Reward flow:**
1. When a referred business subscribes → `process_business_referral` creates a commission record (USD tracking in `referral_commissions`) and awards loyalty points immediately
2. Admin later processes manual payout → `process_referral_payout` marks the commission as paid and pays the money via PayPal/M-Pesa

## Implementation Order

1. **SQL schema** — Extend `referrals`, create `referral_commissions`, create `process_business_referral` and `get_user_referral_dashboard` functions ✅
2. **Business signup** — Pass `referralCode` through API → create referral record ✅
3. **Subscription activation** — Hook `process_business_referral` into `activateBusinessSubscription` ✅
4. **Customer UI** — Referral dashboard page with code, link, earnings ✅
5. **Business owner view** — Simple page showing referral info for the business they own ✅
6. **Admin panel** — Manage referrals, configure rates, process manual payouts ✅
7. **Docs** — Add referral program documentation to the docs page ✅

## Files Created/Modified

### SQL
- `src/db/referral_program.sql` — New file: schema extensions, functions, RLS policies

### API
- `src/app/api/business/create/route.ts` — Added `referralCode` to schema, creates referral record

### Services
- `src/lib/services/paystack.ts` — Calls `process_business_referral` in `activateBusinessSubscription`

### Pages
- `src/app/(public)/business/signup/page.tsx` — Reads `ref` URL param, passes to API
- `src/app/(public)/account/referral/page.tsx` — New: customer referral dashboard
- `src/app/(public)/account/page.tsx` — Added "Referral Program" tab
- `src/app/(admin)/admin/[businessSlug]/referrals/page.tsx` — New: business owner referral info
- `src/app/(admin)/admin/referrals/page.tsx` — New: admin referral management panel
- `src/app/(public)/docs/page.tsx` — Added referral program documentation section
