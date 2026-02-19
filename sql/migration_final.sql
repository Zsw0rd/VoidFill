-- Add clear_requested_by column to chat_conversations for 2-way clear approval
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS clear_requested_by uuid REFERENCES auth.users(id) DEFAULT NULL;

-- Add custom_target_role column to profiles for "Others/Custom" role selection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_target_role text DEFAULT NULL;
