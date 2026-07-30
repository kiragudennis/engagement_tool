-- Enable required extensions (if not already enabled)
-- src/db/notifications.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz,
    
    -- Add constraint after column definition
    CONSTRAINT valid_notification_type CHECK (type IN (
        'loyalty_partial_redeem',
        'loyalty_points_earned',
        'loyalty_points_expiring',
        'loyalty_tier_upgrade',
        'system_alert'
    ))
);

-- Add draw-related notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;

ALTER TABLE notifications ADD CONSTRAINT valid_notification_type CHECK (type IN (
    -- Loyalty
    'loyalty_partial_redeem',
    'loyalty_points_earned',
    'loyalty_points_expiring',
    'loyalty_tier_upgrade',
    -- Draws
    'draw_win',
    'draw_runner_up',
    'draw_reminder',
    'draw_entry_confirmed',
    'draw_consolation',
    'draw_redraw',
    -- Trivia / Challenges
    'challenge_joined',
    'challenge_started',
    'challenge_ended',
    'trivia_correct',
    'trivia_wrong',
    'trivia_rank_improved',
    -- Spins
    'spin_win',
    'spin_loss',
    'spin_prize_ready',
    -- Account
    'account_activated',
    'activation_expiring',
    'activation_expired',
    'id_verified',
    'account_flagged',
    -- Engagement
    'points_earned',
    'points_redeemed',
    'new_code_available',
    'system_alert'
));

-- Update the create_notification function to include new types
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id uuid,
    p_type text,
    p_title text,
    p_message text,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_business_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id uuid;
BEGIN
    -- Validate notification type
    IF p_type NOT IN (
        'loyalty_partial_redeem',
        'loyalty_points_earned',
        'loyalty_points_expiring',
        'loyalty_tier_upgrade',
        'system_alert',
        'draw_win',
        'draw_runner_up',
        'draw_reminder',
        'draw_entry_confirmed',
        'draw_consolation',
        'draw_redraw',
        'challenge_joined',
        'challenge_started',
        'challenge_ended',
        'trivia_correct',
        'trivia_wrong',
        'trivia_rank_improved',
        'spin_win',
        'spin_loss',
        'spin_prize_ready',
        'account_activated',
        'activation_expiring',
        'activation_expired',
        'id_verified',
        'account_flagged',
        'points_earned',
        'points_redeemed',
        'new_code_available'
    ) THEN
        RAISE EXCEPTION 'Invalid notification type: %', p_type;
    END IF;
    
    INSERT INTO notifications (user_id, business_id, type, title, message, metadata)
    VALUES (p_user_id, p_business_id, p_type, p_title, p_message, p_metadata)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Update batch_create_notifications function
CREATE OR REPLACE FUNCTION batch_create_notifications(
    p_user_ids uuid[],
    p_type text,
    p_title text,
    p_message text,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_business_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
    v_user_id uuid;
BEGIN
    -- Validate notification type
    IF p_type NOT IN (
        'loyalty_partial_redeem',
        'loyalty_points_earned',
        'loyalty_points_expiring',
        'loyalty_tier_upgrade',
        'system_alert',
        'draw_win',
        'draw_runner_up',
        'draw_reminder',
        'draw_entry_confirmed',
        'draw_consolation',
        'draw_redraw',
        'challenge_joined',
        'challenge_started',
        'challenge_ended',
        'trivia_correct',
        'trivia_wrong',
        'trivia_rank_improved',
        'spin_win',
        'spin_loss',
        'spin_prize_ready',
        'account_activated',
        'activation_expiring',
        'activation_expired',
        'id_verified',
        'account_flagged',
        'points_earned',
        'points_redeemed',
        'new_code_available'
    ) THEN
        RAISE EXCEPTION 'Invalid notification type: %', p_type;
    END IF;
    
    v_count := 0;
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        PERFORM create_notification(v_user_id, p_type, p_title, p_message, p_metadata, p_business_id);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read = true;
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id) WHERE business_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'User notifications for loyalty, orders, system events, and business-specific communications';
COMMENT ON COLUMN notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN notifications.user_id IS 'User who receives the notification';
COMMENT ON COLUMN notifications.business_id IS 'Business associated with this notification (nullable for system-wide notifications)';
COMMENT ON COLUMN notifications.type IS 'Type of notification: loyalty_partial_redeem, loyalty_points_earned, loyalty_points_expiring, loyalty_tier_upgrade, order_confirmation, order_shipped, order_delivered, payment_received, payment_failed, coupon_issued, system_alert';
COMMENT ON COLUMN notifications.title IS 'Short title of the notification';
COMMENT ON COLUMN notifications.message IS 'Detailed message content';
COMMENT ON COLUMN notifications.read IS 'Whether user has read the notification';
COMMENT ON COLUMN notifications.metadata IS 'Additional data like points amount, order_id, discount amount, etc.';
COMMENT ON COLUMN notifications.created_at IS 'When the notification was created';
COMMENT ON COLUMN notifications.read_at IS 'When the user read the notification';

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id uuid,
    p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated boolean;
BEGIN
    UPDATE notifications
    SET 
        read = true,
        read_at = now()
    WHERE id = p_notification_id 
      AND user_id = p_user_id
      AND read = false;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
    p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    WITH updated AS (
        UPDATE notifications
        SET 
            read = true,
            read_at = now()
        WHERE user_id = p_user_id 
          AND read = false
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM updated;
    
    RETURN v_count;
END;
$$;

-- Function to get unread count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(
    p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM notifications
    WHERE user_id = p_user_id 
      AND read = false;
    
    RETURN v_count;
END;
$$;

-- Function to clean old notifications (older than specified days)
CREATE OR REPLACE FUNCTION clean_old_notifications(
    p_days integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    -- Validate days parameter
    IF p_days <= 0 THEN
        RAISE EXCEPTION 'Days parameter must be positive';
    END IF;
    
    WITH deleted AS (
        DELETE FROM notifications
        WHERE created_at < NOW() - (p_days || ' days')::interval
          AND read = true
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    
    RETURN v_count;
END;
$$;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for SELECT: Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for SELECT: Business admins can view notifications for their business
CREATE POLICY "Business admins can view business notifications" ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business_admins
            WHERE business_admins.user_id = auth.uid()
            AND business_admins.business_id = notifications.business_id
        )
    );

-- Policy for INSERT: System can insert notifications (or trigger functions)
-- Note: In production, you might want to restrict this to service role only
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT
    WITH CHECK (true);  -- Adjust based on your needs

-- Policy for UPDATE: Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Create a scheduled job to clean old notifications (requires pg_cron extension)
-- Uncomment if you have pg_cron extension installed
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'clean-old-notifications',  -- job name
    '0 2 * * 0',               -- weekly on Sunday at 2 AM
    $$SELECT clean_old_notifications(90);$$
);
*/

-- Function to get paginated notifications for a user
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0,
    p_include_read boolean DEFAULT true
)
RETURNS TABLE(
    id uuid,
    type text,
    title text,
    message text,
    read boolean,
    metadata jsonb,
    created_at timestamptz,
    read_at timestamptz,
    business_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate parameters
    IF p_limit <= 0 OR p_limit > 100 THEN
        p_limit := 20;
    END IF;
    
    IF p_offset < 0 THEN
        p_offset := 0;
    END IF;
    
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.read,
        n.metadata,
        n.created_at,
        n.read_at,
        n.business_id
    FROM notifications n
    WHERE n.user_id = p_user_id
      AND (p_include_read OR n.read = false)
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant necessary permissions (adjust based on your security needs)
GRANT EXECUTE ON FUNCTION create_notification(uuid, text, text, text, jsonb, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_notification_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(uuid, integer, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION clean_old_notifications(integer) TO service_role;
GRANT EXECUTE ON FUNCTION batch_create_notifications(uuid[], text, text, text, jsonb, uuid) TO service_role;

-- Optional: Create a trigger to automatically clean old notifications
-- This creates a materialized view for unread counts (useful for performance with many users)
CREATE MATERIALIZED VIEW IF NOT EXISTS notification_unread_counts AS
SELECT 
    user_id,
    COUNT(*) as unread_count,
    MAX(created_at) as latest_notification
FROM notifications
WHERE read = false
GROUP BY user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_unread_counts_user ON notification_unread_counts(user_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_notification_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY notification_unread_counts;
    RETURN NULL;
END;
$$;

-- Create trigger to refresh counts on notification changes
DROP TRIGGER IF EXISTS refresh_notification_counts_trigger ON notifications;
CREATE TRIGGER refresh_notification_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notifications
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_notification_counts();