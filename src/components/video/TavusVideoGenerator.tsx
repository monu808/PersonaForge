import React from 'react';
import { TavusVideoGenerator } from '@/components/video/TavusVideoGenerator_Updated'; // Use the correct path/name
import { TavusVideoResponse } from '@/lib/api/tavus';

function GenerateVideoPage({ currentPersonaId }: { currentPersonaId: string }) {
  
  const handleVideoSuccess = (data: TavusVideoResponse) => {
    console.log('Video generation started:', data);
    // Update UI, maybe add video to a list with status 'processing'
    // data contains { id, status }
  };

  const handleVideoError = (error: Error) => {
    console.error('Video generation failed:', error);
    // Show error message to user
  };

  return (
    <div>
      <h1>Generate Video</h1>
      {currentPersonaId ? (
        <TavusVideoGenerator 
          personaId={currentPersonaId} // Pass the actual Tavus replica_id here
          onSuccess={handleVideoSuccess} 
          onError={handleVideoError} 
        />
      ) : (
        <p>Please select a Persona/Replica first.</p>
      )}
    </div>
  );
}

export default GenerateVideoPage;
