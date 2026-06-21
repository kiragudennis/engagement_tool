-- ============================================
-- ENGAGE PLATFORM: Loyalty System - Cleaned
-- ============================================

-- 1. Loyalty tiers (simplified for engagement)
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    tier TEXT PRIMARY KEY CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    min_points INTEGER NOT NULL,
    points_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO loyalty_tiers (tier, min_points, points_multiplier) VALUES
    ('bronze', 0, 1.0),
    ('silver', 500, 1.2),
    ('gold', 2000, 1.5),
    ('platinum', 10000, 2.0)
ON CONFLICT (tier) DO NOTHING;

-- 2. Loyalty points (per business)
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze' REFERENCES loyalty_tiers(tier),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- 3. Loyalty transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    current_points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'earned', 'redeemed', 'expired', 'adjusted',
        'spin_win', 'trivia_correct', 'trivia_answer', 'daily_visit',
        'draw_entry', 'draw_consolation', 'referral_bonus'
    )),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_business ON loyalty_points(business_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_business ON loyalty_transactions(business_id, created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view tiers
CREATE POLICY "Anyone can view tiers" ON loyalty_tiers FOR SELECT USING (true);

-- Users can view their own points
CREATE POLICY "Users can view own points" ON loyalty_points
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON loyalty_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can manage own business points" ON loyalty_points
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own business transactions" ON loyalty_transactions
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- ============================================
-- Functions
-- ============================================

-- Create loyalty record for a business
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

-- Award engagement points
CREATE OR REPLACE FUNCTION award_engagement_points(
    p_user_id UUID,
    p_business_id UUID,
    p_points INTEGER,
    p_transaction_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
    v_new_tier TEXT;
BEGIN
    -- Ensure loyalty record exists
    PERFORM create_business_loyalty_record(p_user_id, p_business_id);
    
    -- Update points
    UPDATE loyalty_points
    SET points = points + p_points,
        points_earned = points_earned + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id AND business_id = p_business_id
    RETURNING points INTO v_current_points;
    
    -- Record transaction
    INSERT INTO loyalty_transactions (
        user_id, business_id, points_change, current_points,
        transaction_type, description, metadata
    ) VALUES (
        p_user_id, p_business_id, p_points, v_current_points,
        p_transaction_type,
        COALESCE(p_description, 'Engagement reward'),
        p_metadata
    );
    
    -- Check tier upgrade
    SELECT tier INTO v_new_tier
    FROM loyalty_tiers
    WHERE min_points <= v_current_points
    ORDER BY min_points DESC LIMIT 1;
    
    IF v_new_tier IS NOT NULL THEN
        UPDATE loyalty_points
        SET tier = v_new_tier, updated_at = NOW()
        WHERE user_id = p_user_id AND business_id = p_business_id AND tier != v_new_tier;
    END IF;
    
    RETURN v_current_points;
END;
$$;

-- Get business loyalty summary for a user
CREATE OR REPLACE FUNCTION get_business_loyalty_summary(
    p_user_id UUID,
    p_business_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    IF p_business_id IS NOT NULL THEN
        SELECT json_build_object(
            'points', COALESCE(lp.points, 0),
            'tier', COALESCE(lp.tier, 'bronze'),
            'points_earned', COALESCE(lp.points_earned, 0),
            'points_redeemed', COALESCE(lp.points_redeemed, 0),
            'business_name', b.name,
            'next_tier', (
                SELECT json_build_object('name', lt.tier, 'min_points', lt.min_points, 'points_needed', lt.min_points - COALESCE(lp.points, 0))
                FROM loyalty_tiers lt
                WHERE lt.min_points > COALESCE(lp.points, 0)
                ORDER BY lt.min_points LIMIT 1
            )
        ) INTO v_result
        FROM businesses b
        LEFT JOIN loyalty_points lp ON lp.user_id = p_user_id AND lp.business_id = b.id
        WHERE b.id = p_business_id;
    ELSE
        SELECT COALESCE(json_agg(
            json_build_object(
                'business_id', b.id,
                'business_name', b.name,
                'business_slug', b.slug,
                'business_logo', b.logo_url,
                'business_color', b.brand_color,
                'points', COALESCE(lp.points, 0),
                'tier', COALESCE(lp.tier, 'bronze'),
                'points_earned', COALESCE(lp.points_earned, 0)
            )
        ), '[]'::json) INTO v_result
        FROM businesses b
        INNER JOIN customer_business_activations cba ON cba.business_id = b.id
        LEFT JOIN loyalty_points lp ON lp.user_id = p_user_id AND lp.business_id = b.id
        WHERE cba.user_id = p_user_id AND cba.is_active = TRUE;
    END IF;
    
    RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- Get customer points summary (for account dashboard)
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
        b.id, b.name, b.slug, b.logo_url, b.brand_color,
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

-- Auto-create loyalty on activation
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

-- Create loyalty records for existing activations
INSERT INTO loyalty_points (user_id, business_id, tier, points, points_earned, points_redeemed)
SELECT cba.user_id, cba.business_id, 'bronze', 0, 0, 0
FROM customer_business_activations cba
WHERE NOT EXISTS (
    SELECT 1 FROM loyalty_points lp 
    WHERE lp.user_id = cba.user_id AND lp.business_id = cba.business_id
)
ON CONFLICT (user_id, business_id) DO NOTHING;

-- Deactivate expired accounts
CREATE OR REPLACE FUNCTION deactivate_expired_activations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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
GRANT EXECUTE ON FUNCTION create_business_loyalty_record(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_engagement_points(UUID, UUID, INTEGER, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_loyalty_summary(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_points_summary(UUID) TO authenticated;