import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, FileText, Mic, MessageSquare, Star } from 'lucide-react';
import { CallLog } from '@/integrations/supabase/call-logs-service';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo, canViewCallEvaluation } from '@/utils/clientDataIsolation';
import { CallDetailsTab } from './CallDetailsTab';
import { CallRecordingTab } from './CallRecordingTab';
import { CallTranscriptTab } from './CallTranscriptTab';
import { CallEvaluationTab } from './CallEvaluationTab';
import { getCallTypeBadge, getTestCallBadge } from './utils';

interface CallDetailsPopupProps {
    call: CallLog | null;
    isOpen: boolean;
    onClose: () => void;
}

const CallDetailsPopup: React.FC<CallDetailsPopupProps> = ({
    call,
    isOpen,
    onClose,
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const canViewSensitive = canViewSensitiveInfo(user);
    const canViewEvaluation = canViewCallEvaluation(user);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Call Details
                        <div className="flex items-center gap-2">
                            {call && getCallTypeBadge(call.call_type)}
                            {call?.is_test_call && getTestCallBadge()}
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        View call details, listen to recording, and read transcript
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile tab labels */}
                    <TabsList className={`w-full sm:hidden ${canViewEvaluation ? 'grid-cols-4' : 'grid-cols-3'} grid`}>
                        <TabsTrigger value="details" className="px-2">
                            <FileText className="h-4 w-4 mr-1" />
                            Info
                        </TabsTrigger>
                        <TabsTrigger value="recording" className="px-2" disabled={!call?.recording_url}>
                            <Mic className="h-4 w-4 mr-1" />
                            Audio
                        </TabsTrigger>
                        <TabsTrigger value="transcript" className="px-2" disabled={!call?.transcript}>
                            <FileText className="h-4 w-4 mr-1" />
                            Text
                        </TabsTrigger>
                        {canViewEvaluation && (
                            <TabsTrigger value="evaluation" className="px-2">
                                <Star className="h-4 w-4 mr-1" />
                                Eval
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Desktop tab labels */}
                    <TabsList className={`w-full hidden sm:grid ${canViewEvaluation ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        <TabsTrigger value="details">
                            <FileText className="h-4 w-4 mr-2" />
                            Details
                        </TabsTrigger>
                        <TabsTrigger value="recording" disabled={!call?.recording_url}>
                            <Mic className="h-4 w-4 mr-2" />
                            Recording
                        </TabsTrigger>
                        <TabsTrigger value="transcript" disabled={!call?.transcript}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Transcript
                        </TabsTrigger>
                        {canViewEvaluation && (
                            <TabsTrigger value="evaluation">
                                <Star className="h-4 w-4 mr-2" />
                                Evaluation
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="details" className="flex-1 overflow-hidden mt-4">
                        <CallDetailsTab call={call} />
                    </TabsContent>

                    <TabsContent value="recording" className="flex-1 overflow-hidden mt-4">
                        <CallRecordingTab call={call} />
                    </TabsContent>

                    <TabsContent value="transcript" className="flex-1 overflow-hidden mt-4">
                        <CallTranscriptTab call={call} />
                    </TabsContent>

                    {canViewEvaluation && (
                        <TabsContent value="evaluation" className="flex-1 overflow-hidden mt-4">
                            <CallEvaluationTab call={call} />
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default CallDetailsPopup;