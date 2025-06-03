import { supabase } from './auth';
import { User } from './types';

export async function uploadAvatar(file: File, userId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    
    // Create filename with user ID prefix for RLS
    const fileName = `${userId}/${Math.random()}.${fileExt}`;

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

export async function getUserProfile(userId: string) {
  try {
    // Get user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) throw settingsError;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    // If no profile exists, create a default profile object
    const userProfile = profile || {
      id: userId,
      email: null, // Will be populated from auth.user
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: 'user',
      full_name: null,
      avatar_url: null,
      bio: null,
      location: null,
      social_links: {}
    };

    // If no settings exist, use default values
    const defaultSettings = {
      profile_visibility: 'private',
      email_notifications: true,
      theme: 'system'
    };

    return { 
      data: { ...userProfile, settings: settings || defaultSettings }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
}

export async function updateProfile(userId: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        ...updates
      }, { onConflict: 'id' })
      .select()

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}

export async function updateUserSettings(userId: string, settings: UserSettings) {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...settings });
    return { error };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { error };
  }
}