-- ============================================
-- ENGAGE PLATFORM: Challenges - Trivia Only
-- ============================================

-- 1. Challenges table (trivia only)
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Only trivia type
    challenge_type TEXT NOT NULL DEFAULT 'trivia' CHECK (challenge_type = 'trivia'),
    
    -- Scoring configuration
    scoring_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Example: {"base_points": 100, "speed_bonus_lightning": 50, "speed_bonus_quick": 25, "speed_bonus_good": 10}
    
    -- Prize tiers (1st, 2nd, 3rd)
    prize_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [{"rank": 1, "prize_type": "points", "prize_value": 5000}, {"rank": 2, "prize_type": "points", "prize_value": 2500}]
    
    -- Timing
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended', 'archived')),
    
    -- Display
    cover_image_url TEXT,
    theme_color TEXT DEFAULT '#8B5CF6',
    show_leaderboard BOOLEAN DEFAULT TRUE,
    show_ticker BOOLEAN DEFAULT TRUE,
    
    participation_points INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 2. Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    ticket_number INTEGER,
    queue_position INTEGER,
    is_active_in_round BOOLEAN DEFAULT TRUE,
    joined_via_spin BOOLEAN DEFAULT FALSE,
    spin_attempt_id UUID REFERENCES spin_attempts(id),
    
    current_score INTEGER DEFAULT 0,
    current_rank INTEGER,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_action_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(challenge_id, user_id)
);

-- 3. Challenge actions
CREATE TABLE IF NOT EXISTS challenge_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    action_type TEXT NOT NULL CHECK (action_type IN (
        'trivia_joined',
        'trivia_answer',
        'trivia_timeout',
        'trivia_passed'
    )),
    
    points_awarded INTEGER NOT NULL DEFAULT 0,
    action_value NUMERIC,
    action_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trivia questions
CREATE TABLE IF NOT EXISTS challenge_trivia_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    question TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'open_ended', 'true_false')),
    options JSONB,
    correct_answer_index INTEGER,
    accepted_answers TEXT[] DEFAULT '{}',
    case_sensitive BOOLEAN DEFAULT FALSE,
    
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'bonus')),
    points_value INTEGER DEFAULT 100,
    time_limit_seconds INTEGER DEFAULT 5,
    
    display_order INTEGER DEFAULT 0,
    category TEXT,
    explanation TEXT,
    image_url TEXT,
    
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trivia rounds
CREATE TABLE IF NOT EXISTS challenge_trivia_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    round_number INTEGER NOT NULL,
    theme TEXT,
    host_message TEXT,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    points_multiplier NUMERIC DEFAULT 1.0,
    time_limit_override INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trivia round questions
CREATE TABLE IF NOT EXISTS challenge_trivia_round_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES challenge_trivia_rounds(id) ON DELETE CASCADE,
    question_id UUID REFERENCES challenge_trivia_questions(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    display_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'answered', 'timeout', 'skipped')),
    
    answered_by UUID REFERENCES users(id),
    answered_at TIMESTAMPTZ,
    was_correct BOOLEAN,
    points_awarded INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Trivia selections (queue-based)
CREATE TABLE IF NOT EXISTS challenge_trivia_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    round_id UUID REFERENCES challenge_trivia_rounds(id) ON DELETE CASCADE,
    question_id UUID REFERENCES challenge_trivia_questions(id) ON DELETE CASCADE,
    
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
    ticket_number INTEGER,
    
    queue_position INTEGER,
    attempt_number INTEGER DEFAULT 1,
    
    selected_answer INTEGER CHECK (selected_answer >= 0 AND selected_answer <= 3),
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    
    question_shown_at TIMESTAMPTZ,
    answer_submitted_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    
    status TEXT DEFAULT 'queued' CHECK (status IN (
        'queued', 'current', 'answered', 'timeout', 'passed', 'skipped', 'eliminated'
    )),
    
    points_awarded_to UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Trivia scores
CREATE TABLE IF NOT EXISTS challenge_trivia_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    total_score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    fastest_response_ms INTEGER,
    average_response_ms INTEGER,
    
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    
    last_answered_at TIMESTAMPTZ,
    
    UNIQUE(challenge_id, user_id)
);

-- 9. Live ticker
CREATE TABLE IF NOT EXISTS challenge_live_ticker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_name TEXT,
    action_text TEXT,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_challenges_business ON challenges(business_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id, current_score DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_ticket ON challenge_participants(challenge_id, ticket_number);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_business ON challenge_participants(business_id, joined_via_spin);
CREATE INDEX IF NOT EXISTS idx_challenge_actions_challenge ON challenge_actions(challenge_id, user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_challenge ON challenge_trivia_questions(challenge_id, is_used);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_business ON challenge_trivia_questions(business_id);
CREATE INDEX IF NOT EXISTS idx_trivia_rounds_challenge ON challenge_trivia_rounds(challenge_id, status);
CREATE INDEX IF NOT EXISTS idx_trivia_rounds_business ON challenge_trivia_rounds(business_id);
CREATE INDEX IF NOT EXISTS idx_trivia_selections_challenge ON challenge_trivia_selections(challenge_id, status);
CREATE INDEX IF NOT EXISTS idx_trivia_selections_queue ON challenge_trivia_selections(challenge_id, queue_position);
CREATE INDEX IF NOT EXISTS idx_trivia_selections_business ON challenge_trivia_selections(business_id, status);
CREATE INDEX IF NOT EXISTS idx_trivia_scores_challenge ON challenge_trivia_scores(challenge_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_trivia_scores_business ON challenge_trivia_scores(business_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_live_ticker_challenge ON challenge_live_ticker(challenge_id, created_at DESC);

-- ============================================
-- Enable real-time
-- ============================================
ALTER TABLE challenges REPLICA IDENTITY FULL;
ALTER TABLE challenge_participants REPLICA IDENTITY FULL;
ALTER TABLE challenge_actions REPLICA IDENTITY FULL;
ALTER TABLE challenge_trivia_selections REPLICA IDENTITY FULL;
ALTER TABLE challenge_live_ticker REPLICA IDENTITY FULL;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_round_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_live_ticker ENABLE ROW LEVEL SECURITY;

-- Anyone can view active challenges
CREATE POLICY "Anyone can view active challenges" ON challenges
    FOR SELECT USING (status = 'active');

-- Anyone can view trivia questions
CREATE POLICY "Anyone can view questions" ON challenge_trivia_questions
    FOR SELECT USING (true);

-- Anyone can view trivia scores
CREATE POLICY "Anyone can view trivia scores" ON challenge_trivia_scores
    FOR SELECT USING (true);

-- Anyone can view participants
CREATE POLICY "Anyone can view participants" ON challenge_participants
    FOR SELECT USING (true);

-- Users can view their own selections
CREATE POLICY "select_own_selections" ON challenge_trivia_selections
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update their own selections (for answering)
CREATE POLICY "update_own_selections" ON challenge_trivia_selections
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can view challenge actions
CREATE POLICY "Anyone can view actions" ON challenge_actions
    FOR SELECT USING (true);

-- Admin policies (scoped to business)
CREATE POLICY "Admins can manage own challenges" ON challenges
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own participants" ON challenge_participants
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own questions" ON challenge_trivia_questions
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own rounds" ON challenge_trivia_rounds
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own round questions" ON challenge_trivia_round_questions
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own selections" ON challenge_trivia_selections
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own scores" ON challenge_trivia_scores
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage own ticker" ON challenge_live_ticker
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- ============================================
-- Functions
-- ============================================

-- Recalculate ranks
CREATE OR REPLACE FUNCTION recalculate_challenge_ranks(p_challenge_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE challenge_participants
    SET current_rank = ranked.rank
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY current_score DESC) as rank
        FROM challenge_participants
        WHERE challenge_id = p_challenge_id
    ) ranked
    WHERE challenge_participants.id = ranked.id;
END;
$$;

-- Auto-end expired challenges
CREATE OR REPLACE FUNCTION auto_end_expired_challenges()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE challenges
    SET status = 'ended'
    WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at < NOW();
    
    PERFORM recalculate_challenge_ranks(id)
    FROM challenges
    WHERE status = 'ended' AND updated_at < NOW() - INTERVAL '1 hour';
END;
$$;