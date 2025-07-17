import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Call {
  id: string;
  name: string;
  phoneNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  message: string;
  status: "initiated" | "sent" | "answered" | "failed";
  timestamp: string;
}

interface CallStats {
  totalCalls: number;
  sent: number;
  answered: number;
  failed: number;
}

interface CallsContextType {
  calls: Call[];
  stats: CallStats;
  addCall: (call: Omit<Call, "id" | "timestamp" | "status">) => Promise<boolean>;
  sendWebhook: (url: string, data: any) => Promise<any>;
  sendDatabaseWebhook: (url: string) => Promise<any>;
}

const CallsContext = createContext<CallsContextType | undefined>(undefined);

export const CallsProvider = ({ children }: { children: ReactNode }) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    sent: 0,
    answered: 0,
    failed: 0
  });

  useEffect(() => {
    // Load calls from localStorage on init
    const storedCalls = localStorage.getItem("calls");
    if (storedCalls) {
      setCalls(JSON.parse(storedCalls));
    }
  }, []);

  useEffect(() => {
    // Update stats whenever calls change
    if (calls.length > 0) {
      const newStats = {
        totalCalls: calls.length,
        sent: calls.filter(call => call.status === "sent").length,
        answered: calls.filter(call => call.status === "answered").length,
        failed: calls.filter(call => call.status === "failed").length
      };
      setStats(newStats);
      
      // Save to localStorage
      localStorage.setItem("calls", JSON.stringify(calls));
    }
  }, [calls]);

  const isValidWebhookUrl = (url: string) => {
    if (!url || url.includes('webhook.site/your-webhook-id')) {
      return false;
    }
    
    try {
      new URL(url); // Will throw if URL is invalid
      return true;
    } catch {
      return false;
    }
  };

  const addCall = async (callData: Omit<Call, "id" | "timestamp" | "status">): Promise<boolean> => {
    try {
      const newCall: Call = {
        ...callData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: "initiated"
      };
      
      // When this call is sent via webhook, it will include the type field
      const callWithType = {
        ...newCall,
        type: "manual" // Add type identifier for manual calls
      };
      
      setCalls(prevCalls => [newCall, ...prevCalls]);
      return true;
    } catch (error) {
      console.error("Error adding call:", error);
      return false;
    }
  };

  const sendWebhook = async (url: string, data: any) => {
    if (!isValidWebhookUrl(url)) {
      throw new Error('Invalid webhook URL');
    }
    
    try {
      console.log(`Sending webhook to: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Ensure data has a type field, default to "unknown" if not specified
      const payload = {
        ...data,
        // Don't override type if it's already set
        type: data.type || "unknown"
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }
      
      // Update call status based on webhook response
      if (data.id) {
        setCalls(prevCalls => 
          prevCalls.map(call => 
            call.id === data.id 
              ? { ...call, status: "sent" } 
              : call
          )
        );
      }
      
      console.log('Webhook response:', result);
      return result;
    } catch (error) {
      console.error('Error sending webhook:', error);
      
      // Update call status to failed if there was an error
      if (data.id) {
        setCalls(prevCalls => 
          prevCalls.map(call => 
            call.id === data.id 
              ? { ...call, status: "failed" } 
              : call
          )
        );
      }
      
      throw error;
    }
  };

  const sendDatabaseWebhook = async (url: string) => {
    if (!isValidWebhookUrl(url)) {
      throw new Error('Invalid webhook URL');
    }
    
    // Mock database data for demo
    const databaseData = {
      type: "database", // Add type identifier
      source: "database",
      entries: [
        {
          name: "Jane Smith",
          phoneNumber: "+1 (555) 987-6543",
          appointmentDate: "2023-11-15",
          appointmentTime: "14:30",
          message: "Follow-up appointment scheduled",
        },
        {
          name: "David Johnson",
          phoneNumber: "+1 (555) 456-7890",
          appointmentDate: "2023-11-16",
          appointmentTime: "10:15",
          message: "Initial consultation",
        }
      ]
    };
    
    try {
      console.log(`Sending database webhook to: ${url}`);
      return await sendWebhook(url, databaseData);
    } catch (error) {
      console.error('Error sending database webhook:', error);
      throw error;
    }
  };

  return (
    <CallsContext.Provider value={{ calls, stats, addCall, sendWebhook, sendDatabaseWebhook }}>
      {children}
    </CallsContext.Provider>
  );
};

export const useCalls = () => {
  const context = useContext(CallsContext);
  if (context === undefined) {
    throw new Error("useCalls must be used within a CallsProvider");
  }
  return context;
};
