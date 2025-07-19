
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManualCallForm from '@/components/calls/ManualCallForm';
import DatabaseCalls from '@/components/calls/DatabaseCalls';
import AICallerSettings from '@/components/calls/AICallerSettings';
import { useCallForm } from '@/hooks/useCallForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Phone } from 'lucide-react';

/**
 * Outbound Call page component
 * Shows a feature unavailable message and call form UI
 */
const Call = () => {
  const { 
    formData, 
    date, 
    isLoading, 
    isWebhookLoading,
    setDate, 
    handleInputChange, 
    handleManualSubmit, 
    handleDatabaseCall
  } = useCallForm();
  
  return (
    <div className="space-y-6 pb-8">
      {/* Responsive header layout */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Outbound Call</h1>
          </div>
          <p className="text-muted-foreground">Initiate AI-powered outbound calls</p>
        </div>
      </div>
      
      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-800" />
        <AlertDescription className="text-amber-800">
          Your account doesn't have access to the outbound calling feature. Please contact support to enable this feature.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="bg-background border border-border mb-4">
          <TabsTrigger 
            value="manual" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Manual Call
          </TabsTrigger>
          <TabsTrigger 
            value="database" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Database Calls
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="mt-0">
          <ManualCallForm 
            formData={formData}
            date={date}
            isLoading={isLoading}
            setDate={setDate}
            handleInputChange={handleInputChange}
            handleManualSubmit={handleManualSubmit}
          />
        </TabsContent>
        
        <TabsContent value="database" className="mt-0">
          <DatabaseCalls 
            isLoading={isLoading || isWebhookLoading}
            handleDatabaseCall={handleDatabaseCall}
          />
        </TabsContent>
      </Tabs>
      
      <AICallerSettings />
    </div>
  );
};

export default Call;
