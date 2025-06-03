import { supabase } from './auth';
import { User } from './types';

export async function uploadAvatar(file: File) {
  try {
    // First check if bucket exists, if not create it
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (bucketError) throw bucketError;

    const avatarBucket = buckets?.find(b => b.name === 'avatars');
    
    if (!avatarBucket) {
      const { error: createError } = await supabase
        .storage
        .createBucket('avatars', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png']
        });

      if (createError) throw createError;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl }, error: urlError } = await supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (urlError) throw urlError;

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { url: null, error };
  }
}

export async function updateProfile(userId: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .limit(1);

    if (error) throw error;
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateUserSettings(userId: string, settings: User['settings']) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...settings })
      .select()
      .limit(1);

    if (error) throw error;
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1);

    // If no user found, return null data without throwing error
    if (!users || users.length === 0) {
      return { data: null, error: null };
    }

    if (userError) throw userError;

    const user = users[0];

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    // Settings might not exist yet, which is fine
    if (!settings || settings.length === 0) {
      return {
        data: { ...user, settings: null },
        error: null,
      };
    }

    if (settingsError) throw settingsError;

    return {
      data: { ...user, settings: settings[0] },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}