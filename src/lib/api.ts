@@ -1,8 +1,9 @@
 import { supabase } from './auth';
 import { User } from './types';
 
-export async function uploadAvatar(file: File) {
+export async function uploadAvatar(file: File, userId: string) {
   try {
+    // Create filename with user ID as folder to enforce RLS
     const fileExt = file.name.split('.').pop();
-    const fileName = `${Math.random()}.${fileExt}`;
+    const fileName = `${userId}/${Math.random()}.${fileExt}`;
 
     const { error: uploadError } = await supabase.storage
       .from('avatars')
@@ -85,4 +86,4 @@
   } catch (error) {
     return { data: null, error };
   }
-}