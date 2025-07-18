/**
 * User types for the application
 */

export type UserRole = 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  client_id: string | null;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  preferences?: Record<string, any>;
  name?: string; // For backward compatibility
}