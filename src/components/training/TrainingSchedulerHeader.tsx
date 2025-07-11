
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TrainingSchedulerHeaderProps {
  onCreateTraining: () => void;
}

export function TrainingSchedulerHeader({ onCreateTraining }: TrainingSchedulerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Training Scheduler</h2>
        <p className="text-gray-600">Organize and manage training sessions</p>
      </div>
      <Button onClick={onCreateTraining}>
        <Plus className="h-4 w-4 mr-2" />
        Schedule New Training
      </Button>
    </div>
  );
}
