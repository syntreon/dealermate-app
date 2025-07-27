import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CustomDialog,
  CustomDialogContent, 
  CustomDialogHeader,
  CustomDialogTitle,
  CustomDialogDescription
} from '@/components/ui/custom-dialog';

/**
 * Test component to demonstrate the fixed dialog animation
 * This shows a simple dialog with no animation glitches
 */
const DialogTest: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Dialog Animation Test</h2>
      
      {/* Test button that opens the dialog */}
      <Button onClick={() => setIsOpen(true)}>
        Open Test Dialog
      </Button>
      
      {/* New CustomDialog implementation */}
      <CustomDialog open={isOpen} onOpenChange={setIsOpen}>
        <CustomDialogContent>
          <CustomDialogHeader>
            <CustomDialogTitle>Test Dialog</CustomDialogTitle>
            <CustomDialogDescription>
              This dialog uses a custom implementation with improved animations.
              The modal should appear smoothly without any positioning glitches.
            </CustomDialogDescription>
          </CustomDialogHeader>
          
          <div className="py-4">
            <p>
              This custom dialog implementation removes the complex animation system
              and replaces it with a simpler centered approach that should work consistently
              across all browsers and devices.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </div>
        </CustomDialogContent>
      </CustomDialog>
    </div>
  );
};

export default DialogTest;
