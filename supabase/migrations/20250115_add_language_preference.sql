-- Add language preference to user profiles
ALTER TABLE user_profiles 
ADD COLUMN language_preference TEXT DEFAULT 'nl' CHECK (language_preference IN ('en', 'nl')); 