-- Enhanced challenge_participants for trivia with ticket system
ALTER TABLE challenge_participants 
ADD COLUMN IF NOT EXISTS ticket_number INTEGER,
ADD COLUMN IF NOT EXISTS queue_position INTEGER,
ADD COLUMN IF NOT EXISTS is_active_in_round BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS joined_via_spin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spin_attempt_id UUID REFERENCES spin_attempts(id);

-- Create sequence for ticket numbers per challenge
CREATE OR REPLACE FUNCTION get_next_ticket_number(p_challenge_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(ticket_number), 0) + 1
    INTO v_next_number
    FROM challenge_participants
    WHERE challenge_id = p_challenge_id;
    
    RETURN v_next_number;
END;
$$;

-- Modified trivia selections table for queue-based system
DROP TABLE IF EXISTS challenge_trivia_selections CASCADE;
CREATE TABLE challenge_trivia_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    round_id UUID REFERENCES challenge_trivia_rounds(id) ON DELETE CASCADE,
    question_id UUID REFERENCES challenge_trivia_questions(id) ON DELETE CASCADE,
    
    -- Current participant attempting
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
    ticket_number INTEGER,
    
    -- Queue management
    queue_position INTEGER, -- Position in the answering queue
    attempt_number INTEGER DEFAULT 1, -- Which attempt for this question (1st, 2nd, 3rd)
    
    -- Answer tracking
    selected_answer INTEGER CHECK (selected_answer >= 0 AND selected_answer <= 3),
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    
    -- Time tracking
    question_shown_at TIMESTAMPTZ,
    answer_submitted_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    
    -- Status (expanded for queue system)
    status TEXT DEFAULT 'queued' CHECK (status IN (
        'queued',        -- Waiting in queue
        'current',       -- Currently answering
        'answered',      -- Submitted answer
        'timeout',       -- Ran out of time
        'passed',        -- Passed to next person
        'skipped',       -- Skipped their turn
        'eliminated'     -- Removed from queue
    )),
    
    -- Who got the points (if passed, the correct answerer)
    points_awarded_to UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trivia_selections_challenge_status ON challenge_trivia_selections(challenge_id, status);
CREATE INDEX idx_trivia_selections_queue ON challenge_trivia_selections(challenge_id, queue_position);
CREATE INDEX idx_participants_ticket ON challenge_participants(challenge_id, ticket_number);

-- 1. Add a function to clean up stale selections and handle timeouts
CREATE OR REPLACE FUNCTION cleanup_stale_trivia_selections(
    p_challenge_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cleaned_count INTEGER := 0;
    v_timeout_seconds INTEGER;
    v_selection RECORD;
BEGIN
    -- Get the default time limit from challenge config or use 5 seconds
    SELECT COALESCE(
        (scoring_config->>'default_time_limit')::INTEGER,
        5
    ) INTO v_timeout_seconds
    FROM challenges
    WHERE id = COALESCE(p_challenge_id, '00000000-0000-0000-0000-000000000000');
    
    -- Find stale 'current' selections that have exceeded time limit
    FOR v_selection IN
        SELECT 
            cts.id,
            cts.challenge_id,
            cts.question_id,
            cts.user_id,
            cts.participant_id,
            cts.ticket_number,
            cts.question_shown_at,
            COALESCE(ctq.time_limit_seconds, v_timeout_seconds) as time_limit
        FROM challenge_trivia_selections cts
        LEFT JOIN challenge_trivia_questions ctq ON ctq.id = cts.question_id
        WHERE cts.status = 'current'
        AND cts.question_shown_at < (NOW() - INTERVAL '1 second' * COALESCE(ctq.time_limit_seconds, v_timeout_seconds))
        AND (p_challenge_id IS NULL OR cts.challenge_id = p_challenge_id)
    LOOP
        -- Mark as timeout
        UPDATE challenge_trivia_selections
        SET 
            status = 'timeout',
            answer_submitted_at = NOW(),
            is_correct = FALSE,
            points_earned = 0
        WHERE id = v_selection.id;
        
        -- Add to live ticker
        INSERT INTO challenge_live_ticker (
            challenge_id,
            user_name,
            action_text,
            points_awarded
        )
        SELECT
            v_selection.challenge_id,
            COALESCE(u.full_name, 'Anonymous'),
            '⏰ Ticket #' || v_selection.ticket_number || ' ran out of time!',
            0
        FROM users u
        WHERE u.id = v_selection.user_id;
        
        v_cleaned_count := v_cleaned_count + 1;
    END LOOP;
    
    -- Also clean up any 'current' selections that are orphaned (no question exists)
    WITH orphaned AS (
        UPDATE challenge_trivia_selections
        SET status = 'timeout',
            answer_submitted_at = NOW()
        WHERE status = 'current'
        AND question_shown_at < (NOW() - INTERVAL '10 minutes')
        AND (p_challenge_id IS NULL OR challenge_id = p_challenge_id)
        RETURNING id
    )
    SELECT COUNT(*) INTO v_cleaned_count FROM orphaned;
    
    RETURN v_cleaned_count;
END;
$$;

-- 2. Update get_next_queued_participant to clean up before selecting
CREATE OR REPLACE FUNCTION get_next_queued_participant(
    p_challenge_id UUID,
    p_current_question_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_participant RECORD;
    v_attempt_count INTEGER;
    v_selection_id UUID;
    v_question challenge_trivia_questions%ROWTYPE;
BEGIN
    -- Clean up any stale selections first
    PERFORM cleanup_stale_trivia_selections(p_challenge_id);
    
    -- Also mark any existing 'current' for other users as 'passed' since we're selecting someone new
    UPDATE challenge_trivia_selections
    SET status = 'passed',
        answer_submitted_at = NOW()
    WHERE challenge_id = p_challenge_id
    AND status = 'current'
    AND question_id != p_current_question_id;
    
    -- Get current question
    SELECT * INTO v_question
    FROM challenge_trivia_questions
    WHERE id = p_current_question_id;
    
    -- Count how many have attempted this question
    SELECT COUNT(*) INTO v_attempt_count
    FROM challenge_trivia_selections
    WHERE challenge_id = p_challenge_id
    AND question_id = p_current_question_id
    AND status IN ('answered', 'timeout', 'passed');
    
    -- Get next participant from queue who hasn't attempted this question
    SELECT 
        cp.id as participant_id,
        cp.user_id,
        cp.ticket_number,
        cp.queue_position,
        u.full_name as user_name
    INTO v_next_participant
    FROM challenge_participants cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.challenge_id = p_challenge_id
    AND cp.is_active_in_round = TRUE
    AND cp.joined_via_spin = TRUE
    AND NOT EXISTS (
        SELECT 1 FROM challenge_trivia_selections cts
        WHERE cts.challenge_id = p_challenge_id
        AND cts.question_id = p_current_question_id
        AND cts.user_id = cp.user_id
        AND cts.status IN ('answered', 'timeout', 'passed')
    )
    AND NOT EXISTS (
        SELECT 1 FROM challenge_trivia_selections cts
        WHERE cts.challenge_id = p_challenge_id
        AND cts.user_id = cp.user_id
        AND cts.status = 'eliminated'
    )
    ORDER BY cp.queue_position ASC
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Everyone has attempted, reset
        SELECT 
            cp.id as participant_id,
            cp.user_id,
            cp.ticket_number,
            cp.queue_position,
            u.full_name as user_name
        INTO v_next_participant
        FROM challenge_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.challenge_id = p_challenge_id
        AND cp.is_active_in_round = TRUE
        AND cp.joined_via_spin = TRUE
        ORDER BY cp.queue_position ASC
        LIMIT 1;
    END IF;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No participants available');
    END IF;
    
    -- Create selection record
    INSERT INTO challenge_trivia_selections (
        challenge_id,
        question_id,
        user_id,
        participant_id,
        ticket_number,
        queue_position,
        attempt_number,
        status,
        question_shown_at
    ) VALUES (
        p_challenge_id,
        p_current_question_id,
        v_next_participant.user_id,
        v_next_participant.participant_id,
        v_next_participant.ticket_number,
        v_next_participant.queue_position,
        v_attempt_count + 1,
        'current',
        NOW()
    )
    RETURNING id INTO v_selection_id;
    
    -- Add to live ticker
    INSERT INTO challenge_live_ticker (
        challenge_id,
        user_name,
        action_text,
        points_awarded
    ) VALUES (
        p_challenge_id,
        v_next_participant.user_name,
        '🎯 Ticket #' || v_next_participant.ticket_number || ' is up! Question attempt #' || (v_attempt_count + 1)::TEXT,
        0
    );
    
    RETURN json_build_object(
        'success', true,
        'selection_id', v_selection_id,
        'user_id', v_next_participant.user_id,
        'user_name', v_next_participant.user_name,
        'ticket_number', v_next_participant.ticket_number,
        'attempt_number', v_attempt_count + 1
    );
END;
$$;

-- 3. Update pass_to_next_participant to clean up first
CREATE OR REPLACE FUNCTION pass_to_next_participant(
    p_selection_id UUID,
    p_reason TEXT DEFAULT 'wrong_answer'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_selection challenge_trivia_selections%ROWTYPE;
    v_next_participant RECORD;
    v_new_selection_id UUID;
    v_attempt_count INTEGER;
BEGIN
    -- Get current selection
    SELECT * INTO v_selection
    FROM challenge_trivia_selections
    WHERE id = p_selection_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Selection not found');
    END IF;
    
    -- Clean up stale selections
    PERFORM cleanup_stale_trivia_selections(v_selection.challenge_id);
    
    -- Mark current as passed (only if still 'current')
    IF v_selection.status = 'current' THEN
        UPDATE challenge_trivia_selections
        SET status = 'passed',
            answer_submitted_at = NOW()
        WHERE id = p_selection_id;
    END IF;
    
    -- Add to ticker
    INSERT INTO challenge_live_ticker (
        challenge_id,
        user_name,
        action_text,
        points_awarded
    )
    SELECT
        v_selection.challenge_id,
        u.full_name,
        CASE 
            WHEN p_reason = 'wrong_answer' THEN '❌ Wrong answer! Passing to next player'
            WHEN p_reason = 'timeout' THEN '⏰ Time is up! Passing to next player'
            ELSE '➡️ Passed to next player'
        END,
        0
    FROM users u
    WHERE u.id = v_selection.user_id;
    
    -- Get next participant
    SELECT 
        cp.id as participant_id,
        cp.user_id,
        cp.ticket_number,
        cp.queue_position,
        u.full_name as user_name
    INTO v_next_participant
    FROM challenge_participants cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.challenge_id = v_selection.challenge_id
    AND cp.is_active_in_round = TRUE
    AND cp.joined_via_spin = TRUE
    AND cp.user_id != v_selection.user_id
    AND NOT EXISTS (
        SELECT 1 FROM challenge_trivia_selections cts
        WHERE cts.challenge_id = v_selection.challenge_id
        AND cts.question_id = v_selection.question_id
        AND cts.user_id = cp.user_id
        AND cts.status IN ('answered', 'timeout', 'passed')
    )
    ORDER BY cp.queue_position ASC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'All participants attempted. Question closed.',
            'all_attempted', true
        );
    END IF;
    
    -- Count attempts
    SELECT COUNT(*) + 1 INTO v_attempt_count
    FROM challenge_trivia_selections
    WHERE challenge_id = v_selection.challenge_id
    AND question_id = v_selection.question_id;
    
    -- Create new selection for next participant
    INSERT INTO challenge_trivia_selections (
        challenge_id,
        question_id,
        user_id,
        participant_id,
        ticket_number,
        queue_position,
        attempt_number,
        status,
        question_shown_at
    ) VALUES (
        v_selection.challenge_id,
        v_selection.question_id,
        v_next_participant.user_id,
        v_next_participant.participant_id,
        v_next_participant.ticket_number,
        v_next_participant.queue_position,
        v_attempt_count,
        'current',
        NOW()
    )
    RETURNING id INTO v_new_selection_id;
    
    -- Ticker for new person
    INSERT INTO challenge_live_ticker (
        challenge_id,
        user_name,
        action_text,
        points_awarded
    ) VALUES (
        v_selection.challenge_id,
        v_next_participant.user_name,
        '🎯 Ticket #' || v_next_participant.ticket_number || ' now answering! (Attempt #' || v_attempt_count::TEXT || ')',
        0
    );
    
    RETURN json_build_object(
        'success', true,
        'selection_id', v_new_selection_id,
        'user_id', v_next_participant.user_id,
        'user_name', v_next_participant.user_name,
        'ticket_number', v_next_participant.ticket_number,
        'attempt_number', v_attempt_count
    );
END;
$$;

-- 4. Update get_trivia_queue_status to properly identify answering status
CREATE OR REPLACE FUNCTION get_trivia_queue_status(
    p_challenge_id UUID
)
RETURNS TABLE (
    ticket_number INTEGER,
    user_name TEXT,
    queue_position INTEGER,
    is_active BOOLEAN,
    total_score INTEGER,
    questions_answered INTEGER,
    correct_answers INTEGER,
    current_status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean up stale selections before returning queue status
    PERFORM cleanup_stale_trivia_selections(p_challenge_id);
    
    RETURN QUERY
    SELECT 
        cp.ticket_number,
        COALESCE(u.full_name, 'Anonymous') as user_name,
        cp.queue_position,
        cp.is_active_in_round,
        COALESCE(cp.current_score, 0) as total_score,
        COALESCE(ts.questions_answered, 0) as questions_answered,
        COALESCE(ts.correct_answers, 0) as correct_answers,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM challenge_trivia_selections cts
                WHERE cts.challenge_id = p_challenge_id
                AND cts.user_id = cp.user_id
                AND cts.status = 'current'
                AND cts.question_shown_at > (NOW() - INTERVAL '5 minutes') -- Only recent
            ) THEN 'answering'
            WHEN EXISTS (
                SELECT 1 FROM challenge_trivia_selections cts
                WHERE cts.challenge_id = p_challenge_id
                AND cts.user_id = cp.user_id
                AND cts.status = 'eliminated'
            ) THEN 'eliminated'
            ELSE 'waiting'
        END as current_status
    FROM challenge_participants cp
    JOIN users u ON u.id = cp.user_id
    LEFT JOIN challenge_trivia_scores ts ON ts.challenge_id = cp.challenge_id AND ts.user_id = cp.user_id
    WHERE cp.challenge_id = p_challenge_id
    AND cp.joined_via_spin = TRUE
    ORDER BY cp.queue_position ASC;
END;
$$;

-- 5. Create a cron job to periodically clean up stale selections
-- This can be done via pg_cron if available, or you can call this from your app
CREATE OR REPLACE FUNCTION auto_cleanup_trivia_selections()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cleaned INTEGER;
BEGIN
    v_cleaned := cleanup_stale_trivia_selections();
    
    -- Log cleanup
    IF v_cleaned > 0 THEN
        RAISE NOTICE 'Cleaned up % stale trivia selections', v_cleaned;
    END IF;
END;
$$;

-- Optional: Enable pg_cron extension and schedule cleanup
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-trivia-selections', '*/30 * * * *', 'SELECT auto_cleanup_trivia_selections();');

-- Add support for open-ended questions
ALTER TABLE challenge_trivia_questions
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice' 
CHECK (question_type IN ('multiple_choice', 'open_ended', 'true_false')),
ADD COLUMN IF NOT EXISTS accepted_answers TEXT[] DEFAULT '{}', -- For open-ended: list of accepted answers
ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN DEFAULT FALSE;

-- The points earned during trivia are for ranking purposes only (determining 1st, 2nd, 3rd place).
-- The actual prizes come from the challenge's prize_tiers configuration which supports:
-- Points (loyalty points), Discount (coupon code generated by admin), Free Shipping, Product (specific product UUID), Bundle (bundle UUID)
-- Fixed submit_trivia_answer function: points are for ranking only, prizes come from prize_tiers

C-- ============================================
-- ENGAGE PLATFORM: Trivia system updates
-- ============================================

-- 1. Add business_id to existing trivia tables
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE challenge_participants 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE challenge_trivia_questions 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE challenge_trivia_selections 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE challenge_trivia_scores 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE challenge_live_ticker 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_business_trivia ON challenges(business_id, challenge_type, status) 
  WHERE challenge_type = 'trivia';
CREATE INDEX IF NOT EXISTS idx_challenge_participants_business ON challenge_participants(business_id, joined_via_spin);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_business ON challenge_trivia_questions(business_id);
CREATE INDEX IF NOT EXISTS idx_trivia_selections_business ON challenge_trivia_selections(business_id, status);
CREATE INDEX IF NOT EXISTS idx_trivia_scores_business ON challenge_trivia_scores(business_id, total_score DESC);

-- ============================================
-- UPDATED: submit_trivia_answer with engagement points
-- ============================================
CREATE OR REPLACE FUNCTION submit_trivia_answer(
    p_selection_id UUID,
    p_answer_index INTEGER DEFAULT NULL,
    p_text_answer TEXT DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_selection challenge_trivia_selections%ROWTYPE;
    v_question challenge_trivia_questions%ROWTYPE;
    v_is_correct BOOLEAN := FALSE;
    v_points_earned INTEGER := 0;
    v_response_time INTEGER;
    v_speed_bonus INTEGER := 0;
    v_normalized_answer TEXT;
    v_challenge challenges%ROWTYPE;
    v_business_id UUID;
BEGIN
    -- Get selection
    SELECT * INTO v_selection
    FROM challenge_trivia_selections
    WHERE id = p_selection_id AND status = 'current';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid selection or already answered');
    END IF;

    -- Use provided response time or calculate it
    IF p_response_time_ms IS NOT NULL THEN
        v_response_time := p_response_time_ms;
    ELSE
        v_response_time := EXTRACT(MILLISECONDS FROM (NOW() - v_selection.question_shown_at))::INTEGER;
    END IF;
    
    -- Get question
    SELECT * INTO v_question
    FROM challenge_trivia_questions
    WHERE id = v_selection.question_id;
    
    -- Get challenge config
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = v_selection.challenge_id;
    
    v_business_id := v_challenge.business_id;
    
    -- Check answer
    IF v_question.question_type = 'multiple_choice' OR v_question.question_type = 'true_false' THEN
        v_is_correct := (p_answer_index = v_question.correct_answer_index);
    ELSIF v_question.question_type = 'open_ended' THEN
        v_normalized_answer := TRIM(LOWER(p_text_answer));
        
        IF v_question.case_sensitive THEN
            SELECT EXISTS (
                SELECT 1 FROM unnest(v_question.accepted_answers) AS answer
                WHERE TRIM(answer) = TRIM(p_text_answer)
            ) INTO v_is_correct;
        ELSE
            SELECT EXISTS (
                SELECT 1 FROM unnest(v_question.accepted_answers) AS answer
                WHERE TRIM(LOWER(answer)) = v_normalized_answer
            ) INTO v_is_correct;
        END IF;
    END IF;
    
    -- Calculate points
    IF v_is_correct THEN
        v_points_earned := COALESCE(v_question.points_value, 
            (v_challenge.scoring_config->>'base_points')::INTEGER, 100);
        
        -- Speed bonus
        IF v_response_time < 1000 THEN
            v_speed_bonus := COALESCE((v_challenge.scoring_config->>'speed_bonus_lightning')::INTEGER, 50);
        ELSIF v_response_time < 2000 THEN
            v_speed_bonus := COALESCE((v_challenge.scoring_config->>'speed_bonus_quick')::INTEGER, 25);
        ELSIF v_response_time < 3000 THEN
            v_speed_bonus := COALESCE((v_challenge.scoring_config->>'speed_bonus_good')::INTEGER, 10);
        END IF;
        
        v_points_earned := v_points_earned + v_speed_bonus;
    END IF;
    
    -- Update selection record
    UPDATE challenge_trivia_selections
    SET 
        selected_answer = p_answer_index,
        is_correct = v_is_correct,
        points_earned = v_points_earned,
        answer_submitted_at = NOW(),
        response_time_ms = v_response_time,
        status = 'answered',
        points_awarded_to = CASE WHEN v_is_correct THEN v_selection.user_id ELSE NULL END
    WHERE id = p_selection_id;
    
    -- Update challenge_participants score (for ranking)
    IF v_is_correct THEN
        UPDATE challenge_participants
        SET current_score = current_score + v_points_earned,
            last_action_at = NOW()
        WHERE id = v_selection.participant_id;
        
        -- Award engagement points to business loyalty
        PERFORM award_engagement_points(
            v_selection.user_id,
            v_business_id,
            v_points_earned,
            'trivia_correct',
            'Correct trivia answer - ' || v_challenge.name,
            jsonb_build_object(
                'challenge_id', v_selection.challenge_id,
                'question_id', v_selection.question_id,
                'speed_bonus', v_speed_bonus,
                'response_time_ms', v_response_time
            )
        );
    ELSE
        -- Still award small points for participating
        PERFORM award_engagement_points(
            v_selection.user_id,
            v_business_id,
            5,
            'daily_visit',
            'Trivia participation - ' || v_challenge.name,
            jsonb_build_object('challenge_id', v_selection.challenge_id)
        );
    END IF;
    
    -- Update trivia_scores
    INSERT INTO challenge_trivia_scores (
        challenge_id, user_id, business_id, total_score, questions_answered,
        correct_answers, wrong_answers, fastest_response_ms,
        average_response_ms, current_streak, best_streak, last_answered_at
    ) VALUES (
        v_selection.challenge_id, v_selection.user_id, v_business_id, v_points_earned,
        1,
        CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        CASE WHEN v_is_correct THEN 0 ELSE 1 END,
        v_response_time, v_response_time,
        CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (challenge_id, user_id) DO UPDATE
    SET 
        total_score = challenge_trivia_scores.total_score + v_points_earned,
        questions_answered = challenge_trivia_scores.questions_answered + 1,
        correct_answers = challenge_trivia_scores.correct_answers + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        wrong_answers = challenge_trivia_scores.wrong_answers + CASE WHEN v_is_correct THEN 0 ELSE 1 END,
        fastest_response_ms = LEAST(challenge_trivia_scores.fastest_response_ms, v_response_time),
        average_response_ms = (
            (challenge_trivia_scores.average_response_ms * challenge_trivia_scores.questions_answered + v_response_time) 
            / (challenge_trivia_scores.questions_answered + 1)
        ),
        current_streak = CASE WHEN v_is_correct THEN challenge_trivia_scores.current_streak + 1 ELSE 0 END,
        best_streak = GREATEST(challenge_trivia_scores.best_streak, 
            CASE WHEN v_is_correct THEN challenge_trivia_scores.current_streak + 1 ELSE 0 END),
        last_answered_at = NOW();
    
    -- Record action
    INSERT INTO challenge_actions (
        challenge_id, user_id, action_type, points_awarded, action_metadata
    ) VALUES (
        v_selection.challenge_id, v_selection.user_id, 'trivia_answer', v_points_earned,
        jsonb_build_object(
            'question_id', v_selection.question_id,
            'is_correct', v_is_correct,
            'ticket_number', v_selection.ticket_number,
            'response_time_ms', v_response_time,
            'question_type', v_question.question_type
        )
    );
    
    -- Live ticker
    INSERT INTO challenge_live_ticker (
        challenge_id, business_id, user_name, action_text, points_awarded
    )
    SELECT
        v_selection.challenge_id, v_business_id,
        u.full_name,
        CASE 
            WHEN v_is_correct THEN '✅ Correct! +' || v_points_earned::TEXT || ' pts (Ticket #' || v_selection.ticket_number::TEXT || ')'
            ELSE '❌ Wrong answer (Ticket #' || v_selection.ticket_number::TEXT || ')'
        END,
        v_points_earned
    FROM users u
    WHERE u.id = v_selection.user_id;
    
    -- Recalculate ranks
    PERFORM recalculate_challenge_ranks(v_selection.challenge_id);
    
    RETURN json_build_object(
        'success', true,
        'is_correct', v_is_correct,
        'points_earned', v_points_earned,
        'speed_bonus', v_speed_bonus,
        'correct_answer', CASE 
            WHEN v_question.question_type = 'open_ended' THEN v_question.accepted_answers[1]
            ELSE v_question.correct_answer_index::TEXT
        END,
        'response_time_ms', v_response_time,
        'explanation', v_question.explanation,
        'ticket_number', v_selection.ticket_number,
        'question_type', v_question.question_type
    );
END;
$$;

-- ============================================
-- UPDATED: add_trivia_participant_from_spin with activation check
-- ============================================
CREATE OR REPLACE FUNCTION add_trivia_participant_from_spin(
    p_challenge_id UUID,
    p_user_id UUID,
    p_spin_attempt_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket_number INTEGER;
    v_participant_id UUID;
    v_user_name TEXT;
    v_existing_participant challenge_participants%ROWTYPE;
    v_challenge challenges%ROWTYPE;
    v_is_active BOOLEAN;
BEGIN
    -- Get challenge to find business_id
    SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Challenge not found');
    END IF;
    
    -- Check customer is active with this business
    SELECT is_active INTO v_is_active
    FROM customer_business_activations
    WHERE user_id = p_user_id 
      AND business_id = v_challenge.business_id
      AND is_active = TRUE
      AND expires_at > NOW();
    
    IF NOT v_is_active THEN
        RETURN json_build_object('success', false, 'error', 'You need an active code from this business');
    END IF;
    
    -- Check if already participating
    SELECT * INTO v_existing_participant
    FROM challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Already participating',
            'ticket_number', v_existing_participant.ticket_number,
            'participant_id', v_existing_participant.id
        );
    END IF;
    
    -- Get next ticket number
    SELECT get_next_ticket_number(p_challenge_id) INTO v_ticket_number;
    
    -- Get user name
    SELECT COALESCE(full_name, 'Anonymous') INTO v_user_name FROM users WHERE id = p_user_id;
    
    -- Add participant
    INSERT INTO challenge_participants (
        challenge_id, business_id, user_id,
        ticket_number, queue_position, current_score,
        joined_via_spin, spin_attempt_id, last_action_at, metadata
    ) VALUES (
        p_challenge_id, v_challenge.business_id, p_user_id,
        v_ticket_number, v_ticket_number, 0,
        TRUE, p_spin_attempt_id, NOW(),
        jsonb_build_object('entry_method', 'spin_wheel', 'spin_attempt_id', p_spin_attempt_id)
    )
    RETURNING id INTO v_participant_id;
    
    -- Live ticker
    INSERT INTO challenge_live_ticker (
        challenge_id, business_id, user_name, action_text, points_awarded
    ) VALUES (
        p_challenge_id, v_challenge.business_id,
        v_user_name,
        'Got ticket #' || v_ticket_number || ' via Spin & Win! 🎡',
        0
    );
    
    -- Award engagement points for joining
    PERFORM award_engagement_points(
        p_user_id, v_challenge.business_id, 10,
        'daily_visit',
        'Joined trivia: ' || v_challenge.name,
        jsonb_build_object('challenge_id', p_challenge_id, 'ticket_number', v_ticket_number)
    );
    
    -- Record action
    BEGIN
        INSERT INTO challenge_actions (
            challenge_id, user_id, action_type, points_awarded, action_metadata
        ) VALUES (
            p_challenge_id, p_user_id, 'trivia_joined', 0,
            jsonb_build_object('ticket_number', v_ticket_number, 'via_spin', TRUE)
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Could not record trivia_joined action: %', SQLERRM;
    END;
    
    RETURN json_build_object(
        'success', true,
        'ticket_number', v_ticket_number,
        'participant_id', v_participant_id,
        'user_name', v_user_name
    );
END;
$$;

-- ============================================
-- UPDATED: get_trivia_leaderboard with business scope
-- ============================================
CREATE OR REPLACE FUNCTION get_business_trivia_leaderboard(
    p_business_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    user_id UUID, full_name TEXT,
    total_score INTEGER, questions_answered INTEGER,
    correct_answers INTEGER, accuracy NUMERIC,
    fastest_response_ms INTEGER, current_streak INTEGER,
    best_streak INTEGER, current_rank INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.user_id, COALESCE(u.full_name, 'Anonymous') as full_name,
        ts.total_score, ts.questions_answered,
        ts.correct_answers,
        CASE WHEN ts.questions_answered > 0 
            THEN ROUND((ts.correct_answers::NUMERIC / ts.questions_answered::NUMERIC) * 100, 1)
            ELSE 0 END as accuracy,
        ts.fastest_response_ms, ts.current_streak, ts.best_streak,
        ROW_NUMBER() OVER (ORDER BY ts.total_score DESC)::INTEGER as current_rank
    FROM challenge_trivia_scores ts
    JOIN users u ON u.id = ts.user_id
    WHERE ts.business_id = p_business_id
    ORDER BY ts.total_score DESC
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION submit_trivia_answer(UUID, INTEGER, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_trivia_leaderboard(UUID, INTEGER) TO authenticated;
 