import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle, Headphones, Waveform } from 'lucide-react';

interface PodcastProcessingStatusProps {
  podcastId: string;
  isProcessing: boolean;
  onComplete?: (podcastId: string) => void;
}

export default function PodcastProcessingStatus({ 
  podcastId, 
  isProcessing, 
  onComplete 
}: PodcastProcessingStatusProps) {
  const [status, setStatus] = useState<'processing' | 'completed' | 'error'>('processing');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing podcast creation...');

  useEffect(() => {
    if (!isProcessing) {
      setStatus('completed');
      setProgress(100);
      setStatusMessage('Podcast created successfully!');
      return;
    }

    // Simulate processing steps
    const steps = [
      { message: 'Generating script...', duration: 1000 },
      { message: 'Creating audio segments...', duration: 2000 },
      { message: 'Processing voice synthesis...', duration: 3000 },
      { message: 'Merging audio tracks...', duration: 2000 },
      { message: 'Finalizing podcast...', duration: 1000 },
    ];

    let currentStep = 0;
    let currentProgress = 0;

    const processStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setStatusMessage(step.message);
        
        const stepProgress = (currentStep + 1) / steps.length * 100;
        
        // Animate progress for this step
        const progressInterval = setInterval(() => {
          currentProgress += (stepProgress - currentProgress) * 0.1;
          setProgress(Math.min(currentProgress, stepProgress));
          
          if (currentProgress >= stepProgress - 1) {
            clearInterval(progressInterval);
            currentStep++;
            setTimeout(processStep, 500);
          }
        }, 100);
      } else {
        setStatus('completed');
        setProgress(100);
        setStatusMessage('Podcast created successfully!');
        onComplete?.(podcastId);
      }
    };

    const timer = setTimeout(processStep, 500);
    return () => clearTimeout(timer);
  }, [isProcessing, podcastId, onComplete]);

  useEffect(() => {
    // Listen for audio merging completion events
    const handleAudioMerged = (event: CustomEvent) => {
      if (event.detail.podcastId === podcastId) {
        setStatus('completed');
        setProgress(100);
        setStatusMessage('Audio merging completed!');
        onComplete?.(podcastId);
      }
    };

    window.addEventListener('podcastAudioMerged', handleAudioMerged as EventListener);
    return () => window.removeEventListener('podcastAudioMerged', handleAudioMerged as EventListener);
  }, [podcastId, onComplete]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  if (!isProcessing && status === 'completed') {
    return null; // Don't show once completed
  }

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center space-x-3 mb-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            Creating Enhanced Podcast
          </h4>
          <p className="text-sm text-gray-600">{statusMessage}</p>
        </div>
        <div className="flex space-x-1">
          <Headphones className="w-4 h-4 text-gray-400" />
          <Waveform className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {status === 'processing' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {status === 'completed' && (
        <div className="text-sm text-green-700">
          🎉 Your podcast is ready with merged audio tracks!
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-sm text-red-700">
          ❌ Failed to create enhanced podcast. Please try again.
        </div>
      )}
    </div>
  );
}
