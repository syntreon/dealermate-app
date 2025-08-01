import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { callLogsService } from '@/integrations/supabase/call-logs-service';
import { toast } from '@/components/ui/use-toast';

interface TestCallCheckboxProps {
  callId: string;
  isTestCall: boolean;
  onStatusChange?: (callId: string, isTestCall: boolean) => void;
  disabled?: boolean;
}

/**
 * TestCallCheckbox component
 * 
 * Displays a checkbox to mark a call as a test call with confirmation dialog
 * Updates the database when changed
 */
const TestCallCheckbox: React.FC<TestCallCheckboxProps> = ({
  callId,
  isTestCall,
  onStatusChange,
  disabled = false
}) => {
  // Local state for checkbox
  const [checked, setChecked] = useState<boolean>(isTestCall);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [pendingValue, setPendingValue] = useState<boolean>(isTestCall);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Handle checkbox change
  const handleCheckboxChange = (newValue: boolean) => {
    // Store the pending value
    setPendingValue(newValue);
    // Open confirmation dialog
    setIsConfirmOpen(true);
  };

  // Handle confirmation
  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      // Update the database
      const result = await callLogsService.updateCallTestStatus(callId, pendingValue);
      
      if (result) {
        // Update local state
        setChecked(pendingValue);
        
        // Notify parent component
        if (onStatusChange) {
          onStatusChange(callId, pendingValue);
        }
        
        // Show success message
        toast({
          title: pendingValue ? "Call marked as test" : "Call marked as live",
          description: "Call status updated successfully",
          variant: "default",
        });
      } else {
        throw new Error("Failed to update call status");
      }
    } catch (error) {
      console.error("Error updating call test status:", error);
      // Show error message
      toast({
        title: "Update failed",
        description: "Failed to update call status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setIsConfirmOpen(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setIsConfirmOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-center">
        <Checkbox
          id={`test-call-${callId}`}
          checked={checked}
          onCheckedChange={handleCheckboxChange}
          disabled={disabled || isUpdating}
          className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          aria-label="Mark as test call"
        />
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingValue ? "Mark as test call?" : "Mark as live call?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValue
                ? "This will mark the call as a test call. Test calls are excluded from live reporting."
                : "This will mark the call as a live call. Live calls are included in all reporting."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TestCallCheckbox;
