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
          created_at: string
          description: string | null
          duration_hours: number | null
          has_checklist: boolean | null
          id: string
          max_participants: number | null
          price: number | null
          sessions_required: number | null
          title: string
        }
        Insert: {
          category?: string | null
          checklist_items?: Json | null
          code95_points?: number | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          has_checklist?: boolean | null
          id?: string
          max_participants?: number | null
          price?: number | null
          sessions_required?: number | null
          title: string
        }
        Update: {
          category?: string | null
          checklist_items?: Json | null
          code95_points?: number | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          has_checklist?: boolean | null
          id?: string
          max_participants?: number | null
          price?: number | null
          sessions_required?: number | null
          title?: string
        }
        Relationships: []
      }
      employee_licenses: {
        Row: {
          certificate_number: string | null
          created_at: string
          employee_id: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          license_id: string | null
          status: string | null
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          license_id?: string | null
          status?: string | null
        }
        Update: {
          certificate_number?: string | null
          created_at?: string
          employee_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
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
          department: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_number: string
          hire_date: string | null
          id: string
          job_title: string | null
          manager_id: string | null
          marital_status: string | null
          mobile_phone: string | null
          name: string
          first_name: string | null
          last_name: string | null
          tussenvoegsel: string | null
          roepnaam: string | null
          nationality: string | null
          notes: string | null
          personal_id: string | null
          phone: string | null
          postcode: string | null
          salary: number | null
          status: string | null
          status_end_date: string | null
          status_reason: string | null
          status_start_date: string | null
          updated_at: string
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
          department: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_number: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          marital_status?: string | null
          mobile_phone?: string | null
          name: string
          first_name?: string | null
          last_name?: string | null
          tussenvoegsel?: string | null
          roepnaam?: string | null
          nationality?: string | null
          notes?: string | null
          personal_id?: string | null
          phone?: string | null
          postcode?: string | null
          salary?: number | null
          status?: string | null
          status_end_date?: string | null
          status_reason?: string | null
          status_start_date?: string | null
          updated_at?: string
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
          department?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_number?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          marital_status?: string | null
          mobile_phone?: string | null
          name?: string
          first_name?: string | null
          last_name?: string | null
          tussenvoegsel?: string | null
          roepnaam?: string | null
          nationality?: string | null
          notes?: string | null
          personal_id?: string | null
          phone?: string | null
          postcode?: string | null
          salary?: number | null
          status?: string | null
          status_end_date?: string | null
          status_reason?: string | null
          status_start_date?: string | null
          updated_at?: string
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
        ]
      }
      licenses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          validity_period_months: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          validity_period_months?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          validity_period_months?: number | null
        }
        Relationships: []
      }
      training_participants: {
        Row: {
          approval_status: string | null
          employee_id: string | null
          id: string
          registration_date: string
          status: string | null
          training_id: string | null
        }
        Insert: {
          approval_status?: string | null
          employee_id?: string | null
          id?: string
          registration_date?: string
          status?: string | null
          training_id?: string | null
        }
        Update: {
          approval_status?: string | null
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
