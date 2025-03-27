
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
          status: 'pending' | 'running' | 'completed' | 'failed'
          results: Json[]
          logs: string[]
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          level: 'simple' | 'medium' | 'advanced'
          status: 'pending' | 'running' | 'completed' | 'failed'
          results?: Json[]
          logs?: string[]
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          level?: 'simple' | 'medium' | 'advanced'
          status?: 'pending' | 'running' | 'completed' | 'failed'
          results?: Json[]
          logs?: string[]
          created_at?: string
          completed_at?: string | null
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
    }
  }
}
