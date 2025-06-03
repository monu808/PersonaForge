import { supabase } from '@/lib/auth';
import { Persona } from '@/lib/types';

export async function createPersona({
  name,
  description,
  traits,
  imageUrl
}: {
  name: string;
  description: string;
  traits: any[];
  imageUrl?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('personas')
      .insert({
        user_id: user.id,
        name,
        description,
        attributes: {
          traits,
          image_url: imageUrl
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
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

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching personas:', error);
    return { data: null, error };
  }
}