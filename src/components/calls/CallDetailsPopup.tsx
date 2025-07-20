import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Phone,
  User,
  Calendar,
  Clock,
  FileText,
  Headphones,
  Mic,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  Copy,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Heart,
  Meh,
  Frown,
} from 'lucide-react';
import { CallLog, CallType } from '@/integrations/supabase/call-logs-service';
import { LeadEvaluationService } from '@/services/leadEvaluationService';
import { LeadEvaluationSummary } from '@/types/leadEvaluation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  // Removed minimize functionality
  const [activeTab, setActiveTab] = useState('details');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Default playback speed
  const [evaluation, setEvaluation] = useState<LeadEvaluationSummary | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  // Initialize audio player when call changes
  useEffect(() => {
    if (call?.recording_url) {
      const audio = new Audio(call.recording_url);
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        audio.currentTime = 0;
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      // Set initial playback speed
      audio.playbackRate = playbackSpeed;
      
      setAudioElement(audio);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        setAudioElement(null);
      };
    }
  }, [call, playbackSpeed]);

  // Load evaluation data when call changes (admin only)
  useEffect(() => {
    const loadEvaluation = async () => {
      if (!call?.id || !canViewSensitiveInfo(user)) {
        setEvaluation(null);
        return;
      }

      setEvaluationLoading(true);
      try {
        const evaluationData = await LeadEvaluationService.getEvaluationByCallId(call.id);
        if (evaluationData) {
          const summary = LeadEvaluationService.transformToSummary(evaluationData);
          setEvaluation(summary);
        } else {
          setEvaluation(null);
        }
      } catch (error) {
        console.error('Error loading evaluation:', error);
        setEvaluation(null);
      } finally {
        setEvaluationLoading(false);
      }
    };

    loadEvaluation();
  }, [call, user]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle mute/unmute
  const toggleMute = () => {
    if (!audioElement) return;
    
    audioElement.muted = !audioElement.muted;
    setIsMuted(!isMuted);
  };

  // Handle playback speed change
  const cyclePlaybackSpeed = () => {
    if (!audioElement) return;
    
    // Define the sequence of speeds
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    
    // Find the index of the current speed or the closest one
    const currentIndex = speeds.findIndex(speed => speed === playbackSpeed);
    
    // Get the next speed in the sequence or go back to the beginning
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    
    // Apply the new speed without pausing playback
    audioElement.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioElement) return;
    
    const newTime = parseFloat(e.target.value);
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle skip forward/backward
  const skipForward = () => {
    if (!audioElement) return;
    
    const newTime = Math.min(audioElement.currentTime + 10, audioElement.duration);
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipBackward = () => {
    if (!audioElement) return;
    
    const newTime = Math.max(audioElement.currentTime - 10, 0);
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time (seconds) to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label.toLowerCase()}`));
  };
  
  // Copy transcript to clipboard
  const copyTranscript = () => {
    if (!call?.transcript) return;
    copyToClipboard(call.transcript, 'Transcript');
  };

  // Download transcript as text file
  const downloadTranscript = () => {
    if (!call?.transcript) return;
    
    const element = document.createElement('a');
    const file = new Blob([call.transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcript_${call.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Get call type badge
  const getCallTypeBadge = (callType: string | null) => {
    // Ensure callType is a string and has a value
    const safeCallType = callType && typeof callType === 'string' ? callType.toLowerCase() : 'unknown';
    
    const typeStyles: Record<string, string> = {
      'inbound': 'bg-blue-100 text-blue-800 border-blue-200',
      'outbound': 'bg-green-100 text-green-800 border-green-200',
      'missed': 'bg-amber-100 text-amber-800 border-amber-200',
      'voicemail': 'bg-purple-100 text-purple-800 border-purple-200',
      'unknown': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    // Get the appropriate icon based on call type
    const getIcon = () => {
      switch(safeCallType) {
        case 'inbound':
          return <Phone className="h-3.5 w-3.5 mr-1.5" />;
        case 'outbound':
          return <Phone className="h-3.5 w-3.5 mr-1.5" />;
        case 'missed':
          return <Phone className="h-3.5 w-3.5 mr-1.5" />;
        case 'voicemail':
          return <Phone className="h-3.5 w-3.5 mr-1.5" />;
        default:
          return <Phone className="h-3.5 w-3.5 mr-1.5" />;
      }
    };

    // Format the display text with proper capitalization
    const displayText = safeCallType.charAt(0).toUpperCase() + safeCallType.slice(1);

    return (
      <Badge className={cn(
        'px-3 py-1 rounded-full text-xs font-medium border flex items-center',
        typeStyles[safeCallType] || 'bg-gray-100 text-gray-800 border-gray-200'
      )}>
        {getIcon()}
        {displayText}
      </Badge>
    );
  };

  // Get caller initials for avatar
  const getCallerInitials = (name: string | null) => {
    if (!name) return 'UN';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Details
            {call && getCallTypeBadge(call.call_type)}
          </DialogTitle>
          <DialogDescription>
            View call details, listen to recording, and read transcript
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              {/* Mobile tab labels */}
              <TabsList className={`w-full sm:hidden ${canViewSensitiveInfo(user) ? 'grid-cols-4' : 'grid-cols-3'} grid`}>
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
                {canViewSensitiveInfo(user) && (
                  <TabsTrigger value="evaluation" className="px-2">
                    <Star className="h-4 w-4 mr-1" />
                    Eval
                  </TabsTrigger>
                )}
              </TabsList>
              
              {/* Desktop tab labels */}
              <TabsList className={`w-full hidden sm:grid ${canViewSensitiveInfo(user) ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
                {canViewSensitiveInfo(user) && (
                  <TabsTrigger value="evaluation">
                    <Star className="h-4 w-4 mr-2" />
                    Evaluation
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="details" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-full pr-4">
                  {call ? (
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
                            {/* Only show client ID to admins */}
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
                            {/* Show call ID to admins */}
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
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Call Type</span>
                              <div>{getCallTypeBadge(call.call_type)}</div>
                            </div>
                            
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
                                  ${call.total_cost_cad?.toFixed(2) || '0.00'} CAD
                                </span>
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
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Call details not available</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="recording" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-full pr-4">
                  <div className="flex items-center justify-center min-h-[400px]">
                    {call?.recording_url ? (
                      <Card className="w-full max-w-2xl">
                    <CardHeader>
                      <CardTitle className="text-base">Call Recording</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={skipBackward}
                            disabled={!audioElement}
                          >
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="default"
                            size="icon"
                            onClick={togglePlayPause}
                            disabled={!audioElement}
                            className="h-12 w-12 rounded-full"
                          >
                            {isPlaying ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6 ml-1" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={skipForward}
                            disabled={!audioElement}
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleMute}
                            disabled={!audioElement}
                          >
                            {isMuted ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {/* Playback Speed Control */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cyclePlaybackSpeed}
                            disabled={!audioElement}
                            className="text-xs font-medium"
                          >
                            {playbackSpeed}x
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-10">
                            {formatTime(currentTime)}
                          </span>
                          
                          <div className="relative flex-1">
                            <input
                              type="range"
                              min="0"
                              max={duration || 100}
                              value={currentTime}
                              onChange={handleSeek}
                              disabled={!audioElement}
                              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          
                          <span className="text-xs text-muted-foreground w-10">
                            {formatTime(duration)}
                          </span>
                        </div>
                        
                        <div className="text-center text-sm text-muted-foreground">
                          {call.call_duration_mins ? `Total duration: ${call.call_duration_mins} minutes` : ''}
                        </div>
                      </div>
                      </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center">
                        <p className="text-muted-foreground">No recording available for this call</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="transcript" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-full pr-4">
                  {call?.transcript ? (
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Call Transcript</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyTranscript}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadTranscript}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border p-4 bg-muted/50">
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                          {call.transcript}
                        </pre>
                      </div>
                    </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No transcript available for this call</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {canViewSensitiveInfo(user) && (
                <TabsContent value="evaluation" className="flex-1 overflow-hidden mt-4">
                  <ScrollArea className="h-full pr-4">
                    {evaluationLoading ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <Card key={i}>
                            <CardContent className="p-6">
                              <Skeleton className="h-4 w-20 mb-2" />
                              <Skeleton className="h-8 w-16 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : evaluation ? (
                    <div className="space-y-6">
                      {/* Overall Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Call Evaluation Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Overall Score</p>
                              <p className="text-2xl font-bold text-card-foreground">
                                {evaluation.overallScore ? `${evaluation.overallScore}/5` : 'N/A'}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Sentiment</p>
                              <div className="flex items-center justify-center gap-2 mt-1">
                                {(() => {
                                  const sentimentDisplay = LeadEvaluationService.getSentimentDisplay(evaluation.sentiment);
                                  return (
                                    <>
                                      <span className="text-xl">{sentimentDisplay.icon}</span>
                                      <Badge 
                                        className={cn(
                                          'text-xs',
                                          sentimentDisplay.color === 'green' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                          sentimentDisplay.color === 'yellow' && 'bg-amber-50 text-amber-700 border-amber-200',
                                          sentimentDisplay.color === 'red' && 'bg-red-50 text-red-700 border-red-200'
                                        )}
                                      >
                                        {sentimentDisplay.label}
                                      </Badge>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Status</p>
                              <div className="flex flex-col items-center gap-1 mt-1">
                                {evaluation.humanReviewRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Review Required
                                  </Badge>
                                )}
                                {evaluation.negativeCallFlag && (
                                  <Badge variant="destructive" className="text-xs">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Negative Call
                                  </Badge>
                                )}
                                {!evaluation.humanReviewRequired && !evaluation.negativeCallFlag && (
                                  <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Good Call
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              Evaluated on {format(evaluation.evaluatedAt, 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Score Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {evaluation.cards.map((card, index) => (
                          <Card key={index}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
                                <div className={cn(
                                  'p-2 rounded-full',
                                  card.color === 'green' && 'bg-emerald-50',
                                  card.color === 'yellow' && 'bg-amber-50',
                                  card.color === 'red' && 'bg-red-50',
                                  card.color === 'blue' && 'bg-blue-50',
                                  card.color === 'purple' && 'bg-purple-50'
                                )}>
                                  <Star className={cn(
                                    'h-4 w-4',
                                    card.color === 'green' && 'text-emerald-600',
                                    card.color === 'yellow' && 'text-amber-600',
                                    card.color === 'red' && 'text-red-600',
                                    card.color === 'blue' && 'text-blue-600',
                                    card.color === 'purple' && 'text-purple-600'
                                  )} />
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-card-foreground">
                                    {card.score}
                                  </span>
                                  {card.maxScore && (
                                    <span className="text-sm text-muted-foreground">
                                      / {card.maxScore}
                                    </span>
                                  )}
                                </div>
                                
                                {card.maxScore && (
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className={cn(
                                        'h-2 rounded-full transition-all duration-300',
                                        card.color === 'green' && 'bg-emerald-500',
                                        card.color === 'yellow' && 'bg-amber-500',
                                        card.color === 'red' && 'bg-red-500',
                                        card.color === 'blue' && 'bg-blue-500',
                                        card.color === 'purple' && 'bg-purple-500'
                                      )}
                                      style={{ width: `${(card.score / card.maxScore) * 100}%` }}
                                    />
                                  </div>
                                )}
                                
                                {card.rationale && (
                                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    {card.rationale}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      </div>
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">No Evaluation Available</h3>
                      <p className="text-muted-foreground mb-2">
                        This call has not been evaluated yet.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Evaluation data will appear here once the call has been processed.
                      </p>
                    </div>
                  )}
                  </ScrollArea>
                </TabsContent>
              )}
            </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CallDetailsPopup;