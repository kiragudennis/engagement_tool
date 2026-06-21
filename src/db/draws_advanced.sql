-- ============================================
-- ENGAGE PLATFORM: Draws - Code-Gated Only
-- ============================================

-- 1. Draws table
CREATE TABLE IF NOT EXISTS draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Prize configuration
    prize_name TEXT NOT NULL,
    prize_description TEXT,
    prize_image_url TEXT,
    prize_value NUMERIC(10,2),
    
    -- Code-gated entry
    access_code_id UUID REFERENCES access_codes(id),
    entries_per_code INTEGER DEFAULT 1,
    free_entry_code TEXT, -- Optional: code for free entry (legal compliance)
    
    -- Entry limits
    max_entries_total INTEGER,
    max_entries_per_user INTEGER,
    
    -- Timing
    entry_starts_at TIMESTAMPTZ NOT NULL,
    entry_ends_at TIMESTAMPTZ NOT NULL,
    draw_time TIMESTAMPTZ NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'drawing', 'completed', 'cancelled')),
    
    -- Winner management
    winner_id UUID,
    winner_announced_at TIMESTAMPTZ,
    winner_claim_expires_at TIMESTAMPTZ,
    consolation_points_amount INTEGER DEFAULT 0,
    consolation_points_awarded BOOLEAN DEFAULT FALSE,
    
    -- Redraw settings
    auto_redraw_days INTEGER DEFAULT 7,
    max_redraws INTEGER DEFAULT 1,
    redraw_count INTEGER DEFAULT 0,
    
    -- Display
    theme_color TEXT DEFAULT '#8B5CF6',
    show_entry_ticker BOOLEAN DEFAULT TRUE,
    show_leaderboard BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Draw entries
CREATE TABLE IF NOT EXISTS draw_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    entry_count INTEGER NOT NULL DEFAULT 1,
    entry_method TEXT NOT NULL DEFAULT 'code' CHECK (entry_method IN ('code', 'manual')),
    
    source_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Draw tickets (individual entries for fair random selection)
CREATE TABLE IF NOT EXISTS draw_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES draw_entries(id) ON DELETE CASCADE,
    ticket_number INTEGER,
    
    is_winner BOOLEAN DEFAULT FALSE,
    winner_rank INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Live ticker
CREATE TABLE IF NOT EXISTS draw_live_ticker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_name TEXT,
    entry_count INTEGER,
    entry_method TEXT DEFAULT 'code',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Winner tracking
CREATE TABLE IF NOT EXISTS draw_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    winner_rank INTEGER NOT NULL,
    prize_name TEXT,
    
    claim_status TEXT NOT NULL DEFAULT 'pending' CHECK (claim_status IN ('pending', 'claimed', 'expired')),
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    notified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Claim tokens
CREATE TABLE IF NOT EXISTS draw_claim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_draws_business ON draws(business_id, status);
CREATE INDEX IF NOT EXISTS idx_draws_status_dates ON draws(status, entry_starts_at, entry_ends_at);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON draw_entries(draw_id, user_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_business ON draw_entries(business_id, draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_tickets_draw ON draw_tickets(draw_id, is_winner);
CREATE INDEX IF NOT EXISTS idx_draw_tickets_user ON draw_tickets(draw_id, user_id);
CREATE INDEX IF NOT EXISTS idx_draw_live_ticker_draw ON draw_live_ticker(draw_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_draw_winners_draw ON draw_winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_winners_business ON draw_winners(business_id);
CREATE INDEX IF NOT EXISTS idx_draw_winners_claim ON draw_winners(claim_status, expires_at);

-- ============================================
-- Enable real-time
-- ============================================
ALTER TABLE draws REPLICA IDENTITY FULL;
ALTER TABLE draw_entries REPLICA IDENTITY FULL;
ALTER TABLE draw_tickets REPLICA IDENTITY FULL;
ALTER TABLE draw_live_ticker REPLICA IDENTITY FULL;
ALTER TABLE draw_winners REPLICA IDENTITY FULL;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_live_ticker ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_winners ENABLE ROW LEVEL SECURITY;

-- Anyone can view open draws
CREATE POLICY "Anyone can view open draws" ON draws
    FOR SELECT USING (status = 'open' OR public.is_admin());

-- Users can view their own entries
CREATE POLICY "Users can view own entries" ON draw_entries
    FOR SELECT USING (user_id = auth.uid());

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON draw_tickets
    FOR SELECT USING (user_id = auth.uid());

-- Users can view their own winnings
CREATE POLICY "Users can view own winnings" ON draw_winners
    FOR SELECT USING (user_id = auth.uid());

-- Admin policies (scoped to business)
CREATE POLICY "Admins can manage own draws" ON draws
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own entries" ON draw_entries
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own tickets" ON draw_tickets
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own winners" ON draw_winners
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own ticker" ON draw_live_ticker
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- ============================================
-- Functions
-- ============================================

-- Generate claim token
CREATE OR REPLACE FUNCTION generate_claim_token(p_draw_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
BEGIN
    v_token := encode(gen_random_bytes(32), 'base64');
    v_token := replace(v_token, '/', '_');
    v_token := replace(v_token, '+', '-');
    v_token := substring(v_token, 1, 32);
    
    INSERT INTO draw_claim_tokens (draw_id, user_id, token, expires_at)
    VALUES (p_draw_id, p_user_id, v_token, NOW() + INTERVAL '7 days');
    
    RETURN v_token;
END;
$$;

-- Get draw participants with entries
CREATE OR REPLACE FUNCTION get_draw_participants_with_entries(draw_id_param UUID)
RETURNS TABLE(user_id UUID, total_entries BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT de.user_id, SUM(de.entry_count)::BIGINT as total_entries
    FROM draw_entries de
    WHERE de.draw_id = draw_id_param
    GROUP BY de.user_id;
END;
$$;

-- Get business draws with stats
CREATE OR REPLACE FUNCTION get_business_draws_with_stats(p_business_id UUID)
RETURNS TABLE(
    id UUID, name TEXT, slug TEXT, description TEXT,
    prize_name TEXT, prize_description TEXT, prize_image_url TEXT,
    prize_value NUMERIC, max_entries_total INTEGER, max_entries_per_user INTEGER,
    entry_starts_at TIMESTAMPTZ, entry_ends_at TIMESTAMPTZ, draw_time TIMESTAMPTZ,
    status TEXT, winner_id UUID, winner_announced_at TIMESTAMPTZ,
    theme_color TEXT, show_entry_ticker BOOLEAN, show_leaderboard BOOLEAN,
    consolation_points_amount INTEGER, created_at TIMESTAMPTZ,
    total_entries BIGINT, total_participants BIGINT, total_winners BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id, d.name, d.slug, d.description,
        d.prize_name, d.prize_description, d.prize_image_url,
        d.prize_value, d.max_entries_total, d.max_entries_per_user,
        d.entry_starts_at, d.entry_ends_at, d.draw_time,
        d.status, d.winner_id, d.winner_announced_at,
        d.theme_color, d.show_entry_ticker, d.show_leaderboard,
        d.consolation_points_amount, d.created_at,
        COALESCE((SELECT COUNT(*)::BIGINT FROM draw_entries de WHERE de.draw_id = d.id), 0),
        COALESCE((SELECT COUNT(DISTINCT de.user_id)::BIGINT FROM draw_entries de WHERE de.draw_id = d.id), 0),
        COALESCE((SELECT COUNT(*)::BIGINT FROM draw_winners dw WHERE dw.draw_id = d.id), 0)
    FROM draws d
    WHERE d.business_id = p_business_id
    ORDER BY d.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_claim_token(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_draw_participants_with_entries(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_draws_with_stats(UUID) TO authenticated;