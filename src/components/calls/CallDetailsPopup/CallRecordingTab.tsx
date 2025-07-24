import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { CallLog } from '@/integrations/supabase/call-logs-service';
import { formatTime } from './utils';

interface CallRecordingTabProps {
  call: CallLog | null;
}

export const CallRecordingTab: React.FC<CallRecordingTabProps> = ({ call }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

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

  return (
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
  );
};