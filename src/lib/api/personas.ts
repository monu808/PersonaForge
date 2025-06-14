import { supabase } from '@/lib/auth';
import { Persona } from '@/lib/types';
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