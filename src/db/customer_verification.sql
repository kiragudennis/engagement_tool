-- ============================================
-- ENGAGE PLATFORM: Customer Profile & Verification
-- ============================================

-- 1. Add id_number to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number TEXT NOT NULL UNIQUE;

-- 1(b). Take down phone and mark as unique
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL UNIQUE;

-- 2. Add unique constraint on phone (allow NULLs but unique among non-nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone);

-- 3. Add unique constraint on id_number (allow NULLs but unique among non-nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_id_number_unique ON users(id_number);

-- 4. Add flagged columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS flagged_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES businesses(id);

-- 5. Add verified_by_admin flag for ID verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified_by UUID REFERENCES businesses(id);

-- 6. Extend status CHECK to include 'flagged'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check 
    CHECK (status IN ('active', 'inactive', 'suspended', 'banned', 'flagged'));

-- 7. Index for flagged users
CREATE INDEX IF NOT EXISTS idx_users_flagged ON users(status) WHERE status = 'flagged';

-- ============================================
-- Functions
-- ============================================

-- Flag a user account (used when identity verification fails)
CREATE OR REPLACE FUNCTION flag_user_account(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Identity verification mismatch',
    p_flagged_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET 
        status = 'flagged',
        flagged_reason = p_reason,
        flagged_at = NOW(),
        flagged_by = p_flagged_by,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$;

-- Verify user ID (used by admin when collecting prizes)
CREATE OR REPLACE FUNCTION verify_user_identity(
    p_user_id UUID,
    p_business_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET 
        id_verified = TRUE,
        id_verified_at = NOW(),
        id_verified_by = p_business_id,
        updated_at = NOW()
    WHERE id = p_user_id
    AND (id_number IS NOT NULL OR phone IS NOT NULL);
    
    RETURN json_build_object(
        'success', TRUE,
        'user_id', p_user_id,
        'id_verified', TRUE,
        'verified_at', NOW()
    );
END;
$$;

-- Get customer verification summary for admin
CREATE OR REPLACE FUNCTION get_customer_verification_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user users%ROWTYPE;
    v_businesses JSON;
    v_recent_spins JSON;
    v_recent_draws JSON;
    v_recent_trivia JSON;
BEGIN
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', FALSE, 'error', 'User not found');
    END IF;
    
    -- Active businesses
    SELECT COALESCE(json_agg(
        json_build_object(
            'business_id', b.id,
            'business_name', b.name,
            'business_slug', b.slug,
            'points', COALESCE(lp.points, 0),
            'tier', COALESCE(lp.tier, 'bronze'),
            'spins_used', cba.spins_used,
            'expires_at', cba.expires_at,
            'is_active', cba.is_active
        )
    ), '[]'::json) INTO v_businesses
    FROM customer_business_activations cba
    JOIN businesses b ON b.id = cba.business_id
    LEFT JOIN loyalty_points lp ON lp.user_id = p_user_id AND lp.business_id = b.id
    WHERE cba.user_id = p_user_id
    ORDER BY cba.last_activity_at DESC;
    
    -- Recent spins
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', sa.id,
            'prize_type', sa.prize_type,
            'prize_value', sa.prize_value,
            'points_awarded', sa.points_awarded,
            'business_name', b.name,
            'created_at', sa.created_at
        )
    ), '[]'::json) INTO v_recent_spins
    FROM spin_attempts sa
    JOIN businesses b ON b.id = sa.business_id
    WHERE sa.user_id = p_user_id
    ORDER BY sa.created_at DESC
    LIMIT 20;
    
    -- Recent draw entries
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', de.id,
            'draw_name', d.name,
            'entry_count', de.entry_count,
            'created_at', de.created_at
        )
    ), '[]'::json) INTO v_recent_draws
    FROM draw_entries de
    JOIN draws d ON d.id = de.draw_id
    WHERE de.user_id = p_user_id
    ORDER BY de.created_at DESC
    LIMIT 10;
    
    -- Recent trivia participation
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', cp.id,
            'challenge_name', c.name,
            'current_score', cp.current_score,
            'current_rank', cp.current_rank,
            'joined_at', cp.joined_at
        )
    ), '[]'::json) INTO v_recent_trivia
    FROM challenge_participants cp
    JOIN challenges c ON c.id = cp.challenge_id
    WHERE cp.user_id = p_user_id
    ORDER BY cp.joined_at DESC
    LIMIT 10;
    
    RETURN json_build_object(
        'success', TRUE,
        'user', json_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'full_name', v_user.full_name,
            'phone', v_user.phone,
            'id_number', v_user.id_number,
            'status', v_user.status,
            'flagged_reason', v_user.flagged_reason,
            'flagged_at', v_user.flagged_at,
            'id_verified', v_user.id_verified,
            'id_verified_at', v_user.id_verified_at,
            'email_verified', v_user.email_verified,
            'created_at', v_user.created_at
        ),
        'businesses', v_businesses,
        'recent_spins', v_recent_spins,
        'recent_draws', v_recent_draws,
        'recent_trivia', v_recent_trivia
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION flag_user_account(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_identity(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_verification_summary(UUID) TO authenticated;
