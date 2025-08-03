import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Building2, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  X
} from "lucide-react";
import { useWorkHubs } from "@/hooks/useWorkHubs";
import { useEmployees } from "@/hooks/useEmployees";

export interface ApprovalRequirement {
  id: string;
  type: 'planning_department' | 'manager' | 'custom';
  hubId?: string;
  hubName?: string;
  managerId?: string;
  managerName?: string;
  customApproverEmail?: string;
  customApproverName?: string;
  isRequired: boolean;
  order: number;
  status: 'pending' | 'approved' | 'rejected' | 'not_required';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

interface ApprovalWorkflowManagerProps {
  participantEmployeeIds: string[];
  courseType?: string;
  onApprovalRequirementsChange: (requirements: ApprovalRequirement[]) => void;
  initialRequirements?: ApprovalRequirement[];
  readonly?: boolean;
}

export function ApprovalWorkflowManager({
  participantEmployeeIds,
  courseType,
  onApprovalRequirementsChange,
  initialRequirements = [],
  readonly = false
}: ApprovalWorkflowManagerProps) {
  const { t } = useTranslation(['training']);
  const { data: workHubs = [] } = useWorkHubs();
  const { data: employees = [] } = useEmployees();

  const [approvalRequirements, setApprovalRequirements] = useState<ApprovalRequirement[]>(initialRequirements);
  const [managerApprovalEnabled, setManagerApprovalEnabled] = useState(
    initialRequirements.some(req => req.type === 'manager')
  );

  // Auto-detect required hubs based on participant locations
  useEffect(() => {
    if (readonly || initialRequirements.length > 0) return;

    const participantEmployees = employees.filter(emp => 
      participantEmployeeIds.includes(emp.id)
    );

    // Get unique work locations from participants
    const uniqueWorkLocations = Array.from(
      new Set(
        participantEmployees
          .map(emp => emp.work_location)
          .filter(Boolean)
      )
    );

    // Find matching work hubs
    const requiredHubs = workHubs.filter(hub => 
      uniqueWorkLocations.includes(hub.name) || 
      uniqueWorkLocations.some(location => 
        location?.toLowerCase().includes(hub.name.toLowerCase())
      )
    );

    // Create planning department approval requirements for each hub
    const planningRequirements: ApprovalRequirement[] = requiredHubs.map((hub, index) => ({
      id: `planning-${hub.id}`,
      type: 'planning_department',
      hubId: hub.id,
      hubName: hub.name,
      isRequired: true,
      order: index + 1,
      status: 'pending'
    }));

    // Add manager approval if course type requires it
    const requiresManagerApproval = shouldRequireManagerApproval(courseType);
    if (requiresManagerApproval) {
      setManagerApprovalEnabled(true);
      
      // Get unique managers for participants
      const uniqueManagers = Array.from(
        new Set(
          participantEmployees
            .map(emp => emp.manager_id)
            .filter(Boolean)
        )
      );

      const managerRequirements: ApprovalRequirement[] = uniqueManagers.map((managerId, index) => {
        const manager = employees.find(emp => emp.id === managerId);
        return {
          id: `manager-${managerId}`,
          type: 'manager',
          managerId,
          managerName: manager ? `${manager.first_name} ${manager.last_name}` : 'Unknown Manager',
          isRequired: true,
          order: planningRequirements.length + index + 1,
          status: 'pending'
        };
      });

      planningRequirements.push(...managerRequirements);
    }

    setApprovalRequirements(planningRequirements);
  }, [participantEmployeeIds, courseType, workHubs, employees, readonly, initialRequirements.length]);

  // Update parent component when requirements change
  useEffect(() => {
    onApprovalRequirementsChange(approvalRequirements);
  }, [approvalRequirements, onApprovalRequirementsChange]);

  const shouldRequireManagerApproval = (courseType?: string): boolean => {
    // Define course types that require manager approval
    const managerApprovalCourses = [
      'safety',
      'leadership',
      'management',
      'specialized',
      'external_certification',
      'high_cost'
    ];
    
    return courseType ? managerApprovalCourses.some(type => 
      courseType.toLowerCase().includes(type)
    ) : false;
  };

  const addCustomApprover = () => {
    const newRequirement: ApprovalRequirement = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      isRequired: true,
      order: approvalRequirements.length + 1,
      status: 'pending'
    };
    
    setApprovalRequirements([...approvalRequirements, newRequirement]);
  };

  const removeApprovalRequirement = (id: string) => {
    setApprovalRequirements(requirements => 
      requirements.filter(req => req.id !== id)
    );
  };

  const updateApprovalRequirement = (id: string, updates: Partial<ApprovalRequirement>) => {
    setApprovalRequirements(requirements =>
      requirements.map(req => 
        req.id === id ? { ...req, ...updates } : req
      )
    );
  };

  const toggleManagerApproval = (enabled: boolean) => {
    setManagerApprovalEnabled(enabled);
    
    if (!enabled) {
      // Remove all manager approval requirements
      setApprovalRequirements(requirements =>
        requirements.filter(req => req.type !== 'manager')
      );
    } else {
      // Add manager approval requirements
      const participantEmployees = employees.filter(emp => 
        participantEmployeeIds.includes(emp.id)
      );
      
      const uniqueManagers = Array.from(
        new Set(
          participantEmployees
            .map(emp => emp.manager_id)
            .filter(Boolean)
        )
      );

      const managerRequirements: ApprovalRequirement[] = uniqueManagers.map((managerId, index) => {
        const manager = employees.find(emp => emp.id === managerId);
        return {
          id: `manager-${managerId}`,
          type: 'manager',
          managerId,
          managerName: manager ? `${manager.first_name} ${manager.last_name}` : 'Unknown Manager',
          isRequired: true,
          order: approvalRequirements.length + index + 1,
          status: 'pending'
        };
      });

      setApprovalRequirements(current => [...current, ...managerRequirements]);
    }
  };

  const getStatusBadge = (status: ApprovalRequirement['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'not_required':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Required</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: ApprovalRequirement['type']) => {
    switch (type) {
      case 'planning_department':
        return <Building2 className="w-4 h-4" />;
      case 'manager':
        return <UserCheck className="w-4 h-4" />;
      case 'custom':
        return <Users className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (readonly && approvalRequirements.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500 text-center">No approval requirements configured</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Approval Workflow Management
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure who needs to approve this training based on participant work locations and course requirements.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readonly && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="manager-approval"
                checked={managerApprovalEnabled}
                onCheckedChange={toggleManagerApproval}
              />
              <Label htmlFor="manager-approval" className="text-sm font-medium">
                Require Manager Approval
              </Label>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomApprover}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Custom Approver
            </Button>
          </div>
        )}

        {approvalRequirements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No approval requirements detected</p>
            <p className="text-xs">Add participants to auto-detect required approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvalRequirements
              .sort((a, b) => a.order - b.order)
              .map((requirement) => (
                <Card key={requirement.id} className="border-l-4 border-l-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(requirement.type)}
                        <div>
                          <h4 className="font-medium text-sm">
                            {requirement.type === 'planning_department' && `Planning Department - ${requirement.hubName}`}
                            {requirement.type === 'manager' && `Manager - ${requirement.managerName}`}
                            {requirement.type === 'custom' && 'Custom Approver'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Order: {requirement.order} • {requirement.isRequired ? 'Required' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(requirement.status)}
                        {!readonly && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeApprovalRequirement(requirement.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {requirement.type === 'custom' && !readonly && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <Label className="text-xs">Approver Name</Label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-1 text-sm border rounded-md"
                            placeholder="Enter approver name"
                            value={requirement.customApproverName || ''}
                            onChange={(e) => updateApprovalRequirement(requirement.id, {
                              customApproverName: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Email</Label>
                          <input
                            type="email"
                            className="w-full mt-1 px-3 py-1 text-sm border rounded-md"
                            placeholder="Enter approver email"
                            value={requirement.customApproverEmail || ''}
                            onChange={(e) => updateApprovalRequirement(requirement.id, {
                              customApproverEmail: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    )}

                    {!readonly && (
                      <div className="mt-3">
                        <Label className="text-xs">Notes</Label>
                        <Textarea
                          className="mt-1 text-sm"
                          placeholder="Add any specific notes for this approval..."
                          rows={2}
                          value={requirement.notes || ''}
                          onChange={(e) => updateApprovalRequirement(requirement.id, {
                            notes: e.target.value
                          })}
                        />
                      </div>
                    )}

                    {(requirement.rejectionReason || requirement.approvedAt || requirement.rejectedAt) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        {requirement.approvedAt && (
                          <p className="text-xs text-green-600">
                            ✓ Approved on {new Date(requirement.approvedAt).toLocaleDateString()}
                            {requirement.approvedBy && ` by ${requirement.approvedBy}`}
                          </p>
                        )}
                        {requirement.rejectedAt && (
                          <div className="text-xs text-red-600">
                            <p>✗ Rejected on {new Date(requirement.rejectedAt).toLocaleDateString()}
                              {requirement.rejectedBy && ` by ${requirement.rejectedBy}`}
                            </p>
                            {requirement.rejectionReason && (
                              <p className="mt-1">Reason: {requirement.rejectionReason}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {approvalRequirements.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Approval Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-blue-700">Total Required:</span>
                <p className="font-medium">{approvalRequirements.filter(req => req.isRequired).length}</p>
              </div>
              <div>
                <span className="text-green-700">Approved:</span>
                <p className="font-medium">{approvalRequirements.filter(req => req.status === 'approved').length}</p>
              </div>
              <div>
                <span className="text-yellow-700">Pending:</span>
                <p className="font-medium">{approvalRequirements.filter(req => req.status === 'pending').length}</p>
              </div>
              <div>
                <span className="text-red-700">Rejected:</span>
                <p className="font-medium">{approvalRequirements.filter(req => req.status === 'rejected').length}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}