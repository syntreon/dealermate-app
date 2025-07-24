import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { CallLog } from '@/integrations/supabase/call-logs-service';
import { toast } from 'sonner';

interface CallTranscriptTabProps {
  call: CallLog | null;
}

export const CallTranscriptTab: React.FC<CallTranscriptTabProps> = ({ call }) => {
  // Copy transcript to clipboard
  const copyTranscript = () => {
    if (!call?.transcript) return;
    
    navigator.clipboard.writeText(call.transcript)
      .then(() => toast.success('Transcript copied to clipboard'))
      .catch(() => toast.error('Failed to copy transcript'));
  };

  // Download transcript as text file
  const downloadTranscript = () => {
    if (!call?.transcript) return;
    
    const element = document.createElement('a');
    const file = new Blob([call.transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcript_${call.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <ScrollArea className="h-full pr-4">
      {call?.transcript ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Call Transcript</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyTranscript}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTranscript}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border p-4 bg-muted/50">
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {call.transcript}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No transcript available for this call</p>
        </div>
      )}
    </ScrollArea>
  );
};