-- ============================================
-- ENGAGE PLATFORM: Spin System - Business Only
-- ============================================

-- 1. Spin games table
CREATE TABLE IF NOT EXISTS spin_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Game settings
    free_spins_per_day INTEGER DEFAULT 1,
    free_spins_per_week INTEGER DEFAULT 5,
    free_spins_total INTEGER DEFAULT 3,
    points_per_paid_spin INTEGER DEFAULT 50,
    
    -- Prize configuration
    prize_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Single-prize mode
    is_single_prize BOOLEAN DEFAULT FALSE,
    single_prize_claimed BOOLEAN DEFAULT FALSE,
    single_prize_winner_id UUID,
    
    -- Trivia integration
    linked_challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    
    -- Timing
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Display
    theme_color TEXT DEFAULT '#8B5CF6',
    cover_image_url TEXT,
    show_confetti BOOLEAN DEFAULT TRUE,
    play_sounds BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Spin attempts
CREATE TABLE IF NOT EXISTS spin_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES spin_games(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    spin_type TEXT NOT NULL CHECK (spin_type IN ('free', 'points')),
    prize_type TEXT NOT NULL,
    prize_value TEXT,
    points_awarded INTEGER DEFAULT 0,
    points_spent INTEGER DEFAULT 0,
    
    segment_index INTEGER NOT NULL,
    landed_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User spin allocations (daily/weekly limits)
CREATE TABLE IF NOT EXISTS user_spin_allocations (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES spin_games(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    spins_used_today INTEGER DEFAULT 0,
    spins_used_this_week INTEGER DEFAULT 0,
    spins_used_total INTEGER DEFAULT 0,
    last_spin_at TIMESTAMPTZ,
    
    PRIMARY KEY (user_id, game_id, date)
);

-- 4. Live ticker
CREATE TABLE IF NOT EXISTS spin_live_ticker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES spin_games(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    user_name TEXT,
    prize_text TEXT,
    action_type TEXT DEFAULT 'win' CHECK (action_type IN ('spin_start', 'win')),
    is_spinning BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_spin_games_business ON spin_games(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_spin_games_active ON spin_games(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_spin_attempts_game ON spin_attempts(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_spin_attempts_business ON spin_attempts(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spin_attempts_user ON spin_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_live_ticker_game ON spin_live_ticker(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spin_live_ticker_business ON spin_live_ticker(business_id, created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE spin_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_spin_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_live_ticker ENABLE ROW LEVEL SECURITY;

-- Anyone can view spin games
CREATE POLICY "Anyone can view spin games" ON spin_games
    FOR SELECT USING (true);

-- Users can view their own spin attempts
CREATE POLICY "Users can view own attempts" ON spin_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own spin attempts
CREATE POLICY "Users can insert own attempts" ON spin_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own allocations
CREATE POLICY "Users can view own allocations" ON user_spin_allocations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update their own allocations
CREATE POLICY "Users can manage own allocations" ON user_spin_allocations
    FOR ALL USING (auth.uid() = user_id);

-- Anyone can view live ticker
CREATE POLICY "Anyone can view live ticker" ON spin_live_ticker
    FOR SELECT USING (true);

-- Admin policies (scoped to business)
CREATE POLICY "Admins can manage own games" ON spin_games
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own attempts" ON spin_attempts
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- ============================================
-- Functions
-- ============================================

-- Record spin start in live ticker
CREATE OR REPLACE FUNCTION record_spin_start(
    p_game_id UUID,
    p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_name TEXT;
    v_business_id UUID;
    v_ticker_id UUID;
BEGIN
    SELECT COALESCE(full_name, 'Customer') INTO v_user_name FROM users WHERE id = p_user_id;
    SELECT business_id INTO v_business_id FROM spin_games WHERE id = p_game_id;
    
    INSERT INTO spin_live_ticker (game_id, business_id, user_name, user_id, action_type, is_spinning)
    VALUES (p_game_id, v_business_id, v_user_name, p_user_id, 'spin_start', TRUE)
    RETURNING id INTO v_ticker_id;
    
    RETURN v_ticker_id;
END;
$$;

-- Record spin win in live ticker
CREATE OR REPLACE FUNCTION record_spin_win(
    p_attempt_id UUID,
    p_prize_text TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt spin_attempts%ROWTYPE;
    v_game spin_games%ROWTYPE;
    v_user_name TEXT;
BEGIN
    SELECT * INTO v_attempt FROM spin_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN RETURN; END IF;
    
    SELECT COALESCE(full_name, 'Customer') INTO v_user_name FROM users WHERE id = v_attempt.user_id;
    SELECT * INTO v_game FROM spin_games WHERE id = v_attempt.game_id;
    
    -- Insert into spin live ticker
    INSERT INTO spin_live_ticker (game_id, business_id, user_name, user_id, prize_text, action_type, is_spinning)
    VALUES (v_attempt.game_id, v_attempt.business_id, v_user_name, v_attempt.user_id, p_prize_text, 'win', FALSE);
    
    -- If trivia ticket, also add to challenge live ticker
    IF v_attempt.prize_type = 'trivia_ticket' AND v_game.linked_challenge_id IS NOT NULL THEN
        INSERT INTO challenge_live_ticker (challenge_id, business_id, user_name, action_text, points_awarded)
        VALUES (v_game.linked_challenge_id, v_game.business_id, v_user_name, 
                'Won trivia entry via Spin & Win! 🎡 ' || p_prize_text, 0);
    END IF;
END;
$$;

-- ============================================
-- FINAL: perform_spin for business context
-- ============================================
CREATE OR REPLACE FUNCTION perform_spin(
    p_game_id UUID,
    p_spin_type TEXT  -- 'free' or 'points'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_game RECORD;
    v_business_id UUID;
    v_allocation RECORD;
    v_today DATE := CURRENT_DATE;
    v_selected_prize JSONB;
    v_points_awarded INT := 0;
    v_points_spent INT := 0;
    v_prize_display TEXT;
    v_attempt_id UUID;
    v_result JSON;
    v_user_points INT;
    v_random FLOAT;
    v_cumulative FLOAT := 0;
    v_prize_index INT := 0;
    v_prize_config JSONB;
    v_num_prizes INT;
    v_user_name TEXT;
    v_trivia_result JSON;
    v_is_active BOOLEAN;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Get user name
    SELECT COALESCE(full_name, 'Customer') INTO v_user_name FROM users WHERE id = v_user_id;
    
    -- Get game with business_id
    SELECT sg.*, sg.business_id INTO v_game
    FROM spin_games sg
    WHERE sg.id = p_game_id AND sg.is_active = true
      AND (sg.starts_at IS NULL OR sg.starts_at <= NOW())
      AND (sg.ends_at IS NULL OR sg.ends_at >= NOW());
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game not found or not active';
    END IF;
    
    v_business_id := v_game.business_id;
    
    -- Check customer is active with this business
    SELECT is_active INTO v_is_active
    FROM customer_business_activations
    WHERE user_id = v_user_id AND business_id = v_business_id
      AND is_active = TRUE AND expires_at > NOW();
    
    IF NOT v_is_active THEN
        RAISE EXCEPTION 'You need an active code from this business to spin. Ask them for a code!';
    END IF;

    -- Plan engagement limit
    IF NOT check_business_engagement_allowed(v_business_id) THEN
        RAISE EXCEPTION 'This business has reached its monthly engagement limit. Try again next month or ask them to upgrade.';
    END IF;

    -- Live broadcast: spin animation start
    PERFORM record_spin_start(p_game_id, v_user_id);
    
    -- Check single prize
    IF v_game.is_single_prize AND v_game.single_prize_claimed THEN
        RAISE EXCEPTION 'Grand prize already claimed';
    END IF;
    
    -- Get or create allocation
    SELECT * INTO v_allocation
    FROM user_spin_allocations
    WHERE user_id = v_user_id AND game_id = p_game_id AND date = v_today;
    
    IF NOT FOUND THEN
        INSERT INTO user_spin_allocations (user_id, game_id, date, spins_used_today, spins_used_this_week, spins_used_total)
        VALUES (v_user_id, p_game_id, v_today, 0, 0, 0)
        RETURNING * INTO v_allocation;
    END IF;
    
    -- Check eligibility
    IF p_spin_type = 'free' THEN
        IF v_game.free_spins_total <= v_allocation.spins_used_total THEN
            RAISE EXCEPTION 'No free spins remaining (total limit)';
        END IF;
        IF v_game.free_spins_per_day <= v_allocation.spins_used_today THEN
            RAISE EXCEPTION 'No free spins remaining today. Come back tomorrow!';
        END IF;
        IF v_game.free_spins_per_week <= v_allocation.spins_used_this_week THEN
            RAISE EXCEPTION 'No free spins remaining this week';
        END IF;
    ELSIF p_spin_type = 'points' THEN
        SELECT points INTO v_user_points
        FROM loyalty_points
        WHERE user_id = v_user_id AND business_id = v_business_id;
        
        IF v_user_points IS NULL OR v_user_points < v_game.points_per_paid_spin THEN
            RAISE EXCEPTION 'Insufficient points. Need % points', v_game.points_per_paid_spin;
        END IF;
        
        v_points_spent := v_game.points_per_paid_spin;
        
        UPDATE loyalty_points
        SET points = points - v_points_spent, updated_at = NOW()
        WHERE user_id = v_user_id AND business_id = v_business_id;
    ELSE
        RAISE EXCEPTION 'Invalid spin type. Use ''free'' or ''points''';
    END IF;
    
    -- Select prize by probability
    v_prize_config := v_game.prize_config;
    v_num_prizes := jsonb_array_length(v_prize_config);
    v_random := RANDOM() * 100;
    
    FOR i IN 0..v_num_prizes - 1 LOOP
        v_cumulative := v_cumulative + (v_prize_config->i->>'probability')::FLOAT;
        IF v_random <= v_cumulative THEN
            v_prize_index := i;
            EXIT;
        END IF;
    END LOOP;
    
    v_selected_prize := v_prize_config->v_prize_index;
    
    -- Award prize
    CASE v_selected_prize->>'type'
        WHEN 'points' THEN
            v_points_awarded := (v_selected_prize->>'value')::INT;
            v_prize_display := v_points_awarded || ' points';
            
            PERFORM award_engagement_points(
                v_user_id, v_business_id, v_points_awarded,
                'spin_win',
                'Won ' || v_points_awarded || ' points from ' || v_game.name,
                jsonb_build_object('game_id', p_game_id, 'prize_type', 'points')
            );
            
        WHEN 'discount' THEN
            v_prize_display := (v_selected_prize->>'value') || '% off';
            
        WHEN 'product' THEN
            v_prize_display := 'Free ' || (v_selected_prize->>'value');
            
        WHEN 'trivia_ticket' THEN
            v_prize_display := COALESCE(v_selected_prize->>'label', 'Trivia Challenge Entry');
            
        ELSE
            v_prize_display := COALESCE(v_selected_prize->>'label', v_selected_prize->>'value', 'Prize!');
    END CASE;
    
    -- Record spin attempt
    INSERT INTO spin_attempts (
        game_id, user_id, business_id, spin_type, prize_type, prize_value,
        points_awarded, points_spent, segment_index, landed_at
    ) VALUES (
        p_game_id, v_user_id, v_business_id, p_spin_type,
        v_selected_prize->>'type', v_selected_prize->>'value',
        v_points_awarded, v_points_spent, v_prize_index, NOW()
    )
    RETURNING id INTO v_attempt_id;
    
    -- Update allocation
    UPDATE user_spin_allocations
    SET spins_used_today = spins_used_today + 1,
        spins_used_this_week = spins_used_this_week + 1,
        spins_used_total = spins_used_total + 1,
        last_spin_at = NOW()
    WHERE user_id = v_user_id AND game_id = p_game_id AND date = v_today;
    
    -- Update customer activation
    UPDATE customer_business_activations
    SET spins_used = spins_used + 1, last_activity_at = NOW()
    WHERE user_id = v_user_id AND business_id = v_business_id;
    
    -- Single prize lock
    IF v_game.is_single_prize AND p_spin_type != 'points' THEN
        UPDATE spin_games
        SET single_prize_claimed = true, single_prize_winner_id = v_user_id
        WHERE id = p_game_id;
    END IF;
    
    -- Trivia integration
    IF v_selected_prize->>'type' = 'trivia_ticket' AND v_game.linked_challenge_id IS NOT NULL THEN
        BEGIN
            SELECT * INTO v_trivia_result
            FROM add_trivia_participant_from_spin(v_game.linked_challenge_id, v_user_id, v_attempt_id);
            
            IF v_trivia_result->>'success' = 'true' THEN
                v_prize_display := v_prize_display || ' - Ticket #' || (v_trivia_result->>'ticket_number');
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to add trivia participant: %', SQLERRM;
        END;
    END IF;
    
    -- Live ticker
    PERFORM record_spin_win(v_attempt_id, v_prize_display);

    -- Increment business engagement meter
    PERFORM increment_business_engagement(v_business_id, 'spin');
    
    -- Return result
    SELECT json_build_object(
        'id', v_attempt_id,
        'prize_type', v_selected_prize->>'type',
        'prize_value', v_selected_prize->>'value',
        'prize_display', v_prize_display,
        'points_awarded', v_points_awarded,
        'points_spent', v_points_spent,
        'segment_index', v_prize_index,
        'trivia_ticket', CASE 
            WHEN v_selected_prize->>'type' = 'trivia_ticket' AND v_trivia_result->>'success' = 'true'
            THEN jsonb_build_object('ticket_number', v_trivia_result->>'ticket_number', 'challenge_id', v_game.linked_challenge_id)
            ELSE NULL 
        END
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Get user allocation for a game
CREATE OR REPLACE FUNCTION get_user_allocation(
    p_user_id UUID,
    p_game_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_allocation RECORD;
    v_game RECORD;
    v_is_active BOOLEAN;
    v_result JSON;
BEGIN
    SELECT sg.*, sg.business_id INTO v_game FROM spin_games sg WHERE sg.id = p_game_id;
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Game not found');
    END IF;
    
    -- Check activation
    SELECT is_active INTO v_is_active
    FROM customer_business_activations
    WHERE user_id = p_user_id AND business_id = v_game.business_id
    AND is_active = TRUE AND expires_at > NOW();
    
    -- Get allocation
    SELECT * INTO v_allocation
    FROM user_spin_allocations
    WHERE user_id = p_user_id AND game_id = p_game_id AND date = v_today;
    
    IF NOT FOUND THEN
        v_allocation := ROW(p_user_id, p_game_id, v_today, 0, 0, 0, NULL)::user_spin_allocations;
    END IF;
    
    SELECT json_build_object(
        'spins_used_today', COALESCE(v_allocation.spins_used_today, 0),
        'spins_used_this_week', COALESCE(v_allocation.spins_used_this_week, 0),
        'spins_used_total', COALESCE(v_allocation.spins_used_total, 0),
        'free_spins_remaining_today', GREATEST(0, COALESCE(v_game.free_spins_per_day, 0) - COALESCE(v_allocation.spins_used_today, 0)),
        'free_spins_remaining_week', GREATEST(0, COALESCE(v_game.free_spins_per_week, 0) - COALESCE(v_allocation.spins_used_this_week, 0)),
        'free_spins_remaining_total', GREATEST(0, COALESCE(v_game.free_spins_total, 0) - COALESCE(v_allocation.spins_used_total, 0)),
        'points_required_for_paid', COALESCE(v_game.points_per_paid_spin, 0),
        'can_spin_free', COALESCE(v_is_active, FALSE) 
                         AND GREATEST(0, COALESCE(v_game.free_spins_total, 0) - COALESCE(v_allocation.spins_used_total, 0)) > 0
                         AND GREATEST(0, COALESCE(v_game.free_spins_per_day, 0) - COALESCE(v_allocation.spins_used_today, 0)) > 0
                         AND GREATEST(0, COALESCE(v_game.free_spins_per_week, 0) - COALESCE(v_allocation.spins_used_this_week, 0)) > 0,
        'can_spin_paid', COALESCE(v_is_active, FALSE),
        'is_active', COALESCE(v_is_active, FALSE)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Get business spin games with stats
CREATE OR REPLACE FUNCTION get_business_spin_games(p_business_id UUID)
RETURNS TABLE(
    id UUID, name TEXT, description TEXT,
    is_active BOOLEAN, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
    free_spins_per_day INT, free_spins_per_week INT, free_spins_total INT,
    points_per_paid_spin INT, prize_config JSONB,
    is_single_prize BOOLEAN, single_prize_claimed BOOLEAN,
    theme_color TEXT, spins_today BIGINT, total_participants BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id, g.name, g.description,
        g.is_active, g.starts_at, g.ends_at,
        g.free_spins_per_day, g.free_spins_per_week, g.free_spins_total,
        g.points_per_paid_spin, g.prize_config,
        g.is_single_prize, g.single_prize_claimed,
        g.theme_color,
        COALESCE((SELECT COUNT(*)::BIGINT FROM spin_attempts sa WHERE sa.game_id = g.id AND sa.created_at::DATE = CURRENT_DATE), 0),
        COALESCE((SELECT COUNT(DISTINCT sa.user_id)::BIGINT FROM spin_attempts sa WHERE sa.game_id = g.id), 0)
    FROM spin_games g
    WHERE g.business_id = p_business_id
    ORDER BY g.is_active DESC, g.created_at DESC;
END;
$$;

-- Get game participant stats
CREATE OR REPLACE FUNCTION get_game_participant_stats(p_game_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_participants BIGINT;
    v_total_spins BIGINT;
BEGIN
    SELECT COUNT(DISTINCT user_id) INTO v_total_participants FROM spin_attempts WHERE game_id = p_game_id;
    SELECT COUNT(*) INTO v_total_spins FROM spin_attempts WHERE game_id = p_game_id;
    
    RETURN json_build_object(
        'total_participants', COALESCE(v_total_participants, 0),
        'total_spins', COALESCE(v_total_spins, 0)
    );
END;
$$;

-- Get game participants list
CREATE OR REPLACE FUNCTION get_game_participants(p_game_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE(
    id UUID, name TEXT, avatar TEXT,
    first_spin_at TIMESTAMPTZ, spin_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT u.id, COALESCE(u.full_name, 'Anonymous') as name,
               UPPER(LEFT(COALESCE(u.full_name, '?'), 1)) as avatar,
               MIN(sa.created_at) as first_spin_at, COUNT(*) as spin_count
        FROM spin_attempts sa
        JOIN users u ON sa.user_id = u.id
        WHERE sa.game_id = p_game_id
        GROUP BY u.id, u.full_name
        ORDER BY spin_count DESC, first_spin_at DESC
        LIMIT p_limit
    )
    SELECT s.id, s.name, s.avatar, s.first_spin_at, s.spin_count FROM stats s;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_spin_start(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_spin_win(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION perform_spin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_allocation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_spin_games(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_participant_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_participants(UUID, INT) TO authenticated;