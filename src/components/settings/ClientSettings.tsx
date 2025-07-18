import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, AlertTriangle, Building2, Package, Calendar, Users, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientSettingsProps {
  clientId: string | null;
  isAdmin: boolean;
}

interface ClientData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  type: string;
  subscription_plan: string;
  contact_person: string | null;
  contact_email: string | null;
  phone_number: string | null;
  config_json: any;
}

export const ClientSettings: React.FC<ClientSettingsProps> = ({ clientId, isAdmin }) => {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();
        
        if (error) {
          throw error;
        }
        
        setClientData(data as ClientData);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError('Failed to load client settings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <h2 className="text-lg font-medium text-gray-800">Client Settings</h2>
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
  if (!clientId || !clientData) {
    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <h2 className="text-lg font-medium text-gray-800">Client Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Organization-level configuration</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center p-8 text-gray-500 flex-col bg-gray-50 rounded-lg border border-gray-100">
            <InfoIcon className="h-12 w-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2 text-gray-700">No Client Association</h3>
            <p className="text-center text-gray-500">
              You are not associated with any client organization.
              {isAdmin && " As an admin, you have access to all system features."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render client settings for regular users (read-only)
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Client Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Organization-level configuration</p>
          </div>
          <Badge 
            variant="outline" 
            className={`
              ${clientData.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 
                clientData.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                'bg-red-100 text-red-700 border-red-200'}
            `}
          >
            {clientData.status.charAt(0).toUpperCase() + clientData.status.slice(1)}
          </Badge>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Client information */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium text-lg text-gray-800">{clientData.name}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-4">
              {clientData.contact_email && (
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-md">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Contact Email</p>
                    <p className="font-medium text-gray-700">{clientData.contact_email}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-md">
                  <Package className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Type</p>
                  <p className="font-medium text-gray-700">{clientData.type || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-md">
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Subscription</p>
                  <p className="font-medium text-gray-700">{clientData.subscription_plan || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin message for non-admin users */}
        {!isAdmin && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
            <div className="flex items-start">
              <InfoIcon className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-primary mb-1">Admin Access Required</p>
                <p className="text-gray-600">
                  To modify client settings, please contact your administrator. 
                  Only users with admin privileges can change organization-level settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Client configuration */}
        {clientData.config_json && Object.keys(clientData.config_json).length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-700">Client Configuration</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
              {Object.entries(clientData.config_json).map(([key, value]) => (
                <div key={key} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-b-0 border-gray-100">
                  <p className="text-gray-500 text-xs mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p className="font-medium text-gray-700">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
