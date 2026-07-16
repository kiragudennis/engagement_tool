-- ============================================
-- ENGAGE PLATFORM: Multi-Business Foundation
-- ============================================

-- 1. Businesses table
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#8B5CF6',
    brand_secondary_color TEXT DEFAULT '#EC4899',
    favicon_url TEXT,
    custom_domain TEXT UNIQUE,
    
    -- Subscription
    plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    
    -- Limits & overrides
    activation_duration_days INTEGER DEFAULT 30,
    require_reactivation_after_expiry BOOLEAN DEFAULT TRUE,
    max_spins_per_activation INTEGER DEFAULT 0, -- 0 = unlimited
    spins_this_month INTEGER DEFAULT 0,
    max_spins_per_month INTEGER DEFAULT 500,
    
    -- Settings
    require_email_for_prize BOOLEAN DEFAULT TRUE,
    show_branding_on_live BOOLEAN DEFAULT TRUE,
    
    -- Contact
    admin_email TEXT NOT NULL,
    admin_name TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add payment tracking to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS next_billing_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('mpesa', 'paystack', 'card', 'none'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('retail', 'restaurant', 'service', 'event', 'other')) DEFAULT 'retail';
-- add paystack_customer_code, paystack_subscription_code, mpesa_phone
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mpesa_phone TEXT;
-- Add early_bronze, early_silver, early_gold in plans
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
-- Add column for points awarded on code redemption
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS points_per_redemption INTEGER DEFAULT 10;

-- Comment on the column
COMMENT ON COLUMN businesses.points_per_redemption IS 'Loyalty points awarded to customer each time they redeem a code';

-- Add the new constraint with updated values
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_check
    CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise', 'early_bronze', 'early_silver', 'early_gold'));


-- Payment transactions
CREATE TABLE IF NOT EXISTS business_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    plan TEXT NOT NULL,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual', 'one_time')) DEFAULT 'monthly',
    
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'paypal', 'card')),
    payment_reference TEXT,
    transaction_id TEXT,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    metadata JSONB DEFAULT '{}',
    
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add payment_method TEXT NOT NULL CHECK (payment_method IN ('paystack', 'mpesa', 'paypal', 'card'))
DROP CONSTRAINT IF EXISTS business_payments_payment_method_check ON business_payments;
ALTER TABLE business_payments ADD CONSTRAINT business_payments_payment_method_check CHECK (payment_method IN
    ('mpesa', 'paystack', 'paypal', 'card'));


-- 2. Business admin users
CREATE TABLE business_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'host')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- 3. Access codes (activation keys)
CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('public', 'single_use', 'time_limited', 'bulk', 'qr')),
    label TEXT, -- "Friday Night Event", "Receipt Codes Week 24"
    description TEXT,
    
    -- What this code unlocks
    unlocks TEXT NOT NULL DEFAULT 'spin' CHECK (unlocks IN ('spin', 'trivia', 'draw', 'both', 'spin_draw', 'trivia_draw', 'all')),
    
    -- Limits
    max_uses INTEGER, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    
    -- Time restrictions
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add require_activation flag to access_codes
ALTER TABLE access_codes 
ADD COLUMN IF NOT EXISTS require_activation BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN access_codes.require_activation IS 'If TRUE, only users who are activated (have redeemed a code in the last 30 days) can use this code. Public marketing codes should set this to FALSE.';

-- Points configuration
ALTER TABLE access_codes add column point_value INTEGER DEFAULT NULL;

-- Batch tracking (for sticker/receipt batches)
ALTER TABLE access_codess add column batch_id UUID;
ALTER TABLE access_codes add column batch_label TEXT;

-- Loyalty Tier
ALTER TABLE access_codes ADD COLUMN tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'bronze', 'silver', 'gold', 'platinum'));

-- 4. Code usage tracking
CREATE TABLE access_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID REFERENCES access_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customer-business activations
CREATE TABLE customer_business_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    activated_by_code_id UUID REFERENCES access_codes(id),
    activation_source TEXT CHECK (activation_source IN ('code', 'purchase', 'event', 'manual')),
    
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    spins_used INTEGER DEFAULT 0,
    trivia_participated INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- 6. Add to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS home_business_id UUID REFERENCES businesses(id),
ADD COLUMN IF NOT EXISTS created_via_code_id UUID REFERENCES access_codes(id),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 7(a). Business Receipts
CREATE TABLE IF NOT EXISTS business_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Receipt details
    receipt_number TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    items JSONB DEFAULT '[]'::jsonb,
    
    -- The code generated for this receipt
    access_code_id UUID REFERENCES access_codes(id),
    code TEXT NOT NULL,
    points_earned INTEGER DEFAULT 0,
    
    -- Transaction metadata
    cashier_name TEXT,
    register_id TEXT,
    store_location TEXT,
    transaction_id TEXT,
    payment_method TEXT,
    customer_phone TEXT,
    customer_name TEXT,
    
    -- How it was generated
    source TEXT DEFAULT 'dashboard' CHECK (source IN ('dashboard', 'api', 'sticker_batch', 'manual')),
    
    -- Printer status
    print_status TEXT DEFAULT 'not_required' CHECK (print_status IN ('pending', 'printed', 'failed', 'not_required')),
    printer_device_id UUID,
    receipt_template TEXT DEFAULT 'standard',
    
    -- Who generated it
    created_by UUID REFERENCES users(id),
    
    -- Metadata for future expansion
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7(b). Business API Keys
CREATE TABLE IF NOT EXISTS business_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    
    -- What this key can do
    permissions JSONB DEFAULT '["receipt:create"]'::jsonb,
    
    -- Usage tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    request_count INTEGER DEFAULT 0,
    
    -- Who created it
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7(c). Business Printers (Bluetooth/USB/Network)
CREATE TABLE IF NOT EXISTS business_printers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    device_type TEXT DEFAULT 'bluetooth' CHECK (device_type IN ('bluetooth', 'usb', 'network')),
    device_address TEXT,
    printer_model TEXT DEFAULT 'YCP-58',
    paper_width TEXT DEFAULT '58mm',
    
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7(d). Sticker Batches (tracking bulk sticker generation)
CREATE TABLE IF NOT EXISTS sticker_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    batch_label TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    
    -- Rarity distribution stored for reference
    distribution JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [{"rarity": "bronze", "count": 70, "points": 5}, ...]
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7(e). Business Code Sequences (auto-increment per business)
CREATE TABLE IF NOT EXISTS business_code_sequences (
    business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    last_sequence INTEGER DEFAULT 0
);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE business_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_batches ENABLE ROW LEVEL SECURITY;

-- 8. Indexes
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_plan ON businesses(plan, subscription_status);
CREATE INDEX idx_business_payments_business ON business_payments(business_id, created_at DESC);
CREATE INDEX idx_business_payments_status ON business_payments(status);
CREATE INDEX idx_access_codes_business ON access_codes(business_id, is_active);
CREATE INDEX idx_access_codes_code ON access_codes(code) WHERE is_active = TRUE;
CREATE INDEX idx_activations_user ON customer_business_activations(user_id, is_active);
CREATE INDEX idx_activations_business ON customer_business_activations(business_id, is_active);
CREATE INDEX idx_activations_expiry ON customer_business_activations(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_users_home_business ON users(home_business_id);
CREATE INDEX idx_access_codes_business_id ON access_codes(business_id);
CREATE INDEX idx_access_codes_valid_until ON access_codes(valid_until) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_receipts_business ON business_receipts(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_code ON business_receipts(code);
CREATE INDEX IF NOT EXISTS idx_receipts_access_code ON business_receipts(access_code_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_business ON business_api_keys(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON business_api_keys(api_key) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_printers_business ON business_printers(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sticker_batches_business ON sticker_batches(business_id, created_at DESC);

-- 8b. RLS policies
-- Businesses table: Only allow business owners/admins to view/edit their own business
CREATE POLICY business_admins_policy ON businesses
    USING (EXISTS (
        SELECT 1 FROM business_admins ba
        WHERE ba.business_id = businesses.id
        AND ba.user_id = auth.uid()
    ));

-- Customer activations: Only allow users to view their own activations
CREATE POLICY user_activations_policy ON customer_business_activations
    USING (user_id = auth.uid());

-- Access codes: Only allow business admins to manage codes for their business
CREATE POLICY access_codes_policy ON access_codes
    USING (EXISTS (
        SELECT 1 FROM business_admins ba
        WHERE ba.business_id = access_codes.business_id
        AND ba.user_id = auth.uid()
    ));

-- Completely rewrite the business_admins policies with a simpler
-- non-recursive approach
-- 1. Users can see their own admin records
CREATE POLICY "users_view_own_admin_records" ON business_admins
    FOR SELECT
    USING (user_id = auth.uid());

-- 2. Users who are owners can see all admins in their businesses
CREATE POLICY "owners_view_all_admins" ON business_admins
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM business_admins AS owner_check
            WHERE owner_check.business_id = business_admins.business_id
            AND owner_check.role = 'owner'
        )
    );

-- 3. Only owners can insert/update/delete admin records
CREATE POLICY "owners_manage_admins" ON business_admins
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM business_admins AS owner_check
            WHERE owner_check.business_id = business_admins.business_id
            AND owner_check.role = 'owner'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id 
            FROM business_admins AS owner_check
            WHERE owner_check.business_id = business_admins.business_id
            AND owner_check.role = 'owner'
        )
    );

-- 4. Users can accept invites (update their own record)
CREATE POLICY "users_accept_invites" ON business_admins
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        AND accepted_at IS NOT NULL
        AND role IN ('admin', 'host')
    );

-- Receipts: Admins of the business can view
CREATE POLICY "Business admins can view receipts" ON business_receipts
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Business admins can manage receipts" ON business_receipts
    FOR ALL USING (
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- API Keys: Only business admins can view/manage
CREATE POLICY "Business admins can view API keys" ON business_api_keys
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Business admins can manage API keys" ON business_api_keys
    FOR ALL USING (
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- Printers: Business admins can manage
CREATE POLICY "Business admins can manage printers" ON business_printers
    FOR ALL USING (
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- Sticker Batches: Business admins can view
CREATE POLICY "Business admins can view sticker batches" ON sticker_batches
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Business admins can manage sticker batches" ON sticker_batches
    FOR ALL USING (
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- 9. Functions
CREATE OR REPLACE FUNCTION increment_business_spin_count(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE businesses
    SET spins_this_month = spins_this_month + 1
    WHERE id = p_business_id;
END;
$$;

-- Reset monthly spin counts (run via cron on 1st of each month)
CREATE OR REPLACE FUNCTION reset_monthly_spin_counts()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE businesses SET spins_this_month = 0;
END;
$$;


-- Validate and redeem a code
-- Fixed and enhanced redeem_access_code function with loyalty points
CREATE OR REPLACE FUNCTION redeem_access_code(
    p_code TEXT,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code access_codes%ROWTYPE;
    v_business businesses%ROWTYPE;
    v_activation customer_business_activations%ROWTYPE;
    v_user_uses INTEGER;
    v_activation_days INTEGER;
    v_is_activated BOOLEAN := FALSE;
    v_points_awarded INTEGER := 0;
    v_draw RECORD;
    v_draw_name TEXT := NULL;
    v_draw_prize TEXT := NULL;
    v_draw_ends_at TIMESTAMPTZ := NULL;
    v_draw_entered BOOLEAN := FALSE;
    v_redirect_url TEXT;
BEGIN
    -- Find and validate code
    SELECT * INTO v_code
    FROM access_codes
    WHERE code = UPPER(TRIM(p_code)) AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or inactive code');
    END IF;
    
    -- Time validity
    IF v_code.valid_from IS NOT NULL AND v_code.valid_from > NOW() THEN
        RETURN json_build_object('success', false, 'error', 'This code is not yet active');
    END IF;
    
    IF v_code.valid_until IS NOT NULL AND v_code.valid_until < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'This code has expired');
    END IF;
    
    -- Usage limits
    IF v_code.max_uses IS NOT NULL AND v_code.current_uses >= v_code.max_uses THEN
        RETURN json_build_object('success', false, 'error', 'This code has already been used');
    END IF;
    
    IF v_code.max_uses_per_user > 0 THEN
        SELECT COUNT(*) INTO v_user_uses
        FROM access_code_usage
        WHERE code_id = v_code.id AND user_id = p_user_id;
        
        IF v_user_uses >= v_code.max_uses_per_user THEN
            RETURN json_build_object('success', false, 'error', 'You have already used this code');
        END IF;
    END IF;
    
    -- Get business
    SELECT * INTO v_business FROM businesses WHERE id = v_code.business_id;
    v_activation_days := COALESCE(v_business.activation_duration_days, 30);
    
    -- ─── CHECK ACTIVATION REQUIREMENT ───────────────────
    -- Does this code require the user to already be activated?
    IF v_code.require_activation THEN
        -- Check if user is currently active with this business
        SELECT * INTO v_activation
        FROM customer_business_activations
        WHERE user_id = p_user_id 
          AND business_id = v_code.business_id
          AND is_active = TRUE
          AND expires_at > NOW();
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false, 
                'error', 'You need to be an active customer of ' || v_business.name || ' to use this code. Ask them for an activation code first!',
                'requires_activation', true,
                'business_name', v_business.name,
                'business_slug', v_business.slug
            );
        END IF;
        
        v_is_activated := TRUE;
    END IF;
    
    -- ─── UPSERT/EXTEND ACTIVATION ───────────────────────
    -- If this code activates (is an activation code itself), extend the activation
    -- Activation codes are typically: QR codes at counter, receipt codes, sticker codes
    -- Public marketing codes (require_activation=FALSE) don't extend activation
    
    IF v_code.type IN ('qr', 'single_use', 'sticker', 'receipt') THEN
        SELECT * INTO v_activation
        FROM customer_business_activations
        WHERE user_id = p_user_id AND business_id = v_code.business_id;
        
        IF FOUND THEN
            -- Extend or reactivate
            UPDATE customer_business_activations
            SET is_active = TRUE,
                expires_at = GREATEST(expires_at, NOW() + (v_activation_days || ' days')::INTERVAL),
                activated_by_code_id = v_code.id,
                activation_source = 'code',
                last_activity_at = NOW()
            WHERE id = v_activation.id;
        ELSE
            -- New activation
            INSERT INTO customer_business_activations (
                user_id, business_id, activated_by_code_id,
                activation_source, expires_at, is_active
            ) VALUES (
                p_user_id, v_code.business_id, v_code.id,
                'code', NOW() + (v_activation_days || ' days')::INTERVAL, TRUE
            );
        END IF;
        
        v_is_activated := TRUE;
    END IF;
    
    -- ─── RECORD USAGE ───────────────────────────────────
    INSERT INTO access_code_usage (code_id, user_id) VALUES (v_code.id, p_user_id);
    UPDATE access_codes SET current_uses = current_uses + 1 WHERE id = v_code.id;
    
    -- Update user home business
    UPDATE users
    SET home_business_id = COALESCE(home_business_id, v_code.business_id),
        created_via_code_id = COALESCE(created_via_code_id, v_code.id),
        onboarding_completed = TRUE
    WHERE id = p_user_id;
    
    -- ─── CALCULATE POINTS ───────────────────────────────
    IF v_code.point_value IS NOT NULL THEN
        v_points_awarded := v_code.point_value;
    ELSE
        v_points_awarded := COALESCE(v_business.points_per_redemption, 10);
    END IF;
    
    IF v_points_awarded > 0 THEN
        PERFORM award_engagement_points(
            p_user_id, v_code.business_id, v_points_awarded,
            'daily_visit',
            'Code ' || v_code.code || ' redeemed at ' || v_business.name,
            jsonb_build_object(
                'code_id', v_code.id, 'code_type', v_code.type,
                'code_tier', v_code.tier, 'unlocks', v_code.unlocks,
                'is_activation', v_code.type IN ('qr', 'single_use', 'sticker', 'receipt')
            )
        );
    END IF;
    
    -- ─── AUTO-ENTER DRAWS ───────────────────────────────
    IF v_code.unlocks IN ('draw', 'spin_draw', 'trivia_draw', 'all') THEN
        SELECT d.id, d.name, d.prize_name, d.entry_ends_at INTO v_draw
        FROM draws d
        WHERE d.access_code_id = v_code.id AND d.status = 'open'
          AND d.entry_starts_at <= NOW() AND d.entry_ends_at >= NOW()
        LIMIT 1;
        
        IF NOT FOUND THEN
            SELECT d.id, d.name, d.prize_name, d.entry_ends_at INTO v_draw
            FROM draws d
            WHERE d.business_id = v_code.business_id AND d.status = 'open'
              AND d.entry_starts_at <= NOW() AND d.entry_ends_at >= NOW()
            ORDER BY d.entry_ends_at ASC LIMIT 1;
        END IF;
        
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM draw_entries WHERE draw_id = v_draw.id AND user_id = p_user_id
        ) THEN
            INSERT INTO draw_entries (draw_id, user_id, entry_count, entry_method, source_id, metadata)
            VALUES (v_draw.id, p_user_id, COALESCE(v_code.max_uses_per_user, 1), 'code', v_code.id::TEXT,
                jsonb_build_object('code', v_code.code, 'code_type', v_code.type, 'entered_at', NOW()));
            
            FOR i IN 1..COALESCE(v_code.max_uses_per_user, 1) LOOP
                INSERT INTO draw_tickets (draw_id, user_id, ticket_number) VALUES (v_draw.id, p_user_id, i);
            END LOOP;
            
            INSERT INTO draw_live_ticker (draw_id, user_name, entry_count, entry_method)
            SELECT v_draw.id, COALESCE(u.full_name, 'Customer'), COALESCE(v_code.max_uses_per_user, 1), 'code'
            FROM users u WHERE u.id = p_user_id;
            
            v_draw_entered := TRUE;
            v_draw_name := v_draw.name;
            v_draw_prize := v_draw.prize_name;
            v_draw_ends_at := v_draw.entry_ends_at;
        END IF;
    END IF;
    
    -- ─── REDIRECT ───────────────────────────────────────
    IF v_code.unlocks IN ('draw', 'spin_draw') THEN
        v_redirect_url := '/' || v_business.slug || '/spin';
    ELSIF v_code.unlocks IN ('trivia', 'trivia_draw') THEN
        v_redirect_url := '/' || v_business.slug || '/trivia';
    ELSE
        v_redirect_url := '/' || v_business.slug || '/spin';
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'business_id', v_business.id,
        'business_name', v_business.name,
        'business_slug', v_business.slug,
        'business_logo', v_business.logo_url,
        'business_color', v_business.brand_color,
        'expires_at', NOW() + (v_activation_days || ' days')::INTERVAL,
        'unlocks', v_code.unlocks,
        'redirect_url', v_redirect_url,
        'points_awarded', v_points_awarded,
        'code_tier', v_code.tier,
        'is_activated', v_is_activated,
        'draw_entered', v_draw_entered,
        'draw_name', v_draw_name,
        'draw_prize', v_draw_prize,
        'draw_ends_at', v_draw_ends_at
    );
END;
$$;

-- Check if user is active with a business
CREATE OR REPLACE FUNCTION is_user_active_with_business(
    p_user_id UUID,
    p_business_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_active BOOLEAN;
BEGIN
    SELECT is_active INTO v_active
    FROM customer_business_activations
    WHERE user_id = p_user_id 
    AND business_id = p_business_id
    AND is_active = TRUE
    AND expires_at > NOW();
    
    RETURN COALESCE(v_active, FALSE);
END;
$$;

-- Deactivate expired activations
CREATE OR REPLACE FUNCTION deactivate_expired_activations()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE customer_business_activations
    SET is_active = FALSE
    WHERE is_active = TRUE AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION redeem_access_code(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_active_with_business(UUID, UUID) TO authenticated;

-- ============================================
-- ENGAGE PLATFORM: Fixed Functions
-- (Using loyalty_points instead of dropped customer_points tables)
-- ============================================

-- ============================================
-- 1. award_engagement_points - FIXED
-- ============================================
DROP FUNCTION IF EXISTS award_engagement_points(UUID, UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION award_engagement_points(
    p_user_id UUID,
    p_business_id UUID,
    p_points INTEGER DEFAULT 10,
    p_action_type TEXT DEFAULT 'daily_visit',
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
    v_tier TEXT;
BEGIN
    -- Ensure loyalty record exists for this business
    INSERT INTO loyalty_points (user_id, business_id, tier, points, points_earned, points_redeemed)
    VALUES (p_user_id, p_business_id, 'bronze', p_points, p_points, 0)
    ON CONFLICT (user_id, business_id) DO UPDATE
    SET 
        points = loyalty_points.points + p_points,
        points_earned = loyalty_points.points_earned + p_points,
        updated_at = NOW()
    RETURNING points INTO v_current_points;
    
    -- Record transaction
    INSERT INTO loyalty_transactions (
        user_id, business_id, points_change, current_points,
        transaction_type, description, metadata
    ) VALUES (
        p_user_id, p_business_id, p_points, v_current_points,
        p_action_type,
        COALESCE(p_description, 
            CASE p_action_type
                WHEN 'spin_win' THEN 'Points for spinning the wheel'
                WHEN 'trivia_correct' THEN 'Correct trivia answer'
                WHEN 'trivia_answer' THEN 'Trivia participation'
                WHEN 'daily_visit' THEN 'Daily visit bonus'
                WHEN 'draw_entry' THEN 'Entered a prize draw'
                WHEN 'draw_consolation' THEN 'Consolation points from draw'
                WHEN 'referral_bonus' THEN 'Referral bonus'
                ELSE 'Engagement points earned'
            END
        ),
        p_metadata
    );
    
    -- Check and update tier
    SELECT tier INTO v_tier
    FROM loyalty_tiers
    WHERE min_points <= v_current_points
    ORDER BY min_points DESC
    LIMIT 1;
    
    IF v_tier IS NOT NULL THEN
        UPDATE loyalty_points
        SET tier = v_tier, updated_at = NOW()
        WHERE user_id = p_user_id AND business_id = p_business_id AND tier != v_tier;
    END IF;
    
    RETURN v_current_points;
END;
$$;

-- ============================================
-- 2. get_customer_points_summary - FIXED
-- ============================================
DROP FUNCTION IF EXISTS get_customer_points_summary(UUID);

CREATE OR REPLACE FUNCTION get_customer_points_summary(p_user_id UUID)
RETURNS TABLE (
    business_id UUID,
    business_name TEXT,
    business_slug TEXT,
    business_logo TEXT,
    business_color TEXT,
    points INTEGER,
    tier TEXT,
    lifetime_points INTEGER,
    last_earned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.slug,
        b.logo_url,
        b.brand_color,
        COALESCE(lp.points, 0),
        COALESCE(lp.tier, 'bronze'),
        COALESCE(lp.points_earned, 0),
        lp.updated_at
    FROM businesses b
    INNER JOIN customer_business_activations cba ON cba.business_id = b.id
    LEFT JOIN loyalty_points lp ON lp.user_id = p_user_id AND lp.business_id = b.id
    WHERE cba.user_id = p_user_id AND cba.is_active = TRUE
    ORDER BY COALESCE(lp.points, 0) DESC;
END;
$$;

-- ============================================
-- 3. redeem_access_code - FIXED (no changes needed, already correct)
-- This function uses customer_business_activations and access_codes - both still exist
-- ============================================
-- (Keep the existing redeem_access_code function as-is - it's already correct)

-- ============================================
-- 4. is_user_active_with_business - No changes needed
-- ============================================
-- (Keep as-is - uses customer_business_activations which still exists)

-- ============================================
-- 5. get_user_active_businesses - FIXED (add loyalty info)
-- ============================================
DROP FUNCTION IF EXISTS get_user_active_businesses(UUID);

CREATE OR REPLACE FUNCTION get_user_active_businesses(p_user_id UUID)
RETURNS TABLE (
    business_id UUID,
    business_name TEXT,
    business_slug TEXT,
    logo_url TEXT,
    brand_color TEXT,
    expires_at TIMESTAMPTZ,
    spins_used INTEGER,
    is_active BOOLEAN,
    loyalty_points INTEGER,
    loyalty_tier TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.slug,
        b.logo_url,
        b.brand_color,
        cba.expires_at,
        cba.spins_used,
        cba.is_active,
        COALESCE(lp.points, 0),
        COALESCE(lp.tier, 'bronze')
    FROM customer_business_activations cba
    JOIN businesses b ON b.id = cba.business_id
    LEFT JOIN loyalty_points lp ON lp.user_id = p_user_id AND lp.business_id = b.id
    WHERE cba.user_id = p_user_id
    ORDER BY cba.is_active DESC, cba.last_activity_at DESC;
END;
$$;

-- ============================================
-- 6. create_business_loyalty_record - Helper
-- ============================================
CREATE OR REPLACE FUNCTION create_business_loyalty_record(
    p_user_id UUID,
    p_business_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO loyalty_points (user_id, business_id, tier, points, points_earned, points_redeemed)
    VALUES (p_user_id, p_business_id, 'bronze', 0, 0, 0)
    ON CONFLICT (user_id, business_id) DO NOTHING;
END;
$$;

-- ============================================
-- 7. Auto-create loyalty on activation trigger
-- ============================================
CREATE OR REPLACE FUNCTION create_loyalty_on_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM create_business_loyalty_record(NEW.user_id, NEW.business_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activation_create_loyalty ON customer_business_activations;
CREATE TRIGGER activation_create_loyalty
    AFTER INSERT ON customer_business_activations
    FOR EACH ROW
    EXECUTE FUNCTION create_loyalty_on_activation();

-- ============================================
-- 8. Process referral on activation - FIXED
-- ============================================
DROP FUNCTION IF EXISTS process_referral_on_activation(UUID, UUID);

CREATE OR REPLACE FUNCTION process_referral_on_activation(
    p_user_id UUID,
    p_business_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral referrals%ROWTYPE;
BEGIN
    -- Find pending referral for this user
    SELECT * INTO v_referral
    FROM referrals
    WHERE referred_user_id = p_user_id
    AND status = 'joined'
    AND conversion_type IN ('signup', 'activation')
    LIMIT 1;
    
    IF NOT FOUND THEN RETURN; END IF;
    
    -- Mark as completed
    UPDATE referrals
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_referral.id;
    
    -- Award points to referrer using loyalty system
    PERFORM award_engagement_points(
        v_referral.referrer_id,
        p_business_id,
        COALESCE(v_referral.reward_points, 100),
        'referral_bonus',
        'Referral bonus: friend activated their account',
        jsonb_build_object('referral_id', v_referral.id, 'referred_user_id', p_user_id)
    );
END;
$$;

-- ============================================
-- 9. Generate Receipt Code - FIXED
-- ============================================
CREATE OR REPLACE FUNCTION generate_receipt_code(
    p_business_id UUID,
    p_amount NUMERIC,
    p_points_earned INTEGER DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::jsonb,
    p_cashier_name TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'dashboard',
    p_created_by UUID DEFAULT NULL,
    p_unlocks TEXT DEFAULT 'spin',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business businesses%ROWTYPE;
    v_code TEXT;
    v_receipt_number TEXT;
    v_points INTEGER;
    v_code_id UUID;
    v_receipt_id UUID;
    v_sequence INTEGER;
    v_plan_code_type CHAR(1);
    v_prefix TEXT;
BEGIN
    SELECT * INTO v_business FROM businesses WHERE id = p_business_id;
    
    -- Determine code type from plan
    v_plan_code_type := CASE 
        WHEN v_business.plan = 'enterprise' THEN 'E'
        WHEN v_business.plan = 'pro' THEN 'P'
        ELSE 'S'
    END;
    
    -- Get business prefix and next sequence
    v_prefix := UPPER(SUBSTRING(REGEXP_REPLACE(v_business.slug, '[^a-zA-Z0-9]', '', 'g'), 1, 4));
    v_sequence := next_code_sequence(p_business_id);
    
    -- Generate receipt number from sequence
    v_receipt_number := 'RCPT-' || LPAD(v_sequence::TEXT, 5, '0');
    
    -- Determine points
    IF p_points_earned IS NOT NULL THEN
        v_points := p_points_earned;
    ELSE
        v_points := COALESCE(v_business.points_per_redemption, 10);
    END IF;
    
    -- Generate unique code: PREFIX-TYPE-SEQUENCE-RANDOM
    -- Uses the same sequence for consistency
    v_code := v_prefix 
              || '-' || v_plan_code_type || 'R'
              || '-' || LPAD(v_sequence::TEXT, 5, '0')
              || '-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 4));
    
    -- Create the access code
    INSERT INTO access_codes (
        business_id, code, code_prefix, code_type, code_sequence,
        type, label, unlocks, max_uses, max_uses_per_user, 
        point_value, is_active, description, metadata
    ) VALUES (
        p_business_id, v_code, v_prefix, v_plan_code_type, v_sequence,
        'receipt', 'Receipt #' || v_receipt_number, p_unlocks,
        1, 1, v_points, TRUE,
        'Receipt: KES ' || p_amount || ' = ' || v_points || ' pts',
        jsonb_build_object(
            'amount', p_amount,
            'items', p_items,
            'cashier', p_cashier_name,
            'source', p_source
        ) || p_metadata
    )
    RETURNING id INTO v_code_id;
    
    -- Create receipt record
    INSERT INTO business_receipts (
        business_id, receipt_number, amount, items,
        access_code_id, code, points_earned,
        source, cashier_name, created_by
    ) VALUES (
        p_business_id, v_receipt_number, p_amount, p_items,
        v_code_id, v_code, v_points,
        p_source, p_cashier_name, p_created_by
    )
    RETURNING id INTO v_receipt_id;
    
    RETURN json_build_object(
        'success', true,
        'receipt_id', v_receipt_id,
        'receipt_number', v_receipt_number,
        'code', v_code,
        'points_earned', v_points,
        'amount', p_amount,
        'business_name', v_business.name,
        'business_slug', v_business.slug,
        'business_logo', v_business.logo_url,
        'business_color', v_business.brand_color,
        'qr_url', '/spin?code=' || v_code,
        'unlocks', p_unlocks
    );
END;
$$;

-- ============================================
-- 10. Get next code sequence for a business - FIXED
-- ============================================
CREATE OR REPLACE FUNCTION next_code_sequence(p_business_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_seq INTEGER;
BEGIN
    INSERT INTO business_code_sequences (business_id, last_sequence)
    VALUES (p_business_id, 1)
    ON CONFLICT (business_id) DO UPDATE
    SET last_sequence = business_code_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_seq;
    
    RETURN v_seq;
END;
$$;

-- ============================================
-- 11. Get business receipt stats - FIXED
-- ============================================
CREATE OR REPLACE FUNCTION get_business_receipt_stats(
    p_business_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_total_count INTEGER;
    v_total_amount NUMERIC;
    v_total_points INTEGER;
    v_avg_amount NUMERIC;
BEGIN
    SELECT 
        COUNT(*),
        COALESCE(SUM(amount), 0),
        COALESCE(SUM(points_earned), 0),
        CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(amount), 2) ELSE 0 END
    INTO v_total_count, v_total_amount, v_total_points, v_avg_amount
    FROM business_receipts
    WHERE business_id = p_business_id
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date);
    
    RETURN json_build_object(
        'total_receipts', v_total_count,
        'total_amount', v_total_amount,
        'total_points', v_total_points,
        'avg_amount', v_avg_amount
    );
END;
$$;

-- ============================================
-- 12. Create default API key for business (called on Pro/Enterprise upgrade) - FIXED
-- ============================================
CREATE OR REPLACE FUNCTION create_default_api_key(p_business_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key TEXT;
BEGIN
    -- Only create if business is Pro or Enterprise
    IF NOT EXISTS (
        SELECT 1 FROM businesses 
        WHERE id = p_business_id AND plan IN ('pro', 'enterprise')
    ) THEN
        RETURN NULL;
    END IF;
    
    -- Generate key
    v_key := 'engage_live_' || encode(gen_random_bytes(24), 'hex');
    
    INSERT INTO business_api_keys (
        business_id, name, api_key, permissions
    ) VALUES (
        p_business_id, 'Default POS Key', v_key, '["receipt:create"]'
    );
    
    RETURN v_key;
END;
$$;

-- ============================================
-- 10. Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION award_engagement_points(UUID, UUID, INTEGER, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_points_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_access_code(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_active_with_business(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_active_businesses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_business_loyalty_record(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION next_code_sequence(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_receipt_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_api_key(UUID) TO authenticated;