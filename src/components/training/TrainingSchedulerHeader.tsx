
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrainingViewToggle, TrainingViewMode } from "./TrainingViewToggle";
import { Plus, PenTool } from "lucide-react";

interface TrainingSchedulerHeaderProps {
  onCreateTraining: () => void;
  viewMode: TrainingViewMode;
  onViewModeChange: (mode: TrainingViewMode) => void;
}

export function TrainingSchedulerHeader({ onCreateTraining, viewMode, onViewModeChange }: TrainingSchedulerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Training Scheduler</h1>
        <p className="text-gray-600 mt-1">Organize and manage training sessions</p>
      </div>
      <div className="flex items-center space-x-2">
        <TrainingViewToggle value={viewMode} onValueChange={onViewModeChange} />
        <Button variant="outline" asChild>
          <Link to="/preliminary-planning">
            <PenTool className="h-4 w-4 mr-2" />
            Preliminary Planning
          </Link>
        </Button>
        <Button onClick={onCreateTraining}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule New Training
        </Button>
      </div>
    </div>
  );
}
