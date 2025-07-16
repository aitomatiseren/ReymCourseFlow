import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePreliminaryPlans, usePreliminaryPlanGroups } from "@/hooks/usePreliminaryPlanning";
import { CalendarDays, Users, Target, Clock } from "lucide-react";

interface PlanSelectionSectionProps {
  selectedPlanId: string;
  selectedGroupId: string;
  onPlanChange: (planId: string) => void;
  onGroupChange: (groupId: string) => void;
  onPlanDetailsChange: (planDetails: any) => void;
  preSelectedLicenseId?: string;
}

export function PlanSelectionSection({
  selectedPlanId,
  selectedGroupId,
  onPlanChange,
  onGroupChange,
  onPlanDetailsChange,
  preSelectedLicenseId
}: PlanSelectionSectionProps) {
  const { t } = useTranslation(['training', 'common']);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  // Fetch all preliminary plans
  const { data: plans = [] } = usePreliminaryPlans();
  
  // Fetch groups for selected plan
  const { data: planGroups = [] } = usePreliminaryPlanGroups(selectedPlanId);

  // Filter plans by status - only show active plans
  const activePlans = plans.filter(plan => 
    plan.status === 'approved' || plan.status === 'draft' || plan.status === 'review'
  );

  // Filter groups by license if pre-selected
  const relevantGroups = preSelectedLicenseId
    ? planGroups.filter(group => group.certificate_id === preSelectedLicenseId)
    : planGroups;

  const selectedPlan = activePlans.find(plan => plan.id === selectedPlanId);
  const selectedGroup = relevantGroups.find(group => group.id === selectedGroupId);

  // Clear group selection when plan changes
  useEffect(() => {
    if (selectedPlanId && selectedPlanId !== "none") {
      onGroupChange("");
    }
  }, [selectedPlanId, onGroupChange]);

  // Update parent component with plan details
  useEffect(() => {
    if (selectedPlan && selectedGroup) {
      onPlanDetailsChange({
        plan: selectedPlan,
        group: selectedGroup,
        employeeCount: selectedGroup.preliminary_plan_group_employees?.length || 0,
        targetDate: selectedGroup.target_completion_date,
        estimatedCost: selectedGroup.estimated_cost,
        maxParticipants: selectedGroup.max_participants
      });
    } else {
      onPlanDetailsChange(null);
    }
  }, [selectedPlan, selectedGroup, onPlanDetailsChange]);

  const handlePlanChange = (planId: string) => {
    onPlanChange(planId);
    setShowPlanDetails(!!planId && planId !== "none");
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plan-select">
            {t('training:createDialog.preliminaryPlan')}
          </Label>
          <Select value={selectedPlanId} onValueChange={handlePlanChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('training:createDialog.selectPlan')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t('training:createDialog.noAssociatedPlan')}
              </SelectItem>
              {activePlans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  <div className="flex items-center gap-2">
                    <span>{plan.name}</span>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPlanId && selectedPlanId !== "none" && (
          <div className="space-y-2">
            <Label htmlFor="group-select">
              {t('training:createDialog.planGroup')}
            </Label>
            <Select value={selectedGroupId} onValueChange={onGroupChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('training:createDialog.selectGroup')} />
              </SelectTrigger>
              <SelectContent>
                {relevantGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{group.name}</span>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{group.preliminary_plan_group_employees?.length || 0}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedPlan && showPlanDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {selectedPlan.name}
              <Badge className={getStatusColor(selectedPlan.status)}>
                {selectedPlan.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4" />
                  <span>Planning Period:</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDateRange(selectedPlan.planning_period_start, selectedPlan.planning_period_end)}
                </p>
              </div>
              
              {selectedPlan.description && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Description:</span>
                  </div>
                  <p className="text-sm">{selectedPlan.description}</p>
                </div>
              )}
            </div>

            {selectedGroup && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Selected Group: {selectedGroup.name}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Employees:</span>
                    <p className="font-medium">{selectedGroup.preliminary_plan_group_employees?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Participants:</span>
                    <p className="font-medium">{selectedGroup.max_participants || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Priority:</span>
                    <p className="font-medium">{selectedGroup.priority}</p>
                  </div>
                  {selectedGroup.target_completion_date && (
                    <div>
                      <span className="text-gray-600">Target Date:</span>
                      <p className="font-medium">{new Date(selectedGroup.target_completion_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                {selectedGroup.estimated_cost && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-900">
                        Estimated Cost: €{selectedGroup.estimated_cost}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedPlan.notes && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Notes:</h4>
                <p className="text-sm text-gray-600">{selectedPlan.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedPlanId && selectedPlanId !== "none" && relevantGroups.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No groups available for this plan{preSelectedLicenseId ? ' and selected license' : ''}.</p>
              <p className="text-sm">Groups may not have been created yet or may not match the selected criteria.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}