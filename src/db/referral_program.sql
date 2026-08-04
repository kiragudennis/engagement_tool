-- ============================================
-- ENGAGE PLATFORM: Referral Program
-- ============================================

-- 1. Extend referrals table for business referrals
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS referred_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_type TEXT DEFAULT 'customer'
    CHECK (referral_type IN ('customer', 'business')),
  ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'one_time'
    CHECK (commission_type IN ('one_time', 'recurring')),
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,4) DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS first_commission_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_plan TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Referral commissions table
CREATE TABLE IF NOT EXISTS referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

    type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring')),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    plan TEXT,
    billing_cycle TEXT,

    payment_id UUID REFERENCES business_payments(id) ON DELETE SET NULL,

    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referral ON referral_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_business ON referral_commissions(referred_business_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);

-- RLS
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral commissions" ON referral_commissions
    FOR SELECT USING (
        referrer_id = auth.uid()
        OR referred_business_id IN (
            SELECT id FROM businesses WHERE id IN (
                SELECT business_id FROM business_admins WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can manage referral commissions" ON referral_commissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM business_admins ba
            JOIN businesses b ON ba.business_id = b.id
            WHERE ba.user_id = auth.uid() AND ba.role = 'super_admin'
        )
    );

-- 3. Get or create system "Engage" business ID for loyalty points
CREATE OR REPLACE FUNCTION get_system_business_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    SELECT id INTO v_business_id
    FROM businesses
    WHERE slug = 'engage'
    LIMIT 1;

    IF NOT FOUND THEN
        INSERT INTO businesses (
            name, slug, admin_email, admin_name,
            plan, subscription_status,
            brand_color, brand_secondary_color,
            activation_duration_days
        ) VALUES (
            'Engage', 'engage',
            'system@engagespin.com', 'Engage System',
            'enterprise', 'active',
            '#8B5CF6', '#EC4899',
            99999
        )
        RETURNING id INTO v_business_id;
    END IF;

    RETURN v_business_id;
END;
$$;

-- 4. Process business referral on subscription activation
CREATE OR REPLACE FUNCTION process_business_referral(p_business_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business businesses%ROWTYPE;
    v_referrer users%ROWTYPE;
    v_referral referrals%ROWTYPE;
    v_commission_rate NUMERIC;
    v_commission_amount NUMERIC;
    v_total_paid NUMERIC;
    v_payment_amount NUMERIC;
    v_payment_id UUID;
    v_billing_cycle TEXT;
    v_result JSON;
BEGIN
    -- Get business
    SELECT * INTO v_business FROM businesses WHERE id = p_business_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Business not found');
    END IF;

    -- Find the referral record linking this business (not yet completed)
    SELECT * INTO v_referral
    FROM referrals
    WHERE referred_business_id = p_business_id
      AND status IN ('joined', 'completed')
      AND referral_type = 'business'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No pending business referral');
    END IF;

    -- Get referrer
    SELECT * INTO v_referrer FROM users WHERE id = v_referral.referrer_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Referrer not found');
    END IF;

    -- Determine commission rate
    v_commission_rate := COALESCE(v_referral.commission_rate, 0.50);

    -- For one_time: only process if not already paid
    IF v_referral.commission_type = 'one_time' AND v_referral.first_commission_paid THEN
        RETURN json_build_object(
            'success', false,
            'error', 'One-time commission already paid',
            'referral_id', v_referral.id
        );
    END IF;

    -- Get the latest completed payment for this business
    SELECT amount, id, billing_cycle INTO v_payment_amount, v_payment_id, v_billing_cycle
    FROM business_payments
    WHERE business_id = p_business_id AND status = 'completed'
    ORDER BY paid_at DESC LIMIT 1;

    IF v_payment_amount IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No successful payments');
    END IF;

    -- Calculate commission amount
    v_commission_amount := v_payment_amount * v_commission_rate;

    -- Insert commission record
    INSERT INTO referral_commissions (
        referral_id, referrer_id, referred_business_id,
        type, amount, currency, plan, billing_cycle,
        payment_id, status
    ) VALUES (
        v_referral.id, v_referrer.id, p_business_id,
        v_referral.commission_type, v_commission_amount,
        'USD', v_business.plan, v_billing_cycle,
        v_payment_id, 'pending'
    );

    -- Award loyalty points immediately to system "Engage" business entity
    -- Points = commission_amount * 100 (1 point per $0.01 of commission)
    -- These points let the referrer participate in Engage experiences
    -- (spins, draws, trivia, early access) at engagespin.com/admin/engage
    PERFORM award_engagement_points(
        v_referrer.id,
        get_system_business_id(),
        ROUND(v_commission_amount * 100),
        'referral_bonus',
        'Referral commission: ' || v_business.name || ' (' || v_referral.commission_type || ')',
        jsonb_build_object(
            'referral_id', v_referral.id,
            'business_id', p_business_id,
            'business_name', v_business.name,
            'commission_amount', v_commission_amount,
            'plan', v_business.plan
        )
    );

    -- For one_time commissions, mark first_commission_paid and complete the referral
    IF v_referral.commission_type = 'one_time' THEN
        UPDATE referrals
        SET first_commission_paid = TRUE,
            status = 'completed',
            updated_at = NOW()
        WHERE id = v_referral.id;
    ELSE
        -- Recurring: keep referral as 'completed' (first payment marks it complete)
        -- Future payments will generate additional commission records
        UPDATE referrals
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = v_referral.id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'commission_amount', v_commission_amount,
        'commission_rate', v_commission_rate,
        'commission_type', v_referral.commission_type,
        'referrer_id', v_referrer.id,
        'business_name', v_business.name,
        'referral_id', v_referral.id
    );
END;
$$;

-- 5. Process referral payout (mark money commission as paid for admin payout)
CREATE OR REPLACE FUNCTION process_referral_payout(p_referral_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_commission referral_commissions%ROWTYPE;
    v_referrer users%ROWTYPE;
    v_referral referrals%ROWTYPE;
BEGIN
    -- Get commission record
    SELECT * INTO v_commission
    FROM referral_commissions
    WHERE id = p_referral_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Commission not found or already paid');
    END IF;

    -- Get referrer
    SELECT * INTO v_referrer FROM users WHERE id = v_commission.referrer_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Referrer not found');
    END IF;

    -- Get referral record
    SELECT * INTO v_referral FROM referrals WHERE id = v_commission.referral_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Referral not found');
    END IF;

    -- Mark commission as paid (money payout via PayPal/M-Pesa)
    -- Points were already awarded when process_business_referral ran
    UPDATE referral_commissions
    SET status = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = p_referral_id;

    RETURN json_build_object(
        'success', true,
        'commission_amount', v_commission.amount,
        'referrer_id', v_referrer.id
    );
END;
$$;

-- 6. Get referral program dashboard for a user
CREATE OR REPLACE FUNCTION get_user_referral_dashboard(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral_code TEXT;
    v_referral_link TEXT;
    v_total_earned NUMERIC;
    v_pending_earnings NUMERIC;
    v_referred_business_count INTEGER;
    v_active_referrals INTEGER;
    v_total_commissions INTEGER;
    v_result JSON;
BEGIN
    SELECT referral_code INTO v_referral_code
    FROM users WHERE id = p_user_id;

    v_referral_link := COALESCE(
        'https://engagespin.com/business/signup?ref=' || v_referral_code,
        'Not available'
    );

    -- Total earned (all paid commissions, in USD)
    SELECT COALESCE(SUM(rc.amount), 0) INTO v_total_earned
    FROM referral_commissions rc
    JOIN referrals r ON rc.referral_id = r.id
    WHERE r.referrer_id = p_user_id AND rc.status = 'paid';

    -- Pending earnings (commissions with status 'pending')
    SELECT COALESCE(SUM(rc.amount), 0) INTO v_pending_earnings
    FROM referral_commissions rc
    JOIN referrals r ON rc.referral_id = r.id
    WHERE r.referrer_id = p_user_id AND rc.status = 'pending';

    -- Count referred businesses (joined or completed)
    SELECT COUNT(*) INTO v_referred_business_count
    FROM referrals
    WHERE referrer_id = p_user_id
      AND referral_type = 'business'
      AND status IN ('joined', 'completed');

    -- Count active referrals (businesses still subscribed)
    SELECT COUNT(*) INTO v_active_referrals
    FROM referrals r
    JOIN businesses b ON b.id = r.referred_business_id
    WHERE r.referrer_id = p_user_id
      AND r.referral_type = 'business'
      AND b.subscription_status = 'active';

    -- Total commission records
    SELECT COUNT(*) INTO v_total_commissions
    FROM referral_commissions rc
    JOIN referrals r ON rc.referral_id = r.id
    WHERE r.referrer_id = p_user_id;

    SELECT json_build_object(
        'referral_code', v_referral_code,
        'referral_link', v_referral_link,
        'total_earned_usd', v_total_earned,
        'pending_earnings_usd', v_pending_earnings,
        'referred_business_count', v_referred_business_count,
        'active_referrals', v_active_referrals,
        'total_commissions', v_total_commissions
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 7. Get detailed commission history for a user
CREATE OR REPLACE FUNCTION get_user_referral_commissions(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    business_name TEXT,
    type TEXT,
    amount NUMERIC,
    plan TEXT,
    billing_cycle TEXT,
    status TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rc.id, b.name as business_name,
        rc.type, rc.amount, rc.plan, rc.billing_cycle,
        rc.status, rc.paid_at, rc.created_at
    FROM referral_commissions rc
    JOIN referrals r ON rc.referral_id = r.id
    LEFT JOIN businesses b ON b.id = rc.referred_business_id
    WHERE r.referrer_id = p_user_id
    ORDER BY rc.created_at DESC;
END;
$$;

-- 8. Get all referrals with user/business details (for admin view)
CREATE OR REPLACE FUNCTION get_all_referrals(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    referrer_id UUID,
    referrer_email TEXT,
    referrer_name TEXT,
    referred_business_id UUID,
    business_name TEXT,
    business_slug TEXT,
    referral_code TEXT,
    status TEXT,
    commission_type TEXT,
    commission_rate NUMERIC,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.referrer_id,
        u.email as referrer_email,
        u.full_name as referrer_name,
        r.referred_business_id,
        b.name as business_name,
        b.slug as business_slug,
        r.referral_code,
        r.status,
        r.commission_type,
        r.commission_rate,
        r.created_at
    FROM referrals r
    LEFT JOIN users u ON u.id = r.referrer_id
    LEFT JOIN businesses b ON b.id = r.referred_business_id
    WHERE r.referral_type = 'business'
    ORDER BY r.created_at DESC;
END;
$$;

-- 9. Get all referral commissions with business details (for admin view)
CREATE OR REPLACE FUNCTION get_all_referral_commissions()
RETURNS TABLE(
    id UUID,
    referral_id UUID,
    referrer_id UUID,
    referrer_email TEXT,
    referrer_name TEXT,
    referred_business_id UUID,
    business_name TEXT,
    business_slug TEXT,
    type TEXT,
    amount NUMERIC,
    plan TEXT,
    billing_cycle TEXT,
    status TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rc.id,
        rc.referral_id,
        rc.referrer_id,
        u.email as referrer_email,
        u.full_name as referrer_name,
        rc.referred_business_id,
        b.name as business_name,
        b.slug as business_slug,
        rc.type,
        rc.amount,
        rc.plan,
        rc.billing_cycle,
        rc.status,
        rc.paid_at,
        rc.created_at
    FROM referral_commissions rc
    LEFT JOIN users u ON u.id = rc.referrer_id
    LEFT JOIN businesses b ON b.id = rc.referred_business_id
    ORDER BY rc.created_at DESC;
END;
$$;

-- 10. Referral withdrawals table
CREATE TABLE IF NOT EXISTS referral_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paystack', 'mpesa')),
    mpesa_phone TEXT,
    paystack_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_referrer ON referral_withdrawals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_status ON referral_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_created ON referral_withdrawals(created_at DESC);

ALTER TABLE referral_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawal requests" ON referral_withdrawals
    FOR SELECT USING (referrer_id = auth.uid());

CREATE POLICY "Users can create withdrawal requests" ON referral_withdrawals
    FOR INSERT WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Admins can manage all withdrawal requests" ON referral_withdrawals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('super_admin', 'business_owner')
        )
    );

-- 11. Create a withdrawal request (customer initiates payout)
CREATE OR REPLACE FUNCTION create_referral_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_mpesa_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payable NUMERIC;
    v_withdrawal_id UUID;
BEGIN
    -- Must be at least $100 USD
    IF p_amount < 100 THEN
        RETURN json_build_object('success', false, 'error', 'Minimum withdrawal is $100 USD');
    END IF;

    -- Calculate total pending + paid commissions (only paid commissions count for withdrawal)
    SELECT COALESCE(SUM(rc.amount), 0) INTO v_payable
    FROM referral_commissions rc
    JOIN referrals r ON rc.referral_id = r.id
    WHERE r.referrer_id = p_user_id AND rc.status = 'paid';

    IF v_payable < p_amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient paid commissions. Available: $' || v_payable::TEXT,
            'available', v_payable
        );
    END IF;

    -- Create withdrawal request
    INSERT INTO referral_withdrawals (
        referrer_id, amount, currency, payment_method, mpesa_phone, status
    ) VALUES (
        p_user_id, p_amount, 'USD', p_payment_method, p_mpesa_phone, 'pending'
    )
    RETURNING id INTO v_withdrawal_id;

    RETURN json_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id,
        'amount', p_amount,
        'available_balance', v_payable - p_amount
    );
END;
$$;

-- 12. Get user's withdrawal history
CREATE OR REPLACE FUNCTION get_user_withdrawal_history(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    amount NUMERIC,
    currency TEXT,
    payment_method TEXT,
    mpesa_phone TEXT,
    status TEXT,
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id, w.amount, w.currency, w.payment_method, w.mpesa_phone,
        w.status, w.processed_at, w.notes, w.created_at
    FROM referral_withdrawals w
    WHERE w.referrer_id = p_user_id
    ORDER BY w.created_at DESC;
END;
$$;

-- 13. Get all withdrawal requests (for admin/super admin)
CREATE OR REPLACE FUNCTION get_all_withdrawals()
RETURNS TABLE(
    id UUID,
    referrer_id UUID,
    referrer_email TEXT,
    referrer_name TEXT,
    amount NUMERIC,
    currency TEXT,
    payment_method TEXT,
    mpesa_phone TEXT,
    status TEXT,
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id, w.referrer_id,
        u.email as referrer_email,
        u.full_name as referrer_name,
        w.amount, w.currency, w.payment_method, w.mpesa_phone,
        w.status, w.processed_at, w.processed_by, w.notes,
        w.created_at
    FROM referral_withdrawals w
    LEFT JOIN users u ON u.id = w.referrer_id
    ORDER BY w.created_at DESC;
END;
$$;

-- 14. Process a withdrawal (admin pays out)
CREATE OR REPLACE FUNCTION process_withdrawal(
    p_withdrawal_id UUID,
    p_admin_id UUID,
    p_status TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_withdrawal referral_withdrawals%ROWTYPE;
    v_commission_total NUMERIC;
BEGIN
    SELECT * INTO v_withdrawal
    FROM referral_withdrawals
    WHERE id = p_withdrawal_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Withdrawal not found');
    END IF;

    -- Verify admin has authority
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE users.id = p_admin_id
          AND users.role IN ('super_admin', 'business_owner')
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Verify the withdrawal is pending
    IF v_withdrawal.status != 'pending' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Withdrawal already processed: ' || v_withdrawal.status
        );
    END IF;

    -- Mark commission records as paid if processing payout
    IF p_status = 'paid' THEN
        UPDATE referral_commissions
        SET status = 'paid',
            paid_at = NOW()
        WHERE referral_id IN (
            SELECT id FROM referrals WHERE referrer_id = v_withdrawal.referrer_id
        )
        AND status = 'pending';
    END IF;

    -- Update withdrawal record
    UPDATE referral_withdrawals
    SET status = p_status,
        processed_at = NOW(),
        processed_by = p_admin_id,
        notes = p_notes,
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

    RETURN json_build_object(
        'success', true,
        'withdrawal_id', p_withdrawal_id,
        'new_status', p_status,
        'referrer_id', v_withdrawal.referrer_id
    );
END;
$$;

-- Grants for withdrawal functions
GRANT EXECUTE ON FUNCTION create_referral_withdrawal(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_withdrawal_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_withdrawals() TO authenticated;
REVOKE EXECUTE ON FUNCTION process_withdrawal(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_business_id() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION process_business_referral(UUID) TO authenticated, public;
REVOKE EXECUTE ON FUNCTION process_referral_payout(UUID) TO authenticated, public;
GRANT EXECUTE ON FUNCTION get_user_referral_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_commissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_referrals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_referral_commissions() TO authenticated;

-- RLS Policy for referrals table (business referrals should be viewable by admins)
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (
        referrer_id = auth.uid()
        OR referred_user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can manage referrals" ON referrals;
CREATE POLICY "Admins can manage referrals" ON referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM business_admins ba
            WHERE ba.user_id = auth.uid()
        )
        OR (
            EXISTS (
                SELECT 1 FROM businesses b
                JOIN business_admins ba ON ba.business_id = b.id
                WHERE ba.user_id = auth.uid()
                AND b.id = referrals.referred_business_id
            )
        )
    );
