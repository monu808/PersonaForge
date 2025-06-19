/**
 * ElevenLabs API Test Utility
 * Use this to test if your ElevenLabs API key is working
 */

import { generateSpeech } from './elevenlabs';

export async function testElevenLabsAPI(): Promise<void> {
  console.log('🧪 Testing ElevenLabs API...');
  
  // Check if API key is configured
  const hasApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  
  if (!hasApiKey) {
    console.error('❌ ElevenLabs API key not found!');
    console.log('💡 Please add VITE_ELEVENLABS_API_KEY to your .env file');
    return;
  }
  
  console.log('✅ ElevenLabs API key found');
  
  try {
    // Test with a simple text
    console.log('🔊 Testing speech generation...');
    
    const response = await generateSpeech({
      text: 'Hello, this is a test of the ElevenLabs text-to-speech API.',
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella voice
      model: 'eleven_monolingual_v1',
      stability: 0.5,
      similarityBoost: 0.8
    });
    
    if (response.audioUrl) {
      console.log('✅ ElevenLabs API test successful!');
      console.log('🎵 Generated audio URL:', response.audioUrl);
      
      // You can play this audio URL to test
      const audio = new Audio(response.audioUrl);
      audio.play().catch(e => console.log('Audio playback failed:', e));
      
    } else {
      console.error('❌ ElevenLabs API test failed:', response.error);
    }
    
  } catch (error) {
    console.error('❌ ElevenLabs API test error:', error);
  }
}

// Export for use in console
(window as any).testElevenLabsAPI = testElevenLabsAPI;
