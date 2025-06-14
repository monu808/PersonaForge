import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Camera, 
  Upload, 
  Square, 
  RefreshCw,
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Monitor,
  Mic,
  MicOff,
  Video,
  VideoOff,
  SkipForward,
  Info
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { TAVUS_VIDEO_REQUIREMENTS } from '@/lib/tavus-guide';
import { STORAGE_BUCKETS } from '@/lib/constants';
import { supabase } from '@/lib/auth';

interface TavusConsentRecorderProps {
  onVideoReady: (videoUrl: string, videoFile?: File) => void;
  onSkip: () => void;
  className?: string;
  userName?: string;
}

type RecordingState = 'idle' | 'setup' | 'recording' | 'recorded' | 'uploading';
type ConsentStep = 'intro' | 'record' | 'upload' | 'skip';

export function TavusConsentRecorder({ onVideoReady, onSkip, className, userName = "Your Name" }: TavusConsentRecorderProps) {
  const [currentStep, setCurrentStep] = useState<ConsentStep>('intro');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRecorded, setTimeRecorded] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: isAudioEnabled
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setHasPermissions(true);
      setRecordingState('setup');
    } catch (err) {
      setError('Unable to access camera and microphone. Please ensure permissions are granted.');
      console.error('Camera permission error:', err);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      setError('No camera stream available');
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setTimeRecorded(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setRecordingState('recorded');
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      setRecordingState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeRecorded(prev => {
          const newTime = prev + 1;
          // Auto-stop at max duration
          if (newTime >= TAVUS_VIDEO_REQUIREMENTS.MAX_DURATION_SECONDS) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      setError('Failed to start recording. Please try again.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Validate file
      const errors = [];
      
      if (!file.type.startsWith('video/')) {
        errors.push('File must be a video format');
      }
      
      if (file.size > TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`File size must be under ${TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB`);
      }
      
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.includes(extension)) {
        errors.push(`File format must be one of: ${TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.join(', ').toUpperCase()}`);
      }
      
      if (errors.length > 0) {
        setError(errors.join('. '));
        return;
      }

      // Upload to Supabase storage
      const fileName = `${crypto.randomUUID()}.${extension}`;
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.REPLICA_TRAINING_VIDEOS)
        .upload(`consent-videos/${fileName}`, file, {
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.REPLICA_TRAINING_VIDEOS)
        .getPublicUrl(`consent-videos/${fileName}`);
      
      onVideoReady(urlData.publicUrl, file);
      
      toast({
        title: "Video uploaded successfully",
        description: "Your consent video is ready for replica creation.",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload video';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const useRecordedVideo = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    
    try {
      // Convert blob to file
      const file = new File([recordedBlob], `consent-recording-${Date.now()}.webm`, {
        type: 'video/webm'
      });

      await handleUpload(file);
    } catch (err) {
      setError('Failed to process recorded video');
      console.error('Recorded video processing error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingState('setup');
    setTimeRecorded(0);
  };
  // Main intro screen
  if (currentStep === 'intro') {
    const consentScript = `I, ${userName}, am currently speaking and give consent to Tavus to create an AI clone of me by using the audio and video samples I provide. I understand that this AI clone can be used to create videos that look and sound like me.`;

    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Video className="h-6 w-6" />
            Consent Video Required
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            To create your AI replica, we need a consent video that meets Tavus requirements
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consent Script */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Please read this script during recording:
            </h4>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-sm text-gray-800 leading-relaxed">
                "{consentScript}"
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              💡 <strong>Tip:</strong> Keep your lips closed and look into the camera for 1 second before and after reading the script.
            </p>
          </div>

          {/* Requirements overview */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-amber-900 mb-3">Video Requirements:</h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Duration: {TAVUS_VIDEO_REQUIREMENTS.MIN_DURATION_SECONDS}-{TAVUS_VIDEO_REQUIREMENTS.MAX_DURATION_SECONDS} seconds</li>
              <li>• Clear view of your face looking at camera</li>
              <li>• Good lighting and audio quality</li>
              <li>• Speak naturally and clearly</li>
              <li>• Must be at least 15 seconds long</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => setCurrentStep('record')}
              className="h-auto py-4 flex flex-col gap-2"
              variant="outline"
            >
              <Camera className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Record</div>
                <div className="text-xs text-muted-foreground">Use your camera</div>
              </div>
            </Button>

            <Button
              onClick={() => setCurrentStep('upload')}
              className="h-auto py-4 flex flex-col gap-2"
              variant="outline"
            >
              <Upload className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Upload</div>
                <div className="text-xs text-muted-foreground">Choose existing file</div>
              </div>
            </Button>

            <Button
              onClick={onSkip}
              className="h-auto py-4 flex flex-col gap-2"
              variant="ghost"
            >
              <SkipForward className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Skip</div>
                <div className="text-xs text-muted-foreground">Provide URL later</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  // Recording interface
  if (currentStep === 'record') {
    const consentScript = `I, ${userName}, am currently speaking and give consent to Tavus to create an AI clone of me by using the audio and video samples I provide. I understand that this AI clone can be used to create videos that look and sound like me.`;

    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Record Consent Video
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('intro')}
            >
              ← Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Consent Script for Recording */}
          {recordingState !== 'recorded' && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-pink-900 mb-2 flex items-center gap-2">
                📝 Consent Script
              </h4>
              <div className="bg-white p-3 rounded border border-pink-200 mb-2">
                <p className="text-sm text-gray-800 leading-relaxed font-medium">
                  "{consentScript}"
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-pink-700">
                <span className="block w-2 h-2 bg-pink-400 rounded-full"></span>
                <span>Keep lips closed and look at camera for 1 second, then read the script clearly</span>
              </div>
            </div>
          )}

          {/* Camera preview */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
              {/* Recording overlay */}
            {recordingState === 'recording' && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                  REC {formatTime(timeRecorded)}
                </span>
              </div>
            )}            {/* Preview label for recorded state */}
            {recordingState === 'recorded' && (
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                  Preview
                </span>
              </div>
            )}

            {/* Status overlay */}
            {recordingState === 'idle' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Button
                  onClick={requestCameraPermission}
                  size="lg"
                  className="gap-2"
                >
                  <Monitor className="h-5 w-5" />
                  Enable Camera
                </Button>
              </div>
            )}            {/* Quality indicator */}
            {hasPermissions && recordingState !== 'idle' && (
              <div className="absolute bottom-4 left-4">
                <span className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded border border-white/30">
                  720p HD
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          {hasPermissions && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                disabled={recordingState === 'recording'}
              >
                {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                disabled={recordingState === 'recording'}
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>

              {recordingState === 'setup' && (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Camera className="h-5 w-5" />
                  Start Recording
                </Button>
              )}

              {recordingState === 'recording' && (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <Square className="h-5 w-5" />
                  Stop Recording
                </Button>
              )}

              {recordingState === 'recorded' && (
                <div className="flex gap-2">
                  <Button
                    onClick={resetRecording}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={useRecordedVideo}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Use This Video
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Recording timer info */}
          {recordingState === 'setup' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Recommended: {TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_DURATION_SECONDS} seconds</p>
              <p>Max duration: {TAVUS_VIDEO_REQUIREMENTS.MAX_DURATION_SECONDS} seconds</p>
            </div>
          )}

          {/* Recorded video preview */}
          {recordingState === 'recorded' && recordedUrl && (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                src={recordedUrl}
                controls
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Upload interface
  if (currentStep === 'upload') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Consent Video
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('intro')}
            >
              ← Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Upload your consent video</p>
              <p className="text-sm text-muted-foreground">
                Choose a video file that meets the requirements below
              </p>
            </div>
            
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="video-upload"
            />
            
            <label htmlFor="video-upload">
              <Button
                asChild
                disabled={isUploading}
                className="mt-4"
              >
                <span className="cursor-pointer">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>

          {/* Requirements */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-3">File Requirements:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Format: {TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.join(', ').toUpperCase()}</li>
              <li>• Size: Under {TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB</li>
              <li>• Duration: {TAVUS_VIDEO_REQUIREMENTS.MIN_DURATION_SECONDS}-{TAVUS_VIDEO_REQUIREMENTS.MAX_DURATION_SECONDS} seconds</li>
              <li>• Resolution: {TAVUS_VIDEO_REQUIREMENTS.MIN_RESOLUTION} minimum</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
