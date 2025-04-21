
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
  MEDIUM = 'medium',
  ADVANCED = 'advanced'
}

export enum VerificationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface VerificationResult {
  id: string;
  project_id: string;
  level: VerificationLevel;
  status: VerificationStatus;
  results: VerificationIssue[];
  logs: string[];
  created_at: string;
  completed_at?: string;
  structured_results?: StructuredVerificationIssue[];
  logic_text?: string;
  cvl_code?: string;
}

export interface VerificationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    line: number;
    column: number;
  };
  code?: string;
  severity: 'high' | 'medium' | 'low';
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
