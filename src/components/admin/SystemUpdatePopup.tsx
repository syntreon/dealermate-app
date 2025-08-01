import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Calendar, 
  User, 
  Building2, 
  Globe, 
  Trash2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { EnhancedSystemMessage } from '@/services/systemStatusService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SystemUpdatePopupProps {
  message: EnhancedSystemMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (messageId: string) => Promise<void>;
}

/**
 * Enterprise-grade system message details popup
 * 
 * Features:
 * - Fully responsive design (mobile, tablet, desktop)
 * - Theme-aware styling with CSS variables
 * - Accessible keyboard navigation and screen reader support
 * - Delete confirmation dialog
 * - Loading states for delete operation
 * - Rich message details display
 * - Proper focus management
 */
const SystemUpdatePopup: React.FC<SystemUpdatePopupProps> = ({
  message,
  isOpen,
  onClose,
  onDelete
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete with confirmation and loading state
  const handleDelete = async () => {
    if (!message) return;
    
    try {
      setIsDeleting(true);
      await onDelete(message.id);
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get badge configuration for message type
  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'error':
        return { 
          variant: 'destructive' as const, 
          icon: '🚨',
          bgColor: 'bg-destructive/10',
          textColor: 'text-destructive'
        };
      case 'warning':
        return { 
          variant: 'secondary' as const, 
          icon: '⚠️',
          bgColor: 'bg-warning/10',
          textColor: 'text-warning'
        };
      case 'success':
        return { 
          variant: 'default' as const, 
          icon: '✅',
          bgColor: 'bg-success/10',
          textColor: 'text-success'
        };
      case 'info':
      default:
        return { 
          variant: 'outline' as const, 
          icon: 'ℹ️',
          bgColor: 'bg-info/10',
          textColor: 'text-info'
        };
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM dd, yyyy \'at\' HH:mm');
  };

  // Check if message is expired
  const isExpired = message?.expiresAt && message.expiresAt < new Date();

  if (!message) return null;

  const typeBadge = getMessageTypeBadge(message.type);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <MessageSquare className="h-6 w-6 text-primary" />
                System Message Details
              </DialogTitle>
              
              <div className="flex items-center gap-2">
                <Badge variant={typeBadge.variant} className="capitalize text-sm">
                  <span className="mr-1">{typeBadge.icon}</span>
                  {message.type}
                </Badge>
                
                {isExpired && (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </div>
            </div>
            
            <DialogDescription className="sr-only">
              Details and actions for the system message published on {formatDate(message.timestamp)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Message Content */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-card-foreground">Message</h3>
              <div className={cn(
                "p-4 rounded-lg border",
                typeBadge.bgColor,
                "border-border"
              )}>
                <p className="text-card-foreground leading-relaxed whitespace-pre-wrap">
                  {message.message}
                </p>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Message Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Publishing Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-card-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Publishing Details
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Published On</span>
                    <span className="text-card-foreground font-medium">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Expires On</span>
                    <span className="text-card-foreground font-medium">
                      {message.expiresAt ? formatDate(message.expiresAt) : 'Never'}
                    </span>
                  </div>
                  
                  {message.publisher && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Published By</span>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-card-foreground font-medium">
                            {message.publisher.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {message.publisher.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scope Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-card-foreground flex items-center gap-2">
                  {message.client ? (
                    <Building2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Globe className="h-4 w-4 text-primary" />
                  )}
                  Affected Scope
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Target Audience</span>
                    <div className="flex items-center gap-2">
                      {message.client ? (
                        <>
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-card-foreground font-medium">
                            {message.client.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-card-foreground font-medium">
                            All Clients (Platform-wide)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Message Status</span>
                    <span className="text-card-foreground font-medium">
                      {isExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Details (Collapsible on mobile) */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-card-foreground transition-colors">
                <span className="font-medium">Technical Details</span>
              </summary>
              <div className="mt-3 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground space-y-1">
                <div>Message ID: <code className="bg-muted px-1 rounded">{message.id}</code></div>
                <div>Created: {format(new Date(message.createdAt), 'yyyy-MM-dd HH:mm:ss')}</div>
                <div>Updated: {format(new Date(message.updatedAt), 'yyyy-MM-dd HH:mm:ss')}</div>
                {message.client && (
                  <div>Client ID: <code className="bg-muted px-1 rounded">{message.client.id}</code></div>
                )}
              </div>
            </details>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Close
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4" />
              Delete Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card text-card-foreground border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete System Message
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this system message? This action cannot be undone.
              The message will be immediately removed from all users' views.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-card-foreground font-medium">Message Preview:</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              "{message.message}"
            </p>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-2 flex-1 sm:flex-none"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Message
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SystemUpdatePopup;
