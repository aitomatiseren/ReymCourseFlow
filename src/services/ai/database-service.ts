import { supabase } from '@/integrations/supabase/client';

export interface DatabaseContext {
  employees: Array<{
    id: string;
    name: string;
    first_name?: string | null;
    last_name?: string | null;
    tussenvoegsel?: string | null;
    roepnaam?: string | null;
    email: string;
    status: string | null;
    employee_number: string;
    department: string;
    job_title?: string | null;
    hire_date?: string | null;
    salary?: number | null;
    date_of_birth?: string | null;
    nationality?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    mobile_phone?: string | null;
    manager_id?: string | null;
    work_location?: string | null;
    working_hours?: number | null;
    contract_type?: string | null;
    marital_status?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relationship?: string | null;
    notes?: string | null;
  }>;
  courses: Array<{
    id: string;
    title: string;
    description?: string;
    duration_hours?: number;
    max_participants?: number;
    code95_points?: number;
    is_active: boolean;
  }>;
  trainings: Array<{
    id: string;
    course_title: string;
    start_date: string;
    end_date?: string;
    instructor?: string;
    location?: string;
    status: string;
    participant_count: number;
    max_participants?: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  expiringCertificates: Array<{
    employee_name: string;
    license_type: string;
    expiry_date: string;
    days_until_expiry: number;
  }>;
}

export class DatabaseService {
  private static instance: DatabaseService;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getPlatformContext(): Promise<DatabaseContext> {
    console.log('🚀 Starting getPlatformContext...');
    
    // Use Promise.allSettled to get partial data even if some queries fail
    const results = await Promise.allSettled([
      this.getEmployeesSummary(),
      this.getCoursesSummary(),
      this.getTrainingsSummary(),
      this.getExpiringCertificates()
    ]);

    const employees = results[0].status === 'fulfilled' ? results[0].value : [];
    const courses = results[1].status === 'fulfilled' ? results[1].value : [];
    const trainings = results[2].status === 'fulfilled' ? results[2].value : [];
    const certificates = results[3].status === 'fulfilled' ? results[3].value : [];

    // Log any failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const queryNames = ['employees', 'courses', 'trainings', 'certificates'];
        console.error(`Failed to fetch ${queryNames[index]}:`, result.reason);
      }
    });

    const context = {
      employees,
      courses,
      trainings,
      recentActivity: this.generateRecentActivity(trainings),
      expiringCertificates: certificates
    };

    console.log('🎯 Platform context loaded:', {
      employeeCount: employees.length,
      courseCount: courses.length,
      trainingCount: trainings.length,
      certificateCount: certificates.length
    });

    // Additional debug - show actual data structure
    if (employees.length > 0) {
      console.log('👤 Sample employee:', employees[0]);
    }
    if (courses.length > 0) {
      console.log('📚 Sample course:', courses[0]);
    }

    return context;
  }

  async getEmployeesSummary() {
    try {
      console.log('🔍 Querying employees table with ALL fields...');
      
      // First, try a simple count to see if table exists and has data
      const countQuery = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Employee count query result:', {
        count: countQuery.count,
        error: countQuery.error?.message
      });

      // Get ALL fields from employees table
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .limit(50);

      console.log('📋 Full employee query result:', {
        dataLength: data?.length || 0,
        error: error?.message,
        sampleFields: data?.[0] ? Object.keys(data[0]).join(', ') : 'No data',
        sampleName: data?.[0]?.name || 'No name field',
        sampleHireDate: data?.[0]?.hire_date || 'No hire_date field'
      });

      if (error) {
        console.error('❌ Employee query error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No employees found in database');
        return [];
      }

      console.log('✅ Successfully fetched ALL employee data:', {
        count: data.length,
        sample: data[0] ? `${data[0].name} (${data[0].employee_number}) - Hired: ${data[0].hire_date || 'N/A'}` : 'None',
        allFields: data[0] ? Object.keys(data[0]).length : 0
      });

      return data;
    } catch (err) {
      console.error('💥 Employee query crashed:', err);
      return [];
    }
  }

  async getCoursesSummary() {
    try {
      console.log('🔍 Querying courses table...');
      
      // First, try a simple count
      const countQuery = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Course count query result:', {
        count: countQuery.count,
        error: countQuery.error?.message
      });

      // Try basic query without any filters
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .limit(10);

      console.log('📋 Basic course query result:', {
        dataLength: data?.length || 0,
        error: error?.message,
        sampleData: data?.[0] || 'No data'
      });

      if (error) {
        console.error('❌ Course query error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No courses found in database');
        return [];
      }

      console.log('✅ Successfully fetched courses:', {
        count: data?.length || 0,
        sample: data?.[0] ? data[0].title : 'None'
      });

      return data.slice(0, 20);
    } catch (err) {
      console.error('💥 Course query crashed:', err);
      return [];
    }
  }

  private async getTrainingsSummary() {
    const { data, error } = await supabase
      .from('trainings')
      .select(`
        id,
        title,
        date,
        time,
        instructor,
        location,
        status,
        max_participants,
        course_id,
        training_participants(id)
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(20);

    if (error) throw error;

    return (data || []).map(training => ({
      id: training.id,
      course_title: training.title || 'Unknown Training',
      start_date: training.date,
      end_date: training.date, // Single date trainings
      instructor: training.instructor,
      location: training.location,
      status: training.status,
      participant_count: training.training_participants?.length || 0,
      max_participants: training.max_participants
    }));
  }

  private async getExpiringCertificates() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data, error } = await supabase
      .from('employee_licenses')
      .select(`
        id,
        expiry_date,
        certificate_number,
        status,
        employee_id,
        employees!inner(name, employee_number)
      `)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })
      .limit(20);

    if (error) throw error;

    return (data || []).map(cert => {
      const expiryDate = new Date(cert.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        employee_name: cert.employees?.name || 'Unknown Employee',
        license_type: cert.certificate_number || 'Unknown License',
        expiry_date: cert.expiry_date,
        days_until_expiry: daysUntilExpiry
      };
    });
  }

  private generateRecentActivity(trainings: unknown[]): Array<{ type: string; description: string; timestamp: string }> {
    const recent = trainings
      .filter((t: any) => t.start_date && new Date(t.start_date) <= new Date())
      .slice(0, 5)
      .map((training: any) => ({
        type: 'training',
        description: `Training "${training.course_title || 'Unknown'}" ${training.status === 'completed' ? 'completed' : 'started'}`,
        timestamp: training.start_date || new Date().toISOString()
      }));

    return recent;
  }

  private getEmptyContext(): DatabaseContext {
    return {
      employees: [],
      courses: [],
      trainings: [],
      recentActivity: [],
      expiringCertificates: []
    };
  }

  async searchEmployees(query: string, limit = 10) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,employee_number.ilike.%${query}%,department.ilike.%${query}%,job_title.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async searchCourses(query: string, limit = 10) {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, duration_hours, code95_points')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getTrainingsByDate(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('trainings')
      .select(`
        id,
        date,
        time,
        instructor,
        location,
        status,
        title,
        max_participants
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // New function to get newest hires
  async getNewestHires(limit = 5) {
    console.log('🔍 Finding newest hires...');
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .not('hire_date', 'is', null)
      .order('hire_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching newest hires:', error);
      throw error;
    }

    console.log('✅ Found newest hires:', {
      count: data?.length || 0,
      newest: data?.[0] ? `${data[0].name} hired on ${data[0].hire_date}` : 'None'
    });

    return data || [];
  }

  // New function to get employees by hire date range
  async getEmployeesByHireDate(startDate?: string, endDate?: string, limit = 50) {
    let query = supabase
      .from('employees')
      .select('*')
      .not('hire_date', 'is', null)
      .order('hire_date', { ascending: false });

    if (startDate) {
      query = query.gte('hire_date', startDate);
    }
    if (endDate) {
      query = query.lte('hire_date', endDate);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;
    return data || [];
  }

  // New function to get comprehensive employee data with relationships
  async getEmployeeDetails(employeeId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        manager:employees!manager_id(name, employee_number),
        direct_reports:employees!manager_id(name, employee_number, job_title),
        licenses:employee_licenses(*),
        training_participation:training_participants(*)
      `)
      .eq('id', employeeId)
      .single();

    if (error) throw error;
    return data;
  }
}