import { useState } from 'react';
import { supabase } from '../lib/auth';
import { uploadAvatar } from '../lib/api';
import { User } from '../lib/types';

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAvatarUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { url, error } = await uploadAvatar(file, user.id);
      if (error) throw error;

      await updateProfile(user.id, { avatar_url: url });
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {/* Profile content */}
    </div>
  );
}