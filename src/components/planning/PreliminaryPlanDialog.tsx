import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, Save } from "lucide-react";
import { usePreliminaryPlanningMutations } from "@/hooks/usePreliminaryPlanning";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/context/PermissionsContext";

interface PreliminaryPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPlan?: any;
}

export function PreliminaryPlanDialog({ 
  open, 
  onOpenChange, 
  existingPlan 
}: PreliminaryPlanDialogProps) {
  const { userProfile } = usePermissions();
  const { toast } = useToast();
  const { createPreliminaryPlan, updatePreliminaryPlan } = usePreliminaryPlanningMutations();

  const [formData, setFormData] = useState({
    name: existingPlan?.name || "",
    description: existingPlan?.description || "",
    planning_period_start: existingPlan?.planning_period_start || "",
    planning_period_end: existingPlan?.planning_period_end || "",
    status: existingPlan?.status || "draft",
    notes: existingPlan?.notes || ""
  });

  const isEditing = !!existingPlan;

  const validateForm = () => {
    if (!formData.name || !formData.planning_period_start || !formData.planning_period_end) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return false;
    }

    const startDate = new Date(formData.planning_period_start);
    const endDate = new Date(formData.planning_period_end);

    if (endDate <= startDate) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !userProfile) return;

    try {
      const planData = {
        ...formData,
        created_by: userProfile.id,
        metadata: {}
      };

      if (isEditing) {
        await updatePreliminaryPlan.mutateAsync({
          id: existingPlan.id,
          updates: planData
        });
        toast({
          title: "Success",
          description: "Preliminary plan updated successfully"
        });
      } else {
        await createPreliminaryPlan.mutateAsync(planData);
        toast({
          title: "Success",
          description: "Preliminary plan created successfully"
        });
      }

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} preliminary plan`,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      planning_period_start: "",
      planning_period_end: "",
      status: "draft",
      notes: ""
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
    if (!isEditing) {
      resetForm();
    }
  };

  // Suggest planning periods based on common patterns
  const suggestedPeriods = [
    {
      label: "Q1 2025",
      start: "2025-01-01",
      end: "2025-03-31"
    },
    {
      label: "Q2 2025", 
      start: "2025-04-01",
      end: "2025-06-30"
    },
    {
      label: "H1 2025",
      start: "2025-01-01", 
      end: "2025-06-30"
    },
    {
      label: "Full Year 2025",
      start: "2025-01-01",
      end: "2025-12-31"
    }
  ];

  const applySuggestedPeriod = (period: typeof suggestedPeriods[0]) => {
    setFormData(prev => ({
      ...prev,
      planning_period_start: period.start,
      planning_period_end: period.end,
      name: prev.name || `Preliminary Plan - ${period.label}`
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? 'Edit Preliminary Plan' : 'Create New Preliminary Plan'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the preliminary planning details below.'
              : 'Create a new preliminary plan to organize certificate renewals and employee training needs.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Q1 2025 Certificate Renewal Plan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the scope and objectives of this preliminary plan..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Planning Period</span>
            </div>

            {/* Quick Period Selection */}
            <div className="grid grid-cols-2 gap-2">
              {suggestedPeriods.map((period) => (
                <Button
                  key={period.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestedPeriod(period)}
                  className="text-xs"
                >
                  {period.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.planning_period_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, planning_period_start: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.planning_period_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, planning_period_end: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                {isEditing && (
                  <>
                    <SelectItem value="finalized">Finalized</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or comments about this plan..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createPreliminaryPlan.isPending || updatePreliminaryPlan.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {createPreliminaryPlan.isPending || updatePreliminaryPlan.isPending 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Plan' : 'Create Plan')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}