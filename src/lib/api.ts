import { supabase } from './auth';
import { User } from './types';

export async function uploadAvatar(file: File, userId: string) {
  try {
    // Create filename with user ID as folder to enforce RLS
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    return { data: fileName, error: null };
  } catch (error) {
    return { data: null, error };
  }
}