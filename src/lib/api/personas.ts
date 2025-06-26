import { supabase } from '@/lib/auth';
import { syncService, syncEvents } from './sync-service';

export async function createPersona({
  name,
  description,
  traits,
  imageUrl,
  replicaType,
  systemPrompt,
  context,
  defaultReplicaId
}: {
  name: string;
  description: string;
  traits: any[];
  imageUrl?: string;
  replicaType: string;
  systemPrompt?: string;
  context?: string;
  defaultReplicaId?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');    const { data, error } = await supabase
      .from('personas')
      .insert({
        user_id: user.id,
        name,
        description,
        attributes: {
          traits,
          image_url: imageUrl,
          system_prompt: systemPrompt,
          context: context,
          default_replica_id: defaultReplicaId
        },
        replica_type: replicaType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Sync persona creation across all components
    await syncService.syncPersonaToNeurovia(data);
    await syncService.syncAllData();

    return { data, error: null };
  } catch (error) {
    console.error('Error creating persona:', error);
    return { data: null, error };
  }
}

export async function getPersonas() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;    // Trigger sync event for any listening components
    if (data) {
      syncEvents.emit('personas:fetched', data);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching personas:', error);
    return { data: null, error };
  }
}

export async function updatePersona(personaId: string, updates: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('personas')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', personaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Sync update across components
    await syncService.syncPersonaToNeurovia(data);
    await syncService.syncAllData();

    return { data, error: null };
  } catch (error) {
    console.error('Error updating persona:', error);
    return { data: null, error };
  }
}

export async function deletePersona(personaId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', personaId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Log deletion activity
    await syncService.logActivity(
      'persona_deleted',
      `Deleted persona: ${personaId}`,
      { persona_id: personaId }
    );

    // Sync deletion across components
    await syncService.syncAllData();

    return { error: null };
  } catch (error) {
    console.error('Error deleting persona:', error);
    return { error };
  }
}

/**
 * Create TAVUS persona for an existing persona that has a replica but no TAVUS persona
 */
export async function createTavusPersonaForExisting(personaId: string): Promise<{ success: boolean; error?: string; tavusPersonaId?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the persona data
    const { data: persona, error: fetchError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !persona) {
      throw new Error('Persona not found or access denied');
    }

    // Check if it already has TAVUS persona integration
    if (persona.attributes?.tavus_persona_id) {
      return { 
        success: false, 
        error: 'This persona already has TAVUS integration' 
      };
    }

    // Check if it has a replica ID
    const replicaId = persona.attributes?.default_replica_id;
    if (!replicaId) {
      return { 
        success: false, 
        error: 'This persona needs a replica first. Create a replica in the Replicas tab.' 
      };
    }

    // Import TAVUS function
    const { createTavusPersona } = await import('./tavus');
    
    // Prepare system prompt
    const systemPrompt = persona.attributes?.system_prompt || `You are ${persona.name}. ${persona.description}`;
    console.log('Creating TAVUS persona for existing persona:', {
      name: persona.name,
      replica_id: replicaId,
      system_prompt: systemPrompt
    });
    
    // Create TAVUS persona using the replica and persona data
    const tavusPersonaResponse = await createTavusPersona({
      persona_name: persona.name,
      replica_id: replicaId,
      personality_layers: {
        llm: {
          model: 'gpt-4',
          system_prompt: systemPrompt,
          context: persona.attributes?.context || `Persona type: ${persona.replica_type}. ${persona.description}`,
        },
        tts: {
          voice_settings: {
            speed: 'normal',
            emotion: ['neutral']
          }
        }
      }
    });

    if (!tavusPersonaResponse.persona_id) {
      throw new Error(tavusPersonaResponse.error || 'Failed to create TAVUS persona');
    }

    // Update the persona with TAVUS persona ID
    const { error: updateError } = await supabase
      .from('personas')
      .update({
        attributes: {
          ...persona.attributes,
          tavus_persona_id: tavusPersonaResponse.persona_id,
          tavus_integration_completed: true,
          tavus_integration_date: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', personaId);

    if (updateError) {
      throw new Error(`Failed to update persona: ${updateError.message}`);
    }

    return { 
      success: true, 
      tavusPersonaId: tavusPersonaResponse.persona_id 
    };

  } catch (error) {
    console.error('Error creating TAVUS persona for existing persona:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Sync existing TAVUS persona to a local persona
 */
export async function syncTavusPersonaToLocal(localPersonaId: string, tavusPersonaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the local persona to verify ownership
    const { data: persona, error: fetchError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', localPersonaId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !persona) {
      throw new Error('Local persona not found or access denied');
    }

    // Check if it already has TAVUS persona integration
    if (persona.attributes?.tavus_persona_id) {
      return { 
        success: false, 
        error: 'This persona already has TAVUS integration' 
      };
    }

    // Update the persona with TAVUS persona ID
    const { error: updateError } = await supabase
      .from('personas')
      .update({
        attributes: {
          ...persona.attributes,
          tavus_persona_id: tavusPersonaId,
          tavus_integration_completed: true,
          tavus_integration_date: new Date().toISOString(),
          tavus_sync_method: 'manual_sync'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', localPersonaId);

    if (updateError) {
      throw new Error(`Failed to update persona: ${updateError.message}`);
    }

    return { success: true };

  } catch (error) {
    console.error('Error syncing TAVUS persona to local:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}