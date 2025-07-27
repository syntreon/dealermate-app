import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasSystemWideAccess } from '@/utils/clientDataIsolation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requireSystemAccess?: boolean;
}

/**
 * ProtectedAdminRoute component protects admin routes based on user permissions
 * - If requireSystemAccess is true, only system admins can access
 * - Otherwise, both system admins and client admins can access
 */
const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ 
  children, 
  requireSystemAccess = false 
}) => {
  const { user } = useAuth();
  
  // Check if user has system-wide access
  const hasSystemAccess = hasSystemWideAccess(user);
  
  // If system access is required and user doesn't have it
  if (requireSystemAccess && !hasSystemAccess) {
    // For client_admin users, redirect to their accessible page
    if (user?.role === 'client_admin') {
      return <Navigate to="/admin/users" replace />;
    }
    
    // For other users without access, show access denied
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>System Admin Access Required</AlertTitle>
            <AlertDescription className="mt-2">
              This page is only accessible to system administrators (owner, admin, or internal staff).
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="w-full mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default ProtectedAdminRoute;