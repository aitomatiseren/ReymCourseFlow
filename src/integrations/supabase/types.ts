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
      business_context_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_name: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_name: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_name?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      cdr_registry_cache: {
        Row: {
          bsn: string
          cdr_number: string | null
          certificate_type: string | null
          created_at: string | null
          employee_id: string
          id: string
          last_checked: string
          qr_code: string | null
          registry_response: Json | null
          status: string
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          bsn: string
          cdr_number?: string | null
          certificate_type?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          last_checked?: string
          qr_code?: string | null
          registry_response?: Json | null
          status: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          bsn?: string
          cdr_number?: string | null
          certificate_type?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          last_checked?: string
          qr_code?: string | null
          registry_response?: Json | null
          status?: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cdr_registry_cache_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_documents: {
        Row: {
          ai_confidence_score: number | null
          ai_extracted_data: Json | null
          created_at: string
          employee_id: string | null
          employee_license_id: string | null
          extracted_certificate_number: string | null
          extracted_employee_name: string | null
          extracted_expiry_date: string | null
          extracted_issue_date: string | null
          extracted_issuer: string | null
          extracted_license_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          license_id: string | null
          mime_type: string | null
          processing_status: string | null
          updated_at: string
          upload_date: string
          uploaded_by: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_extracted_data?: Json | null
          created_at?: string
          employee_id?: string | null
          employee_license_id?: string | null
          extracted_certificate_number?: string | null
          extracted_employee_name?: string | null
          extracted_expiry_date?: string | null
          extracted_issue_date?: string | null
          extracted_issuer?: string | null
          extracted_license_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          license_id?: string | null
          mime_type?: string | null
          processing_status?: string | null
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_extracted_data?: Json | null
          created_at?: string
          employee_id?: string | null
          employee_license_id?: string | null
          extracted_certificate_number?: string | null
          extracted_employee_name?: string | null
          extracted_expiry_date?: string | null
          extracted_issue_date?: string | null
          extracted_issuer?: string | null
          extracted_license_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          license_id?: string | null
          mime_type?: string | null
          processing_status?: string | null
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_documents_employee_license_id_fkey"
            columns: ["employee_license_id"]
            isOneToOne: false
            referencedRelation: "employee_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_documents_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_exemptions: {
        Row: {
          approval_notes: string | null
          approval_status: string
          approved_at: string | null
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
          rejection_reason: string | null
          requested_by_id: string | null
          requested_by_name: string | null
          revocation_reason: string | null
          revoked_at: string | null
          updated_at: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
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
          rejection_reason?: string | null
          requested_by_id?: string | null
          requested_by_name?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
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
          rejection_reason?: string | null
          requested_by_id?: string | null
          requested_by_name?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
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
      code95_registry_cache: {
        Row: {
          bsn: string
          code95_number: string
          created_at: string | null
          employee_id: string
          id: string
          last_checked: string
          registry_response: Json | null
          status: string
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          bsn: string
          code95_number: string
          created_at?: string | null
          employee_id: string
          id?: string
          last_checked?: string
          registry_response?: Json | null
          status: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          bsn?: string
          code95_number?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          last_checked?: string
          registry_response?: Json | null
          status?: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code95_registry_cache_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          course_id: string
          created_at: string
          credits_awarded: number | null
          directly_grants: boolean | null
          grants_level: number | null
          id: string
          is_required: boolean | null
          license_id: string
          min_score_required: number | null
          notes: string | null
          progression_course: boolean | null
          renewal_eligible: boolean | null
        }
        Insert: {
          course_id: string
          created_at?: string
          credits_awarded?: number | null
          directly_grants?: boolean | null
          grants_level?: number | null
          id?: string
          is_required?: boolean | null
          license_id: string
          min_score_required?: number | null
          notes?: string | null
          progression_course?: boolean | null
          renewal_eligible?: boolean | null
        }
        Update: {
          course_id?: string
          created_at?: string
          credits_awarded?: number | null
          directly_grants?: boolean | null
          grants_level?: number | null
          id?: string
          is_required?: boolean | null
          license_id?: string
          min_score_required?: number | null
          notes?: string | null
          progression_course?: boolean | null
          renewal_eligible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_license_id_fkey"
            columns: ["license_id"]
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
          duration_hours: number | null
          id: string
          location: string | null
          max_participants: number | null
          min_participants: number | null
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
          duration_hours?: number | null
          id?: string
          location?: string | null
          max_participants?: number | null
          min_participants?: number | null
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
          duration_hours?: number | null
          id?: string
          location?: string | null
          max_participants?: number | null
          min_participants?: number | null
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
          requires_approval: boolean | null
          sessions_required: number | null
          title: string
        }
        Insert: {
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
          requires_approval?: boolean | null
          sessions_required?: number | null
          title: string
        }
        Update: {
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
          requires_approval?: boolean | null
          sessions_required?: number | null
          title?: string
        }
        Relationships: []
      }
      employee_availability: {
        Row: {
          availability_type: string
          created_at: string | null
          employee_id: string
          end_date: string | null
          id: string
          impact_level: string | null
          notes: string | null
          reason: string | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          availability_type: string
          created_at?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          impact_level?: string | null
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          availability_type?: string
          created_at?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          impact_level?: string | null
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee_availability_employee_id"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_learning_profiles: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          language_preference: string | null
          learning_style: string | null
          notes: string | null
          performance_level: string | null
          preferred_training_times: Json | null
          previous_training_success_rate: number | null
          special_accommodations: string | null
          training_capacity_per_month: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          language_preference?: string | null
          learning_style?: string | null
          notes?: string | null
          performance_level?: string | null
          preferred_training_times?: Json | null
          previous_training_success_rate?: number | null
          special_accommodations?: string | null
          training_capacity_per_month?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          language_preference?: string | null
          learning_style?: string | null
          notes?: string | null
          performance_level?: string | null
          preferred_training_times?: Json | null
          previous_training_success_rate?: number | null
          special_accommodations?: string | null
          training_capacity_per_month?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee_learning_profiles_employee_id"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
          issuer: string | null
          last_renewal_date: string | null
          level_achieved: number | null
          license_id: string | null
          renewal_due_date: string | null
          status: string | null
        }
        Insert: {
          can_renew_from_level?: number | null
          certificate_number?: string | null
          created_at?: string
          employee_id?: string | null
          exemption_id?: string | null
          expiry_date?: string | null
          id?: string
          is_exempt?: boolean | null
          issue_date?: string | null
          issuer?: string | null
          last_renewal_date?: string | null
          level_achieved?: number | null
          license_id?: string | null
          renewal_due_date?: string | null
          status?: string | null
        }
        Update: {
          can_renew_from_level?: number | null
          certificate_number?: string | null
          created_at?: string
          employee_id?: string | null
          exemption_id?: string | null
          expiry_date?: string | null
          id?: string
          is_exempt?: boolean | null
          issue_date?: string | null
          issuer?: string | null
          last_renewal_date?: string | null
          level_achieved?: number | null
          license_id?: string | null
          renewal_due_date?: string | null
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
            foreignKeyName: "employee_licenses_exemption_id_fkey"
            columns: ["exemption_id"]
            isOneToOne: false
            referencedRelation: "certificate_exemptions"
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
      employee_work_arrangements: {
        Row: {
          contract_type: string | null
          created_at: string | null
          employee_id: string
          id: string
          mobility_limitations: string | null
          notice_period_days: number | null
          primary_work_location: string
          remote_work_percentage: number | null
          travel_restrictions: string | null
          updated_at: string | null
          work_schedule: string | null
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          mobility_limitations?: string | null
          notice_period_days?: number | null
          primary_work_location: string
          remote_work_percentage?: number | null
          travel_restrictions?: string | null
          updated_at?: string | null
          work_schedule?: string | null
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          mobility_limitations?: string | null
          notice_period_days?: number | null
          primary_work_location?: string
          remote_work_percentage?: number | null
          travel_restrictions?: string | null
          updated_at?: string | null
          work_schedule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee_work_arrangements_employee_id"
            columns: ["employee_id"]
            isOneToOne: true
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
        Relationships: [
          {
            foreignKeyName: "licenses_supersedes_license_id_fkey"
            columns: ["supersedes_license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
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
      preliminary_plan_group_employees: {
        Row: {
          added_at: string | null
          certificate_expiry_date: string | null
          current_certificate_id: string | null
          employee_id: string
          employee_type: string
          group_id: string
          id: string
          notes: string | null
          priority_score: number | null
        }
        Insert: {
          added_at?: string | null
          certificate_expiry_date?: string | null
          current_certificate_id?: string | null
          employee_id: string
          employee_type: string
          group_id: string
          id?: string
          notes?: string | null
          priority_score?: number | null
        }
        Update: {
          added_at?: string | null
          certificate_expiry_date?: string | null
          current_certificate_id?: string | null
          employee_id?: string
          employee_type?: string
          group_id?: string
          id?: string
          notes?: string | null
          priority_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "preliminary_plan_group_employees_current_certificate_id_fkey"
            columns: ["current_certificate_id"]
            isOneToOne: false
            referencedRelation: "employee_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plan_group_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plan_group_employees_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plan_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      preliminary_plan_groups: {
        Row: {
          certificate_id: string | null
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          group_type: string
          id: string
          location: string | null
          max_participants: number | null
          metadata: Json | null
          name: string
          notes: string | null
          plan_id: string
          planned_end_date: string | null
          planned_start_date: string | null
          priority: number | null
          provider_id: string | null
          provider_recommendation: string | null
          sessions_required: number | null
          target_completion_date: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          group_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          metadata?: Json | null
          name: string
          notes?: string | null
          plan_id: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: number | null
          provider_id?: string | null
          provider_recommendation?: string | null
          sessions_required?: number | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          group_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          plan_id?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: number | null
          provider_id?: string | null
          provider_recommendation?: string | null
          sessions_required?: number | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_preliminary_plan_groups_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "course_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plan_groups_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plan_groups_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      preliminary_plan_trainings: {
        Row: {
          converted_training_id: string | null
          cost_breakdown: Json | null
          course_id: string | null
          created_at: string | null
          estimated_cost: number | null
          estimated_participants: number | null
          group_id: string | null
          id: string
          max_participants: number | null
          metadata: Json | null
          notes: string | null
          plan_id: string
          priority: number | null
          proposed_date: string | null
          proposed_location: string | null
          proposed_time: string | null
          provider_id: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          converted_training_id?: string | null
          cost_breakdown?: Json | null
          course_id?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          estimated_participants?: number | null
          group_id?: string | null
          id?: string
          max_participants?: number | null
          metadata?: Json | null
          notes?: string | null
          plan_id: string
          priority?: number | null
          proposed_date?: string | null
          proposed_location?: string | null
          proposed_time?: string | null
          provider_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          converted_training_id?: string | null
          cost_breakdown?: Json | null
          course_id?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          estimated_participants?: number | null
          group_id?: string | null
          id?: string
          max_participants?: number | null
          metadata?: Json | null
          notes?: string | null
          plan_id?: string
          priority?: number | null
          proposed_date?: string | null
          proposed_location?: string | null
          proposed_time?: string | null
          provider_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preliminary_plan_trainings_converted_training_id_fkey"
            columns: ["converted_training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plan_trainings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plan_trainings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plan_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plan_trainings_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plan_trainings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "course_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      preliminary_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          finalized_at: string | null
          id: string
          metadata: Json | null
          name: string
          notes: string | null
          parent_plan_id: string | null
          planning_period_end: string
          planning_period_start: string
          status: string
          updated_at: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          finalized_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          notes?: string | null
          parent_plan_id?: string | null
          planning_period_end: string
          planning_period_start: string
          status?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          finalized_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          parent_plan_id?: string | null
          planning_period_end?: string
          planning_period_start?: string
          status?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "preliminary_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preliminary_plans_parent_plan_id_fkey"
            columns: ["parent_plan_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_preferences: {
        Row: {
          booking_lead_time_days: number | null
          cancellation_policy: string | null
          cost_per_participant: number | null
          course_id: string
          created_at: string | null
          distance_from_hub_km: number | null
          id: string
          notes: string | null
          priority_rank: number
          provider_id: string
          quality_rating: number | null
          rescheduling_flexibility_score: number | null
          updated_at: string | null
        }
        Insert: {
          booking_lead_time_days?: number | null
          cancellation_policy?: string | null
          cost_per_participant?: number | null
          course_id: string
          created_at?: string | null
          distance_from_hub_km?: number | null
          id?: string
          notes?: string | null
          priority_rank?: number
          provider_id: string
          quality_rating?: number | null
          rescheduling_flexibility_score?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_lead_time_days?: number | null
          cancellation_policy?: string | null
          cost_per_participant?: number | null
          course_id?: string
          created_at?: string | null
          distance_from_hub_km?: number | null
          id?: string
          notes?: string | null
          priority_rank?: number
          provider_id?: string
          quality_rating?: number | null
          rescheduling_flexibility_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider_preferences_course_id"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_provider_preferences_provider_id"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "course_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_quality_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_date: string
          metric_name: string
          metric_value: number
          notes: string | null
          provider_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_date?: string
          metric_name: string
          metric_value: number
          notes?: string | null
          provider_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_date?: string
          metric_name?: string
          metric_value?: number
          notes?: string | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider_quality_metrics_provider_id"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "course_providers"
            referencedColumns: ["id"]
          },
        ]
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
      sir_registry_cache: {
        Row: {
          bsn: string
          certificate_type: string | null
          created_at: string | null
          employee_id: string
          id: string
          last_checked: string
          registry_response: Json | null
          sir_number: string | null
          status: string
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          bsn: string
          certificate_type?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          last_checked?: string
          registry_response?: Json | null
          sir_number?: string | null
          status: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          bsn?: string
          certificate_type?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          last_checked?: string
          registry_response?: Json | null
          sir_number?: string | null
          status?: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sir_registry_cache_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
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
          preliminary_plan_employee_id: string | null
          registration_date: string
          status: string | null
          training_id: string | null
        }
        Insert: {
          approval_status?: string | null
          code95_eligible?: boolean | null
          employee_id?: string | null
          id?: string
          preliminary_plan_employee_id?: string | null
          registration_date?: string
          status?: string | null
          training_id?: string | null
        }
        Update: {
          approval_status?: string | null
          code95_eligible?: boolean | null
          employee_id?: string | null
          id?: string
          preliminary_plan_employee_id?: string | null
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
            foreignKeyName: "training_participants_preliminary_plan_employee_id_fkey"
            columns: ["preliminary_plan_employee_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plan_group_employees"
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
          min_participants: number | null
          notes: string | null
          organizer_id: string | null
          preliminary_plan_group_id: string | null
          preliminary_plan_id: string | null
          preliminary_plan_training_id: string | null
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
          min_participants?: number | null
          notes?: string | null
          organizer_id?: string | null
          preliminary_plan_group_id?: string | null
          preliminary_plan_id?: string | null
          preliminary_plan_training_id?: string | null
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
          min_participants?: number | null
          notes?: string | null
          organizer_id?: string | null
          preliminary_plan_group_id?: string | null
          preliminary_plan_id?: string | null
          preliminary_plan_training_id?: string | null
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
            foreignKeyName: "trainings_preliminary_plan_group_id_fkey"
            columns: ["preliminary_plan_group_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plan_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainings_preliminary_plan_id_fkey"
            columns: ["preliminary_plan_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainings_preliminary_plan_training_id_fkey"
            columns: ["preliminary_plan_training_id"]
            isOneToOne: false
            referencedRelation: "preliminary_plan_trainings"
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
      work_hubs: {
        Row: {
          address: string
          city: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          postal_code: string
          updated_at: string | null
        }
        Insert: {
          address: string
          city: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          postal_code: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          postal_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_employee_priority_score: {
        Args: { employee_id: string; license_id: string; expiry_date?: string }
        Returns: number
      }
      calculate_provider_base_cost: {
        Args: {
          provider_id: string
          duration_hours?: number
          group_size?: number
          travel_distance_km?: number
        }
        Returns: number
      }
      calculate_provider_distance: {
        Args: { provider_id: string; target_lat: number; target_lng: number }
        Returns: number
      }
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
      employee_needs_certificate: {
        Args: { employee_id_param: string; license_id_param: string }
        Returns: boolean
      }
      get_certificate_expiry_analysis_for_period: {
        Args:
          | {
              planning_start_date: string
              planning_end_date: string
              filter_license_id?: string
              department_filter?: string
            }
          | { start_date_param: string; end_date_param: string }
        Returns: {
          employee_id: string
          employee_name: string
          employee_work_location: string
          certificate_name: string
          certificate_category: string
          expiry_date: string
          days_until_expiry: number
          renewal_notice_months: number
          status: string
          requires_renewal: boolean
        }[]
      }
      get_certificate_hierarchy: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          hierarchy_order: number
          is_base_level: boolean
          supersedes_license_id: string
          supersedes_name: string
          prerequisites_count: number
        }[]
      }
      get_certificate_progression_paths: {
        Args: { license_id_param: string }
        Returns: {
          from_certificate_id: string
          from_certificate_name: string
          to_certificate_id: string
          to_certificate_name: string
          available_courses_count: number
        }[]
      }
      get_employee_effective_certificates: {
        Args: { employee_id_param: string }
        Returns: {
          license_id: string
          license_name: string
          category: string
          status: string
          expiry_date: string
          superseded_by_id: string
          superseded_by_name: string
          is_effective: boolean
        }[]
      }
      get_plan_progress_stats: {
        Args: { plan_id: string }
        Returns: {
          total_groups: number
          total_employees: number
          total_proposed_trainings: number
          total_confirmed_trainings: number
          total_converted_trainings: number
          completion_percentage: number
          employees_with_trainings: number
          employees_without_trainings: number
          estimated_total_cost: number
          actual_total_cost: number
        }[]
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
      has_active_exemption: {
        Args: {
          p_employee_id: string
          p_license_id: string
          p_check_date?: string
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      sync_preliminary_plan_training: {
        Args: {
          training_id: string
          preliminary_plan_id?: string
          preliminary_plan_group_id?: string
          preliminary_plan_training_id?: string
        }
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