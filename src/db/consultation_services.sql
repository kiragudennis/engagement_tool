-- src/db/consultation_services.sql
-- ============================================
-- Consultation Services: Professional services marketplace
-- ============================================

-- Consultation bookings
CREATE TABLE IF NOT EXISTS consultation_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT NOT NULL,
    
    -- Customer info
    business_name TEXT,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Booking details
    preferred_date DATE,
    preferred_time TEXT,
    notes TEXT,
    
    -- Payment
    payment_reference TEXT UNIQUE,
    transaction_id TEXT UNIQUE,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    amount_paid INTEGER,
    currency TEXT DEFAULT 'KES',
    payment_method TEXT DEFAULT 'paystack',
    paid_at TIMESTAMPTZ,
    
    -- Assignment & fulfillment
    assigned_to UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_email ON consultation_bookings(email);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_payment_reference ON consultation_bookings(payment_reference);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_service ON consultation_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_transaction_id ON consultation_bookings(transaction_id);
