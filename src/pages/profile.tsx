@@ -88,7 +88,7 @@
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('No user found');
 
-      const { url, error } = await uploadAvatar(file);
+      const { url, error } = await uploadAvatar(file, user.id);
       if (error) throw error;
 
       await updateProfile(user.id, { avatar_url: url });