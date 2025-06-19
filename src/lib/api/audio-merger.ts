/**
 * Audio Merger Service
 * Handles combining multiple audio segments into a single podcast
 */

export interface AudioSegment {
  id: string;
  host: 'host1' | 'host2';
  text: string;
  audioUrl: string;
  order: number;
  duration?: number;
}

export interface MergeOptions {
  pauseBetweenSpeakers?: number; // seconds
  introMusic?: string;
  outroMusic?: string;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  backgroundMusic?: string;
  backgroundMusicVolume?: number; // 0-1
}

export interface MergedPodcastResult {
  audioUrl: string;
  duration: number;
  segments: AudioSegment[];
  metadata: {
    totalSegments: number;
    hosts: string[];
    mergedAt: string;
    fallback?: boolean;
  };
}

/**
 * Browser-based audio merging using Web Audio API
 */
export class AudioMerger {
  private audioContext: AudioContext | null = null;
  private isSupported: boolean;

  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isSupported = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.isSupported = false;
    }
  }
  /**
   * Check if audio merging is supported in this browser
   */
  isAudioMergingSupported(): boolean {
    return this.isSupported && !!this.audioContext;
  }
  /**
   * Merge multiple audio segments into a single podcast
   */
  async mergePodcastAudio(
    segments: AudioSegment[],
    options: MergeOptions = {}
  ): Promise<MergedPodcastResult> {
    if (!this.isSupported || !this.audioContext) {
      throw new Error('Audio merging not supported in this browser');
    }

    console.log('Starting audio merge for', segments.length, 'segments');

    try {
      // Sort segments by order
      const sortedSegments = [...segments].sort((a, b) => a.order - b.order);
      
      // Validate segments have audio
      const validSegments = sortedSegments.filter(segment => segment.audioUrl);
      if (validSegments.length === 0) {
        throw new Error('No valid audio segments to merge');
      }
      
      console.log(`Merging ${validSegments.length} valid segments out of ${sortedSegments.length} total`);
      
      // Load all audio buffers
      const audioBuffers = await this.loadAudioBuffers(validSegments);
      
      // Filter out any failed loads (silent buffers)
      const validBuffers = audioBuffers.filter(buffer => buffer.duration > 0.1);
      if (validBuffers.length === 0) {
        throw new Error('No valid audio buffers loaded');
      }
      
      // Calculate total duration with pauses
      const pauseDuration = options.pauseBetweenSpeakers || 0.5;
      const totalDuration = this.calculateTotalDuration(validBuffers, pauseDuration);
      
      console.log(`Creating merged buffer with duration: ${totalDuration.toFixed(2)}s`);
      
      // Create merged audio buffer
      const mergedBuffer = await this.createMergedBuffer(
        validBuffers, 
        totalDuration, 
        pauseDuration
      );
      
      // Convert to audio URL
      const audioUrl = await this.bufferToAudioUrl(mergedBuffer);
      
      const result = {
        audioUrl,
        duration: totalDuration,
        segments: validSegments,
        metadata: {
          totalSegments: validSegments.length,
          hosts: [...new Set(validSegments.map(s => s.host))],
          mergedAt: new Date().toISOString()
        }
      };
      
      console.log('Audio merge completed successfully:', result.metadata);
      return result;
      
    } catch (error) {
      console.error('Error merging audio:', error);
      
      // If merging fails, return the first valid segment as fallback
      const firstValidSegment = segments.find(s => s.audioUrl);
      if (firstValidSegment) {
        console.log('Falling back to first segment as merged audio');
        return {
          audioUrl: firstValidSegment.audioUrl,
          duration: firstValidSegment.duration || 5,
          segments: [firstValidSegment],
          metadata: {
            totalSegments: 1,
            hosts: [firstValidSegment.host],
            mergedAt: new Date().toISOString(),
            fallback: true
          }
        };
      }
      
      throw new Error('Failed to merge podcast audio and no fallback available');
    }
  }/**
   * Load audio buffers from URLs
   */
  private async loadAudioBuffers(segments: AudioSegment[]): Promise<AudioBuffer[]> {
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    const loadPromises = segments.map(async (segment) => {
      try {
        console.log(`Loading audio for ${segment.host} segment ${segment.order}`);
        
        // Handle blob URLs more carefully
        let arrayBuffer: ArrayBuffer;
        
        if (segment.audioUrl.startsWith('blob:')) {
          // For blob URLs, use a more direct approach
          try {
            const response = await fetch(segment.audioUrl, {
              method: 'GET',
              mode: 'cors',
              credentials: 'same-origin'
            });
            
            if (!response.ok) {
              throw new Error(`Blob fetch failed: ${response.statusText}`);
            }
            
            arrayBuffer = await response.arrayBuffer();
          } catch (fetchError) {
            console.warn(`Blob fetch failed for segment ${segment.order}, trying alternative method:`, fetchError);
            // Try XMLHttpRequest as fallback for blob URLs
            arrayBuffer = await this.loadBlobWithXHR(segment.audioUrl);
          }
        } else {
          // For regular URLs
          const response = await fetch(segment.audioUrl, {
            mode: 'cors',
            credentials: 'same-origin'
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.statusText}`);
          }
          
          arrayBuffer = await response.arrayBuffer();
        }
        
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        
        console.log(`Loaded audio buffer: ${audioBuffer.duration.toFixed(2)}s`);
        return audioBuffer;
        
      } catch (error) {
        console.error(`Failed to load audio for segment ${segment.order}:`, error);
        // Return silent buffer as fallback
        return this.createSilentBuffer(2.0); // 2 seconds silence for fallback
      }
    });

    return Promise.all(loadPromises);
  }

  /**
   * Load blob URL using XMLHttpRequest as fallback
   */
  private loadBlobWithXHR(blobUrl: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', blobUrl, true);
      xhr.responseType = 'arraybuffer';
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(`XHR failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('XHR network error'));
      xhr.send();
    });
  }

  /**
   * Calculate total duration including pauses
   */
  private calculateTotalDuration(buffers: AudioBuffer[], pauseDuration: number): number {
    const audioTime = buffers.reduce((total, buffer) => total + buffer.duration, 0);
    const pauseTime = (buffers.length - 1) * pauseDuration;
    return audioTime + pauseTime;
  }
  /**
   * Create merged audio buffer
   */
  private async createMergedBuffer(
    buffers: AudioBuffer[], 
    totalDuration: number, 
    pauseDuration: number
  ): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    const channels = Math.max(...buffers.map(b => b.numberOfChannels));
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.ceil(totalDuration * sampleRate);
    
    const mergedBuffer = this.audioContext.createBuffer(channels, length, sampleRate);
    
    let currentTime = 0;
    
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      const startSample = Math.floor(currentTime * sampleRate);
      
      // Copy audio data
      for (let channel = 0; channel < channels; channel++) {
        const sourceChannel = Math.min(channel, buffer.numberOfChannels - 1);
        const sourceData = buffer.getChannelData(sourceChannel);
        const targetData = mergedBuffer.getChannelData(channel);
        
        for (let sample = 0; sample < sourceData.length; sample++) {
          const targetIndex = startSample + sample;
          if (targetIndex < targetData.length) {
            targetData[targetIndex] = sourceData[sample];
          }
        }
      }
      
      currentTime += buffer.duration + pauseDuration;
      console.log(`Merged segment ${i + 1}, new position: ${currentTime.toFixed(2)}s`);
    }
    
    return mergedBuffer;
  }
  /**
   * Convert audio buffer to downloadable URL
   */
  private async bufferToAudioUrl(buffer: AudioBuffer): Promise<string> {
    const length = buffer.length;
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    
    // Create WAV file
    const wavBuffer = this.encodeWAV(buffer, length, channels, sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    
    // Convert blob to base64 data URL for persistence across page refreshes
    return new Promise((resolve, reject) => {
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
    });
  }

  /**
   * Encode audio buffer as WAV
   */
  private encodeWAV(
    buffer: AudioBuffer, 
    length: number, 
    channels: number, 
    sampleRate: number
  ): ArrayBuffer {
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
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

  /**
   * Write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  /**
   * Create silent audio buffer
   */
  private createSilentBuffer(duration: number): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    const sampleRate = this.audioContext.sampleRate;
    const length = Math.ceil(duration * sampleRate);
    return this.audioContext.createBuffer(1, length, sampleRate);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

/**
 * Utility function to create audio merger instance
 */
export function createAudioMerger(): AudioMerger {
  return new AudioMerger();
}

/**
 * Simple audio merger for basic concatenation
 */
export async function mergeAudioSegments(
  segments: AudioSegment[],
  options: MergeOptions = {}
): Promise<MergedPodcastResult> {
  const merger = createAudioMerger();
  
  try {
    return await merger.mergePodcastAudio(segments, options);
  } finally {
    merger.dispose();
  }
}
