import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasSystemWideAccess } from '@/utils/clientDataIsolation';

/**
 * AdminIndex component handles routing logic for the admin panel root
 * - System admins (owner/admin/user) are directed to the Admin Dashboard
 * - Client admins are directed to User Management (their only accessible page)
 */
const AdminIndex: React.FC = () => {
    const { user } = useAuth();

    // Check if user has system-wide access
    const hasSystemAccess = hasSystemWideAccess(user);

    if (hasSystemAccess) {
        // System admins go to the main admin dashboard
        return <Navigate to="/admin/dashboard" replace />;
    } else {
        // Client admins go directly to user management
        return <Navigate to="/admin/users" replace />;
    }
};

export default AdminIndex;