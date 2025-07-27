import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Phone, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { CallLog } from '@/integrations/supabase/call-logs-service';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo, canViewCallDetails } from '@/utils/clientDataIsolation';
import { convertUsdToCad } from '@/utils/currency';
import { toast } from 'sonner';
import { getCallerInitials } from './utils';
import { ToolCallsSection } from './ToolCallsSection';

interface CallDetailsTabProps {
  call: CallLog | null;
}

export const CallDetailsTab: React.FC<CallDetailsTabProps> = ({ call }) => {
  const { user } = useAuth();

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label.toLowerCase()}`));
  };

  if (!call) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Call details not available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Caller Information */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base">Caller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{getCallerInitials(call.caller_full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{call.caller_full_name || 'Unknown Caller'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {call.caller_phone_number || 'No phone number'}
                    </span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                {canViewSensitiveInfo(user) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Client ID</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{call.client_id || 'N/A'}</span>
                      {call.client_id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5" 
                          onClick={() => copyToClipboard(call.client_id!, 'Client ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">To Phone Number</span>
                  <span className="text-sm font-medium">{call.to_phone_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Assistant ID</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{call.assistant_id || 'N/A'}</span>
                    {call.assistant_id && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5" 
                        onClick={() => copyToClipboard(call.assistant_id!, 'Assistant ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {canViewSensitiveInfo(user) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Call ID</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{call.id || 'N/A'}</span>
                      {call.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5" 
                          onClick={() => copyToClipboard(call.id!, 'Call ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Call Details */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base">Call Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Time</span>
                  <span className="text-sm font-medium">
                    {call.call_start_time ? 
                      format(new Date(call.call_start_time), 'MMM d, yyyy h:mm:ss a') : 
                      'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">End Time</span>
                  <span className="text-sm font-medium">
                    {call.call_end_time ? 
                      format(new Date(call.call_end_time), 'MMM d, yyyy h:mm:ss a') : 
                      'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">
                    {call.call_duration_mins ? 
                      `${call.call_duration_mins} min` : 
                      call.call_duration_seconds ? 
                      `${call.call_duration_seconds} sec` : 
                      'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transfer Flag</span>
                  <span className="text-sm font-medium">
                    {call.transfer_flag ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hangup Reason</span>
                  <span className="text-sm font-medium">
                    {call.hangup_reason || 'N/A'}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              {canViewSensitiveInfo(user) && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Call Cost</span>
                    <span className="text-sm font-medium">
                      ${call.total_call_cost_usd?.toFixed(2) || '0.00'} USD
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Cost (CAD)</span>
                    <span className="text-sm font-medium">
                      ${call.total_cost_cad?.toFixed(2) || 
                        convertUsdToCad(call.total_call_cost_usd).toFixed(2)} CAD
                    </span>
                  </div>
                  
                  {/* Cost Breakdown Accordion */}
                  <div className="mt-2">
                    <details className="group">
                      <summary className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 hover:bg-muted">
                        <span className="text-sm font-medium">View Cost Breakdown</span>
                        <span className="shrink-0 transition-transform group-open:rotate-180">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </span>
                      </summary>
                      <div className="mt-2 space-y-2 px-2">
                        {/* VAPI Costs */}
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">VAPI Call Cost</span>
                          <span className="text-xs font-medium">
                            ${call.vapi_call_cost_usd?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        <div className="flex justify-between pl-4">
                          <span className="text-xs text-muted-foreground">↳ VAPI LLM Cost</span>
                          <span className="text-xs font-medium">
                            ${call.vapi_llm_cost_usd?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        <div className="flex justify-between pl-4">
                          <span className="text-xs text-muted-foreground">↳ TTS Cost</span>
                          <span className="text-xs font-medium">
                            ${call.tts_cost?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        <div className="flex justify-between pl-4">
                          <span className="text-xs text-muted-foreground">↳ STT Cost</span>
                          <span className="text-xs font-medium">
                            ${call.transcriber_cost?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        <div className="flex justify-between pl-4">
                          <span className="text-xs text-muted-foreground">↳ Call Summary Cost</span>
                          <span className="text-xs font-medium">
                            ${call.call_summary_cost?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        
                        {/* Twilio Costs */}
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Twilio Call Cost</span>
                          <span className="text-xs font-medium">
                            ${call.twillio_call_cost_usd?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        
                        {/* AI Costs */}
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">AI Cost</span>
                          <span className="text-xs font-medium">
                            ${call.openai_api_cost_usd?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        
                        {/* SMS Costs */}
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">SMS Cost</span>
                          <span className="text-xs font-medium">
                            ${call.sms_cost_usd?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        
                        {/* Tool Costs */}
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Tool Cost</span>
                          <span className="text-xs font-medium">
                            ${call.tool_cost_usd?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        
                        {/* Total */}
                        <div className="flex justify-between border-t pt-1 mt-1">
                          <span className="text-xs font-medium">Total Cost (USD)</span>
                          <span className="text-xs font-medium">
                            ${call.total_call_cost_usd?.toFixed(4) || '0.0000'} USD
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-medium">Total Cost (CAD)</span>
                          <span className="text-xs font-medium">
                            ${call.total_cost_cad?.toFixed(4) || 
                              convertUsdToCad(call.total_call_cost_usd).toFixed(4)} CAD
                          </span>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Call Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {call.call_summary || 'No summary available for this call.'}
            </p>
          </CardContent>
        </Card>
        {/* Tool Calls - Visible to admin users and client_admin */}
        {canViewCallDetails(user) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tool Calls</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ToolCallsSection callId={call.id} clientId={call.client_id} />
            </CardContent>
          </Card>
        )}

        {/* Model Information - Only visible to admin users */}
        {canViewSensitiveInfo(user) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TTS Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Text-to-Speech</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Provider</span>
                      <span className="text-xs font-medium">{call.voice_provider || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Model</span>
                      <span className="text-xs font-medium">{call.voice_model || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* STT Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Speech-to-Text</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Provider</span>
                      <span className="text-xs font-medium">{call.transcriber_provider || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Model</span>
                      <span className="text-xs font-medium">{call.transcriber_model || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* LLM Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Language Model</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Call LLM Model</span>
                      <span className="text-xs font-medium">{call.call_llm_model || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Input Tokens</span>
                      <span className="text-xs font-medium">{call.openai_api_tokens_input?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Output Tokens</span>
                      <span className="text-xs font-medium">{call.openai_api_tokens_output?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Operations Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Operations</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Make.com Operations</span>
                      <span className="text-xs font-medium">{call.make_com_operations || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
