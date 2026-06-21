-- ============================================
-- ENGAGE PLATFORM: Users & Referrals - Cleaned
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'customer' NOT NULL,
    
    -- Profile
    full_name TEXT,
    phone TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Business context
    home_business_id UUID REFERENCES businesses(id),
    created_via_code_id UUID REFERENCES access_codes(id),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Account status (for 30-day activation)
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
    
    -- Referral
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES users(id),
    
    -- Auth
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_status_active ON users(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_home_business ON users(home_business_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- ============================================
-- 2. REFERRALS TABLE (simplified for business context)
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_email VARCHAR(255),
    referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    referral_code VARCHAR(50) NOT NULL,
    
    -- Status flow: pending → joined → completed
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'completed', 'expired')),
    
    -- What type of conversion?
    conversion_type TEXT CHECK (conversion_type IN ('signup', 'activation')),
    
    -- Rewards
    reward_points INTEGER DEFAULT 100,
    
    -- Timing
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================
-- 3. FUNCTIONS
-- ============================================

-- Auto-generate referral code for new users
CREATE OR REPLACE FUNCTION generate_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := 'ENG' || UPPER(SUBSTRING(MD5(NEW.id::TEXT || NEW.email) FROM 1 FOR 8));
    END IF;
    
    IF NEW.status IS NULL THEN
        NEW.status := 'inactive';
    END IF;
    
    IF NEW.metadata IS NULL THEN
        NEW.metadata := '{}'::jsonb;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_before_insert ON users;
CREATE TRIGGER users_before_insert
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_user_referral_code();

-- Check if user is active
CREATE OR REPLACE FUNCTION is_user_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_status TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT status, (metadata->>'activation_expires_at')::TIMESTAMPTZ
    INTO v_status, v_expires_at
    FROM users WHERE id = p_user_id;
    
    IF v_status != 'active' THEN RETURN FALSE; END IF;
    
    IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
        UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = p_user_id;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 3 (b). Create the admin check sql function
-- Replace the old is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin')
  );
$$;

-- ============================================
-- 4. RLS POLICIES
-- ============================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Admins can manage referrals" ON referrals
    FOR ALL USING (public.is_admin());