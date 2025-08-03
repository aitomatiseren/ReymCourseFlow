
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrainingViewToggle, TrainingViewMode } from "./TrainingViewToggle";
import { Plus } from "lucide-react";

interface TrainingSchedulerHeaderProps {
  viewMode: TrainingViewMode;
  onViewModeChange: (mode: TrainingViewMode) => void;
  onCreateTraining: () => void;
}

export function TrainingSchedulerHeader({ viewMode, onViewModeChange, onCreateTraining }: TrainingSchedulerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Training Scheduler</h1>
        <p className="text-gray-600 mt-1">Organize and manage training sessions</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="default" onClick={onCreateTraining}>
          <Plus className="h-4 w-4 mr-2" />
          Add Training
        </Button>
        <TrainingViewToggle value={viewMode} onValueChange={onViewModeChange} />
      </div>
    </div>
  );
}
