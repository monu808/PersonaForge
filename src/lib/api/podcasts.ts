import { supabase } from '../auth';
import { generateText } from './gemini-chat';
import { generateSpeech } from './elevenlabs';
import { mergeAudioSegments, AudioSegment } from './audio-merger';

// Types
export interface PodcastRequest {
  topic?: string;
  duration?: number; // in minutes
  host1VoiceId?: string;
  host2VoiceId?: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  script: string;
  topic: string;
  duration_minutes: number;
  host1_voice_id: string;
  host2_voice_id: string;
  host1_voice_name: string;
  host2_voice_name: string;
  audio_url: string | null;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface PodcastResponse {
  data: Podcast | null;
  error: string | null;
}

// Available podcast topics
export const PODCAST_TOPICS = [
  'Technology & AI',
  'Science & Discovery',
  'History & Culture',
  'Health & Wellness',
  'Business & Finance',
  'Entertainment & Movies',
  'Sports & Athletics',
  'Travel & Adventure',
  'Food & Cooking',
  'Philosophy & Life',
  'Education & Learning',
  'Environment & Nature'
];

// Local storage key for demo podcasts
const DEMO_PODCASTS_KEY = 'demo_podcasts';

// Demo podcast storage functions
function getDemoPodcasts(): Podcast[] {
  try {
    const stored = localStorage.getItem(DEMO_PODCASTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDemoPodcasts(podcasts: Podcast[]): void {
  try {
    localStorage.setItem(DEMO_PODCASTS_KEY, JSON.stringify(podcasts));
  } catch (error) {
    console.error('Failed to save demo podcasts:', error);
  }
}

function addDemoPodcast(podcast: Podcast): void {
  const podcasts = getDemoPodcasts();
  podcasts.unshift(podcast); // Add to beginning
  saveDemoPodcasts(podcasts);
}

function updateDemoPodcast(id: string, updates: Partial<Podcast>): void {
  const podcasts = getDemoPodcasts();
  const index = podcasts.findIndex(p => p.id === id);
  if (index !== -1) {
    podcasts[index] = { ...podcasts[index], ...updates, updated_at: new Date().toISOString() };
    saveDemoPodcasts(podcasts);
  }
}

function removeDemoPodcast(id: string): void {
  const podcasts = getDemoPodcasts();
  const filtered = podcasts.filter(p => p.id !== id);
  saveDemoPodcasts(filtered);
}
export const DEFAULT_PODCAST_VOICES = {
  host1: {
    id: '21m00Tcm4TlvDq8ikWAM', // Rachel - Professional female voice
    name: 'Rachel'
  },
  host2: {
    id: 'AZnzlk1XvdvUeBnXmlld', // Domi - Professional male voice
    name: 'Domi'
  }
};

/**
 * Generate a podcast script using Gemini AI
 */
async function generatePodcastScript(topic: string, duration: number): Promise<string> {
  try {
    const prompt = `Create a podcast script for a ${duration}-minute episode about "${topic}". 

IMPORTANT: Format the script EXACTLY like this example:

HOST 1: Welcome to our podcast! Today we're discussing artificial intelligence.
HOST 2: Thanks for having me! AI is such a fascinating topic to explore.
HOST 1: Absolutely! Let's start with the basics for our listeners.
HOST 2: Great idea. Artificial intelligence refers to machines that can think and learn.

STRICT FORMATTING RULES:
- Each line must start with either "HOST 1: " or "HOST 2: " (no bold, no asterisks, no other formatting)
- No stage directions, no music cues, no action descriptions
- Just pure dialogue between the two hosts
- Keep each speaker turn to 1-3 sentences
- Make it conversational and natural
- Include interesting facts and examples
- Aim for roughly ${Math.floor(duration * 150)} words total (150 words per minute)

Topic: ${topic}

Generate the complete script now (remember: only HOST 1: and HOST 2: lines):`;

    const script = await generateText(prompt);
    
    // Clean up the script to ensure proper formatting
    const cleanedScript = script
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove any markdown formatting
        line = line.replace(/\*\*/g, '');
        // Ensure proper HOST format
        if (line.includes('HOST 1') && !line.startsWith('HOST 1:')) {
          line = line.replace(/.*HOST 1[:\s]*/, 'HOST 1: ');
        }
        if (line.includes('HOST 2') && !line.startsWith('HOST 2:')) {
          line = line.replace(/.*HOST 2[:\s]*/, 'HOST 2: ');
        }
        return line;
      })
      .filter(line => line.startsWith('HOST 1:') || line.startsWith('HOST 2:'))
      .join('\n');

    console.log('Generated and cleaned script:', cleanedScript.substring(0, 300) + '...');
    return cleanedScript || generateMockScript(topic, duration);
  } catch (error) {
    console.error('Error generating podcast script with AI, using fallback:', error);
    // Fallback to mock script if AI generation fails
    return generateMockScript(topic, duration);
  }
}

/**
 * Parse script and separate host dialogues
 */
function parseScript(script: string): { host1Parts: string[], host2Parts: string[] } {
  const lines = script.split('\n').filter(line => line.trim());
  const host1Parts: string[] = [];
  const host2Parts: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for HOST 1 (handle various formats)
    if (trimmedLine.match(/^(\*\*)?HOST\s*1(\*\*)?[\s:]/i)) {
      const text = trimmedLine
        .replace(/^(\*\*)?HOST\s*1(\*\*)?[\s:]+/i, '')
        .replace(/\*\*/g, '') // Remove any bold formatting
        .trim();
      if (text) host1Parts.push(text);
    }
    // Check for HOST 2 (handle various formats)
    else if (trimmedLine.match(/^(\*\*)?HOST\s*2(\*\*)?[\s:]/i)) {
      const text = trimmedLine
        .replace(/^(\*\*)?HOST\s*2(\*\*)?[\s:]+/i, '')
        .replace(/\*\*/g, '') // Remove any bold formatting
        .trim();
      if (text) host2Parts.push(text);
    }
  }

  console.log('Parsed script:', { host1Parts: host1Parts.length, host2Parts: host2Parts.length });
  console.log('Host 1 first part:', host1Parts[0]?.substring(0, 100));
  console.log('Host 2 first part:', host2Parts[0]?.substring(0, 100));
  return { host1Parts, host2Parts };
}

/**
 * Get a demo audio URL for testing
 */
function getDemoAudioUrl(): string {
  // Use a longer demo audio sample for better testing
  return 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3';
}

/**
 * Generate audio for podcast using ElevenLabs with proper conversation flow
 */
async function generatePodcastAudio(
  script: string,
  host1VoiceId: string,
  host2VoiceId: string,
  _podcastId: string
): Promise<string> {
  try {
    console.log('Starting audio generation for script:', script.substring(0, 200) + '...');
    const { host1Parts, host2Parts } = parseScript(script);
    
    // Check if we parsed any content
    if (host1Parts.length === 0 && host2Parts.length === 0) {
      console.warn('No host parts found in script, using demo audio');
      return getDemoAudioUrl();
    }
    
    // Check if we have ElevenLabs API available
    const hasElevenLabsAPI = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!hasElevenLabsAPI) {
      console.log('ElevenLabs API key not configured, using demo audio');
      return getDemoAudioUrl();
    }
    
    console.log('Generating audio with ElevenLabs API...');
    console.log(`Found ${host1Parts.length} parts for Host 1 and ${host2Parts.length} parts for Host 2`);
    
    // Create conversation sequence by interleaving host parts
    const conversationSequence = createConversationSequence(host1Parts, host2Parts);
    console.log('Conversation sequence created with', conversationSequence.length, 'parts');
    
    // For demo purposes, generate audio for first few parts sequentially
    const maxParts = Math.min(4, conversationSequence.length); // Generate first 4 parts for demo
    const audioResults = [];
    
    for (let i = 0; i < maxParts; i++) {
      const part = conversationSequence[i];
      console.log(`Generating audio for ${part.host} part ${i + 1}/${maxParts}: ${part.text.substring(0, 50)}...`);
      
      try {
        const voiceId = part.host === 'host1' ? host1VoiceId : host2VoiceId;
        const result = await generateSpeech({ 
          text: part.text, 
          voiceId: voiceId 
        });
        
        if (result.audioUrl) {
          audioResults.push({
            ...part,
            audioUrl: result.audioUrl,
            success: true
          });
          console.log(`Successfully generated audio for ${part.host} part ${i + 1}`);
        } else {
          console.warn(`Failed to generate audio for ${part.host} part ${i + 1}:`, result.error);
          audioResults.push({
            ...part,
            audioUrl: null,
            success: false,
            error: result.error
          });
        }
        
        // Add delay between requests to respect rate limits
        if (i < maxParts - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
        }
        
      } catch (error) {
        console.error(`Error generating audio for ${part.host} part ${i + 1}:`, error);
        audioResults.push({
          ...part,
          audioUrl: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('Audio generation completed. Results:', audioResults.map(r => ({ 
      host: r.host, 
      success: r.success,
      hasAudio: !!r.audioUrl 
    })));
      // Check if we have at least one successful audio generation
    const successfulAudios = audioResults.filter(r => r.success && r.audioUrl);
    
    if (successfulAudios.length === 0) {
      console.warn('No audio generated successfully, using demo audio');
      return getDemoAudioUrl();
    }
      // Create audio segments for merging
    const audioSegments: AudioSegment[] = successfulAudios
      .filter(result => result.audioUrl) // Ensure we have valid audio URLs
      .map((result, index) => ({
        id: `segment-${index}`,
        host: result.host as 'host1' | 'host2',
        text: result.text,
        audioUrl: result.audioUrl!,
        order: result.order,
        duration: result.text.length * 0.1 // Rough estimate
      }));
    
    console.log(`Generated ${successfulAudios.length} audio segments. Attempting to merge...`);
    
    // Try to merge audio segments into a complete podcast
    try {
      const mergedResult = await mergeAudioSegments(audioSegments, {
        pauseBetweenSpeakers: 1.0, // 1 second pause between speakers
        fadeInDuration: 0.5,
        fadeOutDuration: 0.5
      });
      
      console.log('Successfully merged audio segments into complete podcast');
      console.log(`Final podcast duration: ${mergedResult.duration.toFixed(2)}s`);
      
      return mergedResult.audioUrl;
        } catch (mergeError) {
      console.warn('Audio merging failed, returning first successful segment:', mergeError);
      // Fallback to first successful audio segment
      return successfulAudios[0].audioUrl || getDemoAudioUrl();
    }
    
  } catch (error) {
    console.error('Error generating podcast audio, using demo audio:', error);
    return getDemoAudioUrl();
  }
}

/**
 * Create conversation sequence by interleaving host parts
 */
function createConversationSequence(host1Parts: string[], host2Parts: string[]): Array<{host: string, text: string, order: number}> {
  const sequence = [];
  const maxParts = Math.max(host1Parts.length, host2Parts.length);
  
  for (let i = 0; i < maxParts; i++) {
    // Add Host 1 part if available
    if (i < host1Parts.length && host1Parts[i].trim()) {
      sequence.push({
        host: 'host1',
        text: host1Parts[i].trim(),
        order: sequence.length
      });
    }
    
    // Add Host 2 part if available
    if (i < host2Parts.length && host2Parts[i].trim()) {
      sequence.push({
        host: 'host2',
        text: host2Parts[i].trim(),
        order: sequence.length
      });
    }
  }
  
  return sequence;
}

/**
 * Create a new podcast
 */
export async function createPodcast(request: PodcastRequest): Promise<PodcastResponse> {
  try {
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    // Set defaults
    const topic = request.topic || PODCAST_TOPICS[Math.floor(Math.random() * PODCAST_TOPICS.length)];
    const duration = request.duration || Math.floor(Math.random() * 6) + 5; // 5-10 minutes
    const host1VoiceId = request.host1VoiceId || DEFAULT_PODCAST_VOICES.host1.id;
    const host2VoiceId = request.host2VoiceId || DEFAULT_PODCAST_VOICES.host2.id;    if (!user) {
      // Demo mode - create a mock podcast and store locally
      const mockPodcast = createMockPodcast(request);
      addDemoPodcast(mockPodcast);
      
      // Simulate audio generation after a delay
      setTimeout(async () => {
        try {
          // Try to create a more realistic demo audio
          const demoAudioUrl = await createFullDemoPodcast(topic, duration);
          const updatedPodcast = {
            ...mockPodcast,
            status: 'completed' as const,
            audio_url: demoAudioUrl
          };
          updateDemoPodcast(mockPodcast.id, updatedPodcast);
        } catch (error) {
          console.error('Error creating demo podcast:', error);
          // Fallback to simple demo audio
          const updatedPodcast = {
            ...mockPodcast,
            status: 'completed' as const,
            audio_url: getDemoAudioUrl()
          };
          updateDemoPodcast(mockPodcast.id, updatedPodcast);
        }
      }, 3000);
      
      return { data: mockPodcast, error: null };
    }

    try {
      // Try to use the database first
      // Generate podcast script
      const script = await generatePodcastScript(topic, duration);
      
      // Create title and description
      const title = `${topic}: An AI Podcast Discussion`;
      const description = `A ${duration}-minute podcast exploring ${topic.toLowerCase()} with engaging conversation and insights.`;

      // Create podcast record in database
      const { data: podcast, error: dbError } = await supabase
        .from('podcasts')
        .insert({
          user_id: user.id,
          title,
          description,
          script,
          topic,
          duration_minutes: duration,
          host1_voice_id: host1VoiceId,
          host2_voice_id: host2VoiceId,
          host1_voice_name: request.host1VoiceId ? 'Custom Voice 1' : DEFAULT_PODCAST_VOICES.host1.name,
          host2_voice_name: request.host2VoiceId ? 'Custom Voice 2' : DEFAULT_PODCAST_VOICES.host2.name,
          status: 'generating'
        })
        .select()
        .single();

      if (dbError || !podcast) {
        throw new Error('Database not available');
      }

      // Generate audio in the background
      generatePodcastAudio(script, host1VoiceId, host2VoiceId, podcast.id)
        .then(async (audioUrl) => {
          // Update podcast with audio URL
          await supabase
            .from('podcasts')
            .update({ 
              audio_url: audioUrl, 
              status: 'completed' 
            })
            .eq('id', podcast.id);
        })
        .catch(async (error) => {
          console.error('Background audio generation failed:', error);
          // Update podcast status to failed
          await supabase
            .from('podcasts')
            .update({ status: 'failed' })
            .eq('id', podcast.id);
        });

      return { data: podcast, error: null };
        } catch (dbError) {
      // Database not available, fall back to demo mode
      console.log('Database not available, using demo mode');
      
      const mockPodcast = createMockPodcast(request);
      addDemoPodcast(mockPodcast);
      
      // Simulate audio generation after a delay
      setTimeout(async () => {
        try {
          // Try to create a more realistic demo audio
          const demoAudioUrl = await createFullDemoPodcast(topic, duration);
          const updatedPodcast = {
            ...mockPodcast,
            status: 'completed' as const,
            audio_url: demoAudioUrl
          };
          updateDemoPodcast(mockPodcast.id, updatedPodcast);
        } catch (error) {
          console.error('Error creating demo podcast:', error);
          // Fallback to simple demo audio
          const updatedPodcast = {
            ...mockPodcast,
            status: 'completed' as const,
            audio_url: getDemoAudioUrl()
          };
          updateDemoPodcast(mockPodcast.id, updatedPodcast);
        }
      }, 3000);
      
      return { data: mockPodcast, error: null };
    }
    
  } catch (error) {
    console.error('Error creating podcast:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Create podcast record without triggering audio generation
 * Used by enhanced podcast manager to avoid double audio generation
 */
export async function createPodcastRecord(request: PodcastRequest): Promise<{ data: Podcast | null; error: string | null }> {  try {
    console.log('Creating podcast record for:', request.topic);
    
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    const { topic, duration, host1VoiceId, host2VoiceId } = request;// Validate required fields
    if (!topic) {
      throw new Error('Topic is required');
    }
    if (!duration || duration <= 0) {
      throw new Error('Valid duration is required');
    }

    // Generate script first
    const script = await generatePodcastScript(topic, duration);
    
    if (!script) {
      throw new Error('Failed to generate podcast script');
    }
      // Use default voices if not specified
    const finalHost1VoiceId = host1VoiceId || DEFAULT_PODCAST_VOICES.host1.id;
    const finalHost2VoiceId = host2VoiceId || DEFAULT_PODCAST_VOICES.host2.id;    // If user is not authenticated, fall back to demo mode immediately
    if (!user) {
      console.log('No authenticated user, falling back to demo mode');
      const mockPodcast = createMockPodcast(request);
      mockPodcast.script = script;
      mockPodcast.status = 'generating';
      addDemoPodcast(mockPodcast);
      
      return { data: mockPodcast, error: null };
    }

    try {
      console.log('Attempting to create podcast in database with user:', user.id);
      
      // Try to insert into database first
      const { data: podcast, error: dbError } = await supabase
        .from('podcasts')
        .insert({
          user_id: user.id,
          title: `Podcast: ${topic}`,
          topic,
          script,
          duration_minutes: duration, // Fixed: use duration_minutes to match database schema
          audio_url: '',
          host1_voice_id: finalHost1VoiceId,
          host2_voice_id: finalHost2VoiceId,
          host1_voice_name: request.host1VoiceId ? 'Custom Voice 1' : DEFAULT_PODCAST_VOICES.host1.name,
          host2_voice_name: request.host2VoiceId ? 'Custom Voice 2' : DEFAULT_PODCAST_VOICES.host2.name,
          status: 'generating' // Set to generating, will be updated by enhanced manager
        })
        .select()        .single();

      if (dbError || !podcast) {
        console.error('Database insert failed:', dbError);
        throw new Error(`Database error: ${dbError?.message || 'Unknown error'}`);
      }

      console.log('Podcast record created successfully:', podcast.id);
      return { data: podcast, error: null };} catch (dbError) {
      // Database not available, fall back to demo mode
      console.log('Database not available, using demo mode');
      
      const mockPodcast = createMockPodcast(request);
      mockPodcast.script = script;
      mockPodcast.status = 'generating';
      addDemoPodcast(mockPodcast);
      
      return { data: mockPodcast, error: null };
    }
    
  } catch (error) {
    console.error('Error creating podcast record:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create podcast record' 
    };
  }
}

/**
 * Update podcast with merged audio results
 */
export async function updatePodcastWithAudio(
  podcastId: string, 
  audioUrl: string, 
  status: 'completed' | 'failed' = 'completed'
): Promise<{ error: string | null }> {
  try {
    // Try to update in database first
    const { error: dbError } = await supabase
      .from('podcasts')
      .update({ 
        audio_url: audioUrl, 
        status 
      })
      .eq('id', podcastId);

    if (dbError) {
      // Fallback to demo mode
      console.log('Database update failed, updating demo podcast');
      const demoPodcasts = getDemoPodcasts();
      const podcastIndex = demoPodcasts.findIndex(p => p.id === podcastId);
      
      if (podcastIndex >= 0) {
        demoPodcasts[podcastIndex] = {
          ...demoPodcasts[podcastIndex],
          audio_url: audioUrl,
          status
        };
        localStorage.setItem('demo_podcasts', JSON.stringify(demoPodcasts));
      }
    }

    console.log(`Podcast ${podcastId} updated with audio URL and status: ${status}`);
    return { error: null };

  } catch (error) {
    console.error('Error updating podcast with audio:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update podcast' };
  }
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a mock podcast for demo purposes
 */
function createMockPodcast(request: PodcastRequest): Podcast {
  const topic = request.topic || PODCAST_TOPICS[Math.floor(Math.random() * PODCAST_TOPICS.length)];
  const duration = request.duration || Math.floor(Math.random() * 6) + 5;
  
  return {
    id: generateUUID(), // Use proper UUID format
    title: `${topic}: An AI Podcast Discussion`,
    description: `A ${duration}-minute podcast exploring ${topic.toLowerCase()} with engaging conversation and insights.`,
    script: generateMockScript(topic, duration),
    topic,
    duration_minutes: duration,
    host1_voice_id: request.host1VoiceId || DEFAULT_PODCAST_VOICES.host1.id,
    host2_voice_id: request.host2VoiceId || DEFAULT_PODCAST_VOICES.host2.id,
    host1_voice_name: DEFAULT_PODCAST_VOICES.host1.name,
    host2_voice_name: DEFAULT_PODCAST_VOICES.host2.name,
    audio_url: null, // Will be "generated" after a delay
    status: 'generating',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Generate a mock script for demo purposes
 */
function generateMockScript(topic: string, duration: number): string {
  const baseScript = `HOST 1: Welcome to today's podcast! I'm excited to dive into ${topic}. This is going to be a really interesting discussion.

HOST 2: Absolutely! This is such a fascinating topic. ${topic} has been gaining a lot of attention lately, and for good reason.

HOST 1: That's right. For our listeners who might be new to this subject, could you give us a brief overview of what ${topic} actually means?

HOST 2: Of course! ${topic} represents one of the most significant developments we're seeing today. The implications are far-reaching across multiple industries and everyday life.

HOST 1: I completely agree. What I find most interesting is how this impacts everyday people like our listeners.

HOST 2: Exactly! It's not just academic anymore - this has real-world applications that we're already starting to see implemented in various sectors.

HOST 1: Speaking of applications, can you share some specific examples that our audience might find relatable?

HOST 2: Well, there are several emerging use cases that are particularly promising. From healthcare to education, transportation to entertainment, the possibilities seem endless.

HOST 1: That's incredible. The pace of change is really accelerating, isn't it?

HOST 2: It absolutely is. What used to take years of development can now happen in months or even weeks. It's both exciting and a little overwhelming.

HOST 1: I think that's a great point. For someone listening who might feel overwhelmed by all this change, what advice would you give them?

HOST 2: My advice would be to stay curious and keep learning. ${topic} is evolving rapidly, and there are always new discoveries, but the fundamentals remain important.

HOST 1: Wise words! Any final thoughts as we wrap up today's episode?

HOST 2: Just remember that while technology advances quickly, human creativity and problem-solving remain at the heart of all innovation.

HOST 1: Perfect way to end it. Thank you for joining us today, and thank you to our listeners for tuning in.

HOST 2: Until next time, keep exploring and stay curious!`;

  // For longer durations, repeat some sections with variations
  if (duration > 5) {
    return baseScript + `

HOST 1: Before we go, I wanted to touch on one more aspect of ${topic} that I think deserves attention.

HOST 2: Oh yes, please do. There's always more to explore with this topic.

HOST 1: Well, I think it's important to consider both the opportunities and the challenges that come with these developments.

HOST 2: That's such an important balance to strike. We want to be optimistic about the future while being realistic about the hurdles we need to overcome.

HOST 1: Exactly. And I think our listeners appreciate that balanced perspective.

HOST 2: Absolutely. That's what makes these conversations so valuable - we're not just looking at one side of the story.

HOST 1: Well said. Thanks again for this great discussion.

HOST 2: Thank you too. This has been really enlightening.`;
  }
  return baseScript;
}

/**
 * Get all podcasts (now public for all users to see)
 */
export async function getUserPodcasts(): Promise<{ data: Podcast[] | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - return podcasts from localStorage
      return { data: getDemoPodcasts(), error: null };
    }

    try {
      // Fetch ALL podcasts, not just user's own podcasts
      const { data: podcasts, error } = await supabase
        .from('podcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: podcasts, error: null };
    } catch (dbError) {
      // Database not available, fall back to demo mode
      console.log('Database not available, using demo mode');
      return { data: getDemoPodcasts(), error: null };
    }
    
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get a specific podcast (now public for all users)
 */
export async function getPodcast(id: string): Promise<PodcastResponse> {
  try {
    const { data: podcast, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data: podcast, error: null };
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Delete a podcast (now public for all users)
 */
export async function deletePodcast(id: string): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - remove from localStorage
      removeDemoPodcast(id);
      return { error: null };
    }

    try {
      // Remove user_id restriction - allow anyone to delete any podcast
      const { error } = await supabase
        .from('podcasts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (dbError) {
      // Database not available, fall back to demo mode
      console.log('Database not available, using demo mode');
      removeDemoPodcast(id);
      return { error: null };
    }
    
  } catch (error) {
    console.error('Error deleting podcast:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Helper function to create a full demo podcast in demo mode
async function createFullDemoPodcast(topic: string, duration: number): Promise<string> {
  // For demo purposes, we'll create a longer, more realistic script
  // and then simulate a complete podcast experience
  
  const fullScript = generateMockScript(topic, duration);
  const { host1Parts, host2Parts } = parseScript(fullScript);
  
  console.log('Creating full demo podcast with script length:', fullScript.length);
  console.log(`Found ${host1Parts.length} Host 1 parts and ${host2Parts.length} Host 2 parts`);
  
  // Use the complete podcast demo function
  return createCompletePodcastDemo(topic, duration);
}

/**
 * Simulate a complete podcast experience by creating a longer demo audio
 * In production, this would merge actual audio files from both hosts
 */
function createCompletePodcastDemo(topic: string, duration: number): string {
  // Return a longer demo audio that simulates a complete podcast
  // This is a placeholder for the actual audio merging functionality
  console.log(`Creating complete podcast demo for topic: ${topic}, duration: ${duration} minutes`);
  
  // Use a longer sample that better represents a podcast experience
  // In production, this would be the merged audio of all host parts in conversation order
  const podcastUrls = [
    'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3',
    'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    'https://commondatastorage.googleapis.com/codeskulptor-assets/sounddogs/thrust.mp3'
  ];
  
  // Return a random podcast-like audio for demo
  return podcastUrls[Math.floor(Math.random() * podcastUrls.length)];
}

/**
 * Regenerate audio for an existing podcast (useful when blob URLs become invalid)
 */
export async function regeneratePodcastAudio(podcastId: string): Promise<PodcastResponse> {
  try {
    // First get the existing podcast
    const { data: podcast, error: fetchError } = await getPodcast(podcastId);
    
    if (fetchError || !podcast) {
      return { data: null, error: fetchError || 'Podcast not found' };
    }

    console.log('Regenerating audio for podcast:', podcast.title);

    // Check if we have the script to regenerate from
    if (!podcast.script) {
      return { data: null, error: 'Cannot regenerate audio: podcast script not found' };
    }

    // Update status to generating
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (user) {
      try {
        await supabase
          .from('podcasts')
          .update({ status: 'generating', updated_at: new Date().toISOString() })
          .eq('id', podcastId);
      } catch (updateError) {
        console.log('Could not update status in database, continuing...');
      }
    }    // Regenerate the audio using the existing script
    const audioUrl = await generatePodcastAudio(
      podcast.script,
      podcast.host1_voice_id,
      podcast.host2_voice_id,
      podcastId
    );

    const updatedPodcast = {
      ...podcast,
      audio_url: audioUrl,
      status: 'completed' as const,
      updated_at: new Date().toISOString()
    };

    // Update in database if user is authenticated
    if (user) {
      try {
        await supabase
          .from('podcasts')
          .update({ 
            audio_url: audioUrl, 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', podcastId);
      } catch (updateError) {
        console.log('Could not update podcast in database, continuing...');
      }
    } else {
      // Update in localStorage for demo mode
      updateDemoPodcast(podcastId, { 
        audio_url: audioUrl, 
        status: 'completed',
        updated_at: new Date().toISOString()
      });
    }

    return { data: updatedPodcast, error: null };

  } catch (error) {
    console.error('Error regenerating podcast audio:', error);
    
    // Update status to failed
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (user) {
      try {
        await supabase
          .from('podcasts')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', podcastId);
      } catch (updateError) {
        console.log('Could not update status in database');
      }
    }

    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
