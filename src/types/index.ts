
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
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DatabaseSchema {
  users: User[];
  projects: Project[];
  verification_results: VerificationResult[];
}
