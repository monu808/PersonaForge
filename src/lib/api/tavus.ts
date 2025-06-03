import { supabase } from '@/lib/auth';

/**
 * Generates a video using the Tavus API
 * @param params Video generation parameters
 */
export async function generateTavusVideo({
  script,
  audioFile,
  personaId,
  metadata
}: {
  script?: string;
  audioFile?: string;
  personaId: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    
    if (!script && !audioFile) {
      throw new Error("Either script or audioFile must be provided");
    }
    
    const { data, error } = await supabase.functions.invoke("create-video", {
      body: {
        script,
        audio_file: audioFile,
        userId: user.id,
        personaId,
        metadata: {
          ...metadata,
          persona_id: personaId
        }
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error generating Tavus video:", error);
    return { data: null, error };
  }
}

/**
 * Checks the status of a Tavus video
 * @param videoId The Tavus video ID
 */
export async function checkTavusVideoStatus(videoId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("video-status", {
      queryParams: { id: videoId }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error checking Tavus video status:", error);
    return { data: null, error };
  }
}

/**
 * Fetches all Tavus videos for a persona
 * @param personaId The persona ID
 */
export async function getPersonaVideos(personaId: string) {
  try {
    const { data, error } = await supabase
      .from("persona_content")
      .select("*")
      .eq("persona_id", personaId)
      .eq("content_type", "video")
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching persona videos:", error);
    return { data: null, error };
  }
}