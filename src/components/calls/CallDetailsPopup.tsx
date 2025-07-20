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
} from 'lucide-react';
import { CallLog, CallType } from '@/integrations/supabase/call-logs-service';
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
      
      setAudioElement(audio);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        setAudioElement(null);
      };
    }
  }, [call]);

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

  // Copy transcript to clipboard
  const copyTranscript = () => {
    if (!call?.transcript) return;
    
    navigator.clipboard.writeText(call.transcript)
      .then(() => toast.success('Transcript copied to clipboard'))
      .catch(() => toast.error('Failed to copy transcript'));
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Mobile tab labels */}
              <TabsList className="grid grid-cols-3 w-full sm:hidden">
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
              </TabsList>
              
              {/* Desktop tab labels */}
              <TabsList className="grid grid-cols-3 w-full hidden sm:grid">
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
              </TabsList>

              <TabsContent value="details" className="mt-4">
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
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Client ID</span>
                                <span className="text-sm font-medium">{call.client_id || 'N/A'}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">To Phone Number</span>
                              <span className="text-sm font-medium">{call.to_phone_number || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Assistant ID</span>
                              <span className="text-sm font-medium">{call.assistant_id || 'N/A'}</span>
                            </div>
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
                          
                          <div className="space-y-2">
                            {/* Only show cost information to admins */}
                            {canViewSensitiveInfo(user) ? (
                              <>
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
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground italic">
                                Cost information is only visible to administrators
                              </div>
                            )}
                          </div>
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
              </TabsContent>

              <TabsContent value="recording" className="mt-4">
                {call?.recording_url ? (
                  <Card>
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
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recording available for this call</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transcript" className="mt-4">
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
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                          {call.transcript}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transcript available for this call</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Footer space maintained for consistent spacing */}
            <DialogFooter className="mt-4"></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CallDetailsPopup;