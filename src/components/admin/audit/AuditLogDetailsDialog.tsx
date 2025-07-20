import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Building2, 
  Calendar, 
  Globe, 
  Monitor,
  FileText,
  ArrowRight
} from 'lucide-react';
import { AuditLog } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogDetailsDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuditLogDetailsDialog: React.FC<AuditLogDetailsDialogProps> = ({
  log,
  open,
  onOpenChange,
}) => {
  if (!log) return null;

  const renderValueDiff = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null) => {
    if (!oldValues && !newValues) return null;

    const allKeys = new Set([
      ...(oldValues ? Object.keys(oldValues) : []),
      ...(newValues ? Object.keys(newValues) : [])
    ]);

    return (
      <div className="space-y-3">
        {Array.from(allKeys).map(key => {
          const oldValue = oldValues?.[key];
          const newValue = newValues?.[key];
          
          // Skip if values are the same
          if (oldValue === newValue) return null;

          return (
            <div key={key} className="border rounded-lg p-3">
              <div className="font-medium text-sm mb-2 capitalize">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {oldValue !== undefined && (
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Before:</div>
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-2 text-destructive">
                      {typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : String(oldValue)}
                    </div>
                  </div>
                )}
                
                {oldValue !== undefined && newValue !== undefined && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                
                {newValue !== undefined && (
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">After:</div>
                    <div className="bg-primary/10 border border-primary/20 rounded p-2 text-primary">
                      {typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : String(newValue)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this audit log entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-sm text-muted-foreground">Action</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{log.table_name}</Badge>
                    <span className="text-sm text-muted-foreground">Table</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {log.created_at.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(log.created_at, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {log.record_id && (
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">Record ID</div>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {log.record_id}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">User</div>
                  <div className="font-medium">
                    {log.user?.full_name || 'System User'}
                  </div>
                  {log.user?.email && (
                    <div className="text-sm text-muted-foreground">
                      {log.user.email}
                    </div>
                  )}
                </div>
                
                {log.client && (
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Client
                    </div>
                    <div className="font-medium">{log.client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.client.type} • {log.client.subscription_plan}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          {(log.ip_address || log.user_agent) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {log.ip_address && (
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      IP Address
                    </div>
                    <div className="font-mono text-sm">{log.ip_address}</div>
                  </div>
                )}
                
                {log.user_agent && (
                  <div>
                    <div className="text-sm text-muted-foreground">User Agent</div>
                    <div className="text-sm bg-muted p-2 rounded break-all">
                      {log.user_agent}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Data Changes */}
          {(log.old_values || log.new_values) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Changes</CardTitle>
                <CardDescription>
                  Changes made to the record during this action
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderValueDiff(log.old_values, log.new_values)}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {log.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm bg-muted p-3 rounded">
                  {log.summary}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Data (for debugging) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Raw Data</CardTitle>
              <CardDescription>
                Complete audit log entry for debugging purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {JSON.stringify(log, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};