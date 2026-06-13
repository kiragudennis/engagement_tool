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
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('mpesa', 'paypal', 'card', 'none'));

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
    unlocks TEXT NOT NULL DEFAULT 'spin' CHECK (unlocks IN ('spin', 'trivia', 'both')),
    
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

-- Customer engagement points
CREATE TABLE IF NOT EXISTS customer_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- Points transactions
CREATE TABLE IF NOT EXISTS customer_points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    points_change INTEGER NOT NULL,
    points_balance INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('spin', 'trivia_answer', 'trivia_correct', 'daily_visit', 'referral', 'redeemed')),
    description TEXT,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points redemption options (set by platform, not business)
CREATE TABLE IF NOT EXISTS points_redemption_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type TEXT CHECK (reward_type IN ('extra_spin', 'boost', 'badge', 'highlight')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default redemption options
INSERT INTO points_redemption_options (name, description, points_required, reward_type) VALUES
    ('Extra Spin', 'Get an extra spin at any business', 50, 'extra_spin'),
    ('Profile Boost', 'Get highlighted on the live leaderboard', 100, 'highlight'),
    ('Golden Ticket', 'Auto-entry into any trivia challenge', 200, 'boost'),
    ('VIP Badge', 'Show off your VIP status to businesses', 500, 'badge');

-- 6. Add to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS home_business_id UUID REFERENCES businesses(id),
ADD COLUMN IF NOT EXISTS created_via_code_id UUID REFERENCES access_codes(id),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 7. Add business_id to existing tables
ALTER TABLE spin_games ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE challenge_trivia_questions ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE challenge_live_ticker ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

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
CREATE INDEX idx_spin_games_business ON spin_games(business_id, is_active);
CREATE INDEX idx_challenges_business ON challenges(business_id, status);

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

-- Function to award points for engagement
CREATE OR REPLACE FUNCTION award_engagement_points(
    p_user_id UUID,
    p_business_id UUID,
    p_action TEXT,
    p_points INTEGER DEFAULT 10
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
BEGIN
    -- Upsert points
    INSERT INTO customer_points (user_id, business_id, points, lifetime_points)
    VALUES (p_user_id, p_business_id, p_points, p_points)
    ON CONFLICT (user_id, business_id) DO UPDATE
    SET 
        points = customer_points.points + p_points,
        lifetime_points = customer_points.lifetime_points + p_points,
        updated_at = NOW()
    RETURNING points INTO v_current_points;
    
    -- Record transaction
    INSERT INTO customer_points_transactions (
        user_id, business_id, points_change, points_balance, action, description
    ) VALUES (
        p_user_id, p_business_id, p_points, v_current_points, p_action,
        CASE p_action
            WHEN 'spin' THEN 'Points for spinning the wheel'
            WHEN 'trivia_answer' THEN 'Points for answering trivia'
            WHEN 'trivia_correct' THEN 'Bonus points for correct answer'
            WHEN 'daily_visit' THEN 'Daily visit bonus'
            WHEN 'referral' THEN 'Points for referring a friend'
            ELSE 'Points earned'
        END
    );
    
    RETURN v_current_points;
END;
$$;

-- Get customer's points summary
CREATE OR REPLACE FUNCTION get_customer_points_summary(p_user_id UUID)
RETURNS TABLE (
    business_name TEXT,
    business_slug TEXT,
    points INTEGER,
    lifetime_points INTEGER,
    last_earned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.name,
        b.slug,
        cp.points,
        cp.lifetime_points,
        cp.updated_at
    FROM customer_points cp
    JOIN businesses b ON b.id = cp.business_id
    WHERE cp.user_id = p_user_id
    ORDER BY cp.points DESC;
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
    
    -- Upsert activation
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
    
    -- Record usage
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
    
    RETURN json_build_object(
        'success', true,
        'business_id', v_business.id,
        'business_name', v_business.name,
        'business_slug', v_business.slug,
        'expires_at', NOW() + (v_activation_days || ' days')::INTERVAL,
        'unlocks', v_code.unlocks,
        'redirect_url', '/' || v_business.slug || CASE 
            WHEN v_code.unlocks = 'trivia' THEN '/trivia'
            ELSE '/spin'
        END
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

-- Get user's active businesses
CREATE OR REPLACE FUNCTION get_user_active_businesses(p_user_id UUID)
RETURNS TABLE (
    business_id UUID,
    business_name TEXT,
    business_slug TEXT,
    logo_url TEXT,
    brand_color TEXT,
    expires_at TIMESTAMPTZ,
    spins_used INTEGER,
    is_active BOOLEAN
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
        cba.is_active
    FROM customer_business_activations cba
    JOIN businesses b ON b.id = cba.business_id
    WHERE cba.user_id = p_user_id
    ORDER BY cba.is_active DESC, cba.last_activity_at DESC;
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
GRANT EXECUTE ON FUNCTION get_user_active_businesses(UUID) TO authenticated;