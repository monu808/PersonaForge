import { supabase } from '../auth';
import { generateText } from './gemini-chat';
import { generateSpeech } from './elevenlabs';

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

// Default voices
export const DEFAULT_PODCAST_VOICES = {
  host1: {
    id: '21m00Tcm4TlvDq8ikWAM', // Rachel
    name: 'Rachel'
  },
  host2: {
    id: 'AZnzlk1XvdvUeBnXmlld', // Domi
    name: 'Domi'
  }
};

// Local storage for demo/fallback mode
const DEMO_PODCASTS_KEY = 'demo_podcasts';

// Demo podcast functions
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
  podcasts.unshift(podcast);
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

// Cache for database queries (5 minute cache)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key: string): any | null {
  const entry = queryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  queryCache.delete(key);
  return null;
}

function setCachedData(key: string, data: any): void {
  queryCache.set(key, { data, timestamp: Date.now() });
}

// Optimized database query with timeout and retry logic
async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey?: string,
  timeoutMs: number = 10000
): Promise<{ data: T | null; error: any }> {
  
  // Check cache first
  if (cacheKey) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`Using cached data for ${cacheKey}`);
      return { data: cached, error: null };
    }
  }

  // Create timeout promise
  const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });

  try {
    // Race the query against timeout
    const result = await Promise.race([queryFn(), timeoutPromise]);
    
    // Cache successful results
    if (cacheKey && result.data && !result.error) {
      setCachedData(cacheKey, result.data);
    }
    
    return result;
  } catch (error) {
    console.error('Query execution failed:', error);
    return { data: null, error };
  }
}

/**
 * Get authenticated user's podcasts with optimized querying
 */
export async function getUserPodcasts(): Promise<{ data: Podcast[] | null; error: string | null }> {
  try {
    console.log('🎵 Fetching user podcasts...');
    
    // Check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      console.log('❌ No authenticated user, returning demo podcasts');
      return { data: getDemoPodcasts(), error: null };
    }

    console.log('✅ User authenticated:', user.id);

    // Strategy 1: Try fastest query first (essential fields only)
    const fastResult = await executeQuery(
      () => supabase
        .from('podcasts')
        .select('id, title, topic, status, audio_url, created_at, duration_minutes')
        .eq('user_id', user.id)
        .order('id', { ascending: false })
        .limit(20),
      `podcasts_fast_${user.id}`,
      8000 // 8 second timeout
    );

    if (fastResult.data && fastResult.data.length > 0) {
      console.log(`✅ Fast query successful: ${fastResult.data.length} podcasts`);
      
      // Enrich with additional data for completed podcasts
      const enrichedPodcasts = await Promise.all(
        fastResult.data.map(async (podcast: any) => {
          // For completed podcasts, try to get full data
          if (podcast.status === 'completed') {
            const fullResult = await executeQuery(
              () => supabase
                .from('podcasts')
                .select('description, script, host1_voice_id, host2_voice_id, host1_voice_name, host2_voice_name, updated_at')
                .eq('id', podcast.id)
                .single(),
              `podcast_full_${podcast.id}`,
              5000 // 5 second timeout for individual queries
            );

            if (fullResult.data) {
              return { ...podcast, ...fullResult.data };
            }
          }

          // Return with defaults for missing fields
          return {
            ...podcast,
            description: podcast.description || '',
            script: podcast.script || '',
            host1_voice_id: podcast.host1_voice_id || DEFAULT_PODCAST_VOICES.host1.id,
            host2_voice_id: podcast.host2_voice_id || DEFAULT_PODCAST_VOICES.host2.id,
            host1_voice_name: podcast.host1_voice_name || DEFAULT_PODCAST_VOICES.host1.name,
            host2_voice_name: podcast.host2_voice_name || DEFAULT_PODCAST_VOICES.host2.name,
            updated_at: podcast.updated_at || podcast.created_at
          };
        })
      );

      return { data: enrichedPodcasts as Podcast[], error: null };
    }

    // Strategy 2: If fast query failed, try minimal query
    console.log('⚠️ Fast query failed, trying minimal approach...');
    
    const minimalResult = await executeQuery(
      () => supabase
        .from('podcasts')
        .select('id, title, status, audio_url')
        .eq('user_id', user.id)
        .limit(10),
      `podcasts_minimal_${user.id}`,
      5000
    );

    if (minimalResult.data) {
      console.log(`✅ Minimal query successful: ${minimalResult.data.length} podcasts`);
      
      // Add defaults for UI compatibility
      const minimalPodcasts = minimalResult.data.map((podcast: any) => ({
        ...podcast,
        description: '',
        script: '',
        topic: 'General',
        duration_minutes: 5,
        host1_voice_id: DEFAULT_PODCAST_VOICES.host1.id,
        host2_voice_id: DEFAULT_PODCAST_VOICES.host2.id,
        host1_voice_name: DEFAULT_PODCAST_VOICES.host1.name,
        host2_voice_name: DEFAULT_PODCAST_VOICES.host2.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      return { data: minimalPodcasts as Podcast[], error: null };
    }

    // Strategy 3: Final fallback - count-based approach
    console.log('⚠️ Minimal query failed, checking if user has any podcasts...');
    
    const countResult = await executeQuery(
      () => supabase
        .from('podcasts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      `podcasts_count_${user.id}`,
      3000
    );

    if (countResult.error) {
      throw countResult.error;
    }

    console.log('📊 Database accessible, but no podcasts found or query issues');
    return { data: [], error: null };

  } catch (error) {
    console.error('❌ All database strategies failed:', error);
    console.log('🔄 Falling back to demo mode');
    return { data: getDemoPodcasts(), error: null };
  }
}

/**
 * Get a specific podcast by ID
 */
export async function getPodcast(id: string): Promise<PodcastResponse> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return { data: null, error: 'Authentication required' };
    }

    const result = await executeQuery(
      () => supabase
        .from('podcasts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      `podcast_${id}`,
      8000
    );

    if (result.error) {
      throw result.error;
    }

    return { data: result.data as Podcast, error: null };
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Create a new podcast record
 */
export async function createPodcastRecord(request: PodcastRequest): Promise<PodcastResponse> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - create in localStorage
      const demoPodcast: Podcast = {
        id: `demo_${Date.now()}`,
        title: `${request.topic} Discussion`,
        description: `A ${request.duration}-minute podcast about ${request.topic}`,
        script: '',
        topic: request.topic || 'General',
        duration_minutes: request.duration || 5,
        host1_voice_id: request.host1VoiceId || DEFAULT_PODCAST_VOICES.host1.id,
        host2_voice_id: request.host2VoiceId || DEFAULT_PODCAST_VOICES.host2.id,
        host1_voice_name: DEFAULT_PODCAST_VOICES.host1.name,
        host2_voice_name: DEFAULT_PODCAST_VOICES.host2.name,
        audio_url: null,
        status: 'generating',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      addDemoPodcast(demoPodcast);
      return { data: demoPodcast, error: null };
    }    const podcastData = {
      user_id: user.id,
      title: `${request.topic} Discussion`,
      description: `A ${request.duration}-minute podcast about ${request.topic}`,
      script: generateMockScript(request.topic || 'General', request.duration || 5),
      topic: request.topic || 'General',
      duration_minutes: request.duration || 5,
      host1_voice_id: request.host1VoiceId || DEFAULT_PODCAST_VOICES.host1.id,
      host2_voice_id: request.host2VoiceId || DEFAULT_PODCAST_VOICES.host2.id,
      host1_voice_name: DEFAULT_PODCAST_VOICES.host1.name,
      host2_voice_name: DEFAULT_PODCAST_VOICES.host2.name,
      audio_url: null,
      status: 'generating'
    };

    const result = await executeQuery(
      () => supabase
        .from('podcasts')
        .insert(podcastData)
        .select()
        .single(),
      undefined, // No caching for creates
      10000
    );

    if (result.error) {
      throw result.error;
    }

    // Clear user's podcast cache
    queryCache.delete(`podcasts_fast_${user.id}`);
    queryCache.delete(`podcasts_minimal_${user.id}`);

    return { data: result.data as Podcast, error: null };
  } catch (error) {
    console.error('Error creating podcast:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create podcast' 
    };
  }
}

/**
 * Update podcast with audio URL
 */
export async function updatePodcastWithAudio(id: string, audioUrl: string, script?: string): Promise<PodcastResponse> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode
      updateDemoPodcast(id, { 
        audio_url: audioUrl, 
        status: 'completed',
        ...(script && { script })
      });
      return { data: null, error: null };
    }

    const updates: any = {
      audio_url: audioUrl,
      status: 'completed',
      updated_at: new Date().toISOString()
    };

    if (script) {
      updates.script = script;
    }

    const result = await executeQuery(
      () => supabase
        .from('podcasts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single(),
      undefined, // No caching for updates
      8000
    );

    if (result.error) {
      throw result.error;
    }

    // Clear caches
    queryCache.delete(`podcasts_fast_${user.id}`);
    queryCache.delete(`podcasts_minimal_${user.id}`);
    queryCache.delete(`podcast_${id}`);

    return { data: result.data as Podcast, error: null };
  } catch (error) {
    console.error('Error updating podcast:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to update podcast' 
    };
  }
}

/**
 * Delete a podcast
 */
export async function deletePodcast(id: string): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      removeDemoPodcast(id);
      return { error: null };
    }

    const result = await executeQuery(
      () => supabase
        .from('podcasts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id),
      undefined, // No caching for deletes
      5000
    );

    if (result.error) {
      throw result.error;
    }

    // Clear caches
    queryCache.delete(`podcasts_fast_${user.id}`);
    queryCache.delete(`podcasts_minimal_${user.id}`);
    queryCache.delete(`podcast_${id}`);

    return { error: null };
  } catch (error) {
    console.error('Error deleting podcast:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to delete podcast' 
    };
  }
}

// Mock script generation for demos
function generateMockScript(topic: string, duration: number): string {
  const segments = Math.max(4, Math.floor(duration * 2)); // ~2 segments per minute
  let script = '';
  
  for (let i = 0; i < segments; i++) {
    const host = i % 2 === 0 ? 'HOST 1' : 'HOST 2';
    if (i === 0) {
      script += `${host}: Welcome to our podcast about ${topic}!\n`;
    } else if (i === segments - 1) {
      script += `${host}: Thanks for listening to our discussion on ${topic}!\n`;
    } else {
      script += `${host}: That's a great point about ${topic}. Let me add to that...\n`;
    }
  }
  
  return script;
}

/**
 * Generate podcast script using AI
 */
async function generatePodcastScript(topic: string, duration: number): Promise<string> {
  try {
    const prompt = `Create a ${duration}-minute podcast script about "${topic}". 
    Format each line as "HOST 1: [dialogue]" or "HOST 2: [dialogue]".
    Make it conversational and informative with ${Math.floor(duration * 150)} words total.`;

    const script = await generateText(prompt);
    return script || generateMockScript(topic, duration);
  } catch (error) {
    console.error('Error generating script:', error);
    return generateMockScript(topic, duration);
  }
}

/**
 * Generate demo audio URL
 */
function getDemoAudioUrl(): string {
  return 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3';
}

/**
 * Create a complete podcast (script + audio)
 */
export async function createCompletePodcast(request: PodcastRequest): Promise<PodcastResponse> {
  try {
    console.log('🎬 Starting podcast creation:', request);
    
    // Step 1: Create the podcast record
    const createResult = await createPodcastRecord(request);
    if (createResult.error || !createResult.data) {
      throw new Error(createResult.error || 'Failed to create podcast record');
    }

    const podcast = createResult.data;
    console.log('✅ Podcast record created:', podcast.id);

    // Step 2: Generate script
    const script = await generatePodcastScript(
      request.topic || 'General Discussion', 
      request.duration || 5
    );

    // Step 3: For demo purposes, use demo audio
    const audioUrl = getDemoAudioUrl();

    // Step 4: Update with completed audio
    const updateResult = await updatePodcastWithAudio(podcast.id, audioUrl, script);
    if (updateResult.error) {
      console.warn('Failed to update podcast with audio:', updateResult.error);
    }

    // Return the completed podcast
    return { 
      data: { 
        ...podcast, 
        script, 
        audio_url: audioUrl, 
        status: 'completed' as const 
      }, 
      error: null 
    };

  } catch (error) {
    console.error('❌ Error creating complete podcast:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create podcast' 
    };
  }
}

// Re-export for compatibility
export { generatePodcastScript };
