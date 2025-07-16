-- Migration: Add Plan Associations to Trainings
-- Description: Link actual trainings to preliminary plans for complete workflow integration
-- Date: 2025-07-16

-- Add plan association fields to trainings table
ALTER TABLE public.trainings 
ADD COLUMN IF NOT EXISTS preliminary_plan_id UUID REFERENCES public.preliminary_plans(id),
ADD COLUMN IF NOT EXISTS preliminary_plan_group_id UUID REFERENCES public.preliminary_plan_groups(id),
ADD COLUMN IF NOT EXISTS preliminary_plan_training_id UUID REFERENCES public.preliminary_plan_trainings(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trainings_preliminary_plan_id ON public.trainings(preliminary_plan_id);
CREATE INDEX IF NOT EXISTS idx_trainings_preliminary_plan_group_id ON public.trainings(preliminary_plan_group_id);
CREATE INDEX IF NOT EXISTS idx_trainings_preliminary_plan_training_id ON public.trainings(preliminary_plan_training_id);

-- Create function to get plan progress and statistics
CREATE OR REPLACE FUNCTION get_plan_progress_stats(plan_id UUID)
RETURNS TABLE (
    total_groups INTEGER,
    total_employees INTEGER,
    total_proposed_trainings INTEGER,
    total_confirmed_trainings INTEGER,
    total_converted_trainings INTEGER,
    completion_percentage DECIMAL,
    employees_with_trainings INTEGER,
    employees_without_trainings INTEGER,
    estimated_total_cost DECIMAL,
    actual_total_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM preliminary_plan_groups WHERE preliminary_plan_groups.plan_id = get_plan_progress_stats.plan_id) as total_groups,
        (SELECT COUNT(*)::INTEGER FROM preliminary_plan_group_employees ppge 
         JOIN preliminary_plan_groups ppg ON ppge.group_id = ppg.id 
         WHERE ppg.plan_id = get_plan_progress_stats.plan_id) as total_employees,
        (SELECT COUNT(*)::INTEGER FROM preliminary_plan_trainings WHERE preliminary_plan_trainings.plan_id = get_plan_progress_stats.plan_id) as total_proposed_trainings,
        (SELECT COUNT(*)::INTEGER FROM preliminary_plan_trainings WHERE preliminary_plan_trainings.plan_id = get_plan_progress_stats.plan_id AND status = 'confirmed') as total_confirmed_trainings,
        (SELECT COUNT(*)::INTEGER FROM preliminary_plan_trainings WHERE preliminary_plan_trainings.plan_id = get_plan_progress_stats.plan_id AND status = 'converted') as total_converted_trainings,
        -- Calculate completion percentage
        CASE 
            WHEN (SELECT COUNT(*) FROM preliminary_plan_trainings WHERE preliminary_plan_trainings.plan_id = get_plan_progress_stats.plan_id) = 0 THEN 0
            ELSE (SELECT COUNT(*)::DECIMAL FROM preliminary_plan_trainings WHERE preliminary_plan_trainings.plan_id = get_plan_progress_stats.plan_id AND status IN ('confirmed', 'converted')) * 100 / 
                 (SELECT COUNT(*)::DECIMAL FROM preliminary_plan_trainings WHERE preliminary_plan_trainings.plan_id = get_plan_progress_stats.plan_id)
        END as completion_percentage,
        -- Count employees with actual training assignments
        (SELECT COUNT(DISTINCT ppge.employee_id)::INTEGER 
         FROM preliminary_plan_group_employees ppge 
         JOIN preliminary_plan_groups ppg ON ppge.group_id = ppg.id 
         JOIN preliminary_plan_trainings ppt ON ppg.id = ppt.group_id
         WHERE ppg.plan_id = get_plan_progress_stats.plan_id 
         AND ppt.status IN ('confirmed', 'converted')) as employees_with_trainings,
        -- Count employees without training assignments
        (SELECT COUNT(DISTINCT ppge.employee_id)::INTEGER 
         FROM preliminary_plan_group_employees ppge 
         JOIN preliminary_plan_groups ppg ON ppge.group_id = ppg.id 
         LEFT JOIN preliminary_plan_trainings ppt ON ppg.id = ppt.group_id AND ppt.status IN ('confirmed', 'converted')
         WHERE ppg.plan_id = get_plan_progress_stats.plan_id 
         AND ppt.id IS NULL) as employees_without_trainings,
        -- Calculate estimated cost
        (SELECT COALESCE(SUM(estimated_cost), 0) FROM preliminary_plan_trainings WHERE preliminary_plan_trainings.plan_id = get_plan_progress_stats.plan_id) as estimated_total_cost,
        -- Calculate actual cost from converted trainings
        (SELECT COALESCE(SUM(t.cost_per_participant * t.max_participants), 0) 
         FROM preliminary_plan_trainings ppt 
         JOIN trainings t ON ppt.converted_training_id = t.id 
         WHERE ppt.plan_id = get_plan_progress_stats.plan_id AND ppt.status = 'converted') as actual_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync preliminary plan with actual training
CREATE OR REPLACE FUNCTION sync_preliminary_plan_training(
    training_id UUID,
    preliminary_plan_id UUID DEFAULT NULL,
    preliminary_plan_group_id UUID DEFAULT NULL,
    preliminary_plan_training_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    training_record RECORD;
    plan_record RECORD;
BEGIN
    -- Get the training record
    SELECT * INTO training_record FROM trainings WHERE id = training_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Training not found';
    END IF;
    
    -- Update the training with plan associations
    UPDATE trainings 
    SET 
        preliminary_plan_id = sync_preliminary_plan_training.preliminary_plan_id,
        preliminary_plan_group_id = sync_preliminary_plan_training.preliminary_plan_group_id,
        preliminary_plan_training_id = sync_preliminary_plan_training.preliminary_plan_training_id
    WHERE id = training_id;
    
    -- If linking to a preliminary plan training, update its status
    IF preliminary_plan_training_id IS NOT NULL THEN
        UPDATE preliminary_plan_trainings 
        SET 
            status = 'converted',
            converted_training_id = training_id
        WHERE id = preliminary_plan_training_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add plan association columns to training_participants for better tracking
ALTER TABLE public.training_participants 
ADD COLUMN IF NOT EXISTS preliminary_plan_employee_id UUID REFERENCES public.preliminary_plan_group_employees(id);

CREATE INDEX IF NOT EXISTS idx_training_participants_preliminary_plan_employee_id ON public.training_participants(preliminary_plan_employee_id);

-- Add comments for documentation
COMMENT ON FUNCTION get_plan_progress_stats IS 'Returns comprehensive statistics about preliminary plan progress and completion';
COMMENT ON FUNCTION sync_preliminary_plan_training IS 'Synchronizes actual training with preliminary plan training record';

COMMENT ON COLUMN public.trainings.preliminary_plan_id IS 'Links training to the preliminary plan it originated from';
COMMENT ON COLUMN public.trainings.preliminary_plan_group_id IS 'Links training to the specific group within the preliminary plan';
COMMENT ON COLUMN public.trainings.preliminary_plan_training_id IS 'Links training to the specific preliminary training record';
COMMENT ON COLUMN public.training_participants.preliminary_plan_employee_id IS 'Links participant to their preliminary plan group assignment';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_plan_progress_stats TO authenticated;
GRANT EXECUTE ON FUNCTION sync_preliminary_plan_training TO authenticated;