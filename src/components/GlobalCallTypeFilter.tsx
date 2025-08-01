import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { CallType } from '@/context/CallTypeContext';

/**
 * GlobalCallTypeFilter component for the TopBar
 * Allows admin users to filter calls by type: All Calls, Live Calls, Test Calls
 * Future-proof for rollout to other roles
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
  // Only admin users can see this filter for now
  const canView = useMemo(() => canViewSensitiveInfo(user), [user]);
  if (!canView) return null;
  return (
    <div className="hidden md:block min-w-[120px]">
      <Select value={selectedCallType} onValueChange={onCallTypeChange}>
        <SelectTrigger className="w-full h-8 text-sm bg-background border-border focus:ring-0 focus:border-primary hover:bg-muted">
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
    </div>
  );
};

export default GlobalCallTypeFilter;
