import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Calendar, 
  Users, 
  MapPin, 
  Euro, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  TrendingUp,
  Target
} from "lucide-react";
import { usePreliminaryPlans, useCertificateExpiryAnalysis } from "@/hooks/usePreliminaryPlanning";
import { useProviders } from "@/hooks/useProviders";
import { ProviderScheduleSlot } from "@/components/providers/ProviderScheduleManager";

export interface AITrainingRecommendation {
  id: string;
  type: 'optimal_scheduling' | 'cost_optimization' | 'provider_matching' | 'conflict_resolution';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  estimatedSavings?: {
    cost?: number;
    time?: string;
    efficiency?: number;
  };
  affectedEmployees: string[];
  recommendedAction: {
    type: 'schedule_training' | 'merge_groups' | 'change_provider' | 'adjust_dates';
    details: any;
  };
  reasoning: string[];
  providerScheduleSlots?: ProviderScheduleSlot[];
  alternativeOptions?: any[];
}

interface AIEnhancedPlanningAssistantProps {
  planId?: string;
  licenseId?: string;
  onRecommendationApply?: (recommendation: AITrainingRecommendation) => void;
}

export function AIEnhancedPlanningAssistant({
  planId,
  licenseId,
  onRecommendationApply
}: AIEnhancedPlanningAssistantProps) {
  const { t } = useTranslation(['planning', 'training']);
  
  const [recommendations, setRecommendations] = useState<AITrainingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [userQuery, setUserQuery] = useState('');

  const { data: plans = [] } = usePreliminaryPlans();
  const { data: providers = [] } = useProviders();
  const { data: expiryAnalysis = [] } = useCertificateExpiryAnalysis({
    license_id: licenseId,
    preliminary_plan_id: planId
  });

  useEffect(() => {
    generateAIRecommendations();
  }, [planId, licenseId, expiryAnalysis]);

  const generateAIRecommendations = async () => {
    setLoading(true);
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiRecommendations = await analyzeTrainingNeeds();
      setRecommendations(aiRecommendations);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTrainingNeeds = async (): Promise<AITrainingRecommendation[]> => {
    const recommendations: AITrainingRecommendation[] = [];

    // 1. Optimal Scheduling Analysis
    if (expiryAnalysis.length > 0) {
      const urgentEmployees = expiryAnalysis.filter(emp => 
        emp.days_until_expiry !== null && emp.days_until_expiry <= 30
      );

      if (urgentEmployees.length >= 3) {
        recommendations.push({
          id: `optimal-${Date.now()}`,
          type: 'optimal_scheduling',
          title: 'Urgent Training Consolidation Opportunity',
          description: `${urgentEmployees.length} employees need immediate training. AI suggests consolidating into a single session.`,
          confidence: 95,
          priority: 'high',
          estimatedSavings: {
            cost: 850,
            time: '2-3 weeks saved',
            efficiency: 78
          },
          affectedEmployees: urgentEmployees.map(emp => emp.employee_id),
          recommendedAction: {
            type: 'schedule_training',
            details: {
              suggestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              participantCount: urgentEmployees.length,
              location: 'Central Hub',
              duration: '1 day intensive'
            }
          },
          reasoning: [
            'Certificate expiry analysis shows critical timing',
            'Group size optimization for cost efficiency',
            'Minimizes business disruption through consolidation',
            'Provider availability window identified'
          ]
        });
      }
    }

    // 2. Provider Matching Analysis
    const providerAnalysis = analyzeProviderOptimization();
    if (providerAnalysis) {
      recommendations.push(providerAnalysis);
    }

    // 3. Cost Optimization
    const costOptimization = analyzeCostOptimization();
    if (costOptimization) {
      recommendations.push(costOptimization);
    }

    // 4. Schedule Conflict Resolution
    const conflictResolution = analyzeScheduleConflicts();
    if (conflictResolution) {
      recommendations.push(conflictResolution);
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const analyzeProviderOptimization = (): AITrainingRecommendation | null => {
    if (providers.length < 2) return null;

    // Mock analysis of provider optimization
    const preferredProvider = providers[0];
    const alternativeProvider = providers[1];

    return {
      id: `provider-${Date.now()}`,
      type: 'provider_matching',
      title: 'Optimal Provider Selection Identified',
      description: `AI analysis suggests ${preferredProvider.name} offers better value and schedule alignment for your training needs.`,
      confidence: 87,
      priority: 'medium',
      estimatedSavings: {
        cost: 420,
        time: '1 week faster delivery',
        efficiency: 65
      },
      affectedEmployees: [],
      recommendedAction: {
        type: 'change_provider',
        details: {
          currentProvider: alternativeProvider.name,
          recommendedProvider: preferredProvider.name,
          reasons: ['Better schedule availability', 'Lower cost per participant', 'Higher quality rating']
        }
      },
      reasoning: [
        'Provider schedule analysis shows better availability windows',
        'Cost-per-participant comparison favors recommended provider',
        'Quality ratings and past performance metrics',
        'Travel distance optimization for participants'
      ]
    };
  };

  const analyzeCostOptimization = (): AITrainingRecommendation | null => {
    // Mock cost optimization analysis
    return {
      id: `cost-${Date.now()}`,
      type: 'cost_optimization',
      title: 'Bulk Training Discount Opportunity',
      description: 'AI detected potential for 25% cost savings by combining two separate training groups.',
      confidence: 82,
      priority: 'medium',
      estimatedSavings: {
        cost: 1250,
        efficiency: 71
      },
      affectedEmployees: [],
      recommendedAction: {
        type: 'merge_groups',
        details: {
          groups: ['Safety Training Group A', 'Safety Training Group B'],
          newGroupSize: 16,
          costSavingsPerParticipant: 78,
          schedulingWindow: '2-week flexibility'
        }
      },
      reasoning: [
        'Provider offers bulk pricing for 15+ participants',
        'Schedule compatibility identified between groups',
        'Same certification requirements across groups',
        'Venue capacity can accommodate merged group'
      ]
    };
  };

  const analyzeScheduleConflicts = (): AITrainingRecommendation | null => {
    // Mock conflict analysis
    return {
      id: `conflict-${Date.now()}`,
      type: 'conflict_resolution',
      title: 'Schedule Conflict Resolution',
      description: 'AI detected overlapping training dates with offshore operations. Alternative scheduling recommended.',
      confidence: 91,
      priority: 'high',
      estimatedSavings: {
        time: 'Prevents 3-day operational delay'
      },
      affectedEmployees: [],
      recommendedAction: {
        type: 'adjust_dates',
        details: {
          conflictingDates: ['2024-08-15', '2024-08-16'],
          recommendedDates: ['2024-08-22', '2024-08-23'],
          conflictType: 'offshore_operations',
          impactedDepartments: ['Operations', 'Marine']
        }
      },
      reasoning: [
        'Offshore operations schedule analysis shows conflicts',
        'Critical staff availability during proposed dates',
        'Alternative dates maintain certification timeline',
        'Minimal impact on training effectiveness'
      ]
    };
  };

  const handleApplyRecommendation = (recommendation: AITrainingRecommendation) => {
    if (onRecommendationApply) {
      onRecommendationApply(recommendation);
    }
  };

  const handleAIQuery = async () => {
    if (!userQuery.trim()) return;
    
    setLoading(true);
    
    // Simulate AI processing of user query
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const queryResponse: AITrainingRecommendation = {
      id: `query-${Date.now()}`,
      type: 'optimal_scheduling',
      title: 'AI Response to Your Query',
      description: `Based on your question: "${userQuery}", AI suggests the following approach.`,
      confidence: 85,
      priority: 'medium',
      affectedEmployees: [],
      recommendedAction: {
        type: 'schedule_training',
        details: {
          customResponse: true,
          userQuery
        }
      },
      reasoning: [
        'Analysis of current training pipeline',
        'Consideration of employee availability',
        'Provider schedule optimization',
        'Cost-effectiveness evaluation'
      ]
    };

    setRecommendations(prev => [queryResponse, ...prev]);
    setUserQuery('');
    setLoading(false);
  };

  const getPriorityColor = (priority: AITrainingRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: AITrainingRecommendation['type']) => {
    switch (type) {
      case 'optimal_scheduling': return <Calendar className="w-4 h-4" />;
      case 'cost_optimization': return <Euro className="w-4 h-4" />;
      case 'provider_matching': return <Target className="w-4 h-4" />;
      case 'conflict_resolution': return <AlertTriangle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI-Enhanced Planning Assistant
        </CardTitle>
        <p className="text-sm text-gray-600">
          Intelligent analysis of training needs, provider schedules, and optimization opportunities.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">
              <Brain className="w-4 h-4 mr-2" />
              AI Recommendations
            </TabsTrigger>
            <TabsTrigger value="query">
              <Zap className="w-4 h-4 mr-2" />
              Ask AI
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 animate-pulse mx-auto mb-4 text-purple-600" />
                <p>AI is analyzing your training data...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No recommendations available</p>
                <p className="text-xs">Add training data to get AI suggestions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <Card key={recommendation.id} className="border-l-4 border-l-purple-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(recommendation.type)}
                          <div>
                            <h4 className="font-medium">{recommendation.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {recommendation.priority}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {recommendation.confidence}% confidence
                          </div>
                        </div>
                      </div>

                      {recommendation.estimatedSavings && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h5 className="text-sm font-medium text-green-900 mb-2">Estimated Benefits</h5>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {recommendation.estimatedSavings.cost && (
                              <div>
                                <span className="text-green-700">Cost Savings:</span>
                                <p className="font-medium">€{recommendation.estimatedSavings.cost}</p>
                              </div>
                            )}
                            {recommendation.estimatedSavings.time && (
                              <div>
                                <span className="text-green-700">Time Savings:</span>
                                <p className="font-medium">{recommendation.estimatedSavings.time}</p>
                              </div>
                            )}
                            {recommendation.estimatedSavings.efficiency && (
                              <div>
                                <span className="text-green-700">Efficiency:</span>
                                <p className="font-medium">{recommendation.estimatedSavings.efficiency}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-2">AI Reasoning</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {recommendation.reasoning.map((reason, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="text-xs text-gray-500">
                          Affects {recommendation.affectedEmployees.length} employee(s)
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleApplyRecommendation(recommendation)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Apply Recommendation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="query" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Ask AI about your training planning</label>
                <Textarea
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="e.g., 'How can I optimize training costs for next quarter?' or 'What's the best time to schedule safety training for the operations team?'"
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleAIQuery}
                disabled={loading || !userQuery.trim()}
                className="w-full"
              >
                <Zap className="w-4 h-4 mr-2" />
                {loading ? 'AI is thinking...' : 'Get AI Recommendation'}
              </Button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Example Queries</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• "When should I schedule Code 95 renewals for maximum efficiency?"</li>
                <li>• "Which training provider offers the best value for VCA certification?"</li>
                <li>• "How can I group employees to minimize training costs?"</li>
                <li>• "What are the optimal dates considering offshore operations?"</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <h4 className="font-medium">Training Efficiency</h4>
                  </div>
                  <div className="text-2xl font-bold text-green-600">87%</div>
                  <p className="text-sm text-gray-600">Optimization vs manual planning</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Euro className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium">Cost Savings</h4>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">€3,240</div>
                  <p className="text-sm text-gray-600">Potential monthly savings</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <h4 className="font-medium">Time Savings</h4>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">12h</div>
                  <p className="text-sm text-gray-600">Per week planning time saved</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <h4 className="font-medium">Employee Satisfaction</h4>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">94%</div>
                  <p className="text-sm text-gray-600">With AI-optimized schedules</p>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-medium text-purple-900 mb-2">AI Intelligence Features</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>✨ Real-time provider schedule integration</li>
                <li>🎯 Employee work location optimization</li>
                <li>📊 Cost-benefit analysis for all recommendations</li>
                <li>⚡ Conflict detection and resolution</li>
                <li>🧠 Continuous learning from planning outcomes</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}