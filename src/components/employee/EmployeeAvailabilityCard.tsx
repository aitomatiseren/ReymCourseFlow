import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Eye
} from 'lucide-react';
import { 
  useEmployeeAvailability,
  useEmployeeLearningProfile,
  useEmployeeWorkArrangement
} from '@/hooks/useEmployeeAvailability';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { EmployeeAvailabilityManager } from './EmployeeAvailabilityManager';

interface EmployeeAvailabilityCardProps {
  employeeId: string;
  showManageButton?: boolean;
  maxItems?: number;
  className?: string;
}

export function EmployeeAvailabilityCard({
  employeeId,
  showManageButton = true,
  maxItems = 5,
  className = ''
}: EmployeeAvailabilityCardProps) {
  const [showManager, setShowManager] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: availability = [], isLoading } = useEmployeeAvailability(employeeId);
  const { data: learningProfile } = useEmployeeLearningProfile(employeeId);
  const { data: workArrangement } = useEmployeeWorkArrangement(employeeId);

  // Filter to show current and upcoming availability
  const currentAvailability = availability.filter(item => {
    const now = new Date();
    const endDate = parseISO(item.end_date);
    return isAfter(endDate, now) && ['active', 'planned'].includes(item.status);
  });

  const displayedItems = showAll ? currentAvailability : currentAvailability.slice(0, maxItems);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'planned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'leave': return <Calendar className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'restriction': return <XCircle className="h-4 w-4" />;
      case 'schedule': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (showManager) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Availability Management</h2>
            <Button 
              variant="outline" 
              onClick={() => setShowManager(false)}
            >
              Close
            </Button>
          </div>
          <EmployeeAvailabilityManager selectedEmployeeId={employeeId} />
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability & Schedule
          </CardTitle>
          {showManageButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManager(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentAvailability.filter(item => item.status === 'active').length}
                </div>
                <div className="text-sm text-blue-600">Active</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {currentAvailability.filter(item => item.status === 'planned').length}
                </div>
                <div className="text-sm text-yellow-600">Planned</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {learningProfile?.training_capacity_per_month || 2}
                </div>
                <div className="text-sm text-green-600">Monthly Capacity</div>
              </div>
            </div>

            {/* Work Arrangement Summary */}
            {workArrangement && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Work Arrangement</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Schedule:</strong> {workArrangement.work_schedule}
                  </div>
                  <div>
                    <strong>Hours:</strong> {workArrangement.weekly_hours}h/week
                  </div>
                  <div>
                    <strong>Work Time:</strong> {workArrangement.start_time} - {workArrangement.end_time}
                  </div>
                  <div>
                    <strong>Location:</strong> {workArrangement.work_location}
                  </div>
                </div>
              </div>
            )}

            {/* Learning Profile Summary */}
            {learningProfile && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Learning Profile</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Learning Style:</strong> {learningProfile.preferred_learning_style}
                  </div>
                  <div>
                    <strong>Group Size:</strong> {learningProfile.preferred_group_size}
                  </div>
                  <div>
                    <strong>Duration:</strong> {learningProfile.preferred_training_duration}
                  </div>
                  <div>
                    <strong>Pace:</strong> {learningProfile.learning_pace}
                  </div>
                </div>
              </div>
            )}

            {/* Current Availability */}
            <div>
              <h4 className="font-semibold mb-3">Current & Upcoming Availability</h4>
              {displayedItems.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No current availability restrictions</p>
                  <p className="text-sm">Employee is available for training</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-1 bg-gray-100 rounded">
                            {getTypeIcon(item.availability_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium">{item.title}</h5>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                              <Badge variant="outline" className={getImpactColor(item.impact_level)}>
                                {item.impact_level}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-4 mb-1">
                                <span>{item.availability_type}</span>
                                <span>
                                  {format(parseISO(item.start_date), 'MMM d')} - {format(parseISO(item.end_date), 'MMM d, yyyy')}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-xs">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {currentAvailability.length > maxItems && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAll(!showAll)}
                      className="w-full"
                    >
                      {showAll ? 'Show Less' : `Show ${currentAvailability.length - maxItems} More`}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManager(true)}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Availability
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManager(true)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}