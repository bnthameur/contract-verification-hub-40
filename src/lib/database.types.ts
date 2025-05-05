
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          code: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          code: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          code?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      verification_results: {
        Row: {
          id: string
          project_id: string
          level: 'simple' | 'medium' | 'advanced'
          status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_confirmation'
          results: Json[]
          logs: string[]
          created_at: string
          completed_at: string | null
          structured_results: Json | null
          spec_draft: string | null
          cvl_code: string | null
          spec_used: string | null
          phase: string | null
          error_message: string | null
          options: Json | null
          priority_focus: string[] | null
        }
        Insert: {
          id?: string
          project_id: string
          level: 'simple' | 'medium' | 'advanced'
          status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_confirmation'
          results?: Json[]
          logs?: string[]
          created_at?: string
          completed_at?: string | null
          structured_results?: Json | null
          spec_draft?: string | null
          cvl_code?: string | null
          spec_used?: string | null
          phase?: string | null
          error_message?: string | null
          options?: Json | null
          priority_focus?: string[] | null
        }
        Update: {
          id?: string
          project_id?: string
          level?: 'simple' | 'medium' | 'advanced'
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_confirmation'
          results?: Json[]
          logs?: string[]
          created_at?: string
          completed_at?: string | null
          structured_results?: Json | null
          spec_draft?: string | null
          cvl_code?: string | null
          spec_used?: string | null
          phase?: string | null
          error_message?: string | null
          options?: Json | null 
          priority_focus?: string[] | null
        }
      }
      verification_issues: {
        Row: {
          id: string
          verification_id: string
          error_type: string
          severity: 'low' | 'medium' | 'high'
          description: string
          line_number: number | null
          column_number: number | null
          function_name: string | null
          contract_name: string | null
          suggested_fix: string | null
          code_snippet: string | null
          created_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          error_type: string
          severity: 'low' | 'medium' | 'high'
          description: string
          line_number?: number | null
          column_number?: number | null
          function_name?: string | null
          contract_name?: string | null
          suggested_fix?: string | null
          code_snippet?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          error_type?: string
          severity?: 'low' | 'medium' | 'high'
          description?: string
          line_number?: number | null
          column_number?: number | null
          function_name?: string | null
          contract_name?: string | null
          suggested_fix?: string | null
          code_snippet?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_user_projects: {
        Args: Record<string, never>
        Returns: Database['public']['Tables']['projects']['Row'][]
      }
      get_project_verification_results: {
        Args: { p_project_id: string }
        Returns: Database['public']['Tables']['verification_results']['Row'][]
      }
      get_verification_issues: {
        Args: { v_result_id: string }
        Returns: Database['public']['Tables']['verification_issues']['Row'][]
      }
    }
  }
}
