import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parseISO, isAfter, isBefore, isWeekend, startOfWeek, endOfWeek, addWeeks } from "date-fns";

export interface SchedulingConstraints {
  courseId: string;
  preferredStartDate?: Date;
  preferredEndDate?: Date;
  maxParticipants?: number;
  requiredEmployeeIds?: string[];
  excludedEmployeeIds?: string[];
  maxBudget?: number;
  maxTravelDistance?: number;
  preferredLocation?: {
    lat: number;
    lng: number;
  };
  learningStylePreferences?: string[];
  urgencyLevel?: 'low' | 'medium' | 'high';
  teamCoverageRequired?: boolean;
}

export interface SchedulingRecommendation {
  score: number;
  provider: {
    id: string;
    name: string;
    hourlyRate?: number;
    travelCost?: number;
    distance?: number;
    totalEstimatedCost: number;
  };
  suggestedDates: {
    startDate: string;
    endDate: string;
    sessions: Array<{
      date: string;
      startTime: string;
      endTime: string;
    }>;
  };
  availableEmployees: Array<{
    id: string;
    name: string;
    availabilityScore: number;
    learningStyleMatch: number;
    urgencyScore: number;
    certificateExpiryDays?: number;
  }>;
  conflictWarnings: Array<{
    type: 'availability' | 'capacity' | 'cost' | 'location';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  businessImpact: {
    teamCoverageScore: number;
    skillGapImpact: number;
    complianceUrgency: number;
  };
}

export class IntelligentScheduler {
  private static instance: IntelligentScheduler;

  public static getInstance(): IntelligentScheduler {
    if (!IntelligentScheduler.instance) {
      IntelligentScheduler.instance = new IntelligentScheduler();
    }
    return IntelligentScheduler.instance;
  }

  /**
   * Get intelligent scheduling recommendations based on constraints
   */
  async getSchedulingRecommendations(
    constraints: SchedulingConstraints
  ): Promise<SchedulingRecommendation[]> {
    try {
      const [
        providers,
        employeeAvailability,
        learningProfiles,
        certificateExpiry,
        existingTrainings,
        workArrangements
      ] = await Promise.all([
        this.getEligibleProviders(constraints),
        this.getEmployeeAvailability(constraints),
        this.getLearningProfiles(constraints),
        this.getCertificateExpiryData(constraints),
        this.getExistingTrainings(constraints),
        this.getWorkArrangements(constraints)
      ]);

      const recommendations: SchedulingRecommendation[] = [];

      for (const provider of providers) {
        const recommendation = await this.analyzeProvider(
          provider,
          constraints,
          employeeAvailability,
          learningProfiles,
          certificateExpiry,
          existingTrainings,
          workArrangements
        );
        
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Sort by score (highest first)
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting scheduling recommendations:', error);
      throw error;
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkSchedulingConflicts(
    dates: string[],
    employeeIds: string[],
    providerId: string
  ): Promise<Array<{
    type: 'employee_unavailable' | 'provider_conflict' | 'capacity_exceeded';
    message: string;
    affectedEmployees?: string[];
  }>> {
    const conflicts = [];

    // Check employee availability conflicts
    const { data: unavailableEmployees } = await supabase
      .from('employee_availability')
      .select('employee_id, title, start_date, end_date, availability_type')
      .in('employee_id', employeeIds)
      .eq('status', 'active')
      .or(dates.map(date => 
        `and(start_date.lte.${date},end_date.gte.${date})`
      ).join(','));

    if (unavailableEmployees?.length) {
      conflicts.push({
        type: 'employee_unavailable' as const,
        message: `${unavailableEmployees.length} employees have availability conflicts`,
        affectedEmployees: unavailableEmployees.map(emp => emp.employee_id)
      });
    }

    // Check provider capacity conflicts
    const { data: providerConflicts } = await supabase
      .from('trainings')
      .select('date, max_participants, training_participants(count)')
      .eq('provider_id', providerId)
      .in('date', dates)
      .eq('status', 'scheduled');

    if (providerConflicts?.length) {
      conflicts.push({
        type: 'provider_conflict' as const,
        message: `Provider has ${providerConflicts.length} conflicting training sessions`
      });
    }

    return conflicts;
  }

  /**
   * Analyze business context for training scheduling
   */
  async analyzeBusinessContext(
    courseId: string,
    employeeIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    teamCoverageAnalysis: {
      criticalSkillsAffected: string[];
      teamAvailabilityPercentage: number;
      coverageRisk: 'low' | 'medium' | 'high';
    };
    seasonalFactors: {
      busyPeriodConflict: boolean;
      historicalDemand: number;
      recommendedAlternatives?: string[];
    };
    complianceUrgency: {
      expiringCertificates: number;
      complianceRiskLevel: 'low' | 'medium' | 'high';
      deadline?: string;
    };
  }> {
    const [teamCoverage, seasonalData, complianceData] = await Promise.all([
      this.analyzeTeamCoverage(employeeIds, startDate, endDate),
      this.analyzeSeasonalFactors(courseId, startDate, endDate),
      this.analyzeComplianceUrgency(courseId, employeeIds)
    ]);

    return {
      teamCoverageAnalysis: teamCoverage,
      seasonalFactors: seasonalData,
      complianceUrgency: complianceData
    };
  }

  /**
   * Get cost optimization suggestions
   */
  async getCostOptimizationSuggestions(
    constraints: SchedulingConstraints
  ): Promise<{
    cheapestProvider: any;
    costBreakdown: any[];
    savingsOpportunities: Array<{
      description: string;
      potentialSavings: number;
      recommendation: string;
    }>;
  }> {
    const { data: providers } = await supabase
      .rpc('get_provider_recommendations', {
        target_lat: constraints.preferredLocation?.lat,
        target_lng: constraints.preferredLocation?.lng,
        max_distance_km: constraints.maxTravelDistance || 100,
        max_hourly_rate: constraints.maxBudget ? constraints.maxBudget / 8 : null,
        course_id: constraints.courseId
      });

    if (!providers?.length) {
      return {
        cheapestProvider: null,
        costBreakdown: [],
        savingsOpportunities: []
      };
    }

    const cheapestProvider = providers[0];
    const costBreakdown = await this.calculateDetailedCosts(cheapestProvider, constraints);
    const savingsOpportunities = await this.identifySavingsOpportunities(providers, constraints);

    return {
      cheapestProvider,
      costBreakdown,
      savingsOpportunities
    };
  }

  // Private helper methods
  private async getEligibleProviders(constraints: SchedulingConstraints) {
    const { data, error } = await supabase
      .from('course_providers')
      .select(`
        id,
        name,
        default_hourly_rate,
        travel_cost_per_km,
        base_location_lat,
        base_location_lng,
        min_group_size,
        max_group_size,
        setup_cost,
        cancellation_fee,
        advance_booking_days,
        cost_currency,
        course_provider_courses!inner(
          course_id,
          cost_breakdown,
          number_of_sessions,
          max_participants
        )
      `)
      .eq('active', true)
      .eq('course_provider_courses.course_id', constraints.courseId);

    if (error) {
      console.error('Error fetching eligible providers:', error);
      return [];
    }

    return data || [];
  }

  private async getEmployeeAvailability(constraints: SchedulingConstraints) {
    const { data, error } = await supabase
      .from('employee_availability')
      .select(`
        employee_id,
        availability_type,
        start_date,
        end_date,
        status,
        impact_level,
        employees(
          id,
          first_name,
          last_name,
          department,
          job_title
        )
      `)
      .eq('status', 'active')
      .gte('end_date', format(new Date(), 'yyyy-MM-dd'));

    if (error) {
      console.error('Error fetching employee availability:', error);
      return [];
    }

    return data || [];
  }

  private async getLearningProfiles(constraints: SchedulingConstraints) {
    const { data, error } = await supabase
      .from('employee_learning_profiles')
      .select(`
        employee_id,
        learning_style,
        training_capacity_per_month,
        language_preference,
        special_accommodations,
        performance_level,
        previous_training_success_rate,
        preferred_training_times
      `);

    if (error) {
      console.error('Error fetching learning profiles:', error);
      return [];
    }

    return data || [];
  }

  private async getCertificateExpiryData(constraints: SchedulingConstraints) {
    const { data, error } = await supabase
      .from('certificate_expiry_analysis')
      .select('*')
      .in('employee_status', ['expired', 'renewal_due', 'renewal_approaching']);

    if (error) {
      console.error('Error fetching certificate expiry data:', error);
      return [];
    }

    return data || [];
  }

  private async getExistingTrainings(constraints: SchedulingConstraints) {
    const { data, error } = await supabase
      .from('trainings')
      .select(`
        id,
        course_id,
        provider_id,
        date,
        time,
        max_participants,
        training_participants(count)
      `)
      .eq('status', 'scheduled')
      .gte('date', format(new Date(), 'yyyy-MM-dd'));

    if (error) {
      console.error('Error fetching existing trainings:', error);
      return [];
    }

    return data || [];
  }

  private async getWorkArrangements(constraints: SchedulingConstraints) {
    const { data, error } = await supabase
      .from('employee_work_arrangements')
      .select(`
        employee_id,
        work_schedule,
        primary_work_location,
        contract_type,
        notice_period_days,
        travel_restrictions,
        mobility_limitations,
        remote_work_percentage
      `);

    if (error) {
      console.error('Error fetching work arrangements:', error);
      return [];
    }

    return data || [];
  }

  private async analyzeProvider(
    provider: any,
    constraints: SchedulingConstraints,
    employeeAvailability: any[],
    learningProfiles: any[],
    certificateExpiry: any[],
    existingTrainings: any[],
    workArrangements: any[]
  ): Promise<SchedulingRecommendation | null> {
    // Calculate distance if location provided
    let distance = 0;
    let travelCost = 0;
    
    if (constraints.preferredLocation && provider.base_location_lat && provider.base_location_lng) {
      distance = this.calculateDistance(
        constraints.preferredLocation.lat,
        constraints.preferredLocation.lng,
        provider.base_location_lat,
        provider.base_location_lng
      );
      travelCost = provider.travel_cost_per_km ? provider.travel_cost_per_km * distance : 0;
    }

    // Calculate total estimated cost
    const baseCost = provider.default_hourly_rate ? provider.default_hourly_rate * 8 : 0;
    const setupCost = provider.setup_cost || 0;
    const totalEstimatedCost = baseCost + setupCost + travelCost;

    // Check budget constraints
    if (constraints.maxBudget && totalEstimatedCost > constraints.maxBudget) {
      return null;
    }

    // Check distance constraints
    if (constraints.maxTravelDistance && distance > constraints.maxTravelDistance) {
      return null;
    }

    // Analyze available employees
    const availableEmployees = await this.analyzeEmployeeAvailability(
      constraints,
      employeeAvailability,
      learningProfiles,
      certificateExpiry
    );

    // Calculate scheduling score
    const score = this.calculateSchedulingScore(
      provider,
      availableEmployees,
      distance,
      totalEstimatedCost,
      constraints
    );

    // Generate suggested dates
    const suggestedDates = await this.generateOptimalDates(
      provider,
      constraints,
      availableEmployees,
      existingTrainings,
      workArrangements
    );

    // Check for conflicts
    const conflictWarnings = await this.generateConflictWarnings(
      provider,
      suggestedDates,
      availableEmployees,
      constraints
    );

    // Analyze business impact
    const businessImpact = await this.analyzeBusinessImpact(
      constraints,
      availableEmployees,
      certificateExpiry
    );

    return {
      score,
      provider: {
        id: provider.id,
        name: provider.name,
        hourlyRate: provider.default_hourly_rate,
        travelCost,
        distance,
        totalEstimatedCost
      },
      suggestedDates,
      availableEmployees,
      conflictWarnings,
      businessImpact
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 100) / 100;
  }

  private async analyzeEmployeeAvailability(
    constraints: SchedulingConstraints,
    employeeAvailability: any[],
    learningProfiles: any[],
    certificateExpiry: any[]
  ) {
    // Implementation for employee availability analysis
    const employees = [];
    
    if (constraints.requiredEmployeeIds?.length) {
      // Analyze specific employees
      for (const employeeId of constraints.requiredEmployeeIds) {
        const availability = employeeAvailability.filter(a => a.employee_id === employeeId);
        const learningProfile = learningProfiles.find(p => p.employee_id === employeeId);
        const expiryInfo = certificateExpiry.find(e => e.employee_id === employeeId);
        
        employees.push({
          id: employeeId,
          name: availability[0]?.employees?.first_name + ' ' + availability[0]?.employees?.last_name,
          availabilityScore: this.calculateAvailabilityScore(availability),
          learningStyleMatch: this.calculateLearningStyleMatch(learningProfile, constraints),
          urgencyScore: this.calculateUrgencyScore(expiryInfo),
          certificateExpiryDays: expiryInfo?.days_until_expiry
        });
      }
    }

    return employees;
  }

  private calculateSchedulingScore(
    provider: any,
    availableEmployees: any[],
    distance: number,
    totalCost: number,
    constraints: SchedulingConstraints
  ): number {
    let score = 100;

    // Provider quality factors
    if (provider.default_hourly_rate) {
      score += 20; // Has pricing information
    }

    // Distance penalty
    if (distance > 0) {
      score -= Math.min(distance * 0.5, 30);
    }

    // Cost efficiency
    if (constraints.maxBudget) {
      const costEfficiency = (constraints.maxBudget - totalCost) / constraints.maxBudget;
      score += costEfficiency * 25;
    }

    // Employee availability
    const avgAvailability = availableEmployees.reduce((sum, emp) => sum + emp.availabilityScore, 0) / availableEmployees.length;
    score += avgAvailability * 30;

    // Learning style match
    const avgLearningMatch = availableEmployees.reduce((sum, emp) => sum + emp.learningStyleMatch, 0) / availableEmployees.length;
    score += avgLearningMatch * 15;

    // Urgency bonus
    const avgUrgency = availableEmployees.reduce((sum, emp) => sum + emp.urgencyScore, 0) / availableEmployees.length;
    score += avgUrgency * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateAvailabilityScore(availability: any[]): number {
    // Higher score means better availability
    if (!availability.length) return 100;
    
    const conflicts = availability.filter(a => a.impact_level === 'high').length;
    return Math.max(0, 100 - (conflicts * 30));
  }

  private calculateLearningStyleMatch(learningProfile: any, constraints: SchedulingConstraints): number {
    if (!learningProfile || !constraints.learningStylePreferences?.length) return 50;
    
    const match = constraints.learningStylePreferences.includes(learningProfile.learning_style);
    return match ? 100 : 25;
  }

  private calculateUrgencyScore(expiryInfo: any): number {
    if (!expiryInfo) return 0;
    
    const days = expiryInfo.days_until_expiry || 999;
    if (days <= 0) return 100; // Expired
    if (days <= 30) return 80; // Very urgent
    if (days <= 90) return 60; // Moderately urgent
    return 20; // Not urgent
  }

  private async generateOptimalDates(
    provider: any,
    constraints: SchedulingConstraints,
    availableEmployees: any[],
    existingTrainings: any[],
    workArrangements: any[]
  ) {
    // Generate suggested dates based on constraints and availability
    const startDate = constraints.preferredStartDate || new Date();
    const sessions = [];
    
    // Simple implementation - can be enhanced with more sophisticated logic
    const sessionDate = format(addDays(startDate, provider.advance_booking_days || 14), 'yyyy-MM-dd');
    
    sessions.push({
      date: sessionDate,
      startTime: '09:00',
      endTime: '17:00'
    });

    return {
      startDate: sessionDate,
      endDate: sessionDate,
      sessions
    };
  }

  private async generateConflictWarnings(
    provider: any,
    suggestedDates: any,
    availableEmployees: any[],
    constraints: SchedulingConstraints
  ) {
    const warnings = [];

    // Check for high-impact availability conflicts
    const highImpactConflicts = availableEmployees.filter(emp => emp.availabilityScore < 50);
    if (highImpactConflicts.length > 0) {
      warnings.push({
        type: 'availability' as const,
        message: `${highImpactConflicts.length} employees have availability conflicts`,
        severity: 'high' as const
      });
    }

    // Check capacity constraints
    if (constraints.maxParticipants && availableEmployees.length > constraints.maxParticipants) {
      warnings.push({
        type: 'capacity' as const,
        message: `More employees available than maximum capacity (${constraints.maxParticipants})`,
        severity: 'medium' as const
      });
    }

    return warnings;
  }

  private async analyzeBusinessImpact(
    constraints: SchedulingConstraints,
    availableEmployees: any[],
    certificateExpiry: any[]
  ) {
    // Analyze business impact of scheduling this training
    const expiredCertificates = certificateExpiry.filter(c => c.employee_status === 'expired').length;
    const renewalDue = certificateExpiry.filter(c => c.employee_status === 'renewal_due').length;
    
    return {
      teamCoverageScore: Math.min(100, availableEmployees.length * 10),
      skillGapImpact: expiredCertificates * 20,
      complianceUrgency: (expiredCertificates * 30) + (renewalDue * 20)
    };
  }

  private async analyzeTeamCoverage(employeeIds: string[], startDate: Date, endDate: Date) {
    // Analyze team coverage impact
    return {
      criticalSkillsAffected: [],
      teamAvailabilityPercentage: 85,
      coverageRisk: 'medium' as const
    };
  }

  private async analyzeSeasonalFactors(courseId: string, startDate: Date, endDate: Date) {
    // Analyze seasonal factors
    return {
      busyPeriodConflict: false,
      historicalDemand: 7,
      recommendedAlternatives: []
    };
  }

  private async analyzeComplianceUrgency(courseId: string, employeeIds: string[]) {
    // Analyze compliance urgency
    return {
      expiringCertificates: 3,
      complianceRiskLevel: 'medium' as const,
      deadline: '2025-09-15'
    };
  }

  private async calculateDetailedCosts(provider: any, constraints: SchedulingConstraints) {
    return [
      {
        component: 'Training',
        amount: provider.hourly_rate * 8,
        currency: 'EUR'
      },
      {
        component: 'Travel',
        amount: provider.estimated_travel_cost,
        currency: 'EUR'
      },
      {
        component: 'Setup',
        amount: provider.setup_cost,
        currency: 'EUR'
      }
    ];
  }

  private async identifySavingsOpportunities(providers: any[], constraints: SchedulingConstraints) {
    const opportunities = [];
    
    if (providers.length > 1) {
      const costDifference = providers[1].estimated_travel_cost - providers[0].estimated_travel_cost;
      if (costDifference > 50) {
        opportunities.push({
          description: 'Choose closer provider',
          potentialSavings: costDifference,
          recommendation: `Select ${providers[0].provider_name} instead of ${providers[1].provider_name}`
        });
      }
    }

    return opportunities;
  }
}