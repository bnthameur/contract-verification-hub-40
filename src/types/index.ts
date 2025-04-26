
export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  code: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export enum VerificationLevel {
  SIMPLE = 'simple',
  DEEP = 'deep',
  FORMAL = 'formal'
}

export enum VerificationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  AWAITING_CONFIRMATION ='awaiting_confirmation'
}

export interface VerificationResult {
  id: string;
  project_id: string;
  level: string;
  status: string;
  results: any; // or a more specific type if you have one
  logs?: string[];
  created_at: string;
  completed_at?: string;


  // Add the missing properties from your database schema
  specs_draft?: string;
  structured_results?: any;
  phases?: any;
  error_message?: string;
  specs_used?: string;
  options?: any;
  priority_focus?: string;
}

export interface VerificationIssue {
  id: string;
  file: string;
  line: number;
  type: 'error' | 'warning' | 'info';
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  // Keep existing optional fields if still relevant
  code?: string;
  function_name?: string;
  contract_name?: string;
  suggested_fix?: string;
}

export interface StructuredVerificationIssue {
  error_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  line_number?: number;
  column_number?: number;
  function_name?: string;
  contract_name?: string;
  suggested_fix?: string;
  code_snippet?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DatabaseSchema {
  users: User[];
  projects: Project[];
  verification_results: VerificationResult[];
}
