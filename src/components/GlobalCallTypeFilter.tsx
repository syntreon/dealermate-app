import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { CallType } from '@/context/CallTypeContext';

/**
 * GlobalCallTypeFilter component for the TopBar
 * Allows admin/owner/client_admin users to filter calls by type: All Calls, Live Calls, Test Calls
 * For client_user, displays "Live Calls" as a non-interactive UI element
 */
const CALL_TYPE_OPTIONS = [
  { value: 'all', label: 'All Calls' },
  { value: 'live', label: 'Live Calls' },
  { value: 'test', label: 'Test Calls' },
];

interface GlobalCallTypeFilterProps {
  selectedCallType: CallType;
  onCallTypeChange: (type: CallType) => void;
}

const GlobalCallTypeFilter: React.FC<GlobalCallTypeFilterProps> = ({ selectedCallType, onCallTypeChange }) => {
  const { user } = useAuth();
  
  // Check if user is admin/owner (can view sensitive info)
  const isAdmin = useMemo(() => canViewSensitiveInfo(user), [user]);
  
  // Check if user is client_admin
  const isClientAdmin = useMemo(() => {
    return user?.role === 'client_admin';
  }, [user]);
  
  // Determine if user can interact with the filter (admin/owner/client_admin)
  const canInteract = isAdmin || isClientAdmin;
  
  // Show component for all roles, but with different functionality
  return (
    <div className="hidden md:block min-w-[120px]">
      {canInteract ? (
        // Interactive selector for admin/owner/client_admin
        <Select value={selectedCallType} onValueChange={onCallTypeChange}>
          <SelectTrigger className="justify-between hover:bg-muted h-8">
            <SelectValue placeholder="Call Type" />
          </SelectTrigger>
          <SelectContent>
            {CALL_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        // Non-interactive display for client_user (always shows "Live Calls")
        <div className="w-[90px] hidden md:flex items-center px-4 h-8 text-xs bg-background border border-border rounded-sm">
          <span className="text-card-foreground">Live Calls</span>
        </div>
      )}
    </div>
  );
};

export default GlobalCallTypeFilter;
