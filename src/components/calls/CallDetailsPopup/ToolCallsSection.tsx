import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ToolCallsSectionProps {
  callId: string;
  clientId: string | null;
}

interface ToolCall {
  id: string;
  call_id: string;
  client_id: string | null;
  role: 'tool_calls' | 'tool_call_result';
  tool_name: string | null;
  arguments: any | null;
  result: any | null;
  created_at: string;
}

export const ToolCallsSection: React.FC<ToolCallsSectionProps> = ({ callId, clientId }) => {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToolCalls = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tool calls for the specific call ID
        const { data, error } = await supabase
          .from('tool_calls')
          .select('*')
          .eq('call_id', callId)
          .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        
        setToolCalls(data || []);
      } catch (err) {
        console.error('Error fetching tool calls:', err);
        setError('Failed to load tool calls data');
      } finally {
        setLoading(false);
      }
    };

    if (callId) {
      fetchToolCalls();
    }
  }, [callId]);

  // Group tool calls and results together
  const renderToolCallsAndResults = () => {
    if (toolCalls.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No tool calls for this conversation</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {toolCalls.map((toolCall) => (
          <div 
            key={toolCall.id}
            className={`p-3 rounded-lg max-w-[85%] ${
              toolCall.role === 'tool_calls' 
                ? 'bg-muted/50 mr-auto' 
                : 'bg-primary/10 ml-auto'
            }`}
          >
            {toolCall.role === 'tool_calls' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold bg-primary/20 px-2 py-0.5 rounded">
                    {toolCall.tool_name || 'Unknown Tool'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(toolCall.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60 font-mono">
                  {toolCall.arguments ? JSON.stringify(toolCall.arguments, null, 2) : 'No arguments'}
                </pre>
              </>
            )}
            
            {toolCall.role === 'tool_call_result' && (
              <>
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(toolCall.created_at).toLocaleTimeString()}
                  </span>
                  <span className="text-xs font-semibold bg-primary/20 px-2 py-0.5 rounded">
                    Result
                  </span>
                </div>
                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60 font-mono">
                  {toolCall.result ? JSON.stringify(toolCall.result, null, 2) : 'No result'}
                </pre>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2 ml-auto" />
            <Skeleton className="h-20 w-full ml-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {renderToolCallsAndResults()}
      </CardContent>
    </Card>
  );
};
