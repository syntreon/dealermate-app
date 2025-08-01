import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Phone, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const getCallTypeBadge = (callType: string | null) => {
  const safeCallType = callType?.toLowerCase() ?? 'unknown';

  const typeStyles: Record<string, string> = {
    inbound: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    outbound: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    missed: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    voicemail: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    unknown: 'bg-muted text-muted-foreground border-border',
  };

  const displayText = safeCallType.charAt(0).toUpperCase() + safeCallType.slice(1);

  return (
    <Badge
      variant="outline"
      className={cn(
        'px-3 py-1 text-xs font-medium flex items-center gap-1.5',
        typeStyles[safeCallType]
      )}
    >
      <Phone className="h-3.5 w-3.5" />
      {displayText}
    </Badge>
  );
};

export const getCallerInitials = (name: string | null) => {
  if (!name) return 'UN';
  
  const nameParts = name.split(' ');
  if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
  
  return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
};

export const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Returns a badge indicating that a call is a test call
 * Uses destructive (red) color with white text for high visibility
 */
export const getTestCallBadge = () => {
  return (
    <Badge
      variant="outline"
      className={cn(
        'px-3 py-1 text-xs font-medium flex items-center gap-1.5',
        'bg-destructive text-destructive-foreground border-destructive/20'
      )}
    >
      <AlertCircle className="h-3.5 w-3.5" />
      Test Call
    </Badge>
  );
};