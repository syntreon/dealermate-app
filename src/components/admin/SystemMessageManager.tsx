import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit } from 'lucide-react';
import { SystemMessage } from '@/types/dashboard';
import { toast } from 'sonner';

interface SystemMessageManagerProps {
  messages: SystemMessage[];
  onCreateMessage: (message: Omit<SystemMessage, 'id' | 'timestamp'>) => Promise<void>;
  onUpdateMessage: (id: string, message: Partial<SystemMessage>) => Promise<void>;
  onDeleteMessage: (id: string) => Promise<void>;
}

const SystemMessageManager: React.FC<SystemMessageManagerProps> = ({
  messages,
  onCreateMessage,
  onUpdateMessage,
  onDeleteMessage
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'info' as SystemMessage['type'],
    message: '',
    expiresAt: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const messageData = {
        type: formData.type,
        message: formData.message,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null
      };

      if (editingId) {
        await onUpdateMessage(editingId, messageData);
        setEditingId(null);
        toast.success('System message updated successfully');
      } else {
        await onCreateMessage(messageData);
        toast.success('System message created successfully');
      }

      setFormData({ type: 'info', message: '', expiresAt: '' });
      setIsCreating(false);
    } catch (error) {
      toast.error('Failed to save system message');
    }
  };

  const handleEdit = (message: SystemMessage) => {
    setFormData({
      type: message.type,
      message: message.message,
      expiresAt: message.expiresAt ? message.expiresAt.toISOString().slice(0, 16) : ''
    });
    setEditingId(message.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this system message?')) {
      try {
        await onDeleteMessage(id);
        toast.success('System message deleted successfully');
      } catch (error) {
        toast.error('Failed to delete system message');
      }
    }
  };

  const getTypeColor = (type: SystemMessage['type']) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Messages</h2>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Add Message
        </Button>
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
                <Select value={formData.type} onValueChange={(value: SystemMessage['type']) => 
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
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'} Message
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setFormData({ type: 'info', message: '', expiresAt: '' });
                  }}
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
                    <span className="text-sm text-gray-500">
                      {message.timestamp.toLocaleString()}
                    </span>
                    {message.expiresAt && (
                      <span className="text-sm text-gray-500">
                        Expires: {message.expiresAt.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900">{message.message}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(message)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(message.id)}
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