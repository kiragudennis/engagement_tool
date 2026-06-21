-- Trivia questions table
CREATE TABLE IF NOT EXISTS challenge_trivia_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    
    -- Question content
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of possible answers: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0 AND correct_answer_index <= 3),
    
    -- Difficulty & Scoring
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'bonus')),
    points_value INTEGER DEFAULT 100,
    time_limit_seconds INTEGER DEFAULT 5, -- Default 5 seconds
    
    -- Ordering
    display_order INTEGER DEFAULT 0,
    
    -- Status tracking
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    
    -- Metadata
    category TEXT,
    explanation TEXT,
    image_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trivia rounds/sessions (a live session can have multiple rounds)
CREATE TABLE IF NOT EXISTS challenge_trivia_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    
    -- Round info
    round_number INTEGER NOT NULL,
    theme TEXT,
    host_message TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Rules for this round
    points_multiplier NUMERIC DEFAULT 1.0,
    time_limit_override INTEGER, -- Override default time limit
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trivia round questions (which questions in which round)
CREATE TABLE IF NOT EXISTS challenge_trivia_round_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES challenge_trivia_rounds(id) ON DELETE CASCADE,
    question_id UUID REFERENCES challenge_trivia_questions(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'answered', 'timeout', 'skipped')),
    
    -- Track who answered
    answered_by UUID REFERENCES users(id),
    answered_at TIMESTAMPTZ,
    was_correct BOOLEAN,
    points_awarded INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trivia leaderboard (real-time)
CREATE TABLE IF NOT EXISTS challenge_trivia_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
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

-- Indexes
CREATE INDEX idx_trivia_questions_challenge ON challenge_trivia_questions(challenge_id, is_used);
CREATE INDEX idx_trivia_rounds_challenge ON challenge_trivia_rounds(challenge_id, status);
CREATE INDEX idx_trivia_selections_challenge ON challenge_trivia_selections(challenge_id, status);
CREATE INDEX idx_trivia_scores_challenge ON challenge_trivia_scores(challenge_id, total_score DESC);

-- Enable RLS
ALTER TABLE challenge_trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_round_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view questions" ON challenge_trivia_questions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view trivia scores" ON challenge_trivia_scores
    FOR SELECT USING (true);
-- First, DROP ALL existing policies on this table
DROP POLICY IF EXISTS "Users can insert their answers" ON challenge_trivia_selections;
DROP POLICY IF EXISTS "Users can view their own selections" ON challenge_trivia_selections;
DROP POLICY IF EXISTS "Users can update their own selections" ON challenge_trivia_selections;
DROP POLICY IF EXISTS "Admins can view all selections" ON challenge_trivia_selections;

-- 1. SELECT - Users can see their own selections (CRITICAL for real-time)
CREATE POLICY "select_own_selections"
ON challenge_trivia_selections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. INSERT - Users can insert their own selections (needed for real-time to work properly)
CREATE POLICY "insert_own_selections"
ON challenge_trivia_selections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE - Users can update their own selections (for answering)
CREATE POLICY "update_own_selections"
ON challenge_trivia_selections
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. DELETE - Optional, but good to have
CREATE POLICY "delete_own_selections"
ON challenge_trivia_selections
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Admin access (if you have is_admin function)
CREATE POLICY "admin_all_access"
ON challenge_trivia_selections
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admin policies
CREATE POLICY "Admins can manage trivia" ON challenge_trivia_questions
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage trivia scores" ON challenge_trivia_scores
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage trivia round questions" ON challenge_trivia_round_questions
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage trivia rounds" ON challenge_trivia_rounds
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage rounds" ON challenge_trivia_rounds
    FOR ALL USING (public.is_admin());

-- Functions
-- ============================================
-- ENGAGE PLATFORM: Trivia tables - add business_id + update RLS
-- ============================================

-- 1. Add business_id to all trivia tables (already added in previous migration for most)
-- These are the ones that might have been missed:
ALTER TABLE challenge_trivia_rounds 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE challenge_trivia_round_questions 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- 2. Update RLS policies to scope by business for admin access
-- Admins should only manage their own business's trivia

-- challenge_trivia_questions: Replace admin policy
DROP POLICY IF EXISTS "Admins can manage trivia" ON challenge_trivia_questions;
CREATE POLICY "Admins can manage own business trivia" ON challenge_trivia_questions
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- challenge_trivia_scores: Replace admin policy
DROP POLICY IF EXISTS "Admins can manage trivia scores" ON challenge_trivia_scores;
CREATE POLICY "Admins can manage own business trivia scores" ON challenge_trivia_scores
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- challenge_trivia_rounds: Replace admin policy
DROP POLICY IF EXISTS "Admins can manage trivia rounds" ON challenge_trivia_rounds;
DROP POLICY IF EXISTS "Admins can manage rounds" ON challenge_trivia_rounds;
CREATE POLICY "Admins can manage own business rounds" ON challenge_trivia_rounds
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- challenge_trivia_round_questions: Replace admin policy
DROP POLICY IF EXISTS "Admins can manage trivia round questions" ON challenge_trivia_round_questions;
CREATE POLICY "Admins can manage own business round questions" ON challenge_trivia_round_questions
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- challenge_trivia_selections: Update admin policy
DROP POLICY IF EXISTS "admin_all_access" ON challenge_trivia_selections;
CREATE POLICY "admin_all_access" ON challenge_trivia_selections
    FOR ALL USING (
        public.is_admin() AND 
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- 3. Update select_trivia_participant to include business_id
CREATE OR REPLACE FUNCTION select_trivia_participant(
    p_challenge_id UUID,
    p_round_id UUID,
    p_question_id UUID,
    p_spin_game_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_selected_user_id UUID;
    v_user_name TEXT;
    v_selection_id UUID;
    v_business_id UUID;
    v_result JSON;
BEGIN
    -- Get business_id from challenge
    SELECT business_id INTO v_business_id FROM challenges WHERE id = p_challenge_id;

    -- Use the spin game to select a random participant
    SELECT user_id INTO v_selected_user_id
    FROM spin_attempts
    WHERE game_id = p_spin_game_id
    AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Fallback: select from challenge participants
        SELECT cp.user_id INTO v_selected_user_id
        FROM challenge_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.challenge_id = p_challenge_id
        AND cp.joined_via_spin = TRUE
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No participants available');
    END IF;
    
    -- Get user name
    SELECT COALESCE(full_name, 'Anonymous') INTO v_user_name
    FROM users WHERE id = v_selected_user_id;
    
    -- Create selection record
    INSERT INTO challenge_trivia_selections (
        challenge_id, business_id, round_id, question_id,
        user_id, status, question_shown_at
    ) VALUES (
        p_challenge_id, v_business_id, p_round_id, p_question_id,
        v_selected_user_id, 'queued', NOW()
    )
    RETURNING id INTO v_selection_id;
    
    -- Add to live ticker
    INSERT INTO challenge_live_ticker (
        challenge_id, business_id, user_name, action_text, points_awarded
    ) VALUES (
        p_challenge_id, v_business_id,
        v_user_name, 'Selected by the wheel! 🎡', 0
    );
    
    RETURN json_build_object(
        'success', true,
        'selection_id', v_selection_id,
        'user_id', v_selected_user_id,
        'user_name', v_user_name
    );
END;
$$;

-- 4. Update indexes for business-scoped queries
CREATE INDEX IF NOT EXISTS idx_trivia_rounds_business ON challenge_trivia_rounds(business_id, status);
CREATE INDEX IF NOT EXISTS idx_trivia_round_questions_business ON challenge_trivia_round_questions(business_id);
CREATE INDEX IF NOT EXISTS idx_trivia_scores_business ON challenge_trivia_scores(business_id, total_score DESC);