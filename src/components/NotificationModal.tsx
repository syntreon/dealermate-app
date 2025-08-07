// src/components/NotificationModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { PhoneIncoming, Phone, MessageCircle, PhoneOff, Headphones, X } from 'lucide-react';

// Minimal shape used by the modal. Keep in sync with schema.
interface NotificationData {
  type?: string | null;
  title?: string | null;
  body?: string | null;
  listen_url?: string | null;
  from_number?: string | null;
  from_name?: string | null;
}

export interface NotificationModalProps {
  notification: NotificationData | null;
  onClose: () => void;
  // Auto-close durations
  autoCloseMs?: number; // used for call
  nonCallAutoCloseMs?: number; // used for non-call (e.g., sms)
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  onClose,
  autoCloseMs,
  nonCallAutoCloseMs
}) => {
  // NOTE: Confirm-close dialog is disabled for now per request.
  // const [confirmClose, setConfirmClose] = useState(false);

  // Always call hooks; use a safe fallback when notification is null
  const data: Required<Pick<NotificationData, 'type' | 'title' | 'body' | 'listen_url' | 'from_number' | 'from_name'>> | NotificationData = notification ?? {
    type: null,
    title: null,
    body: null,
    listen_url: null,
    from_number: null,
    from_name: null,
  };

  // Derive view based on type
  const isCall = ((data.type || '') as string).toLowerCase() === 'call';
  const isSms = ((data.type || '') as string).toLowerCase() === 'sms';

  const header = useMemo(() => {
    if (isCall) {
      const n = data.from_number || 'Unknown Number';
      return `Incoming Call from... ${n}`;
    }
    if (isSms) {
      const n = data.from_number || 'Unknown Number';
      return `New SMS from... ${n}`;
    }
    // Fallbacks
    return data.title || 'New Notification';
  }, [isCall, isSms, data.from_number, data.title]);

  const subline = useMemo(() => {
    if (isCall) return data.from_name || '';
    if (isSms) return data.from_name || '';
    return data.body || '';
  }, [isCall, isSms, data.from_name, data.body]);

  // Auto-close timer: 15s for calls, 8s for non-calls (defaults)
  useEffect(() => {
    const ms = isCall ? (autoCloseMs ?? 15000) : (nonCallAutoCloseMs ?? 8000);
    if (!notification) return; // nothing to close
    const t = window.setTimeout(() => {
      onClose();
    }, ms);
    return () => window.clearTimeout(t);
  }, [notification, isCall, autoCloseMs, nonCallAutoCloseMs, onClose]);

  // Actions (placeholders except listen)
  const handleAnswer = () => {
    // TODO: wire to call control
    console.log('Answer clicked');
  };
  const handleEnd = () => {
    // TODO: wire to call control
    console.log('End clicked');
  };
  const handleListen = () => {
    if (data.listen_url) {
      window.open(data.listen_url, '_blank', 'noopener,noreferrer');
    }
  };

  // const requestClose = () => setConfirmClose(true);
  // const cancelClose = () => setConfirmClose(false);
  // const confirmAndClose = () => {
  //   setConfirmClose(false);
  //   onClose();
  // };

  // If there's no notification, render nothing after hooks are called
  if (!notification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Card */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 min-w-[300px] max-w-sm animate-in fade-in slide-in-from-bottom-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {isCall && <PhoneIncoming className="h-4 w-4 text-primary" aria-hidden />}
            {isSms && <MessageCircle className="h-4 w-4 text-primary" aria-hidden />}
            {!isCall && !isSms && <Phone className="h-4 w-4 text-primary" aria-hidden />}
            <h3 className="font-semibold text-card-foreground">{header}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Subline/body */}
        {subline && (
          <p className="mt-2 text-sm text-muted-foreground">{subline}</p>
        )}

        {/* SMS body (if provided) */}
        {!isCall && data.body && (
          <p className="mt-1 text-sm text-foreground">{data.body}</p>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {isCall && (
            <>
              <button
                onClick={handleAnswer}
                className="px-3 py-2 text-xs rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                Answer
              </button>
              <button
                onClick={handleListen}
                className="px-3 py-2 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1"
              >
                <Headphones className="h-3.5 w-3.5" /> Listen
              </button>
              <button
                onClick={handleEnd}
                className="px-3 py-2 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
              >
                <PhoneOff className="h-3.5 w-3.5" /> End
              </button>
            </>
          )}
          {!isCall && data.listen_url && (
            <button
              onClick={handleListen}
              className="px-3 py-2 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1"
            >
              <Headphones className="h-3.5 w-3.5" /> Listen
            </button>
          )}
        </div>
      </div>

      {/**
       * Confirm-close dialog is intentionally disabled for now.
       * To re-enable in future, restore the state and handlers above
       * and uncomment this block.
       */}
    </div>
  );
};