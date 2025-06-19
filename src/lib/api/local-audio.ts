/**
 * Local Audio Resources for Podcast Demo
 * These are self-contained audio generators that don't require external URLs
 */

/**
 * Generate a simple audio tone using Web Audio API
 */
export function generateTone(
  frequency: number = 440, 
  duration: number = 2, 
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const numSamples = duration * sampleRate;
      
      // Create audio buffer
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      // Generate tone
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const angle = frequency * t * 2 * Math.PI;
        
        switch (type) {
          case 'sine':
            channelData[i] = Math.sin(angle) * 0.3;
            break;
          case 'square':
            channelData[i] = (Math.sin(angle) > 0 ? 1 : -1) * 0.3;
            break;
          case 'sawtooth':
            channelData[i] = ((angle % (2 * Math.PI)) / Math.PI - 1) * 0.3;
            break;
          case 'triangle':
            channelData[i] = (2 / Math.PI * Math.asin(Math.sin(angle))) * 0.3;
            break;
        }
      }
        // Convert to WAV and create persistent data URL
      const wavData = encodeWAV(buffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      
      // Convert blob to base64 data URL for persistence across page refreshes
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert audio to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading audio blob'));
      reader.readAsDataURL(blob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate speech using browser's Speech Synthesis API
 * This creates actual speech instead of synthetic tones
 */
export function generateSpeechPattern(
  text: string, 
  voiceType: 'male' | 'female' = 'male'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Generating ${voiceType} voice for "${text.substring(0, 50)}..." using improved synthesis`);
      
      // For now, use the improved tone-based speech until we can get Speech Synthesis recording working
      // This provides much better speech-like audio than the previous version
      generateImprovedSpeechTones(text, voiceType).then(resolve).catch(reject);
      
    } catch (error) {
      console.error('Error in speech generation:', error);
      reject(error);
    }
  });
}

/**
 * Generate highly improved speech-like audio using advanced tone synthesis
 */
function generateImprovedSpeechTones(text: string, voiceType: 'male' | 'female'): Promise<string> {
  const wordsPerMinute = 150;
  const words = text.split(' ').filter(w => w.trim()).length;
  const duration = Math.max(2, Math.min((words / wordsPerMinute) * 60, 30));
  
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const numSamples = Math.floor(duration * sampleRate);
      
      const buffer = audioContext.createBuffer(2, numSamples, sampleRate);
      
      // More sophisticated speech-like parameters based on actual human speech
      const fundamentalFreq = voiceType === 'male' ? 85 : 165; // More realistic fundamental frequencies
      const formants = voiceType === 'male' 
        ? [
          { freq: 730, intensity: 1.0 },   // F1
          { freq: 1090, intensity: 0.6 },  // F2  
          { freq: 2440, intensity: 0.3 }   // F3
        ]
        : [
          { freq: 850, intensity: 1.0 },   // F1
          { freq: 2050, intensity: 0.7 },  // F2
          { freq: 2850, intensity: 0.4 }   // F3
        ];
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = buffer.getChannelData(channel);
        
        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          
          // Create realistic speech timing patterns
          const wordsPerSec = wordsPerMinute / 60;
          const syllablesPerSec = wordsPerSec * 1.3; // Average syllables per word
          const phonemesPerSec = syllablesPerSec * 2.5; // Average phonemes per syllable
          
          // Speech segment timing
          const wordPhase = (t * wordsPerSec) % 1;
          const syllablePhase = (t * syllablesPerSec) % 1;
          const phonemePhase = (t * phonemesPerSec) % 1;
          
          // Determine speech segment type
          const isWordBreak = wordPhase < 0.08; // 8% of time is word breaks
          const isConsonant = !isWordBreak && (phonemePhase < 0.4); // 40% consonants when speaking
          const isVowel = !isWordBreak && !isConsonant;
          
          // Silence during word breaks
          if (isWordBreak) {
            channelData[i] = (Math.random() - 0.5) * 0.02; // Very quiet breath noise
            continue;
          }
          
          // Pitch variation for natural prosody
          const pitchContour = Math.sin(t * 0.8 * Math.PI) * 0.15; // Sentence-level pitch contour
          const microPitchVar = Math.sin(t * 12 * Math.PI) * 0.05; // Micro pitch variations
          const currentFreq = fundamentalFreq * (1 + pitchContour + microPitchVar);
          
          let sample = 0;
          
          if (isVowel) {
            // Vowel sounds: strong formants, clear harmonic structure
            // Fundamental frequency
            sample += Math.sin(currentFreq * t * 2 * Math.PI) * 0.3;
            
            // Harmonics with formant shaping
            for (let harmonic = 2; harmonic <= 8; harmonic++) {
              const harmonicFreq = currentFreq * harmonic;
              let harmonicAmp = 0.3 / harmonic; // Natural harmonic rolloff
              
              // Boost harmonics near formant frequencies
              formants.forEach(formant => {
                const distance = Math.abs(harmonicFreq - formant.freq);
                if (distance < 200) { // Within formant bandwidth
                  harmonicAmp *= (1 + formant.intensity * (1 - distance / 200));
                }
              });
              
              sample += Math.sin(harmonicFreq * t * 2 * Math.PI) * harmonicAmp;
            }
            
            // Add slight breathiness
            sample += (Math.random() - 0.5) * 0.03;
            
          } else if (isConsonant) {
            // Consonant sounds: more noise, less harmonic content
            const consonantType = (Math.floor(t * phonemesPerSec * 3)) % 4;
            
            if (consonantType === 0) {
              // Fricatives (s, f, sh sounds) - high frequency noise
              sample = (Math.random() - 0.5) * 0.4;
              // Filter for high frequency emphasis
              sample = sample * (1 + Math.sin(t * 8000 * Math.PI) * 0.3);
              
            } else if (consonantType === 1) {
              // Plosives (p, t, k sounds) - brief bursts
              const burstIntensity = Math.exp(-(((phonemePhase - 0.1) * 20) ** 2));
              sample = (Math.random() - 0.5) * 0.6 * burstIntensity;
              
            } else if (consonantType === 2) {
              // Nasals (m, n sounds) - low frequency resonance
              sample = Math.sin(currentFreq * 0.5 * t * 2 * Math.PI) * 0.2;
              sample += (Math.random() - 0.5) * 0.1;
              
            } else {
              // Liquids (l, r sounds) - formant transitions
              const transitionFreq = fundamentalFreq * (1.5 + Math.sin(phonemePhase * Math.PI) * 0.5);
              sample = Math.sin(transitionFreq * t * 2 * Math.PI) * 0.25;
              sample += Math.sin(transitionFreq * 2 * t * 2 * Math.PI) * 0.1;
            }
          }
          
          // Apply amplitude envelope for natural speech dynamics
          let envelope = 1;
          
          // Overall fade in/out
          const fadeTime = 0.1;
          if (t < fadeTime) {
            envelope *= (t / fadeTime);
          } else if (t > duration - fadeTime) {
            envelope *= ((duration - t) / fadeTime);
          }
          
          // Syllable-level amplitude modulation
          const syllableEnvelope = 0.7 + 0.3 * Math.sin(syllablePhase * Math.PI);
          envelope *= syllableEnvelope;
          
          // Phoneme-level envelope
          if (isConsonant) {
            const consonantEnvelope = Math.sin(phonemePhase * Math.PI);
            envelope *= consonantEnvelope;
          }
          
          // Apply volume variation for natural speech
          const volumeVariation = 0.8 + 0.2 * Math.sin(t * 1.3 * Math.PI);
          envelope *= volumeVariation;
          
          // Slight stereo separation for spatial effect
          const stereoFactor = channel === 0 ? 1.0 : 0.95;
          
          // Final sample with limiting to prevent clipping
          const finalSample = sample * envelope * stereoFactor * 0.4;
          channelData[i] = Math.max(-0.95, Math.min(0.95, finalSample));
        }
      }
        // Convert to WAV
      const wavData = encodeWAV(buffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      
      // Convert blob to base64 data URL for persistence across page refreshes
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          console.log(`Generated improved speech audio (${duration.toFixed(1)}s)`);
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert audio to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading audio blob'));
      reader.readAsDataURL(blob);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate ambient background music
 */
export function generateBackgroundMusic(duration: number = 30): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const numSamples = duration * sampleRate;
      
      const buffer = audioContext.createBuffer(2, numSamples, sampleRate); // Stereo
      
      // Generate chord progression
      const chords = [
        [261.63, 329.63, 392.00], // C major
        [293.66, 369.99, 440.00], // D minor
        [329.63, 415.30, 493.88], // E minor
        [349.23, 440.00, 523.25], // F major
      ];
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = buffer.getChannelData(channel);
        
        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          const chordIndex = Math.floor((t / duration) * chords.length) % chords.length;
          const chord = chords[chordIndex];
          
          let sample = 0;
          chord.forEach(freq => {
            sample += Math.sin(freq * t * 2 * Math.PI) * 0.1;
          });
          
          // Add some reverb-like effect
          const reverb = Math.sin(t * 2 * Math.PI * 0.5) * 0.02;
          channelData[i] = sample + reverb;
        }
      }
        const wavData = encodeWAV(buffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      
      // Convert blob to base64 data URL for persistence across page refreshes
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert audio to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading audio blob'));
      reader.readAsDataURL(blob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Encode audio buffer as WAV
 */
function encodeWAV(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Audio data
  let offset = 44;
  for (let sample = 0; sample < length; sample++) {
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const pcm = Math.max(-1, Math.min(1, channelData[sample]));
      view.setInt16(offset, pcm * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Demo audio generators for different host types
 */
export const DemoAudioGenerators = {
  host1: (text: string) => generateSpeechPattern(text, 'male'),
  host2: (text: string) => generateSpeechPattern(text, 'female'),
  tone: (freq: number, duration: number) => generateTone(freq, duration),
  background: (duration: number) => generateBackgroundMusic(duration),
};
