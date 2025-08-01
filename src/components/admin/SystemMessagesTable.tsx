import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Calendar,
  Building2,
  Globe,
  User
} from 'lucide-react';
import { EnhancedSystemMessage } from '@/services/systemStatusService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SystemMessagesTableProps {
  // Data
  messages: EnhancedSystemMessage[];
  totalCount: number;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
  // State
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  onRefresh: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRowClick: (message: EnhancedSystemMessage) => void;
  
  // Optional props
  className?: string;
}

/**
 * Enterprise-grade system messages table component
 * 
 * Features:
 * - Fully responsive design (mobile, tablet, desktop)
 * - Theme-aware styling with CSS variables
 * - Accessible keyboard navigation
 * - Loading and error states
 * - Pagination controls
 * - Manual refresh capability
 * - Clickable rows with hover/focus states
 */
const SystemMessagesTable: React.FC<SystemMessagesTableProps> = ({
  messages,
  totalCount,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  isLoading,
  error,
  onRefresh,
  onNextPage,
  onPrevPage,
  onRowClick,
  className
}) => {
  
  // Get badge variant and color for message type
  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'error':
        return { variant: 'destructive' as const, icon: '🚨' };
      case 'warning':
        return { variant: 'secondary' as const, icon: '⚠️' };
      case 'success':
        return { variant: 'default' as const, icon: '✅' };
      case 'info':
      default:
        return { variant: 'outline' as const, icon: 'ℹ️' };
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  // Truncate long messages for table display
  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength 
      ? `${message.substring(0, maxLength)}...` 
      : message;
  };

  return (
    <Card className={cn("bg-card text-card-foreground border-border", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-card-foreground">
            Active System Messages
          </CardTitle>
          <Badge variant="secondary" className="ml-2">
            {totalCount}
          </Badge>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Error State */}
        {error && (
          <div className="p-6 text-center">
            <div className="text-destructive text-sm">
              Error loading messages: {error.message}
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
              Try Again
            </Button>
          </div>
        )}
        
        {/* Empty State */}
        {!error && !isLoading && messages.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No active messages</h3>
            <p className="text-sm">There are currently no system messages to display.</p>
          </div>
        )}
        
        {/* Desktop Table View */}
        {!error && messages.length > 0 && (
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[140px]">Published</TableHead>
                  <TableHead className="w-[140px]">Expires</TableHead>
                  <TableHead className="w-[120px]">Publisher</TableHead>
                  <TableHead className="w-[120px]">Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => {
                  const typeBadge = getMessageTypeBadge(message.type);
                  
                  return (
                    <TableRow
                      key={message.id}
                      className={cn(
                        "border-border cursor-pointer transition-colors",
                        "hover:bg-muted/50 focus:bg-muted/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                      onClick={() => onRowClick(message)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(message);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View details for ${message.type} message: ${truncateMessage(message.message, 30)}`}
                    >
                      <TableCell>
                        <Badge variant={typeBadge.variant} className="capitalize">
                          <span className="mr-1">{typeBadge.icon}</span>
                          {message.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {truncateMessage(message.message)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(message.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {message.expiresAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(message.expiresAt)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {message.publisher?.name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          {message.client ? (
                            <>
                              <Building2 className="h-3 w-3" />
                              {message.client.name}
                            </>
                          ) : (
                            <>
                              <Globe className="h-3 w-3" />
                              All Clients
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Mobile Card View */}
        {!error && messages.length > 0 && (
          <div className="md:hidden space-y-3 p-4">
            {messages.map((message) => {
              const typeBadge = getMessageTypeBadge(message.type);
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "p-4 rounded-lg border border-border bg-card cursor-pointer transition-colors",
                    "hover:bg-muted/50 focus:bg-muted/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                  onClick={() => onRowClick(message)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(message);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${message.type} message`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={typeBadge.variant} className="capitalize">
                      <span className="mr-1">{typeBadge.icon}</span>
                      {message.type}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {message.client ? (
                        <>
                          <Building2 className="h-3 w-3" />
                          {message.client.name}
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3" />
                          All
                        </>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-card-foreground mb-3 line-clamp-2">
                    {message.message}
                  </p>
                  
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Published: {formatDate(message.timestamp)}</span>
                    </div>
                    {message.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Expires: {formatDate(message.expiresAt)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>By: {message.publisher?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination Controls */}
        {!error && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Page {currentPage} of {totalPages}</span>
              <span className="hidden sm:inline">
                ({totalCount} total messages)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevPage}
                disabled={!hasPrevPage || isLoading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onNextPage}
                disabled={!hasNextPage || isLoading}
                className="flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading messages...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemMessagesTable;
