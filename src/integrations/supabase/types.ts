export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          dentist: string | null
          id: string
          notes: string | null
          patient_name: string
          procedure: string | null
          status: string | null
          time: string
          type: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          dentist?: string | null
          id?: string
          notes?: string | null
          patient_name: string
          procedure?: string | null
          status?: string | null
          time: string
          type?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          dentist?: string | null
          id?: string
          notes?: string | null
          patient_name?: string
          procedure?: string | null
          status?: string | null
          time?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          clinic_id: string
          content: string | null
          created_at: string
          date: string
          days: string | null
          deleted_at: string | null
          id: string
          patient_name: string
        }
        Insert: {
          clinic_id: string
          content?: string | null
          created_at?: string
          date: string
          days?: string | null
          deleted_at?: string | null
          id?: string
          patient_name: string
        }
        Update: {
          clinic_id?: string
          content?: string | null
          created_at?: string
          date?: string
          days?: string | null
          deleted_at?: string | null
          id?: string
          patient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: string | null
          clinic_id: string
          clinic_name: string | null
          created_at: string
          email: string | null
          id: string
          jarvis_always_listening: boolean | null
          jarvis_enabled: boolean | null
          jarvis_pitch: number | null
          jarvis_speed: number | null
          jarvis_voice_gender: string | null
          jarvis_volume: number | null
          phone: string | null
          professional_name: string | null
          registration_number: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_id: string
          clinic_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jarvis_always_listening?: boolean | null
          jarvis_enabled?: boolean | null
          jarvis_pitch?: number | null
          jarvis_speed?: number | null
          jarvis_voice_gender?: string | null
          jarvis_volume?: number | null
          phone?: string | null
          professional_name?: string | null
          registration_number?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_id?: string
          clinic_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jarvis_always_listening?: boolean | null
          jarvis_enabled?: boolean | null
          jarvis_pitch?: number | null
          jarvis_speed?: number | null
          jarvis_voice_gender?: string | null
          jarvis_volume?: number | null
          phone?: string | null
          professional_name?: string | null
          registration_number?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_records: {
        Row: {
          allergies: string | null
          chief_complaint: string | null
          clinic_id: string
          created_at: string
          current_medications: string | null
          deleted_at: string | null
          dental_history: string | null
          diagnosis: string | null
          extra_oral_exam: string | null
          family_history: string | null
          habits: string | null
          id: string
          intra_oral_exam: string | null
          medical_history: string | null
          patient_id: string
          prognosis: string | null
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          chief_complaint?: string | null
          clinic_id: string
          created_at?: string
          current_medications?: string | null
          deleted_at?: string | null
          dental_history?: string | null
          diagnosis?: string | null
          extra_oral_exam?: string | null
          family_history?: string | null
          habits?: string | null
          id?: string
          intra_oral_exam?: string | null
          medical_history?: string | null
          patient_id: string
          prognosis?: string | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          chief_complaint?: string | null
          clinic_id?: string
          created_at?: string
          current_medications?: string | null
          deleted_at?: string | null
          dental_history?: string | null
          diagnosis?: string | null
          extra_oral_exam?: string | null
          family_history?: string | null
          habits?: string | null
          id?: string
          intra_oral_exam?: string | null
          medical_history?: string | null
          patient_id?: string
          prognosis?: string | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          max_patients: number
          max_storage_mb: number
          name: string
          phone: string | null
          plan: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          max_patients?: number
          max_storage_mb?: number
          name: string
          phone?: string | null
          plan?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          max_patients?: number
          max_storage_mb?: number
          name?: string
          phone?: string | null
          plan?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      evolutions: {
        Row: {
          assessment: string | null
          clinic_id: string
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          objective: string | null
          patient_id: string
          plan: string | null
          procedure: string | null
          professional: string | null
          subjective: string | null
          tooth_number: string | null
        }
        Insert: {
          assessment?: string | null
          clinic_id: string
          created_at?: string
          date: string
          deleted_at?: string | null
          id?: string
          objective?: string | null
          patient_id: string
          plan?: string | null
          procedure?: string | null
          professional?: string | null
          subjective?: string | null
          tooth_number?: string | null
        }
        Update: {
          assessment?: string | null
          clinic_id?: string
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          objective?: string | null
          patient_id?: string
          plan?: string | null
          procedure?: string | null
          professional?: string | null
          subjective?: string | null
          tooth_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolutions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolutions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          id: string
          min_quantity: number
          name: string
          quantity: number
          unit: string | null
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          unit?: string | null
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          clinic_id: string
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograms: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          patient_id: string
          records: Json
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          patient_id: string
          records?: Json
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          records?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontograms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_files: {
        Row: {
          clinic_id: string
          created_at: string
          date: string | null
          description: string | null
          external_url: string | null
          id: string
          name: string
          patient_id: string
          storage_path: string | null
          type: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          name: string
          patient_id: string
          storage_path?: string | null
          type?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          name?: string
          patient_id?: string
          storage_path?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          clinic_id: string
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          clinic_id: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          clinic_id?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          medications: string | null
          patient_name: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          deleted_at?: string | null
          id?: string
          medications?: string | null
          patient_name: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          medications?: string | null
          patient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clinic_id: string
          created_at: string
          full_name: string
          id: string
          phone: string | null
          registration_number: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clinic_id: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          registration_number?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          registration_number?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          clinic_id: string
          created_at: string
          date: string
          description: string
          id: string
          type: string
        }
        Insert: {
          amount?: number
          category?: string | null
          clinic_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          type: string
        }
        Update: {
          amount?: number
          category?: string | null
          clinic_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_documents: { Args: never; Returns: undefined }
      get_platform_stats: { Args: never; Returns: Json }
      get_user_clinic_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "dentist" | "receptionist" | "assistant"
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
    Enums: {
      app_role: ["owner", "admin", "dentist", "receptionist", "assistant"],
    },
  },
} as const
