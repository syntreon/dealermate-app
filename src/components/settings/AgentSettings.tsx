import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { InfoIcon, AlertTriangle, Bot, ListChecks, MessageSquare, Building2, Target, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Type guard to check if the fetched data conforms to AgentConfig
const isAgentConfig = (config: any): config is AgentConfig => {
  return (
    config &&
    typeof config === 'object' &&
    (!config.lead_capture_config || typeof config.lead_capture_config === 'object') &&
    (!config.conversation_quality_config || typeof config.conversation_quality_config === 'object')
  );
};

interface AgentSettingsProps {
  clientId: string | null;
}

interface AgentConfig {
  lead_capture_config?: {
    required_fields?: string;
  };
  conversation_quality_config?: {
    client_name?: string;
    persona_name?: string;
    persona_speech_style?: string;
    client_business_context?: string;
    primary_call_objectives?: string;
    persona_identity_and_personality?: string;
  };
}

// Define Zod schema for form validation
const agentSettingsSchema = z.object({
  lead_capture_config: z.object({
    required_fields: z.string().optional(),
  }).optional(),
  conversation_quality_config: z.object({
    client_name: z.string().optional(),
    persona_name: z.string().optional(),
    persona_speech_style: z.string().optional(),
    client_business_context: z.string().optional(),
    primary_call_objectives: z.string().optional(),
    persona_identity_and_personality: z.string().optional(),
  }).optional(),
});

type AgentSettingsFormValues = z.infer<typeof agentSettingsSchema>;

export const AgentSettings: React.FC<AgentSettingsProps> = ({ clientId }) => {
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [agentStatus, setAgentStatus] = useState<'online' | 'offline' | 'busy'>('offline');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<AgentSettingsFormValues>({
    resolver: zodResolver(agentSettingsSchema),
    defaultValues: agentConfig || {},
  });

  // Reset form when agentConfig changes
  useEffect(() => {
    if (agentConfig) {
      form.reset(agentConfig);
    }
  }, [agentConfig, form]);

  const onSubmit = async (values: AgentSettingsFormValues) => {
    if (!clientId) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ config_json: values })
        .eq('id', clientId);

      if (error) throw error;

      setAgentConfig(values as AgentConfig);
      setIsEditing(false);
      toast.success('Agent settings updated successfully!');
    } catch (err) {
      console.error('Error updating agent settings:', err);
      toast.error('Failed to update agent settings.');
    }
  };

  // Fetch agent configuration
  useEffect(() => {
    const fetchAgentConfig = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('clients')
          .select('config_json')
          .eq('id', clientId)
          .single();
        
        if (error) {
          throw error;
        }
        
        const configData = data?.config_json;
        if (isAgentConfig(configData)) {
          setAgentConfig(configData);
        } else {
          // Set to a default/empty state or handle as an error
          setAgentConfig({});
          console.warn('Fetched agent configuration does not match the expected structure.');
        }
        
        // For demo purposes, set a random agent status
        // In a real app, this would come from the agent status API or context
        const statuses = ['online', 'offline', 'busy'] as const;
        setAgentStatus(statuses[Math.floor(Math.random() * statuses.length)]);
      } catch (err) {
        console.error('Error fetching agent configuration:', err);
        setError('Failed to load agent configuration. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentConfig();
  }, [clientId]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
        <div className="border-b border-border bg-muted/50 p-4">
          <Skeleton className="h-8 w-64 bg-muted" />
          <Skeleton className="h-4 w-48 bg-muted mt-2" />
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full bg-muted rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full bg-muted rounded-lg" />
              <Skeleton className="h-16 w-full bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
        <div className="border-b border-border bg-muted/50 p-4">
          <h2 className="text-lg font-medium text-card-foreground">Agent Settings</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center p-6 text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Render when no client is associated
  if (!clientId || !agentConfig) {
    return (
      <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
        <div className="border-b border-border bg-muted/50 p-4">
          <h2 className="text-lg font-medium text-card-foreground">Agent Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Agent configuration and status</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center p-8 text-muted-foreground flex-col bg-muted/50 rounded-lg border border-border/50">
            <InfoIcon className="h-12 w-12 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-card-foreground">No Agent Configuration</h3>
            <p className="text-center text-muted-foreground">
              No agent configuration is available. This may be because you're not associated with a business or the agent hasn't been configured.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to format text for display
  const formatText = (text: string | undefined) => {
    if (!text) return 'Not configured';
    return text;
  };

  // Render agent configuration
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
      <div className="border-b border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-card-foreground">Agent Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Agent configuration and status</p>
          </div>
          <div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
            ) : (
              <div className="flex gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  form.reset(agentConfig || {});
                }}>Cancel</Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Agent Status */}
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-card-foreground">Agent Status</h3>
              <p className="text-sm text-muted-foreground">Current status of your virtual agent</p>
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${
              agentStatus === 'online' ? 'bg-emerald-500' : 
              agentStatus === 'busy' ? 'bg-amber-500' : 
              'bg-destructive'
            }`}></div>
            <span className="text-sm font-medium text-card-foreground">
              {agentStatus === 'online' ? 'Online and ready to handle calls' : 
               agentStatus === 'busy' ? 'Busy handling calls' : 
               'Offline - not accepting calls'}
            </span>
          </div>
        </div>

        {/* Lead Capture Configuration */}
        {agentConfig.lead_capture_config && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-muted p-2 rounded-md">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-card-foreground">Lead Capture Requirements</h3>
                <p className="text-sm text-muted-foreground">Fields the agent will attempt to collect</p>
              </div>
            </div>
            <div className="mt-3">
              {isEditing ? (
                <FormField
                  control={form.control}
                  name="lead_capture_config.required_fields"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Fields</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="e.g., name, email, phone_number" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="text-sm text-card-foreground whitespace-pre-wrap">
                  {formatText(agentConfig.lead_capture_config.required_fields)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Conversation Quality Configuration */}
        {agentConfig.conversation_quality_config && (
          <div className="space-y-4 mt-4">
            <h3 className="text-sm font-medium text-card-foreground">Conversation Configuration</h3>
            
            {/* Persona Name */}
            {agentConfig.conversation_quality_config.persona_name && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-muted p-1.5 rounded-md">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Persona Name</p>
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="conversation_quality_config.persona_name"
                    render={({ field }) => (
                      <FormItem className="pl-10">
                        <FormControl>
                          <Input {...field} placeholder="Enter persona name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="text-sm text-card-foreground pl-10">
                    {formatText(agentConfig.conversation_quality_config.persona_name)}
                  </p>
                )}
              </div>
            )}
            
            {/* Speech Style */}
            {agentConfig.conversation_quality_config.persona_speech_style && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-muted p-1.5 rounded-md">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Speech Style</p>
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="conversation_quality_config.persona_speech_style"
                    render={({ field }) => (
                      <FormItem className="pl-10">
                        <FormControl>
                          <Textarea {...field} placeholder="Describe the speech style" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="text-sm text-card-foreground pl-10 whitespace-pre-wrap">
                    {formatText(agentConfig.conversation_quality_config.persona_speech_style)}
                  </p>
                )}
              </div>
            )}
            
            {/* Business Context */}
            {agentConfig.conversation_quality_config.client_business_context && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-muted p-1.5 rounded-md">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Business Context</p>
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="conversation_quality_config.client_business_context"
                    render={({ field }) => (
                      <FormItem className="pl-10">
                        <FormControl>
                          <Textarea {...field} placeholder="Describe the business context" rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="text-sm text-card-foreground pl-10 whitespace-pre-wrap">
                    {formatText(agentConfig.conversation_quality_config.client_business_context)}
                  </p>
                )}
              </div>
            )}
            
            {/* Call Objectives */}
            {agentConfig.conversation_quality_config.primary_call_objectives && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-muted p-1.5 rounded-md">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Call Objectives</p>
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="conversation_quality_config.primary_call_objectives"
                    render={({ field }) => (
                      <FormItem className="pl-10">
                        <FormControl>
                          <Textarea {...field} placeholder="List the primary call objectives" rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="text-sm text-card-foreground pl-10 whitespace-pre-wrap">
                    {formatText(agentConfig.conversation_quality_config.primary_call_objectives)}
                  </p>
                )}
              </div>
            )}
            
            {/* Persona Identity */}
            {agentConfig.conversation_quality_config.persona_identity_and_personality && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-muted p-1.5 rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Persona Identity & Personality</p>
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="conversation_quality_config.persona_identity_and_personality"
                    render={({ field }) => (
                      <FormItem className="pl-10">
                        <FormControl>
                          <Textarea {...field} placeholder="Describe the persona's identity and personality" rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="text-sm text-card-foreground pl-10 whitespace-pre-wrap">
                    {formatText(agentConfig.conversation_quality_config.persona_identity_and_personality)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Message when no configuration is available */}
        {(!agentConfig.lead_capture_config && !agentConfig.conversation_quality_config) && (
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 text-sm">
            <div className="flex items-start">
              <InfoIcon className="h-5 w-5 text-warning mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-warning-foreground mb-1">No Agent Configuration</p>
                <p className="text-warning-foreground/80">
                  The agent has not been configured yet. Please contact your administrator to set up the agent configuration.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  </Form>
  );
};
