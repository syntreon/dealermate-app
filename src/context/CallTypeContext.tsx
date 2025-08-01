import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CallType = 'all' | 'live' | 'test';

interface CallTypeContextProps {
  selectedCallType: CallType;
  setSelectedCallType: (type: CallType) => void;
}

const CallTypeContext = createContext<CallTypeContextProps | undefined>(undefined);

export const useCallType = () => {
  const ctx = useContext(CallTypeContext);
  if (!ctx) throw new Error('useCallType must be used within a CallTypeProvider');
  return ctx;
};

export const CallTypeProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCallType, setSelectedCallType] = useState<CallType>('all');
  return (
    <CallTypeContext.Provider value={{ selectedCallType, setSelectedCallType }}>
      {children}
    </CallTypeContext.Provider>
  );
};
