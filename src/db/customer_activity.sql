-- Function to update user activity (site duration tracking)
CREATE OR REPLACE FUNCTION update_user_activity(
    p_user_id UUID,
    p_duration_seconds INTEGER,
    p_session_seconds INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_total INTEGER;
    v_metadata JSONB;
BEGIN
    -- Get current metadata
    SELECT metadata INTO v_metadata
    FROM users
    WHERE id = p_user_id;
    
    IF v_metadata IS NULL THEN
        v_metadata := '{}'::jsonb;
    END IF;
    
    v_current_total := COALESCE((v_metadata->>'total_site_seconds')::INTEGER, 0);
    
    -- Update with merged metadata
    UPDATE users
    SET 
        metadata = v_metadata || jsonb_build_object(
            'last_activity', NOW()::TEXT,
            'total_site_seconds', v_current_total + p_duration_seconds,
            'last_session_seconds', p_session_seconds,
            'last_session_end', NOW()::TEXT
        ),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_activity(UUID, INTEGER, INTEGER) TO authenticated;