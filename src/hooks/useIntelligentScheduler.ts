import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IntelligentScheduler, SchedulingConstraints, SchedulingRecommendation } from '@/services/scheduling/intelligent-scheduler';
import { useToast } from '@/hooks/use-toast';

export function useIntelligentScheduler() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<SchedulingRecommendation[]>([]);
  const { toast } = useToast();

  const scheduler = IntelligentScheduler.getInstance();

  const getSchedulingRecommendations = async (constraints: SchedulingConstraints) => {
    setIsAnalyzing(true);
    try {
      const results = await scheduler.getSchedulingRecommendations(constraints);
      setRecommendations(results);
      return results;
    } catch (error) {
      console.error('Error getting scheduling recommendations:', error);
      toast({
        title: "Scheduling Analysis Failed",
        description: "Unable to analyze scheduling options. Please try again.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  const checkSchedulingConflicts = async (
    dates: string[],
    employeeIds: string[],
    providerId: string
  ) => {
    try {
      return await scheduler.checkSchedulingConflicts(dates, employeeIds, providerId);
    } catch (error) {
      console.error('Error checking scheduling conflicts:', error);
      toast({
        title: "Conflict Check Failed",
        description: "Unable to check for scheduling conflicts.",
        variant: "destructive"
      });
      return [];
    }
  };

  const analyzeBusinessContext = async (
    courseId: string,
    employeeIds: string[],
    startDate: Date,
    endDate: Date
  ) => {
    try {
      return await scheduler.analyzeBusinessContext(courseId, employeeIds, startDate, endDate);
    } catch (error) {
      console.error('Error analyzing business context:', error);
      toast({
        title: "Business Analysis Failed",
        description: "Unable to analyze business context.",
        variant: "destructive"
      });
      return null;
    }
  };

  const getCostOptimizationSuggestions = async (constraints: SchedulingConstraints) => {
    try {
      return await scheduler.getCostOptimizationSuggestions(constraints);
    } catch (error) {
      console.error('Error getting cost optimization suggestions:', error);
      toast({
        title: "Cost Analysis Failed",
        description: "Unable to analyze cost optimization options.",
        variant: "destructive"
      });
      return null;
    }
  };

  const clearRecommendations = () => {
    setRecommendations([]);
  };

  return {
    isAnalyzing,
    recommendations,
    getSchedulingRecommendations,
    checkSchedulingConflicts,
    analyzeBusinessContext,
    getCostOptimizationSuggestions,
    clearRecommendations
  };
}

export function useSchedulingRecommendations(constraints: SchedulingConstraints | null) {
  return useQuery({
    queryKey: ['scheduling-recommendations', constraints],
    queryFn: () => {
      if (!constraints) return [];
      const scheduler = IntelligentScheduler.getInstance();
      return scheduler.getSchedulingRecommendations(constraints);
    },
    enabled: !!constraints,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}