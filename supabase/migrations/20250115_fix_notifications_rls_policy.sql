-- Fix notifications RLS policy to properly join with user_profiles
-- This fixes the issue where notifications weren't showing up because the RLS policy
-- was incorrectly matching auth.uid() directly with recipient_id (employee_id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create corrected RLS policies that properly join through user_profiles
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (
        recipient_id IN (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid() AND employee_id IS NOT NULL
        )
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (
        recipient_id IN (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid() AND employee_id IS NOT NULL
        )
    );

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (
        recipient_id IN (
            SELECT employee_id 
            FROM user_profiles 
            WHERE id = auth.uid() AND employee_id IS NOT NULL
        )
    ); 