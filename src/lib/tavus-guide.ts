/**
 * Tavus API Best Practices and Requirements Guide
 * 
 * This file contains comprehensive guidelines for working with Tavus API
 * based on documentation and best practices.
 */

// Training Video Requirements
export const TAVUS_VIDEO_REQUIREMENTS = {
  // Duration requirements
  MIN_DURATION_SECONDS: 10,
  MAX_DURATION_SECONDS: 120, // 2 minutes
  RECOMMENDED_DURATION_SECONDS: 30,  // Technical requirements
  MIN_RESOLUTION: '720p',
  RECOMMENDED_RESOLUTION: '1080p',
  SUPPORTED_FORMATS: ['mp4', 'mov', 'webm'],
  MAX_FILE_SIZE_MB: 50, // Supabase server-side limit
  RECOMMENDED_FILE_SIZE_MB: 25, // For better upload reliability
  SUPABASE_LIMIT_MB: 50, // Actual Supabase storage limit
  
  // Consent requirements
  REQUIRED_CONSENT_PHRASE: "I, Your Name, am currently speaking and give consent to Tavus to create an AI clone of me by using the audio and video samples I provide. I understand that this AI clone can be used to create videos that look and sound like me.",
  CONSENT_REQUIREMENTS: [
    'Must say the exact consent phrase clearly',
    'Consent phrase should be spoken at the beginning or end of video',
    'Clear pronunciation and audible speech required',
    'Must be the same person giving consent as appears in video'
  ],
  
  // Content requirements
  REQUIRED_ELEMENTS: [
    'Required consent phrase spoken clearly',
    'Clear face visibility (front-facing)',
    'Good lighting (well-lit face)',
    'Stable camera (minimal movement)',
    'Clear audio (speech)',
    'Single person in frame',
    'Looking at camera majority of time'
  ],
  
  AVOID: [
    'Multiple people in frame',
    'Poor lighting/shadows on face',
    'Profile shots or turned away',
    'Background music/noise',
    'Excessive camera movement',
    'Sunglasses or face coverings'
  ]
};

// Common error codes and solutions
export const TAVUS_ERROR_SOLUTIONS = {
  'CONSENT_PHRASE_MISMATCH': {
    message: 'Your consent phrase does not match our requirements',
    solution: `You must clearly say: "${TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE}" in your training video`
  },
  'CONSENT_PHRASE_NOT_DETECTED': {
    message: 'Required consent phrase not detected in training video',
    solution: `Ensure you clearly say: "${TAVUS_VIDEO_REQUIREMENTS.REQUIRED_CONSENT_PHRASE}" with clear audio`
  },
  'INSUFFICIENT_FACE_TIME': {
    message: 'Not enough clear face visibility in the training video',
    solution: 'Ensure the person is facing the camera for at least 80% of the video duration'
  },
  'POOR_VIDEO_QUALITY': {
    message: 'Video quality is too low for training',
    solution: 'Use at least 720p resolution with good lighting and stable camera'
  },
  'MULTIPLE_FACES': {
    message: 'Multiple faces detected in training video',
    solution: 'Ensure only one person is visible in the frame throughout the video'
  },
  'AUDIO_ISSUES': {
    message: 'Audio quality issues detected',
    solution: 'Ensure clear speech without background music or excessive noise'
  },
  'VIDEO_TOO_SHORT': {
    message: 'Training video is too short',
    solution: `Video must be at least ${TAVUS_VIDEO_REQUIREMENTS.MIN_DURATION_SECONDS} seconds long`
  },
  'VIDEO_TOO_LONG': {
    message: 'Training video is too long',
    solution: `Video must be less than ${TAVUS_VIDEO_REQUIREMENTS.MAX_DURATION_SECONDS} seconds long`
  },
  'INVALID_FORMAT': {
    message: 'Unsupported video format',
    solution: `Use one of the supported formats: ${TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.join(', ')}`
  }
};

// Status explanations
export const REPLICA_STATUS_GUIDE = {
  'training': {
    description: 'Replica is being processed and trained',
    timeEstimate: '15-30 minutes',
    action: 'Wait for completion, check status periodically'
  },
  'ready': {
    description: 'Replica is ready for video generation',
    timeEstimate: 'N/A',
    action: 'Can generate videos immediately'
  },
  'completed': {
    description: 'Replica training is completed and ready for video generation',
    timeEstimate: 'N/A',
    action: 'Can generate videos immediately'
  },
  'error': {
    description: 'Replica training failed due to issues with the training video',
    timeEstimate: 'N/A',
    action: 'Create a new replica with an improved training video'
  },
  'pending': {
    description: 'Replica creation request is queued',
    timeEstimate: '1-5 minutes',
    action: 'Wait for training to begin'
  }
};

// Video generation best practices
export const VIDEO_GENERATION_BEST_PRACTICES = {
  SCRIPT_GUIDELINES: [
    'Keep scripts conversational and natural',
    'Avoid overly long sentences',
    'Include natural pauses with punctuation',
    'Test with shorter scripts first',
    'Use clear, simple language'
  ],
  
  AUDIO_GUIDELINES: [
    'Use high-quality audio files (44.1kHz+)',
    'Ensure clear speech without background noise',
    'Keep audio length reasonable (under 2 minutes)',
    'Match the speaking style of the training video'
  ],
  
  PERFORMANCE_TIPS: [
    'Start with simple, short content',
    'Test replica quality before bulk generation',
    'Monitor generation times and adjust accordingly',
    'Use appropriate content for the replica personality'
  ]
};

// Troubleshooting checklist
export const TROUBLESHOOTING_CHECKLIST = {
  BEFORE_CREATING_REPLICA: [
    'Verify training video meets all requirements',
    'Test video playback and audio quality',
    'Ensure single person is clearly visible',
    'Check video duration and format',
    'Verify API key is valid and has credits'
  ],
  
  AFTER_REPLICA_ERROR: [
    'Review error message for specific issues',
    'Check training video against requirements',
    'Create new replica with improved video',
    'Test with a different training video',
    'Contact support if issues persist'
  ],
  
  FOR_VIDEO_GENERATION: [
    'Verify replica status is "ready"',
    'Test with short scripts first',
    'Check audio file quality if using audio',
    'Monitor generation progress',
    'Implement retry logic for transient errors'
  ]
};

export default {
  TAVUS_VIDEO_REQUIREMENTS,
  TAVUS_ERROR_SOLUTIONS,
  REPLICA_STATUS_GUIDE,
  VIDEO_GENERATION_BEST_PRACTICES,
  TROUBLESHOOTING_CHECKLIST
};
