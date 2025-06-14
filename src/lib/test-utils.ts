// Test script to create a sample persona with replica ID for testing
// This is for development testing only

import { supabase } from './auth';

export async function createTestPersona() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('User not authenticated');
      return;
    }

    // Create a test persona with a mock replica ID
    const { data, error } = await supabase
      .from('personas')
      .insert({
        user_id: user.id,
        name: 'Test Educator Persona',
        description: 'A test persona for educational content',
        attributes: {
          traits: [
            { id: '1', name: 'Friendly', description: 'Warm and approachable', category: 'personality' },
            { id: '18', name: 'Educational', description: 'Focuses on teaching and learning', category: 'knowledge' }
          ],
          system_prompt: 'You are a friendly educational AI that helps people learn new concepts.',
          context: 'Educational content creator specializing in clear explanations.',
          // Mock replica ID for testing - replace with real replica ID once created
          default_replica_id: 'test-replica-id-12345'
        },
        replica_type: 'professional',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test persona:', error);
      return null;
    }

    console.log('Test persona created:', data);
    return data;
  } catch (error) {
    console.error('Error in createTestPersona:', error);
    return null;
  }
}

// Function to update a persona with a real replica ID
export async function updatePersonaWithReplicaId(personaId: string, replicaId: string) {
  try {
    const { data: persona, error: fetchError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (fetchError || !persona) {
      console.error('Error fetching persona:', fetchError);
      return null;
    }

    const { data, error } = await supabase
      .from('personas')
      .update({
        attributes: {
          ...persona.attributes,
          default_replica_id: replicaId
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', personaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating persona:', error);
      return null;
    }

    console.log('Persona updated with replica ID:', data);
    return data;
  } catch (error) {
    console.error('Error in updatePersonaWithReplicaId:', error);
    return null;
  }
}

// Export for use in browser console during testing
declare global {
  interface Window {
    createTestPersona: typeof createTestPersona;
    updatePersonaWithReplicaId: typeof updatePersonaWithReplicaId;
  }
}

if (typeof window !== 'undefined') {
  window.createTestPersona = createTestPersona;
  window.updatePersonaWithReplicaId = updatePersonaWithReplicaId;
}
