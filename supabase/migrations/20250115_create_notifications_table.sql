-- Create notifications table
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN (
        'certificate_expiry',
        'training_reminder', 
        'training_enrollment',
        'training_cancellation',
        'location_change',
        'instructor_change',
        'approval_required',
        'system_announcement',
        'employee_onboarding',
        'employee_departure'
    )),
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    read_at timestamptz,
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    related_entity_type text,
    related_entity_id uuid,
    action_url text,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Create trigger for updated_at
CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (recipient_id = auth.uid()::text::uuid);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (recipient_id = auth.uid()::text::uuid);

-- System can create notifications for all users
CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- System can delete notifications
CREATE POLICY "System can delete notifications"
    ON notifications FOR DELETE
    USING (true);

-- Create function to automatically mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read = true AND OLD.read = false THEN
        NEW.read_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-setting read_at
CREATE TRIGGER notifications_mark_read
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION mark_notification_as_read();

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id uuid)
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer
        FROM notifications 
        WHERE recipient_id = user_id AND read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_id uuid,
    p_type text,
    p_title text,
    p_message text,
    p_priority text DEFAULT 'medium',
    p_related_entity_type text DEFAULT NULL,
    p_related_entity_id uuid DEFAULT NULL,
    p_action_url text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (
        recipient_id,
        type,
        title,
        message,
        priority,
        related_entity_type,
        related_entity_id,
        action_url,
        metadata
    ) VALUES (
        p_recipient_id,
        p_type,
        p_title,
        p_message,
        p_priority,
        p_related_entity_type,
        p_related_entity_id,
        p_action_url,
        p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to bulk create notifications
CREATE OR REPLACE FUNCTION create_bulk_notifications(
    p_recipient_ids uuid[],
    p_type text,
    p_title text,
    p_message text,
    p_priority text DEFAULT 'medium',
    p_related_entity_type text DEFAULT NULL,
    p_related_entity_id uuid DEFAULT NULL,
    p_action_url text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
    recipient_id uuid;
    created_count integer := 0;
BEGIN
    FOREACH recipient_id IN ARRAY p_recipient_ids
    LOOP
        INSERT INTO notifications (
            recipient_id,
            type,
            title,
            message,
            priority,
            related_entity_type,
            related_entity_id,
            action_url,
            metadata
        ) VALUES (
            recipient_id,
            p_type,
            p_title,
            p_message,
            p_priority,
            p_related_entity_type,
            p_related_entity_id,
            p_action_url,
            p_metadata
        );
        created_count := created_count + 1;
    END LOOP;
    
    RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 