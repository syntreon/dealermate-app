import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Edit, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { SystemMessage } from '@/types/admin';
import { useRealtimeSystemMessages } from '@/hooks/useRealtimeSystemMessages';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SystemMessageManagerProps {
  clientId?: string | null;
  onMessagesChange?: (messages: SystemMessage[]) => void;
}

const SystemMessageManager: React.FC<SystemMessageManagerProps> = ({
  clientId,
  onMessagesChange
}) => {
  const {
    messages,
    isLoading,
    error,
    connectionStatus,
    createMessage,
    updateMessage,
    deleteMessage,
    refresh,
    isUpdating,
    activeMessages,
    expiredMessages
  } = useRealtimeSystemMessages({
    clientId,
    enableNotifications: true,
    onMessagesChange,
    autoCleanupExpired: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    message: '',
    expiresAt: ''
  });

  const getConnectionIcon = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-emerald-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="h-4 w-4 text-destructive" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.expiresAt && new Date(formData.expiresAt) < new Date()) {
      toast.error('Expiration date cannot be in the past.');
      return;
    }
    
    try {
      const messageData = {
        client_id: clientId,
        type: formData.type,
        message: formData.message,
        expires_at: formData.expiresAt ? new Date(formData.expiresAt) : undefined
      };

      if (editingId) {
        await updateMessage(editingId, messageData);
        setEditingId(null);
      } else {
        await createMessage(messageData);
      }

      setFormData({ type: 'info', message: '', expiresAt: '' });
      setIsCreating(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEdit = (message: SystemMessage) => {
    setFormData({
      type: message.type,
      message: message.message,
      expiresAt: message.expires_at ? message.expires_at.toISOString().slice(0, 16) : ''
    });
    setEditingId(message.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this system message?')) {
      try {
        await deleteMessage(id);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">System Messages</h2>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const getTypeColor = (type: 'info' | 'warning' | 'error' | 'success') => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Messages</h2>
        <div className="flex items-center gap-2">
          {getConnectionIcon()}
          <span className="text-sm text-muted-foreground">
            {connectionStatus.status === 'connected' ? 'Live' : 'Offline'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating || isUpdating}>
            <Plus className="h-4 w-4 mr-2" />
            Add Message
          </Button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {connectionStatus.status === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connection error: {connectionStatus.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Message Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeMessages.length}</div>
            <p className="text-xs text-muted-foreground">Active Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{expiredMessages.length}</div>
            <p className="text-xs text-muted-foreground">Expired Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">Total Messages</p>
          </CardContent>
        </Card>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Create'} System Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Message Type</Label>
                <Select value={formData.type} onValueChange={(value: 'info' | 'warning' | 'error' | 'success') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter system message..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingId ? 'Update' : 'Create'} Message
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setFormData({ type: 'info', message: '', expiresAt: '' });
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTypeColor(message.type)}>
                      {message.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {message.timestamp.toLocaleString()}
                    </span>
                    {message.expires_at && (
                      <span className={cn(
                        "text-sm",
                        message.isExpired ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {message.isExpired ? 'Expired:' : 'Expires:'} {message.expires_at.toLocaleString()}
                      </span>
                    )}
                    {message.isGlobal && (
                      <Badge variant="outline" className="text-xs">
                        Global
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    "mt-2",
                    message.isExpired ? "text-muted-foreground line-through" : ""
                  )}>
                    {message.message}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(message)}
                    disabled={isUpdating}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(message.id)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SystemMessageManager;