
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManualCallForm from '@/components/calls/ManualCallForm';
import DatabaseCalls from '@/components/calls/DatabaseCalls';
import AICallerSettings from '@/components/calls/AICallerSettings';
import { useCallForm } from '@/hooks/useCallForm';

const Call = () => {
  const { 
    formData, 
    date, 
    isLoading, 
    isWebhookLoading,
    setDate, 
    handleInputChange, 
    handleManualSubmit, 
    handleDatabaseCall,
    webhookUrl
  } = useCallForm();
  
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Call Manager</h1>
        <p className="text-zinc-400 mt-1">Initiate AI-powered calls</p>
      </div>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="glass-morphism text-zinc-400 p-1 mb-6">
          <TabsTrigger value="manual" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            Manual Call
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            Database Calls
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="animate-in mt-0">
          <ManualCallForm 
            formData={formData}
            date={date}
            isLoading={isLoading}
            setDate={setDate}
            handleInputChange={handleInputChange}
            handleManualSubmit={handleManualSubmit}
          />
        </TabsContent>
        
        <TabsContent value="database" className="animate-in mt-0">
          <DatabaseCalls 
            isLoading={isLoading || isWebhookLoading}
            handleDatabaseCall={handleDatabaseCall}
            webhookUrl={webhookUrl}
          />
        </TabsContent>
      </Tabs>
      
      {/* Add the new AI Caller Settings component */}
      <AICallerSettings webhookUrl={webhookUrl} />
    </div>
  );
};

export default Call;
