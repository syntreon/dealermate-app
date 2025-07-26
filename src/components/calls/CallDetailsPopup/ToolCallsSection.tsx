import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Code } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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

// Helper function to format arguments (JSONB stored as string)
const formatArguments = (args: any): string => {
  try {
    // Handle case where args is a string that contains escaped JSON
    // Example: "{\"make\": \"Nissan\", \"model\": \"Pathfinder\"}"
    if (typeof args === 'string') {
      // First try to parse it directly
      try {
        const parsed = JSON.parse(args);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // If direct parsing fails, check if it's an escaped JSON string
        if (args.includes('\\"')) {
          try {
            // Try to parse the unescaped string
            const unescaped = args.replace(/\\"/g, '"');
            const parsed = JSON.parse(unescaped);
            return JSON.stringify(parsed, null, 2);
          } catch (e2) {
            // If that fails too, return the original
          }
        }
      }
    } else if (args && typeof args === 'object') {
      // If it's already an object, just stringify it
      return JSON.stringify(args, null, 2);
    }
    
    // If all parsing attempts fail or it's not a string/object, return as is
    return String(args);
  } catch (error) {
    console.error('Error formatting arguments:', error);
    return String(args);
  }
};

// Helper function to format result text with line breaks
const formatResult = (result: string): React.ReactNode => {
  try {
    if (!result) return 'No result';
    
    // If result is a JSON string, try to parse and format it
    if ((result.startsWith('{') && result.endsWith('}')) || 
        (result.startsWith('[') && result.endsWith(']'))) {
      try {
        const parsed = JSON.parse(result);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // If parsing fails, continue with normal formatting
      }
    }
    
    // Handle escaped newlines (\n) in the result string
    if (result.includes('\\n')) {
      // Convert to an array of lines and join with <br/> elements
      const lines = result.split('\\n');
      return (
        <span className="whitespace-pre-wrap">
          {lines.map((line, i) => (
            // Use a span with a key instead of React.Fragment
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    }
    
    // Handle regular newlines (\n) in the result string
    if (result.includes('\n')) {
      // Convert to an array of lines and join with <br/> elements
      const lines = result.split('\n');
      return (
        <span className="whitespace-pre-wrap">
          {lines.map((line, i) => (
            // Use a span with a key instead of React.Fragment
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    }
    
    return result;
  } catch (error) {
    console.error('Error formatting result:', error);
    return String(result);
  }
};

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
            key={`${toolCall.id}_${toolCall.role}`}
            className={`p-3 rounded-lg max-w-[85%] ${
              toolCall.role === 'tool_calls' 
                ? 'bg-muted/50 mr-auto' 
                : 'bg-primary/10 ml-auto'
            }`}
          >
            {toolCall.role === 'tool_calls' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-semibold bg-primary/20">
                    {toolCall.tool_name || 'Unknown Tool'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(toolCall.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-muted/70 rounded-md p-2 mt-1">
                  <div className="flex items-center gap-1 mb-1">
                    <Code className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Arguments</span>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60 font-mono">
                    {toolCall.arguments ? formatArguments(toolCall.arguments) : 'No arguments'}
                  </pre>
                </div>
              </>
            )}
            
            {toolCall.role === 'tool_call_result' && (
              <>
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(toolCall.created_at).toLocaleTimeString()}
                  </span>
                  <Badge variant="outline" className="text-xs font-semibold bg-primary/20">
                    Result
                  </Badge>
                </div>
                <div className="bg-primary/5 rounded-md p-2 mt-1">
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60 font-mono">
                    {toolCall.result ? formatResult(toolCall.result) : 'No result'}
                  </pre>
                </div>
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
