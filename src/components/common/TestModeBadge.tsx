import React from 'react';
import { Circle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

/**
 * Badge for indicating Test Mode (only visible if test mode is enabled)
 */
// Minimal, clickable badge that navigates to business settings on click
const TestModeBadge: React.FC = () => {
  const navigate = useNavigate();
  // Handler for navigation
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Go to business settings (update route if needed)
    navigate('/settings', { state: { openBusinessTab: true } });
  };
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium',
              'text-white bg-destructive/10 border-destructive/20',
              'transition hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-destructive/40 outline-none'
            )}
            aria-label="Test Mode Enabled (Go to Business Settings)"
            role="button"
            tabIndex={0}
            onClick={handleClick}
          >
            <Circle className="h-3 w-3 mr-1 text-destructive" />
            Test Mode
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>Test Mode is enabled for this business. Click to manage business settings.</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TestModeBadge;
