import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Function to check if environment variables are valid
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Initialize Supabase client with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate URL and key before creating client
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl) || 
      supabaseUrl === 'your_supabase_url' || supabaseAnonKey === 'your_supabase_anon_key') {
    console.error('Invalid Supabase configuration. Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    // Return a mock client that won't crash but will log errors on method calls
    return {
      auth: {
        signUp: () => Promise.resolve({ data: null, error: new Error('Invalid Supabase configuration') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Invalid Supabase configuration') }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Invalid Supabase configuration') }),
        signOut: () => Promise.resolve({ error: new Error('Invalid Supabase configuration') }),
        verifyOTP: () => Promise.resolve({ data: null, error: new Error('Invalid Supabase configuration') }),
        updateUser: () => Promise.resolve({ data: null, error: new Error('Invalid Supabase configuration') }),
        resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error('Invalid Supabase configuration') }),
        getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Invalid Supabase configuration') }),
        refreshSession: () => Promise.resolve({ data: { session: null }, error: new Error('Invalid Supabase configuration') })
      }
    };
  }
  
  // Create actual client if config is valid
  return createClient(supabaseUrl, supabaseAnonKey);
})();

// Validation schemas
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email is too short')
  .max(254, 'Email is too long');

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Must include country code.');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
});

// Auth functions
export async function signUp({ email, password, phone }: z.infer<typeof signUpSchema>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          phone_verified: false,
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn({ email, password }: { email: string; password: string }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'email profile',
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    // First, sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear all Supabase-related storage
    window.localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL + '-auth-token');
    window.sessionStorage.clear();

    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
}

export async function verifyOTP(phone: string, otp: string) {
  try {
    const { data, error } = await supabase.auth.verifyOTP({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error) throw error;

    // Update user metadata to mark phone as verified
    if (data.user) {
      await supabase.auth.updateUser({
        data: { phone_verified: true },
      });
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function resendOTP(phone: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Session management
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    return { session: null, error };
  }
}

export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    return { session: null, error };
  }
}