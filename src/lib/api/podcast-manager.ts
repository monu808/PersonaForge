/**
 * Comprehensive Podcast Management Service
 * Handles the complete podcast lifecycle including generation, merging, and playback
 */

import { createPodcastRecord, updatePodcastWithAudio, getUserPodcasts, getPodcast, deletePodcast, type Podcast, type PodcastRequest } from './podcasts';
import { mergeAudioSegments, createAudioMerger, type AudioSegment, type MergedPodcastResult } from './audio-merger';
import { generateSpeech } from './elevenlabs';

export interface PodcastWithMergedAudio extends Podcast {
  mergedAudio?: MergedPodcastResult;
  segments?: AudioSegment[];
  isProcessing?: boolean;
}

export interface PodcastGenerationOptions {
  enableMerging?: boolean;
  pauseBetweenSpeakers?: number;
  maxSegments?: number;
  quality?: 'draft' | 'standard' | 'high';
}

export class PodcastManager {
  private audioMerger = createAudioMerger();
  private processingQueue = new Map<string, Promise<any>>();
  private podcastCache = new Map<string, Podcast>(); // Cache for demo mode
  /**
   * Create a new podcast with enhanced audio processing
   */
  async createEnhancedPodcast(
    request: PodcastRequest,
    options: PodcastGenerationOptions = {}
  ): Promise<{ data: PodcastWithMergedAudio | null; error: string | null }> {
    try {
      console.log('Creating enhanced podcast with options:', options);
      
      // Create the podcast record without triggering audio generation
      const result = await createPodcastRecord(request);
      
      if (result.error || !result.data) {
        return result;
      }      const podcast = result.data as PodcastWithMergedAudio;

      // Cache the podcast for demo mode processing
      this.podcastCache.set(podcast.id, podcast);

      // If merging is disabled or not supported, return the basic podcast
      if (!options.enableMerging || !this.audioMerger.isAudioMergingSupported()) {
        console.log('Audio merging not enabled or supported, returning basic podcast');
        return { data: podcast, error: null };
      }

      // Mark as processing
      podcast.isProcessing = true;

      // Start background audio processing
      this.processAudioInBackground(podcast.id, options);

      return { data: podcast, error: null };

    } catch (error) {
      console.error('Error creating enhanced podcast:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create podcast' 
      };
    }
  }

  /**
   * Process audio merging in the background
   */
  private async processAudioInBackground(
    podcastId: string,
    options: PodcastGenerationOptions
  ): Promise<void> {
    // Prevent duplicate processing
    if (this.processingQueue.has(podcastId)) {
      console.log(`Podcast ${podcastId} is already being processed`);
      return;
    }

    const processingPromise = this.performAudioProcessing(podcastId, options);
    this.processingQueue.set(podcastId, processingPromise);

    try {
      await processingPromise;
    } finally {
      this.processingQueue.delete(podcastId);
    }
  }  /**
   * Perform the actual audio processing and merging
   */
  private async performAudioProcessing(
    podcastId: string,
    options: PodcastGenerationOptions
  ): Promise<void> {
    try {
      console.log(`Starting audio processing for podcast ${podcastId}`);

      // First try to get from cache (for demo mode)
      let podcast = this.podcastCache.get(podcastId);
      
      // If not in cache, try to fetch from database/demo storage
      if (!podcast) {
        const podcastResult = await getPodcast(podcastId);
        if (podcastResult.error || !podcastResult.data) {
          console.warn(`Failed to retrieve podcast ${podcastId} for processing: ${podcastResult.error}`);
          // Emit completion event for demo mode even if we can't fetch the podcast
          this.emitProcessingComplete(podcastId);
          return;
        }
        podcast = podcastResult.data;
      }

      console.log(`Processing podcast: ${podcast.title}`);

      // Parse the script to extract conversation segments
      const segments = this.extractAudioSegments(podcast.script);
      
      if (segments.length === 0) {
        console.warn('No audio segments found in podcast script');
        this.emitProcessingComplete(podcastId);
        return;
      }

      // Generate audio for each segment (this would integrate with the existing TTS system)
      const audioSegments = await this.generateSegmentAudio(segments, {
        quality: options.quality || 'standard',
        maxSegments: options.maxSegments || 10
      });

      if (audioSegments.length === 0) {
        console.warn('No audio segments generated successfully');
        return;
      }

      // Merge the audio segments
      const mergedResult = await mergeAudioSegments(audioSegments, {
        pauseBetweenSpeakers: options.pauseBetweenSpeakers || 1.0,
        fadeInDuration: 0.5,
        fadeOutDuration: 0.5
      });

      console.log(`Successfully merged ${audioSegments.length} segments into complete podcast`);

      // Update the podcast with merged audio (in a real app, you'd save this to the database)
      this.updatePodcastWithMergedAudio(podcastId, mergedResult, audioSegments);

    } catch (error) {
      console.error(`Error processing audio for podcast ${podcastId}:`, error);
    }
  }

  /**
   * Extract audio segments from podcast script
   */
  private extractAudioSegments(script: string): AudioSegment[] {
    const lines = script.split('\n').filter(line => line.trim());
    const segments: AudioSegment[] = [];
    let order = 0;

    for (const line of lines) {
      if (line.startsWith('HOST 1:')) {
        const text = line.replace('HOST 1:', '').trim();
        if (text) {
          segments.push({
            id: `host1-${order}`,
            host: 'host1',
            text,
            audioUrl: '', // Will be filled in during generation
            order: order++
          });
        }
      } else if (line.startsWith('HOST 2:')) {
        const text = line.replace('HOST 2:', '').trim();
        if (text) {
          segments.push({
            id: `host2-${order}`,
            host: 'host2',
            text,
            audioUrl: '', // Will be filled in during generation
            order: order++
          });
        }
      }
    }

    return segments;
  }  /**
   * Generate audio for segments using ElevenLabs API with fallback
   */
  private async generateSegmentAudio(
    segments: AudioSegment[],
    options: { quality: string; maxSegments: number }
  ): Promise<AudioSegment[]> {
    console.log(`Generating audio for ${segments.length} segments`);

    // Check if ElevenLabs API is available
    const hasElevenLabsAPI = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!hasElevenLabsAPI) {
      console.warn('ElevenLabs API key not found, falling back to demo mode');
      return this.generateDemoAudio(segments, options);
    }

    // Limit segments for performance
    const limitedSegments = segments.slice(0, options.maxSegments);
    const successfulSegments: AudioSegment[] = [];
    
    // Get voice IDs (you can customize these)
    const host1VoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella - female voice
    const host2VoiceId = 'TxGEqnHWrfWFTfGW9XjX'; // Josh - male voice
    
    // Generate audio sequentially to avoid rate limits
    for (const segment of limitedSegments) {
      try {
        console.log(`Generating ElevenLabs audio for ${segment.host}: ${segment.text.substring(0, 50)}...`);
        
        // Choose voice based on host
        const voiceId = segment.host === 'host1' ? host1VoiceId : host2VoiceId;
        
        // Generate speech using ElevenLabs API
        const response = await generateSpeech({
          text: segment.text,
          voiceId: voiceId,
          model: 'eleven_monolingual_v1',
          stability: 0.5,
          similarityBoost: 0.8
        });
        
        if (response.audioUrl) {
          // Calculate duration based on text length (roughly 150 words per minute)
          const wordsPerMinute = 150;
          const words = segment.text.split(' ').filter(w => w.trim()).length;
          const duration = Math.max(2, (words / wordsPerMinute) * 60);
          
          const updatedSegment = {
            ...segment,
            audioUrl: response.audioUrl,
            duration
          };
          
          successfulSegments.push(updatedSegment);
          console.log(`✓ ElevenLabs audio generated for segment ${segment.order} (${duration.toFixed(1)}s)`);
        } else {
          console.warn(`ElevenLabs API failed for segment ${segment.order}: ${response.error}`);
        }
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to generate ElevenLabs audio for segment ${segment.order}:`, error);
        // Continue with other segments instead of failing completely
      }
    }
    
    if (successfulSegments.length === 0) {
      console.warn('ElevenLabs failed for all segments, falling back to demo audio');
      return this.generateDemoAudio(segments, options);
    }
    
    console.log(`Successfully generated ${successfulSegments.length} out of ${limitedSegments.length} audio segments using ElevenLabs`);
    return successfulSegments;
  }

  /**
   * Fallback demo audio generation
   */
  private async generateDemoAudio(
    segments: AudioSegment[],
    options: { quality: string; maxSegments: number }
  ): Promise<AudioSegment[]> {
    console.log('Using demo audio generation as fallback');
    
    const limitedSegments = segments.slice(0, options.maxSegments);
    const successfulSegments: AudioSegment[] = [];
    
    // Import demo generators dynamically
    const { DemoAudioGenerators } = await import('./local-audio');
    
    for (const segment of limitedSegments) {
      try {
        console.log(`Generating demo audio for ${segment.host}: ${segment.text.substring(0, 50)}...`);
        
        const audioUrl = await DemoAudioGenerators[segment.host](segment.text);
        
        if (audioUrl) {
          const wordsPerMinute = 150;
          const words = segment.text.split(' ').filter(w => w.trim()).length;
          const duration = Math.max(2, (words / wordsPerMinute) * 60);
          
          const updatedSegment = {
            ...segment,
            audioUrl,
            duration
          };
          
          successfulSegments.push(updatedSegment);
          console.log(`✓ Demo audio generated for segment ${segment.order} (${duration.toFixed(1)}s)`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to generate demo audio for segment ${segment.order}:`, error);
      }
    }
    
    if (successfulSegments.length === 0) {
      throw new Error('Failed to generate any audio segments');
    }
    
    return successfulSegments;
  }/**
   * Update podcast with merged audio results
   */
  private async updatePodcastWithMergedAudio(
    podcastId: string,
    mergedResult: MergedPodcastResult,
    segments: AudioSegment[]
  ): Promise<void> {
    // Update the podcast record with the merged audio URL
    await updatePodcastWithAudio(podcastId, mergedResult.audioUrl, 'completed');
    
    // Emit an event that components can listen to
    const event = new CustomEvent('podcastAudioMerged', {
      detail: {
        podcastId,
        mergedResult,
        segments,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(event);
    console.log(`Podcast ${podcastId} audio merging completed`);
  }

  /**
   * Emit processing complete event for demo mode
   */
  private emitProcessingComplete(podcastId: string): void {
    const event = new CustomEvent('podcastAudioMerged', {
      detail: {
        podcastId,
        mergedResult: null,
        segments: [],
        timestamp: new Date().toISOString(),
        demoMode: true
      }
    });
    
    window.dispatchEvent(event);
    console.log(`Podcast ${podcastId} processing completed (demo mode)`);
  }

  /**
   * Get enhanced podcast with merged audio if available
   */
  async getEnhancedPodcast(podcastId: string): Promise<{ data: PodcastWithMergedAudio | null; error: string | null }> {
    const result = await getPodcast(podcastId);
    
    if (result.error || !result.data) {
      return result;
    }

    const podcast = result.data as PodcastWithMergedAudio;
    
    // Check if processing is in progress
    if (this.processingQueue.has(podcastId)) {
      podcast.isProcessing = true;
    }

    return { data: podcast, error: null };
  }

  /**
   * Get all enhanced podcasts for user
   */
  async getEnhancedUserPodcasts(): Promise<{ data: PodcastWithMergedAudio[] | null; error: string | null }> {
    const result = await getUserPodcasts();
    
    if (result.error || !result.data) {
      return result;
    }

    const enhancedPodcasts = result.data.map(podcast => {
      const enhanced = podcast as PodcastWithMergedAudio;
      
      // Check if processing is in progress
      if (this.processingQueue.has(podcast.id)) {
        enhanced.isProcessing = true;
      }

      return enhanced;
    });

    return { data: enhancedPodcasts, error: null };
  }

  /**
   * Delete podcast and cleanup resources
   */
  async deleteEnhancedPodcast(podcastId: string): Promise<{ error: string | null }> {
    // Cancel any ongoing processing
    if (this.processingQueue.has(podcastId)) {
      console.log(`Canceling processing for podcast ${podcastId}`);
      this.processingQueue.delete(podcastId);
    }

    return await deletePodcast(podcastId);
  }

  /**
   * Check if audio merging is supported
   */
  isMergingSupported(): boolean {
    return this.audioMerger.isAudioMergingSupported();
  }

  /**
   * Get processing status for a podcast
   */
  isProcessing(podcastId: string): boolean {
    return this.processingQueue.has(podcastId);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.audioMerger.dispose();
    this.processingQueue.clear();
  }
}

// Singleton instance
let podcastManagerInstance: PodcastManager | null = null;

export function getPodcastManager(): PodcastManager {
  if (!podcastManagerInstance) {
    podcastManagerInstance = new PodcastManager();
  }
  return podcastManagerInstance;
}

export function disposePodcastManager(): void {
  if (podcastManagerInstance) {
    podcastManagerInstance.dispose();
    podcastManagerInstance = null;
  }
}
