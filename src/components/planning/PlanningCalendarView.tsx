import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Plus,
  Filter
} from "lucide-react";
import { PreliminaryPlan } from "@/hooks/usePreliminaryPlanning";

interface PlanningCalendarViewProps {
  preliminaryPlans: PreliminaryPlan[];
}

export function PlanningCalendarView({ preliminaryPlans }: PlanningCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateQuarter = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 3);
    } else {
      newDate.setMonth(newDate.getMonth() + 3);
    }
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'review': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'finalized': return 'bg-green-200 text-green-900 border-green-400';
      case 'archived': return 'bg-gray-50 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredPlans = selectedPlan && selectedPlan !== 'all'
    ? preliminaryPlans.filter(plan => plan.id === selectedPlan)
    : preliminaryPlans;

  const getPlansForPeriod = () => {
    const startOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfPeriod = viewMode === 'month' 
      ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);

    return filteredPlans.filter(plan => {
      const planStart = new Date(plan.planning_period_start);
      const planEnd = new Date(plan.planning_period_end);
      
      // Check if plan overlaps with current period
      return planStart <= endOfPeriod && planEnd >= startOfPeriod;
    });
  };

  const currentPeriodPlans = getPlansForPeriod();

  const formatPeriodTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      const quarterStart = Math.floor(currentDate.getMonth() / 3) * 3;
      const quarter = Math.floor(quarterStart / 3) + 1;
      return `Q${quarter} ${currentDate.getFullYear()}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planning Calendar
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All plans</SelectItem>
                    {preliminaryPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'quarter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('quarter')}
                >
                  Quarter
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateQuarter('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-xl font-semibold">{formatPeriodTitle()}</h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateQuarter('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Plans for {formatPeriodTitle()}
            </CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Training
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentPeriodPlans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No preliminary plans for this period</p>
              <p className="text-sm">Plans will appear here when their planning period overlaps with the selected timeframe</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentPeriodPlans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                      <span className="text-sm text-gray-500">v{plan.version}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500">Planning Period</p>
                      <p className="text-sm">
                        {new Date(plan.planning_period_start).toLocaleDateString()} - {' '}
                        {new Date(plan.planning_period_end).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500">Created</p>
                      <p className="text-sm">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500">Last Updated</p>
                      <p className="text-sm">
                        {new Date(plan.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {plan.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <p className="font-medium text-gray-700 mb-1">Notes:</p>
                      <p className="text-gray-600">{plan.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline View (for quarter mode) */}
      {viewMode === 'quarter' && (
        <Card>
          <CardHeader>
            <CardTitle>Quarter Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {[0, 1, 2].map((monthOffset) => {
                  const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
                  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });
                  
                  const monthPlans = filteredPlans.filter(plan => {
                    const planStart = new Date(plan.planning_period_start);
                    const planEnd = new Date(plan.planning_period_end);
                    const monthStart = monthDate;
                    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                    
                    return planStart <= monthEnd && planEnd >= monthStart;
                  });

                  return (
                    <div key={monthOffset} className="relative flex items-start gap-4">
                      <div className="relative z-10 flex items-center justify-center w-4 h-4 bg-white border-2 border-gray-300 rounded-full">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{monthName}</h3>
                        {monthPlans.length === 0 ? (
                          <p className="text-sm text-gray-500">No plans scheduled</p>
                        ) : (
                          <div className="space-y-2">
                            {monthPlans.map((plan) => (
                              <div key={plan.id} className="flex items-center gap-2 text-sm">
                                <Badge className={getStatusColor(plan.status)} variant="outline">
                                  {plan.status}
                                </Badge>
                                <span>{plan.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}