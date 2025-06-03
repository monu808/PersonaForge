import { supabase } from './auth';
import { User } from './types';

export async function uploadAvatar(file: File) {
  try {
    const fileExt = file.name.split('.').pop();
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    // Create filename with user ID prefix for RLS
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl }, error: urlError } = await supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    if (urlError) throw urlError;
    
    // Return the public URL
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { url: null, error };
  }
}