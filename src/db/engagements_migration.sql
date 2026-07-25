-- src/db/engagements_migration.sql
-- ============================================
-- Engagements meter, billing columns, live RPCs
-- Run after engagement_tool.sql
-- ============================================

-- Unified engagement counter
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS engagements_this_month INTEGER DEFAULT 0;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS mpesa_phone TEXT;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly'
CHECK (billing_cycle IN ('monthly', 'annual'));

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS spins_this_month INTEGER DEFAULT 0;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS trivia_answers_this_month INTEGER DEFAULT 0;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS draw_entries_this_month INTEGER DEFAULT 0;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS code_redemptions_this_month INTEGER DEFAULT 0;

-- Backfill from legacy column
UPDATE businesses
SET engagements_this_month = COALESCE(spins_this_month, 0)
WHERE engagements_this_month = 0 AND spins_this_month > 0;

-- Allow paystack in business_payments
ALTER TABLE business_payments DROP CONSTRAINT IF EXISTS business_payments_payment_method_check;
ALTER TABLE business_payments
ADD CONSTRAINT business_payments_payment_method_check
CHECK (payment_method IN ('mpesa', 'paypal', 'card', 'paystack'));

ALTER TABLE business_payments
ALTER COLUMN currency SET DEFAULT 'KES';

-- Plan engagement limits (mirrors src/lib/config/plans.ts)
CREATE OR REPLACE FUNCTION get_plan_engagement_limit(p_plan TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'trial' THEN 100
    WHEN 'starter' THEN 1000
    WHEN 'pro' THEN 10000
    WHEN 'enterprise' THEN 50000
    ELSE 100
  END;
$$;

CREATE OR REPLACE FUNCTION check_business_engagement_allowed(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_business businesses%ROWTYPE;
  v_limit INTEGER;
  v_used INTEGER;
BEGIN
  SELECT * INTO v_business FROM businesses WHERE id = p_business_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF v_business.subscription_status IN ('expired', 'past_due', 'cancelled') THEN
    RETURN FALSE;
  END IF;

  IF v_business.subscription_status = 'trial'
     AND v_business.trial_ends_at IS NOT NULL
     AND v_business.trial_ends_at <= NOW() THEN
    RETURN FALSE;
  END IF;

  v_limit := get_plan_engagement_limit(v_business.plan);
  v_used := COALESCE(v_business.engagements_this_month, v_business.spins_this_month, 0);
  RETURN v_used < v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION increment_business_engagement(
    p_business_id UUID,
    p_type TEXT DEFAULT 'spin'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE businesses
    SET
        engagements_this_month = COALESCE(engagements_this_month, 0) + 1,
        spins_this_month = CASE
            WHEN p_type = 'spin' THEN COALESCE(spins_this_month, 0) + 1
            ELSE spins_this_month
        END,
        trivia_answers_this_month = CASE
            WHEN p_type = 'trivia' THEN COALESCE(trivia_answers_this_month, 0) + 1
            ELSE trivia_answers_this_month
        END,
        draw_entries_this_month = CASE
            WHEN p_type = 'draw' THEN COALESCE(draw_entries_this_month, 0) + 1
            ELSE draw_entries_this_month
        END,
        code_redemptions_this_month = CASE
            WHEN p_type = 'code_redeem' THEN COALESCE(code_redemptions_this_month, 0) + 1
            ELSE code_redemptions_this_month
        END
    WHERE id = p_business_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_business_spin_count(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM increment_business_engagement(p_business_id, 'spin');
END;
$$;

CREATE OR REPLACE FUNCTION reset_monthly_engagement_counts()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE businesses
  SET
    engagements_this_month = 0,
    spins_this_month = 0,
    trivia_answers_this_month = 0,
    draw_entries_this_month = 0,
    code_redemptions_this_month = 0;
END;
$$;

CREATE OR REPLACE FUNCTION reset_monthly_spin_counts()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM reset_monthly_engagement_counts();
END;
$$;

-- Weighted draw execution for live broadcast
CREATE OR REPLACE FUNCTION perform_draw(p_draw_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draw draws%ROWTYPE;
  v_winner RECORD;
  v_total_weight BIGINT;
  v_random BIGINT;
  v_running BIGINT := 0;
  v_user_name TEXT;
BEGIN
  SELECT * INTO v_draw FROM draws WHERE id = p_draw_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Draw not found');
  END IF;

  IF v_draw.status NOT IN ('open', 'closed') THEN
    RETURN json_build_object('success', false, 'error', 'Draw is not ready');
  END IF;

  SELECT COALESCE(SUM(entry_count), 0) INTO v_total_weight
  FROM draw_entries WHERE draw_id = p_draw_id;

  IF v_total_weight = 0 THEN
    RETURN json_build_object('success', false, 'error', 'No entries in draw');
  END IF;

  v_random := floor(random() * v_total_weight)::BIGINT;

  FOR v_winner IN
    SELECT de.user_id, de.entry_count
    FROM draw_entries de
    WHERE de.draw_id = p_draw_id
    ORDER BY de.created_at
  LOOP
    v_running := v_running + v_winner.entry_count;
    IF v_random < v_running THEN
      SELECT COALESCE(full_name, 'Customer') INTO v_user_name
      FROM users WHERE id = v_winner.user_id;

      INSERT INTO draw_winners (draw_id, user_id, prize_name, rank)
      VALUES (p_draw_id, v_winner.user_id, v_draw.prize_name, 1)
      ON CONFLICT DO NOTHING;

      UPDATE draws SET status = 'completed', updated_at = NOW() WHERE id = p_draw_id;

      INSERT INTO draw_live_ticker (draw_id, user_name, entry_count, entry_method, action_type)
      VALUES (p_draw_id, v_user_name, 1, 'draw', 'winner');

      RETURN json_build_object(
        'success', true,
        'winner_id', v_winner.user_id,
        'winner_name', v_user_name,
        'prize_name', v_draw.prize_name
      );
    END IF;
  END LOOP;

  RETURN json_build_object('success', false, 'error', 'Could not select winner');
END;
$$;

-- Live stats for admin dashboard
CREATE OR REPLACE FUNCTION get_live_engagement_stats(p_business_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_spins INTEGER;
  v_trivia INTEGER;
  v_draws INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_spins
  FROM spin_attempts WHERE business_id = p_business_id
    AND created_at >= date_trunc('month', NOW());

  SELECT COUNT(*) INTO v_trivia
  FROM challenge_trivia_selections
  WHERE business_id = p_business_id
    AND status = 'answered'
    AND answered_at >= date_trunc('month', NOW());

  SELECT COUNT(*) INTO v_draws
  FROM draw_entries de
  JOIN draws d ON d.id = de.draw_id
  WHERE d.business_id = p_business_id
    AND de.created_at >= date_trunc('month', NOW());

  RETURN json_build_object(
    'spins', v_spins,
    'trivia_answers', v_trivia,
    'draw_entries', v_draws,
    'total', v_spins + v_trivia + v_draws
  );
END;
$$;

-- Realtime reliability for spin live pages
ALTER TABLE spin_live_ticker REPLICA IDENTITY FULL;
ALTER TABLE spin_attempts REPLICA IDENTITY FULL;
ALTER TABLE spin_games REPLICA IDENTITY FULL;

GRANT EXECUTE ON FUNCTION increment_business_engagement(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_business_engagement_allowed(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION perform_draw(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_live_engagement_stats(UUID) TO authenticated, service_role;

-- Engagement notifications table
CREATE TABLE IF NOT EXISTS engagement_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL DEFAULT 'limit_warning',
    threshold_percent INTEGER,
    channel TEXT NOT NULL DEFAULT 'email',
    status TEXT NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_notifications_business ON engagement_notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_engagement_notifications_status ON engagement_notifications(status);

ALTER TABLE engagement_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view own notifications" ON engagement_notifications
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM business_admins WHERE user_id = auth.uid())
    );

-- ============================================
-- PLAN PERIOD CHALLENGE COUNT
-- ============================================

-- Count trivia challenges created in current billing period
CREATE OR REPLACE FUNCTION get_challenges_in_current_period(p_business_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business businesses%ROWTYPE;
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_count INTEGER;
BEGIN
    SELECT * INTO v_business FROM businesses WHERE id = p_business_id;
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Determine subscription period based on last_payment_at and next_billing_at
    IF v_business.last_payment_at IS NOT NULL AND v_business.next_billing_at IS NOT NULL THEN
        v_period_start := v_business.last_payment_at;
        v_period_end := v_business.next_billing_at;
    ELSIF v_business.subscription_status = 'trial' THEN
        v_period_start := date_trunc('month', NOW());
        v_period_end := v_period_start + INTERVAL '1 month';
    ELSE
        -- Fallback: use calendar month
        v_period_start := date_trunc('month', NOW());
        v_period_end := v_period_start + INTERVAL '1 month';
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM challenges
    WHERE business_id = p_business_id
      AND created_at >= v_period_start
      AND created_at < v_period_end;

    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_challenges_in_current_period(UUID) TO authenticated, service_role;

-- ============================================
-- Viewer Engagement Tracking
-- ============================================

-- Viewer prize configuration per challenge/game
CREATE TABLE IF NOT EXISTS viewer_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('spin', 'draw', 'trivia')),
    game_id UUID,
    prize_type TEXT NOT NULL DEFAULT 'points' CHECK (prize_type IN ('points', 'discount', 'free_service', 'custom')),
    prize_value INTEGER DEFAULT 100,
    min_watch_seconds INTEGER NOT NULL DEFAULT 60,
    max_claims_per_user INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viewer engagement records (track who watched for long enough)
CREATE TABLE IF NOT EXISTS viewer_engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    game_id UUID,
    game_type TEXT NOT NULL CHECK (game_type IN ('spin', 'draw', 'trivia')),
    stream_type TEXT NOT NULL DEFAULT 'internal',
    watched_seconds INTEGER DEFAULT 0,
    claimed_at TIMESTAMPTZ,
    viewer_prize_id UUID REFERENCES viewer_prizes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id, game_id, stream_type)
);

CREATE INDEX IF NOT EXISTS idx_viewer_engagements_business ON viewer_engagements(business_id);
CREATE INDEX IF NOT EXISTS idx_viewer_engagements_user ON viewer_engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_viewer_engagements_challenge ON viewer_engagements(challenge_id);
CREATE INDEX IF NOT EXISTS idx_viewer_engagements_unclaimed ON viewer_engagements(business_id, game_id) WHERE claimed_at IS NULL;

-- ============================================
-- Viewer Prize Claim RPC
-- ============================================
CREATE OR REPLACE FUNCTION claim_viewer_prize(
    p_business_id UUID,
    p_user_id UUID,
    p_game_type TEXT,
    p_game_id UUID,
    p_stream_type TEXT DEFAULT 'internal'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prize viewer_prizes%ROWTYPE;
    v_viewer viewer_engagements%ROWTYPE;
    v_user_points INTEGER;
BEGIN
    -- Only count internal stream viewers
    IF p_stream_type != 'internal' THEN
        RETURN json_build_object('success', false, 'error', 'Only internal stream viewers can claim prizes');
    END IF;

    -- Find active viewer prize for this game
    SELECT * INTO v_prize
    FROM viewer_prizes
    WHERE business_id = p_business_id
      AND game_type = p_game_type
      AND (game_id IS NULL OR game_id = p_game_id)
      AND is_active = TRUE
    ORDER BY game_id NULLS FIRST
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No viewer prize configured');
    END IF;

    -- Check if user watched long enough
    SELECT * INTO v_viewer
    FROM viewer_engagements
    WHERE business_id = p_business_id
      AND user_id = p_user_id
      AND game_type = p_game_type
      AND game_id = p_game_id
      AND stream_type = 'internal';

    IF NOT FOUND OR v_viewer.watched_seconds < v_prize.min_watch_seconds THEN
        RETURN json_build_object('success', false, 'error', 'Minimum watch time not reached');
    END IF;

    -- Prevent duplicate claims
    IF v_viewer.claimed_at IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Prize already claimed');
    END IF;

    -- Award prize
    IF v_prize.prize_type = 'points' THEN
        INSERT INTO loyalty_points (user_id, business_id, points, points_earned)
        VALUES (p_user_id, p_business_id, v_prize.prize_value, v_prize.prize_value)
        ON CONFLICT (user_id, business_id)
        DO UPDATE SET
            points = loyalty_points.points + v_prize.prize_value,
            points_earned = loyalty_points.points_earned + v_prize.prize_value,
            updated_at = NOW();

        INSERT INTO loyalty_transactions (user_id, business_id, points_change, current_points, transaction_type, description)
        VALUES (p_user_id, p_business_id, v_prize.prize_value, v_prize.prize_value, 'viewer_prize',
                'Viewer prize: ' || v_prize.prize_value || ' points for watching');
    END IF;

    -- Mark as claimed
    UPDATE viewer_engagements
    SET claimed_at = NOW(),
        viewer_prize_id = v_prize.id
    WHERE id = v_viewer.id;

    RETURN json_build_object('success', true, 'prize_type', v_prize.prize_type, 'prize_value', v_prize.prize_value);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_viewer_prize(UUID, UUID, TEXT, UUID, TEXT) TO authenticated;
