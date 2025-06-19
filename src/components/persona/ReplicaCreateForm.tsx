import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Video, CheckCircle, AlertTriangle, Info, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getPersonas } from '@/lib/api/personas';
import { createTavusReplica } from '@/lib/api/tavus';
import { supabase } from '@/lib/auth';
import { TAVUS_VIDEO_REQUIREMENTS } from '@/lib/tavus-guide';
import { STORAGE_BUCKETS } from '@/lib/constants';
import { TavusConsentRecorder } from '@/components/video/TavusConsentRecorder';

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
      
      // Check file size
      if (file.size > TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`File size must be under ${TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB`);
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
        // Upload video file to Supabase storage
        const fileName = `${crypto.randomUUID()}.${trainVideoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.REPLICA_TRAINING_VIDEOS)
          .upload(`training-videos/${fileName}`, trainVideoFile, {
            contentType: trainVideoFile.type
          });

        if (uploadError) {
          throw new Error(`Failed to upload video file: ${uploadError.message}`);
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
      
      // Update the selected persona with the replica ID
      const { error: updateError } = await supabase
        .from('personas')
        .update({
          attributes: {
            ...personas.find(p => p.id === selectedPersona)?.attributes,
            default_replica_id: replicaData.replica_id
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPersona);

      if (updateError) {
        console.error('Failed to link replica to persona:', updateError);
        // Don't throw here as the replica was created successfully
        toast({
          title: "Replica Created",
          description: `Replica created but failed to link to persona. Please manually update the persona.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Replica Created and Linked",
          description: `Your replica "${replicaName}" is being processed and has been linked to the selected persona.`,
        });
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
      { key: 'creation' as WorkflowStep, label: 'Create Replica', description: 'Generate your replica' }
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
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          {/* Step 1: Consent Video */}
          {currentStep === 'consent' && (              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Step 1: Consent Video</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Record or upload a consent video to authorize Tavus platform to create your replica.
                    This helps ensure you have given explicit permission for AI replica creation.
                  </p>
                </div>

                {/* Consent Phrase Requirements */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Required Consent Phrase</h4>
                      <div className="bg-white border border-yellow-300 rounded-md p-3 mb-3">
                        <p className="text-sm font-mono text-gray-800 text-center">
                          "{TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE}"
                        </p>
                      </div>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• You must say this exact phrase clearly in your video</li>
                        <li>• Speak it at the beginning or end of your video</li>
                        <li>• Ensure clear pronunciation and audible speech</li>
                        <li>• The person speaking must be the same person in the video</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Video className="h-4 w-4" />
                    Consent Video Method
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUseConsentRecorder(!useConsentRecorder)}
                  >
                    {useConsentRecorder ? 'Use Manual Input' : 'Use Tavus Recorder'}
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
                      <Label htmlFor="consentVideoUrl">Consent Video URL</Label>
                      <Input 
                        id="consentVideoUrl" 
                        type="url"
                        value={consentVideoUrl} 
                        onChange={(e) => setConsentVideoUrl(e.target.value)}
                        placeholder="https://example.com/your-consent-video.mp4"
                        disabled={!!consentVideoFile}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Provide a direct URL to your consent video
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-500">OR</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <div>
                      <Label htmlFor="consentVideoFile">Upload Consent Video</Label>
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
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="consent"
                          checked={consentAcknowledged}
                          onChange={(e) => setConsentAcknowledged(e.target.checked)}
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="consent" className="text-sm">
                            Consent and Agreement
                          </Label>
                          <p className="text-xs text-gray-600 mt-1">
                            I consent to the creation of an AI replica and authorize Tavus platform 
                            to process my video content for replica generation.
                          </p>
                        </div>
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
                    Training Video Method
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUseTrainingRecorder(!useTrainingRecorder)}
                  >
                    {useTrainingRecorder ? 'Use Manual Input' : 'Use Tavus Recorder'}
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
                      <Label htmlFor="trainVideoUrl">Training Video URL</Label>
                      <Input 
                        id="trainVideoUrl" 
                        type="url"
                        value={trainVideoUrl} 
                        onChange={handleTrainingUrlChange}
                        placeholder="https://example.com/your-training-video.mp4"
                        disabled={!!trainVideoFile}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Provide a direct URL to your training video (MP4, MOV, or AVI format)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-500">OR</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <div>
                      <Label htmlFor="trainVideoFile">Upload Training Video</Label>
                      <Input 
                        id="trainVideoFile" 
                        type="file"
                        accept="video/*"
                        onChange={handleTrainingFileUpload}
                        disabled={!!trainVideoUrl}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {trainVideoFile && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ File selected: {trainVideoFile.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Upload your training video directly (max 100MB recommended)
                      </p>
                    </div>
                  </div>
                )}                {/* Video Requirements */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Training Video Requirements
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Consent Phrase Reminder */}
                    <div className="bg-yellow-100 border border-yellow-300 rounded-md p-3">
                      <h5 className="text-xs font-semibold text-yellow-800 mb-1">🔊 IMPORTANT - Required Consent Phrase:</h5>
                      <p className="text-xs font-mono text-gray-800 bg-white border rounded px-2 py-1 mb-1">
                        "{TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE}"
                      </p>
                      <p className="text-xs text-yellow-700">
                        This exact phrase must be spoken clearly in your training video!
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-blue-800 mb-1">Duration & Quality:</h5>
                      <ul className="text-xs text-blue-700 space-y-0.5 ml-2">
                        <li>• Duration: {TAVUS_VIDEO_REQUIREMENTS.MIN_DURATION_SECONDS}-{TAVUS_VIDEO_REQUIREMENTS.MAX_DURATION_SECONDS} seconds (recommended: {TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_DURATION_SECONDS}s)</li>
                        <li>• Resolution: {TAVUS_VIDEO_REQUIREMENTS.MIN_RESOLUTION} minimum, {TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_RESOLUTION} recommended</li>
                        <li>• Format: {TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.join(', ').toUpperCase()}</li>
                        <li>• File size: Under {TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-blue-800 mb-1">Content Requirements:</h5>
                      <ul className="text-xs text-blue-700 space-y-0.5 ml-2">
                        {TAVUS_VIDEO_REQUIREMENTS.REQUIRED_ELEMENTS.map((req, index) => (
                          <li key={index}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-xs font-medium text-red-800 mb-1">Avoid:</h5>
                      <ul className="text-xs text-red-700 space-y-0.5 ml-2">
                        {TAVUS_VIDEO_REQUIREMENTS.AVOID.map((avoid, index) => (
                          <li key={index}>• {avoid}</li>
                        ))}
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
