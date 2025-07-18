export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      certificate_exemptions: {
        Row: {
          approval_date: string | null
          approval_notes: string | null
          approval_status: string
          approved_by_id: string | null
          approved_by_name: string | null
          created_at: string | null
          dont_repeat_flag: boolean
          effective_date: string
          employee_id: string
          exemption_type: string
          expiry_date: string | null
          id: string
          is_active: boolean
          justification: string | null
          license_id: string
          reason: string
          requested_by_id: string | null
          requested_by_name: string | null
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string
          approved_by_id?: string | null
          approved_by_name?: string | null
          created_at?: string | null
          dont_repeat_flag?: boolean
          effective_date?: string
          employee_id: string
          exemption_type: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          justification?: string | null
          license_id: string
          reason: string
          requested_by_id?: string | null
          requested_by_name?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string
          approved_by_id?: string | null
          approved_by_name?: string | null
          created_at?: string | null
          dont_repeat_flag?: boolean
          effective_date?: string
          employee_id?: string
          exemption_type?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          justification?: string | null
          license_id?: string
          reason?: string
          requested_by_id?: string | null
          requested_by_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_exemptions_approved_by_id_fkey"
            columns: ["approved_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_exemptions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_exemptions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_exemptions_requested_by_id_fkey"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_prerequisites: {
        Row: {
          certificate_id: string
          created_at: string | null
          id: string
          prerequisite_id: string
        }
        Insert: {
          certificate_id: string
          created_at?: string | null
          id?: string
          prerequisite_id: string
        }
        Update: {
          certificate_id?: string
          created_at?: string | null
          id?: string
          prerequisite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_prerequisites_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_prerequisites_prerequisite_id_fkey"
            columns: ["prerequisite_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_provider_courses: {
        Row: {
          active: boolean | null
          cost_breakdown: Json | null
          course_id: string
          created_at: string | null
          id: string
          max_participants: number | null
          notes: string | null
          number_of_sessions: number | null
          price: number | null
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          cost_breakdown?: Json | null
          course_id: string
          created_at?: string | null
          id?: string
          max_participants?: number | null
          notes?: string | null
          number_of_sessions?: number | null
          price?: number | null
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          cost_breakdown?: Json | null
          course_id?: string
          created_at?: string | null
          id?: string
          max_participants?: number | null
          notes?: string | null
          number_of_sessions?: number | null
          price?: number | null
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_provider_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_provider_courses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "course_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      course_providers: {
        Row: {
          active: boolean | null
          additional_locations: Json | null
          additional_locations_backup: string[] | null
          address: string | null
          advance_booking_days: number | null
          base_location_lat: number | null
          base_location_lng: number | null
          cancellation_fee: number | null
          city: string | null
          contact_person: string | null
          cost_currency: string | null
          country: string | null
          created_at: string | null
          default_hourly_rate: number | null
          default_location: string | null
          description: string | null
          email: string | null
          id: string
          instructors: string[] | null
          max_group_size: number | null
          min_group_size: number | null
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          setup_cost: number | null
          travel_cost_per_km: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          additional_locations?: Json | null
          additional_locations_backup?: string[] | null
          address?: string | null
          advance_booking_days?: number | null
          base_location_lat?: number | null
          base_location_lng?: number | null
          cancellation_fee?: number | null
          city?: string | null
          contact_person?: string | null
          cost_currency?: string | null
          country?: string | null
          created_at?: string | null
          default_hourly_rate?: number | null
          default_location?: string | null
          description?: string | null
          email?: string | null
          id?: string
          instructors?: string[] | null
          max_group_size?: number | null
          min_group_size?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          setup_cost?: number | null
          travel_cost_per_km?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          additional_locations?: Json | null
          additional_locations_backup?: string[] | null
          address?: string | null
          advance_booking_days?: number | null
          base_location_lat?: number | null
          base_location_lng?: number | null
          cancellation_fee?: number | null
          city?: string | null
          contact_person?: string | null
          cost_currency?: string | null
          country?: string | null
          created_at?: string | null
          default_hourly_rate?: number | null
          default_location?: string | null
          description?: string | null
          email?: string | null
          id?: string
          instructors?: string[] | null
          max_group_size?: number | null
          min_group_size?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          setup_cost?: number | null
          travel_cost_per_km?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      course_sessions: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          session_number: number
          title: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          session_number: number
          title?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          session_number?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          checklist_items: Json | null
          code95_points: number | null
          cost_breakdown: Json | null
          created_at: string
          description: string | null
          duration_hours: number | null
          has_checklist: boolean | null
          id: string
          level: number | null
          level_description: string | null
          max_participants: number | null
          price: number | null
          sessions_required: number | null
          title: string
        }
        Insert: {
          category?: string | null
          checklist_items?: Json | null
          code95_points?: number | null
          cost_breakdown?: Json | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          has_checklist?: boolean | null
          id?: string
          level?: number | null
          level_description?: string | null
          max_participants?: number | null
          price?: number | null
          sessions_required?: number | null
          title: string
        }
        Update: {
          category?: string | null
          checklist_items?: Json | null
          code95_points?: number | null
          cost_breakdown?: Json | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          has_checklist?: boolean | null
          id?: string
          level?: number | null
          level_description?: string | null
          max_participants?: number | null
          price?: number | null
          sessions_required?: number | null
          title?: string
        }
        Relationships: []
      }
      employee_licenses: {
        Row: {
          can_renew_from_level: number | null
          certificate_number: string | null
          created_at: string
          employee_id: string | null
          exemption_id: string | null
          expiry_date: string | null
          id: string
          is_exempt: boolean | null
          issue_date: string | null
          level_achieved: number | null
          license_id: string | null
          status: string | null
        }
        Insert: {
          can_renew_from_level?: number | null
          certificate_number?: string | null
          created_at?: string
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          level_achieved?: number | null
          license_id?: string | null
          status?: string | null
        }
        Update: {
          can_renew_from_level?: number | null
          certificate_number?: string | null
          created_at?: string
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          level_achieved?: number | null
          license_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_licenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_licenses_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_status_history: {
        Row: {
          changed_by_name: string | null
          changed_by_user_id: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string
        }
        Insert: {
          changed_by_name?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status: string
        }
        Update: {
          changed_by_name?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_status_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          birth_country: string | null
          birth_place: string | null
          city: string | null
          contract_type: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          death_date: string | null
          department: string
          divorce_date: string | null
          driving_license_a: boolean | null
          driving_license_a_expiry_date: string | null
          driving_license_a_start_date: string | null
          driving_license_b: boolean | null
          driving_license_b_expiry_date: string | null
          driving_license_b_start_date: string | null
          driving_license_be: boolean | null
          driving_license_be_expiry_date: string | null
          driving_license_be_start_date: string | null
          driving_license_c: boolean | null
          driving_license_c_expiry_date: string | null
          driving_license_c_start_date: string | null
          driving_license_ce: boolean | null
          driving_license_ce_expiry_date: string | null
          driving_license_ce_start_date: string | null
          driving_license_code95: boolean | null
          driving_license_code95_expiry_date: string | null
          driving_license_code95_start_date: string | null
          driving_license_d: boolean | null
          driving_license_d_expiry_date: string | null
          driving_license_d_start_date: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_number: string
          first_name: string | null
          gender: string | null
          hire_date: string | null
          id: string
          id_proof_expiry_date: string | null
          id_proof_number: string | null
          id_proof_type: string | null
          job_title: string | null
          last_name: string | null
          manager_id: string | null
          marital_status: string | null
          marriage_date: string | null
          mobile_phone: string | null
          name: string
          nationality: string | null
          notes: string | null
          personal_id: string | null
          phone: string | null
          postcode: string | null
          private_email: string | null
          roepnaam: string | null
          role_id: string | null
          salary: number | null
          status: string | null
          status_end_date: string | null
          status_reason: string | null
          status_start_date: string | null
          tussenvoegsel: string | null
          updated_at: string
          website: string | null
          work_location: string | null
          working_hours: number | null
        }
        Insert: {
          address?: string | null
          birth_country?: string | null
          birth_place?: string | null
          city?: string | null
          contract_type?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          death_date?: string | null
          department: string
          divorce_date?: string | null
          driving_license_a?: boolean | null
          driving_license_a_expiry_date?: string | null
          driving_license_a_start_date?: string | null
          driving_license_b?: boolean | null
          driving_license_b_expiry_date?: string | null
          driving_license_b_start_date?: string | null
          driving_license_be?: boolean | null
          driving_license_be_expiry_date?: string | null
          driving_license_be_start_date?: string | null
          driving_license_c?: boolean | null
          driving_license_c_expiry_date?: string | null
          driving_license_c_start_date?: string | null
          driving_license_ce?: boolean | null
          driving_license_ce_expiry_date?: string | null
          driving_license_ce_start_date?: string | null
          driving_license_code95?: boolean | null
          driving_license_code95_expiry_date?: string | null
          driving_license_code95_start_date?: string | null
          driving_license_d?: boolean | null
          driving_license_d_expiry_date?: string | null
          driving_license_d_start_date?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_number: string
          first_name?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          id_proof_expiry_date?: string | null
          id_proof_number?: string | null
          id_proof_type?: string | null
          job_title?: string | null
          last_name?: string | null
          manager_id?: string | null
          marital_status?: string | null
          marriage_date?: string | null
          mobile_phone?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          personal_id?: string | null
          phone?: string | null
          postcode?: string | null
          private_email?: string | null
          roepnaam?: string | null
          role_id?: string | null
          salary?: number | null
          status?: string | null
          status_end_date?: string | null
          status_reason?: string | null
          status_start_date?: string | null
          tussenvoegsel?: string | null
          updated_at?: string
          website?: string | null
          work_location?: string | null
          working_hours?: number | null
        }
        Update: {
          address?: string | null
          birth_country?: string | null
          birth_place?: string | null
          city?: string | null
          contract_type?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          death_date?: string | null
          department?: string
          divorce_date?: string | null
          driving_license_a?: boolean | null
          driving_license_a_expiry_date?: string | null
          driving_license_a_start_date?: string | null
          driving_license_b?: boolean | null
          driving_license_b_expiry_date?: string | null
          driving_license_b_start_date?: string | null
          driving_license_be?: boolean | null
          driving_license_be_expiry_date?: string | null
          driving_license_be_start_date?: string | null
          driving_license_c?: boolean | null
          driving_license_c_expiry_date?: string | null
          driving_license_c_start_date?: string | null
          driving_license_ce?: boolean | null
          driving_license_ce_expiry_date?: string | null
          driving_license_ce_start_date?: string | null
          driving_license_code95?: boolean | null
          driving_license_code95_expiry_date?: string | null
          driving_license_code95_start_date?: string | null
          driving_license_d?: boolean | null
          driving_license_d_expiry_date?: string | null
          driving_license_d_start_date?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_number?: string
          first_name?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          id_proof_expiry_date?: string | null
          id_proof_number?: string | null
          id_proof_type?: string | null
          job_title?: string | null
          last_name?: string | null
          manager_id?: string | null
          marital_status?: string | null
          marriage_date?: string | null
          mobile_phone?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          personal_id?: string | null
          phone?: string | null
          postcode?: string | null
          private_email?: string | null
          roepnaam?: string | null
          role_id?: string | null
          salary?: number | null
          status?: string | null
          status_end_date?: string | null
          status_reason?: string | null
          status_start_date?: string | null
          tussenvoegsel?: string | null
          updated_at?: string
          website?: string | null
          work_location?: string | null
          working_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string
          description: string | null
          hierarchy_order: number | null
          id: string
          is_base_level: boolean | null
          level: number | null
          level_description: string | null
          name: string
          renewal_notice_months: number | null
          supersedes_license_id: string | null
          validity_period_months: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hierarchy_order?: number | null
          id?: string
          is_base_level?: boolean | null
          level?: number | null
          level_description?: string | null
          name: string
          renewal_notice_months?: number | null
          supersedes_license_id?: string | null
          validity_period_months?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hierarchy_order?: number | null
          id?: string
          is_base_level?: boolean | null
          level?: number | null
          level_description?: string | null
          name?: string
          renewal_notice_months?: number | null
          supersedes_license_id?: string | null
          validity_period_months?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          read: boolean | null
          read_at: string | null
          recipient_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_participants: {
        Row: {
          approval_status: string | null
          code95_eligible: boolean | null
          employee_id: string | null
          id: string
          registration_date: string
          status: string | null
          training_id: string | null
        }
        Insert: {
          approval_status?: string | null
          code95_eligible?: boolean | null
          employee_id?: string | null
          id?: string
          registration_date?: string
          status?: string | null
          training_id?: string | null
        }
        Update: {
          approval_status?: string | null
          code95_eligible?: boolean | null
          employee_id?: string | null
          id?: string
          registration_date?: string
          status?: string | null
          training_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_participants_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          checklist: Json | null
          cost_breakdown: Json | null
          course_id: string | null
          created_at: string
          date: string
          id: string
          instructor: string | null
          instructor_id: string | null
          location: string
          max_participants: number
          notes: string | null
          organizer_id: string | null
          price: number | null
          provider_id: string | null
          requires_approval: boolean | null
          session_dates: Json | null
          session_end_times: Json | null
          session_times: Json | null
          sessions_count: number | null
          status: string | null
          time: string
          title: string
        }
        Insert: {
          checklist?: Json | null
          cost_breakdown?: Json | null
          course_id?: string | null
          created_at?: string
          date: string
          id?: string
          instructor?: string | null
          instructor_id?: string | null
          location: string
          max_participants: number
          notes?: string | null
          organizer_id?: string | null
          price?: number | null
          provider_id?: string | null
          requires_approval?: boolean | null
          session_dates?: Json | null
          session_end_times?: Json | null
          session_times?: Json | null
          sessions_count?: number | null
          status?: string | null
          time: string
          title: string
        }
        Update: {
          checklist?: Json | null
          cost_breakdown?: Json | null
          course_id?: string | null
          created_at?: string
          date?: string
          id?: string
          instructor?: string | null
          instructor_id?: string | null
          location?: string
          max_participants?: number
          notes?: string | null
          organizer_id?: string | null
          price?: number | null
          provider_id?: string | null
          requires_approval?: boolean | null
          session_dates?: Json | null
          session_end_times?: Json | null
          session_times?: Json | null
          sessions_count?: number | null
          status?: string | null
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "course_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          is_active: boolean | null
          language_preference: string | null
          last_login: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id: string
          is_active?: boolean | null
          language_preference?: string | null
          last_login?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          language_preference?: string | null
          last_login?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_availability: {
        Row: {
          id: string
          employee_id: string
          availability_type: string
          status: string
          start_date: string
          end_date: string | null
          reason: string | null
          impact_level: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          availability_type: string
          status: string
          start_date: string
          end_date?: string | null
          reason?: string | null
          impact_level?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          availability_type?: string
          status?: string
          start_date?: string
          end_date?: string | null
          reason?: string | null
          impact_level?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      employee_learning_profiles: {
        Row: {
          id: string
          employee_id: string
          learning_style: string | null
          language_preference: string | null
          special_accommodations: string | null
          performance_level: string | null
          previous_training_success_rate: number | null
          preferred_training_times: Json | null
          training_capacity_per_month: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          learning_style?: string | null
          language_preference?: string | null
          special_accommodations?: string | null
          performance_level?: string | null
          previous_training_success_rate?: number | null
          preferred_training_times?: Json | null
          training_capacity_per_month?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          learning_style?: string | null
          language_preference?: string | null
          special_accommodations?: string | null
          performance_level?: string | null
          previous_training_success_rate?: number | null
          preferred_training_times?: Json | null
          training_capacity_per_month?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_learning_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      employee_work_arrangements: {
        Row: {
          id: string
          employee_id: string
          primary_work_location: string | null
          work_schedule: string | null
          contract_type: string | null
          notice_period_days: number | null
          travel_restrictions: string | null
          mobility_limitations: string | null
          remote_work_percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          primary_work_location?: string | null
          work_schedule?: string | null
          contract_type?: string | null
          notice_period_days?: number | null
          travel_restrictions?: string | null
          mobility_limitations?: string | null
          remote_work_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          primary_work_location?: string | null
          work_schedule?: string | null
          contract_type?: string | null
          notice_period_days?: number | null
          travel_restrictions?: string | null
          mobility_limitations?: string | null
          remote_work_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_work_arrangements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      provider_preferences: {
        Row: {
          id: string
          course_id: string
          provider_id: string
          priority_rank: number
          cost_per_participant: number | null
          distance_from_hub_km: number | null
          quality_rating: number | null
          booking_lead_time_days: number | null
          cancellation_policy: string | null
          rescheduling_flexibility_score: number | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          provider_id: string
          priority_rank: number
          cost_per_participant?: number | null
          distance_from_hub_km?: number | null
          quality_rating?: number | null
          booking_lead_time_days?: number | null
          cancellation_policy?: string | null
          rescheduling_flexibility_score?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          provider_id?: string
          priority_rank?: number
          cost_per_participant?: number | null
          distance_from_hub_km?: number | null
          quality_rating?: number | null
          booking_lead_time_days?: number | null
          cancellation_policy?: string | null
          rescheduling_flexibility_score?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_preferences_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_preferences_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "training_providers"
            referencedColumns: ["id"]
          }
        ]
      }
      work_hubs: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number | null
          longitude: number | null
          is_primary: boolean | null
          employee_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude?: number | null
          longitude?: number | null
          is_primary?: boolean | null
          employee_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number | null
          longitude?: number | null
          is_primary?: boolean | null
          employee_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_context_settings: {
        Row: {
          id: string
          setting_type: string
          setting_name: string
          start_date: string | null
          end_date: string | null
          impact_level: string | null
          description: string | null
          constraints: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_type: string
          setting_name: string
          start_date?: string | null
          end_date?: string | null
          impact_level?: string | null
          description?: string | null
          constraints?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_type?: string
          setting_name?: string
          start_date?: string | null
          end_date?: string | null
          impact_level?: string | null
          description?: string | null
          constraints?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_bulk_notifications: {
        Args: {
          p_recipient_ids: string[]
          p_type: string
          p_title: string
          p_message: string
          p_priority?: string
          p_related_entity_type?: string
          p_related_entity_id?: string
          p_action_url?: string
          p_metadata?: Json
        }
        Returns: number
      }
      create_notification: {
        Args: {
          p_recipient_id: string
          p_type: string
          p_title: string
          p_message: string
          p_priority?: string
          p_related_entity_type?: string
          p_related_entity_id?: string
          p_action_url?: string
          p_metadata?: Json
        }
        Returns: string
      }
      get_unread_notification_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: {
          permission_name: string
          permission_category: string
        }[]
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_permission: {
        Args: { user_id: string; permission_name: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const