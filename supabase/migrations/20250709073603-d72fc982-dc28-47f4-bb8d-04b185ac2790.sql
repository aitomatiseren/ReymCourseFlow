
-- Add RLS policies for trainings table to allow INSERT, UPDATE, and DELETE operations
CREATE POLICY "Allow insert trainings" 
  ON public.trainings 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update trainings" 
  ON public.trainings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete trainings" 
  ON public.trainings 
  FOR DELETE 
  USING (true);

-- Also add policies for training_participants table to support participant management
CREATE POLICY "Allow insert training_participants" 
  ON public.training_participants 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update training_participants" 
  ON public.training_participants 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete training_participants" 
  ON public.training_participants 
  FOR DELETE 
  USING (true);
