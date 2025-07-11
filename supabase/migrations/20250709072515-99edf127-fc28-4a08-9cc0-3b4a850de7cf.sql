
-- Add RLS policies to allow INSERT, UPDATE, and DELETE operations on courses table
CREATE POLICY "Allow insert courses" 
  ON courses 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update courses" 
  ON courses 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete courses" 
  ON courses 
  FOR DELETE 
  USING (true);

-- Add similar policies for course_sessions table
CREATE POLICY "Allow insert course_sessions" 
  ON course_sessions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update course_sessions" 
  ON course_sessions 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete course_sessions" 
  ON course_sessions 
  FOR DELETE 
  USING (true);
