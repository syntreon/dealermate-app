import React, { useState, useEffect } from 'react';
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

export const AgentSettings: React.FC<AgentSettingsProps> = ({ clientId }) => {
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [agentStatus, setAgentStatus] = useState<'online' | 'offline' | 'busy'>('offline');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <Skeleton className="h-8 w-64 bg-gray-200" />
          <Skeleton className="h-4 w-48 bg-gray-200 mt-2" />
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-1 gap-4">
              <Skeleton className="h-16 w-full bg-gray-200 rounded-lg" />
              <Skeleton className="h-16 w-full bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <h2 className="text-lg font-medium text-gray-800">Agent Settings</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center p-6 text-red-500 bg-red-50 rounded-lg border border-red-100">
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
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <h2 className="text-lg font-medium text-gray-800">Agent Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Agent configuration and status</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center p-8 text-gray-500 flex-col bg-gray-50 rounded-lg border border-gray-100">
            <InfoIcon className="h-12 w-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2 text-gray-700">No Agent Configuration</h3>
            <p className="text-center text-gray-500">
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
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Agent Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Agent configuration and status</p>
          </div>
          <Badge 
            variant="outline" 
            className={`
              ${agentStatus === 'online' ? 'bg-green-100 text-green-700 border-green-200' : 
                agentStatus === 'busy' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                'bg-red-100 text-red-700 border-red-200'}
            `}
          >
            {agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
          </Badge>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Agent Status */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Agent Status</h3>
              <p className="text-sm text-gray-500">Current status of your virtual agent</p>
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${
              agentStatus === 'online' ? 'bg-green-500' : 
              agentStatus === 'busy' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              {agentStatus === 'online' ? 'Online and ready to handle calls' : 
               agentStatus === 'busy' ? 'Busy handling calls' : 
               'Offline - not accepting calls'}
            </span>
          </div>
        </div>

        {/* Lead Capture Configuration */}
        {agentConfig.lead_capture_config && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-100 p-2 rounded-md">
                <ListChecks className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Lead Capture Requirements</h3>
                <p className="text-sm text-gray-500">Fields the agent will attempt to collect</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {formatText(agentConfig.lead_capture_config.required_fields)}
              </p>
            </div>
          </div>
        )}

        {/* Conversation Quality Configuration */}
        {agentConfig.conversation_quality_config && (
          <div className="space-y-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700">Conversation Configuration</h3>
            
            {/* Persona Name */}
            {agentConfig.conversation_quality_config.persona_name && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gray-100 p-1.5 rounded-md">
                    <Bot className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm">Persona Name</p>
                </div>
                <p className="text-sm text-gray-700 pl-10">
                  {formatText(agentConfig.conversation_quality_config.persona_name)}
                </p>
              </div>
            )}
            
            {/* Speech Style */}
            {agentConfig.conversation_quality_config.persona_speech_style && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gray-100 p-1.5 rounded-md">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm">Speech Style</p>
                </div>
                <p className="text-sm text-gray-700 pl-10 whitespace-pre-wrap">
                  {formatText(agentConfig.conversation_quality_config.persona_speech_style)}
                </p>
              </div>
            )}
            
            {/* Business Context */}
            {agentConfig.conversation_quality_config.client_business_context && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gray-100 p-1.5 rounded-md">
                    <Building2 className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm">Business Context</p>
                </div>
                <p className="text-sm text-gray-700 pl-10 whitespace-pre-wrap">
                  {formatText(agentConfig.conversation_quality_config.client_business_context)}
                </p>
              </div>
            )}
            
            {/* Call Objectives */}
            {agentConfig.conversation_quality_config.primary_call_objectives && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gray-100 p-1.5 rounded-md">
                    <Target className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm">Call Objectives</p>
                </div>
                <p className="text-sm text-gray-700 pl-10 whitespace-pre-wrap">
                  {formatText(agentConfig.conversation_quality_config.primary_call_objectives)}
                </p>
              </div>
            )}
            
            {/* Persona Identity */}
            {agentConfig.conversation_quality_config.persona_identity_and_personality && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gray-100 p-1.5 rounded-md">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm">Persona Identity & Personality</p>
                </div>
                <p className="text-sm text-gray-700 pl-10 whitespace-pre-wrap">
                  {formatText(agentConfig.conversation_quality_config.persona_identity_and_personality)}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Message when no configuration is available */}
        {(!agentConfig.lead_capture_config && !agentConfig.conversation_quality_config) && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm">
            <div className="flex items-start">
              <InfoIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-700 mb-1">No Agent Configuration</p>
                <p className="text-yellow-600">
                  The agent has not been configured yet. Please contact your administrator to set up the agent configuration.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
