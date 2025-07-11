
-- Add support for multi-session courses and checklists
ALTER TABLE courses 
ADD COLUMN sessions_required integer DEFAULT 1,
ADD COLUMN has_checklist boolean DEFAULT false,
ADD COLUMN checklist_items jsonb DEFAULT '[]'::jsonb;

-- Add a table to track course sessions
CREATE TABLE course_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  title text,
  description text,
  duration_hours numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on course_sessions
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;

-- Allow read access to course sessions
CREATE POLICY "Allow read access to course_sessions" 
  ON course_sessions 
  FOR SELECT 
  USING (true);

-- Add indexes for better performance
CREATE INDEX idx_course_sessions_course_id ON course_sessions(course_id);
CREATE INDEX idx_course_sessions_session_number ON course_sessions(course_id, session_number);
