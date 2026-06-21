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
    WHEN 'starter' THEN 500
    WHEN 'pro' THEN 5000
    WHEN 'enterprise' THEN 25000
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
    spins_this_month = COALESCE(spins_this_month, 0) + 1
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
  SET engagements_this_month = 0, spins_this_month = 0;
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
