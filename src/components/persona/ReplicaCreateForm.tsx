import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Video, CheckCircle, AlertTriangle, Info, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getPersonas } from '@/lib/api/personas';
import { createTavusReplica } from '@/lib/api/tavus';
import { supabase } from '@/lib/auth';
import { TAVUS_VIDEO_REQUIREMENTS } from '@/lib/tavus-guide';
import { STORAGE_BUCKETS } from '@/lib/constants';
import { TavusConsentRecorder } from '@/components/video/TavusConsentRecorder';
import VideoCompressionGuide from '@/components/video/VideoCompressionGuide';
import { startTavusAutomation } from '@/lib/automation/tavus-automation';

interface ReplicaCreateFormProps {
  onSuccess?: (replicaData: any) => void;
  onError?: (error: Error) => void;
}

type WorkflowStep = 'consent' | 'training' | 'creation';

export function ReplicaCreateForm({ onSuccess, onError }: ReplicaCreateFormProps) {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('consent');
  
  // Form data
  const [replicaName, setReplicaName] = useState('');
  const [consentVideoUrl, setConsentVideoUrl] = useState('');
  const [consentVideoFile, setConsentVideoFile] = useState<File | null>(null);
  const [trainVideoUrl, setTrainVideoUrl] = useState('');
  const [trainVideoFile, setTrainVideoFile] = useState<File | null>(null);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [useConsentRecorder, setUseConsentRecorder] = useState(false);
  const [useTrainingRecorder, setUseTrainingRecorder] = useState(false);
    // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [showCompressionGuide, setShowCompressionGuide] = useState(false);
  const [largeFileSizeMB, setLargeFileSizeMB] = useState<number | null>(null);
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoadingPersonas(true);
      const { data: personasData, error } = await getPersonas();
      
      if (error) throw error;
      
      if (personasData) {
        setPersonas(personasData);
      }
    } catch (err) {
      console.error("Error loading personas:", err);
      setError("Failed to load personas. Please try again.");
    } finally {
      setLoadingPersonas(false);
    }
  };

  // Step progression handlers
  const handleConsentComplete = () => {
    setCurrentStep('training');
    setError(null);
  };

  const handleTrainingComplete = () => {
    setCurrentStep('creation');
    setError(null);
  };

  const goBackToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
    setError(null);
  };

  // Consent video handlers
  const handleConsentVideoReady = (videoUrl: string, videoFile?: File) => {
    setConsentVideoUrl(videoUrl);
    if (videoFile) {
      setConsentVideoFile(videoFile);
    }
    setUseConsentRecorder(false);
    setError(null);
  };

  const handleConsentRecorderSkip = () => {
    setUseConsentRecorder(false);
    // Automatically acknowledge consent if they skip recording
    setConsentAcknowledged(true);
    handleConsentComplete();
  };

  // Training video handlers
  const handleTrainingVideoReady = (videoUrl: string, videoFile?: File) => {
    setTrainVideoUrl(videoUrl);
    if (videoFile) {
      setTrainVideoFile(videoFile);
    }
    setUseTrainingRecorder(false);
    setError(null);
  };

  const handleTrainingRecorderSkip = () => {
    setUseTrainingRecorder(false);
  };
  const handleTrainingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Comprehensive validation
      const errors = [];
      
      // Check file type
      if (!file.type.startsWith('video/')) {
        errors.push('File must be a video format');
      }
      
      // Check file size (convert MB to bytes for comparison)
      const fileSizeMB = file.size / (1024 * 1024);
      if (file.size > TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`File size (${fileSizeMB.toFixed(1)}MB) exceeds the ${TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB limit. Please compress your video or use a smaller file.`);
      }
      
      // Warn if file is large but within limits
      if (fileSizeMB > TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_FILE_SIZE_MB && fileSizeMB <= TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB) {
        toast({
          title: 'Large File Warning',
          description: `Your video is ${fileSizeMB.toFixed(1)}MB. For better upload reliability, consider compressing to under ${TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_FILE_SIZE_MB}MB.`,
          variant: 'default',
        });
      }
      
      // Check file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.includes(extension)) {
        errors.push(`File format must be one of: ${TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.join(', ').toUpperCase()}`);
      }
      
      if (errors.length > 0) {
        setError(errors.join('. '));
        e.target.value = '';
        return;
      }
      
      setTrainVideoFile(file);
      setTrainVideoUrl(''); // Clear URL if file is uploaded
      setError(null);
    }
  };

  const handleTrainingUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrainVideoUrl(e.target.value);
    if (e.target.value) {
      setTrainVideoFile(null); // Clear file if URL is provided
    }
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Tavus API key is configured
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    if (!tavusApiKey) {
      setError('Tavus API key is not configured. Please check your environment variables.');
      return;
    }
    
    if (!replicaName) {
      setError('Replica name is required.');
      return;
    }

    if (!trainVideoUrl && !trainVideoFile) {
      setError('Please provide training video content.');
      return;
    }

    if (!selectedPersona || selectedPersona === 'loading' || selectedPersona === 'no-personas') {
      setError('Please select a valid persona to link this replica to.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, if we have a file, we need to upload it to get a URL
      let finalVideoUrl = trainVideoUrl;
        if (trainVideoFile) {
        // Check file size before upload
        const fileSizeMB = trainVideoFile.size / (1024 * 1024);
        console.log(`Uploading video file: ${trainVideoFile.name}, Size: ${fileSizeMB.toFixed(2)}MB`);
        
        // Upload video file to Supabase storage
        const fileName = `${crypto.randomUUID()}.${trainVideoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.REPLICA_TRAINING_VIDEOS)
          .upload(`training-videos/${fileName}`, trainVideoFile, {
            contentType: trainVideoFile.type,
            duplex: 'half' // Required for large file uploads
          });        if (uploadError) {
          console.error('Upload error details:', uploadError);
          
          // Provide specific error messages based on the error type
          let errorMessage = `Failed to upload video file: ${uploadError.message}`;
          let showGuide = false;
            // Handle specific Supabase error codes
          if ((uploadError as any).statusCode === '413' || uploadError.message.includes('Payload too large') || uploadError.message.includes('413')) {
            errorMessage = `🚫 File Too Large: Your video (${fileSizeMB.toFixed(1)}MB) exceeds Supabase's ${TAVUS_VIDEO_REQUIREMENTS.SUPABASE_LIMIT_MB}MB upload limit.\n\nClick "Show Compression Guide" below for help reducing your file size.`;
            showGuide = true;
            setLargeFileSizeMB(fileSizeMB);
          } else if (uploadError.message.includes('maximum allowed size') || uploadError.message.includes('too large')) {
            errorMessage = `Video file is too large (${fileSizeMB.toFixed(1)}MB). Please compress your video to under ${TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB and try again.`;
            showGuide = true;
            setLargeFileSizeMB(fileSizeMB);
          } else if (uploadError.message.includes('Bad Request')) {
            errorMessage = `Upload failed due to file size restrictions. Your video (${fileSizeMB.toFixed(1)}MB) exceeds the upload limit. Please compress your video to under ${TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB.`;
            showGuide = true;
            setLargeFileSizeMB(fileSizeMB);
          } else if (uploadError.message.includes('permission') || uploadError.message.includes('unauthorized')) {
            errorMessage = 'Upload failed due to permission issues. Please try again or contact support.';
          }
          
          // If it's a file size error, suggest showing the compression guide
          if (showGuide) {
            toast({
              title: 'File Size Error',
              description: errorMessage,
              variant: 'destructive',
              action: (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCompressionGuide(true)}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Show Compression Guide
                </Button>
              ),
            });
          }
          
          throw new Error(errorMessage);
        }

        // Get the public URL for the uploaded video
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKETS.REPLICA_TRAINING_VIDEOS)
          .getPublicUrl(`training-videos/${fileName}`);
        
        finalVideoUrl = urlData.publicUrl;
      }      // Create replica using Tavus API directly
      const replicaResponse = await createTavusReplica({
        replica_name: replicaName,
        train_video_url: finalVideoUrl,
        callback_url: `${window.location.origin}/api/tavus-webhook`, // Add webhook for async notifications
      });

      if (replicaResponse.error || !replicaResponse.replica_id) {
        throw new Error(replicaResponse.error || 'Failed to create replica');
      }

      const replicaData = replicaResponse;
      
      // Get the selected persona data for automation
      const selectedPersonaData = personas.find(p => p.id === selectedPersona);
      if (!selectedPersonaData) {
        throw new Error('Selected persona not found');
      }

      // Start background automation for TAVUS integration
      console.log(`🚀 Starting automated TAVUS integration for persona: ${selectedPersona}`);
      
      if (!replicaData.replica_id) {
        throw new Error('Replica ID is missing from created replica');
      }
      
      try {
        await startTavusAutomation({
          personaId: selectedPersona,
          replicaId: replicaData.replica_id,
          replicaName: replicaName
        });

        toast({
          title: "Replica Created - Automation Started!",
          description: "Replica creation started. TAVUS integration will happen automatically in the background. Check console for progress updates.",
        });

        console.log(`✅ TAVUS automation started successfully for persona: ${selectedPersona}`);
        console.log(`📊 Monitor progress in browser console with [AUTOMATION] tags`);

      } catch (automationError) {
        console.error('Failed to start TAVUS automation:', automationError);
        
        // Fallback: at least link the replica to the persona manually
        const { error: updateError } = await supabase
          .from('personas')
          .update({
            attributes: {
              ...selectedPersonaData.attributes,
              default_replica_id: replicaData.replica_id,
              automation_failed: true,
              automation_error: automationError instanceof Error ? automationError.message : String(automationError)
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPersona);

        if (updateError) {
          console.error('Failed to link replica to persona:', updateError);
          toast({
            title: "Replica Created",
            description: `Replica created but automation failed to start. Please check console for details.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Replica Created (Automation Failed)",
            description: `Replica created and linked to persona, but background automation failed to start. Check console for details.`,
            variant: "destructive"
          });
        }
      }

      // Reset form
      setReplicaName('');
      setConsentVideoUrl('');
      setConsentVideoFile(null);
      setTrainVideoUrl('');
      setTrainVideoFile(null);
      setConsentAcknowledged(false);
      setSelectedPersona('');
      setCurrentStep('consent');

      onSuccess?.(replicaData);
        } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      // Check for specific consent phrase error
      if (errorMessage.includes('consent phrase does not match') || 
          errorMessage.includes('consent phrase') ||
          errorMessage.includes('training file')) {
        setError(`⚠️ Consent Phrase Issue: ${errorMessage}\n\nPlease ensure your video includes the exact phrase: "${TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE}"\n\nThe phrase must be spoken clearly and audibly in your training video.`);
      } else {
        setError(errorMessage);
      }
      
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      console.error('Error creating replica:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { key: 'consent' as WorkflowStep, label: 'Consent Video', description: 'Authorize Tavus platform' },
      { key: 'training' as WorkflowStep, label: 'Training Video', description: 'Teach your replica' },
      { key: 'creation' as WorkflowStep, label: 'Create Replica', description: 'Start automated integration' }
    ];

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep === step.key 
                ? 'bg-primary text-primary-foreground' 
                : index < steps.findIndex(s => s.key === currentStep)
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index < steps.findIndex(s => s.key === currentStep) ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                currentStep === step.key ? 'text-primary' : 'text-gray-600'
              }`}>
                {step.label}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="mx-4 h-4 w-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Create AI Replica
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create a digital replica using a 3-step process: consent authorization, training video, and replica generation.
          </p>
          
          {/* TAVUS Integration Notice */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Automated TAVUS Integration
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>What happens when you create a replica:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>TAVUS replica is created using your training video</li>
                <li>Background automation monitors replica training status</li>
                <li>When training completes, TAVUS persona is automatically created</li>
                <li>Your local persona is updated with both IDs for full integration</li>
              </ol>
              <p className="mt-2 font-medium">Result: Complete hands-off TAVUS integration! Monitor progress in browser console.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          {/* Step 1: Consent Video */}
          {currentStep === 'consent' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Step 1: Consent Video</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Record or upload a consent video to authorize the creation of your AI replica.
                </p>
              </div>

              {/* Required Consent Phrase */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-3">Required Consent Statement</h4>
                    <div className="bg-white border border-blue-300 rounded-md p-3 mb-3">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        <strong>"{TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE}"</strong>
                      </p>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>📝 Replace "Your Name" with your actual name</p>
                      <p>🎤 Speak this phrase clearly in both your consent and training videos</p>
                      <p>📹 Ensure good lighting and audio quality</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Video className="h-4 w-4" />
                    Choose Input Method
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUseConsentRecorder(!useConsentRecorder)}
                  >
                    {useConsentRecorder ? 'Manual Upload' : 'Record Now'}
                  </Button>
                </div>

                {useConsentRecorder ? (
                  <TavusConsentRecorder
                    onVideoReady={handleConsentVideoReady}
                    onSkip={handleConsentRecorderSkip}
                    className="w-full"
                  />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="consentVideoUrl">Video URL</Label>
                      <Input 
                        id="consentVideoUrl" 
                        type="url"
                        value={consentVideoUrl} 
                        onChange={(e) => setConsentVideoUrl(e.target.value)}
                        placeholder="https://example.com/your-consent-video.mp4"
                        disabled={!!consentVideoFile}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-500">OR</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <div>
                      <Label htmlFor="consentVideoFile">Upload Video File</Label>
                      <Input 
                        id="consentVideoFile" 
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setConsentVideoFile(file);
                            setConsentVideoUrl('');
                          }
                        }}
                        disabled={!!consentVideoUrl}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {consentVideoFile && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ File selected: {consentVideoFile.name}
                        </p>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="consent"
                          checked={consentAcknowledged}
                          onChange={(e) => setConsentAcknowledged(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="consent" className="text-sm cursor-pointer">
                          I confirm that I have provided the required consent statement and authorize AI replica creation
                        </Label>
                      </div>
                    </div>

                    <Button 
                      onClick={handleConsentComplete}
                      disabled={!consentAcknowledged || (!consentVideoUrl && !consentVideoFile)}
                      className="w-full"
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Continue to Training Video
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Training Video */}
          {currentStep === 'training' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Step 2: Training Video</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Provide a high-quality training video to teach your replica your appearance and mannerisms.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Video className="h-4 w-4" />
                    Choose Input Method
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUseTrainingRecorder(!useTrainingRecorder)}
                  >
                    {useTrainingRecorder ? 'Manual Upload' : 'Record Now'}
                  </Button>
                </div>

                {useTrainingRecorder ? (
                  <TavusConsentRecorder
                    onVideoReady={handleTrainingVideoReady}
                    onSkip={handleTrainingRecorderSkip}
                    className="w-full"
                  />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="trainVideoUrl">Video URL</Label>
                      <Input 
                        id="trainVideoUrl" 
                        type="url"
                        value={trainVideoUrl} 
                        onChange={handleTrainingUrlChange}
                        placeholder="https://example.com/your-training-video.mp4"
                        disabled={!!trainVideoFile}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-500">OR</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <div>
                      <Label htmlFor="trainVideoFile">Upload Video File</Label>
                      <Input 
                        id="trainVideoFile" 
                        type="file"
                        accept="video/*"
                        onChange={handleTrainingFileUpload}
                        disabled={!!trainVideoUrl}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />                      {trainVideoFile && (
                        <div className="text-xs mt-1">
                          <p className="text-green-600">
                            ✓ File selected: {trainVideoFile.name}
                          </p>
                          <p className="text-gray-500">
                            Size: {(trainVideoFile.size / (1024 * 1024)).toFixed(1)}MB
                          </p>
                        </div>
                      )}                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Max file size: {TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB</strong> • Recommended: {TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_FILE_SIZE_MB}MB or less
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCompressionGuide(true)}
                          className="text-xs h-auto p-1"
                        >
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Need help compressing your video?
                        </Button>
                      </div>
                    </div>
                  </div>
                )}                {/* Video Requirements */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Training Video Guidelines
                  </h4>
                  
                  {/* Reminder about consent phrase */}
                  <div className="bg-amber-100 border border-amber-300 rounded-md p-3 mb-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Remember to include the consent statement in this video too!</span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-xs text-blue-800">
                    <div>
                      <h5 className="font-semibold mb-1">Technical Requirements:</h5>
                      <ul className="space-y-0.5">
                        <li>• Duration: {TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_DURATION_SECONDS} seconds (ideal)</li>
                        <li>• Resolution: {TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_RESOLUTION} recommended</li>
                        <li>• File size: Under {TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB</li>
                        <li>• Format: {TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.join(', ').toUpperCase()}</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-1">Best Practices:</h5>
                      <ul className="space-y-0.5">
                        <li>• Clear face visibility (front-facing)</li>
                        <li>• Good lighting and stable camera</li>
                        <li>• Include the consent statement</li>
                        <li>• Single person in frame</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => goBackToStep('consent')}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Consent
                  </Button>
                  <Button 
                    onClick={handleTrainingComplete}
                    disabled={!trainVideoUrl && !trainVideoFile}
                    className="flex-1"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Continue to Creation
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Create Replica */}
          {currentStep === 'creation' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Step 3: Create Replica</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Finalize your replica creation by providing a name and linking it to a persona.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="replicaName">Replica Name</Label>
                  <Input 
                    id="replicaName" 
                    value={replicaName} 
                    onChange={(e) => setReplicaName(e.target.value)}
                    placeholder="Enter a name for your replica..."
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name will be used to identify your replica
                  </p>
                </div>

                <div>
                  <Label htmlFor="persona">Link to Persona</Label>
                  <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a persona to link this replica to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPersonas ? (
                        <SelectItem value="loading">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading personas...
                          </div>
                        </SelectItem>
                      ) : personas.length === 0 ? (
                        <SelectItem value="no-personas">
                          No personas available. Create a persona first.
                        </SelectItem>
                      ) : (
                        personas.map((persona) => (
                          <SelectItem key={persona.id} value={persona.id}>
                            <div className="flex items-center gap-2">
                              <span>{persona.name}</span>
                              {persona.attributes?.default_replica_id && (
                                <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                  Has Replica
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select which persona this replica should be linked to for video generation
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Creation Summary</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• Consent: {consentVideoUrl || consentVideoFile ? '✓ Provided' : '✗ Missing'}</p>
                    <p>• Training Video: {trainVideoUrl || trainVideoFile ? '✓ Provided' : '✗ Missing'}</p>
                    <p>• Replica Name: {replicaName || 'Not set'}</p>
                    <p>• Linked Persona: {selectedPersona && selectedPersona !== 'loading' && selectedPersona !== 'no-personas' 
                         ? personas.find(p => p.id === selectedPersona)?.name || 'Unknown' 
                         : 'Not selected'}</p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => goBackToStep('training')}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Training
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !replicaName || personas.length === 0 || loadingPersonas || (!selectedPersona || selectedPersona === 'loading' || selectedPersona === 'no-personas')} 
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Replica...
                      </>
                    ) : loadingPersonas ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Personas...
                      </>
                    ) : personas.length === 0 ? (
                      'No Personas Available'
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create AI Replica
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Processing Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Processing Time</h4>
              <p className="text-xs text-gray-600 mt-1">
                Replica creation typically takes 15-30 minutes. You'll receive an email notification 
                when your replica is ready to use. The replica will then be available for video and 
                conversation generation.
              </p>
            </div>          </div>
        </CardContent>
      </Card>

      {/* Video Compression Guide Modal */}
      {showCompressionGuide && (
        <VideoCompressionGuide
          currentFileSizeMB={largeFileSizeMB || undefined}
          onClose={() => {
            setShowCompressionGuide(false);
            setLargeFileSizeMB(null);
          }}
        />
      )}
    </div>
  );
}
