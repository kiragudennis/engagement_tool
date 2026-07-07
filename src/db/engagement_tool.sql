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

-- Payment transactions
CREATE TABLE IF NOT EXISTS business_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    plan TEXT NOT NULL,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')),
    
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'paypal', 'card')),
    payment_reference TEXT,
    transaction_id TEXT,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    metadata JSONB DEFAULT '{}',
    
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Add indexes for performance
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_business_id ON access_codes(business_id);
CREATE INDEX idx_access_codes_valid_until ON access_codes(valid_until) WHERE is_active = true;

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

-- Completely rewrite the business_admins policies with a simpler, non-recursive approach

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
    v_draw RECORD;
    v_challenge RECORD;
    v_redirect_url TEXT;
    v_draw_entered BOOLEAN := FALSE;
BEGIN
    -- Find and validate code
    SELECT * INTO v_code
    FROM access_codes
    WHERE code = UPPER(TRIM(p_code))
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or inactive code');
    END IF;
    
    -- Check time validity
    IF v_code.valid_from IS NOT NULL AND v_code.valid_from > NOW() THEN
        RETURN json_build_object('success', false, 'error', 'This code is not yet active');
    END IF;
    
    IF v_code.valid_until IS NOT NULL AND v_code.valid_until < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'This code has expired');
    END IF;
    
    -- Check max uses
    IF v_code.max_uses IS NOT NULL AND v_code.current_uses >= v_code.max_uses THEN
        RETURN json_build_object('success', false, 'error', 'This code has reached its maximum uses');
    END IF;
    
    -- Check user's usage of this specific code
    IF v_code.max_uses_per_user > 0 THEN
        SELECT COUNT(*) INTO v_user_uses
        FROM access_code_usage
        WHERE code_id = v_code.id AND user_id = p_user_id;
        
        IF v_user_uses >= v_code.max_uses_per_user THEN
            RETURN json_build_object('success', false, 'error', 'You have already used this code');
        END IF;
    END IF;
    
    -- Get business details
    SELECT * INTO v_business
    FROM businesses
    WHERE id = v_code.business_id;
    
    -- Get activation duration for this business
    v_activation_days := COALESCE(v_business.activation_duration_days, 30);
    
    -- ─── UPSERT CUSTOMER ACTIVATION ─────────────────────
    SELECT * INTO v_activation
    FROM customer_business_activations
    WHERE user_id = p_user_id AND business_id = v_code.business_id;
    
    IF FOUND THEN
        -- Extend or reactivate
        UPDATE customer_business_activations
        SET 
            is_active = TRUE,
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
    
    -- ─── RECORD USAGE ───────────────────────────────────
    INSERT INTO access_code_usage (code_id, user_id)
    VALUES (v_code.id, p_user_id);
    
    -- Increment code usage counter
    UPDATE access_codes
    SET current_uses = current_uses + 1
    WHERE id = v_code.id;
    
    -- Update user's home business if not set
    UPDATE users
    SET 
        home_business_id = COALESCE(home_business_id, v_code.business_id),
        created_via_code_id = COALESCE(created_via_code_id, v_code.id),
        onboarding_completed = TRUE
    WHERE id = p_user_id;
    
    -- ─── AUTO-ENTER DRAWS ───────────────────────────────
    -- If this code unlocks draws, find and enter the customer
    IF v_code.unlocks IN ('draw', 'spin_draw', 'trivia_draw', 'all') THEN
        -- Find the active draw linked to this code
        SELECT d.id, d.name, d.prize_name, d.entry_ends_at
        INTO v_draw
        FROM draws d
        WHERE d.access_code_id = v_code.id
        AND d.status = 'open'
        AND d.entry_starts_at <= NOW()
        AND d.entry_ends_at >= NOW()
        LIMIT 1;
        
        -- If no draw linked directly, find any open draw for this business
        IF NOT FOUND THEN
            SELECT d.id, d.name, d.prize_name, d.entry_ends_at
            INTO v_draw
            FROM draws d
            WHERE d.business_id = v_code.business_id
            AND d.status = 'open'
            AND d.entry_starts_at <= NOW()
            AND d.entry_ends_at >= NOW()
            ORDER BY d.entry_ends_at ASC
            LIMIT 1;
        END IF;
        
        -- Enter customer into the draw
        IF FOUND THEN
            -- Check if already entered
            IF NOT EXISTS (
                SELECT 1 FROM draw_entries
                WHERE draw_id = v_draw.id AND user_id = p_user_id
            ) THEN
                -- Add draw entry
                INSERT INTO draw_entries (
                    draw_id, user_id, entry_count, entry_method, source_id, metadata
                ) VALUES (
                    v_draw.id, p_user_id, 
                    COALESCE(v_code.max_uses_per_user, 1), -- entries from code config
                    'code', v_code.id::TEXT,
                    jsonb_build_object(
                        'code', v_code.code,
                        'code_type', v_code.type,
                        'entered_at', NOW()
                    )
                );
                
                -- Create individual tickets
                FOR i IN 1..COALESCE(v_code.max_uses_per_user, 1) LOOP
                    INSERT INTO draw_tickets (draw_id, user_id, ticket_number)
                    VALUES (v_draw.id, p_user_id, i);
                END LOOP;
                
                -- Add to live ticker
                INSERT INTO draw_live_ticker (draw_id, user_name, entry_count, entry_method)
                SELECT v_draw.id, COALESCE(u.full_name, 'Customer'), 
                       COALESCE(v_code.max_uses_per_user, 1), 'code'
                FROM users u WHERE u.id = p_user_id;

                PERFORM increment_business_engagement(v_business.id, 'draw');
                
                v_draw_entered := TRUE;
            END IF;
        END IF;
    END IF;
    
    -- ─── DETERMINE REDIRECT URL ─────────────────────────
    -- Priority: draw > trivia > spin (or combination)
    IF v_code.unlocks IN ('draw', 'spin_draw') THEN
        v_redirect_url := '/' || v_business.slug || '/spin';
    ELSIF v_code.unlocks IN ('trivia', 'trivia_draw') THEN
        v_redirect_url := '/' || v_business.slug || '/trivia';
    ELSIF v_code.unlocks = 'all' THEN
        v_redirect_url := '/' || v_business.slug || '/spin';
    ELSE
        -- 'spin' or default
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
        'draw_entered', v_draw_entered,
        'draw_name', v_draw.name,
        'draw_prize', v_draw.prize_name,
        'draw_ends_at', v_draw.entry_ends_at
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
-- 9. Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION award_engagement_points(UUID, UUID, INTEGER, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_points_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_access_code(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_active_with_business(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_active_businesses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_business_loyalty_record(UUID, UUID) TO authenticated;