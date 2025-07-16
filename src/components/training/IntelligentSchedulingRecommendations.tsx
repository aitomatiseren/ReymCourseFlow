import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Euro, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Shield,
  Target
} from 'lucide-react';
import { SchedulingRecommendation } from '@/services/scheduling/intelligent-scheduler';
import { format } from 'date-fns';

interface IntelligentSchedulingRecommendationsProps {
  recommendations: SchedulingRecommendation[];
  isAnalyzing: boolean;
  onApplyRecommendation: (recommendation: SchedulingRecommendation) => void;
  onRefreshRecommendations: () => void;
}

export function IntelligentSchedulingRecommendations({
  recommendations,
  isAnalyzing,
  onApplyRecommendation,
  onRefreshRecommendations
}: IntelligentSchedulingRecommendationsProps) {
  if (isAnalyzing) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Brain className="h-5 w-5 animate-pulse" />
            Analyzing Scheduling Options...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Considering employee availability, provider costs, learning profiles, and business context
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            No Recommendations Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Select a course and provide constraints to get intelligent scheduling recommendations.
          </p>
          <Button onClick={onRefreshRecommendations} size="sm" variant="outline">
            Refresh Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Intelligent Scheduling Recommendations
        </h3>
        <Button onClick={onRefreshRecommendations} size="sm" variant="outline">
          Refresh Analysis
        </Button>
      </div>

      {recommendations.map((recommendation, index) => (
        <Card key={index} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge 
                  className={`${getScoreColor(recommendation.score)} font-semibold`}
                >
                  Score: {Math.round(recommendation.score)}%
                </Badge>
                <h4 className="font-semibold">{recommendation.provider.name}</h4>
              </div>
              <Button 
                onClick={() => onApplyRecommendation(recommendation)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply Recommendation
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Provider & Cost Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Total Cost:</span> €{recommendation.provider.totalEstimatedCost}
                </span>
              </div>
              {recommendation.provider.distance && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">Distance:</span> {recommendation.provider.distance} km
                  </span>
                </div>
              )}
              {recommendation.provider.hourlyRate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">Hourly Rate:</span> €{recommendation.provider.hourlyRate}
                  </span>
                </div>
              )}
            </div>

            {/* Suggested Schedule */}
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Suggested Schedule
              </h5>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Period:</span> {recommendation.suggestedDates.startDate} to {recommendation.suggestedDates.endDate}
                  </div>
                  <div>
                    <span className="font-medium">Sessions:</span> {recommendation.suggestedDates.sessions.length}
                  </div>
                </div>
                
                {recommendation.suggestedDates.sessions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {recommendation.suggestedDates.sessions.map((session, sessionIndex) => (
                      <div key={sessionIndex} className="text-xs text-gray-600">
                        Session {sessionIndex + 1}: {format(new Date(session.date), 'MMM dd, yyyy')} | {session.startTime} - {session.endTime}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Available Employees */}
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Available Employees ({recommendation.availableEmployees.length})
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recommendation.availableEmployees.slice(0, 6).map((employee, empIndex) => (
                  <div key={empIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{employee.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Availability: {employee.availabilityScore}%
                      </Badge>
                      {employee.urgencyScore > 50 && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
                {recommendation.availableEmployees.length > 6 && (
                  <div className="text-xs text-gray-500 p-2">
                    +{recommendation.availableEmployees.length - 6} more employees
                  </div>
                )}
              </div>
            </div>

            {/* Business Impact */}
            <div>
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Business Impact Analysis
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    <span className="font-medium">Team Coverage:</span> {recommendation.businessImpact.teamCoverageScore}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">
                    <span className="font-medium">Skill Gap Impact:</span> {recommendation.businessImpact.skillGapImpact}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">
                    <span className="font-medium">Compliance Urgency:</span> {recommendation.businessImpact.complianceUrgency}%
                  </span>
                </div>
              </div>
            </div>

            {/* Conflict Warnings */}
            {recommendation.conflictWarnings.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Potential Conflicts
                </h5>
                <div className="space-y-2">
                  {recommendation.conflictWarnings.map((warning, warningIndex) => (
                    <Alert key={warningIndex} className={getSeverityColor(warning.severity)}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <span className="font-medium capitalize">{warning.type.replace('_', ' ')}:</span> {warning.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}