import React from 'react';
import { TavusVideoResponse } from '@/lib/api/tavus';

interface TavusVideoGeneratorProps {
  personaId: string;
  onSuccess: (data: TavusVideoResponse) => void;
  onError: (error: Error) => void;
}

export function TavusVideoGenerator({ personaId, onSuccess, onError }: TavusVideoGeneratorProps) {
  const handleVideoSuccess = (data: TavusVideoResponse) => {
    console.log('Video generation started:', data);
    onSuccess(data);
  };

  const handleVideoError = (error: Error) => {
    console.error('Video generation failed:', error);
    onError(error);
  };

  return (
    <div>
      <h1>Generate Video</h1>
      {personaId ? (
        <div>
          {/* Video generation form/controls would go here */}
          <p>Video generation interface for persona: {personaId}</p>
        </div>
      ) : (
        <p>Please select a Persona/Replica first.</p>
      )}
    </div>
  );
}

export default TavusVideoGenerator;