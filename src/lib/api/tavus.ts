// Tavus API integration client for the frontend

import { supabase } from '@/lib/auth';

/**
 * Creates a new Tavus replica for the user
 * @param name The name of the replica
 * @param description Optional description
 */
export async function createTavusReplica(name: string, description?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    
    const { data, error } = await supabase.functions.invoke("tavus-api/create-replica", {
      body: {
        name,
        description,
        userId: user.id
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating Tavus replica:", error);
    return { data: null, error };
  }
}

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
  personaId?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    
    if (!script && !audioFile) {
      throw new Error("Either script or audioFile must be provided");
    }
    
    const { data, error } = await supabase.functions.invoke("tavus-api/generate-video", {
      body: {
        script,
        audio_file: audioFile,
        userId: user.id,
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
    const { data, error } = await supabase.functions.invoke("tavus-api/video-status", {
      body: { id: videoId }
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