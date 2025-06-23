# Google OAuth & Email Confirmation Setup Instructions for Supabase

## 1. Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and enable it
4. You'll need to configure:
   - **Client ID**: Get from Google Cloud Console
   - **Client Secret**: Get from Google Cloud Console

## 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Set **Application type** to **Web application**
6. Add authorized redirect URIs:
   ```
   https://ueoifolobucposyqafxe.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

## 3. Supabase Configuration

1. In Supabase dashboard, paste the Google credentials
2. Set **Redirect URLs** in Supabase Auth settings:
   ```
   http://localhost:5173/auth/callback
   https://your-domain.com/auth/callback
   http://localhost:5173/auth/email-confirm
   https://your-domain.com/auth/email-confirm
   ```

## 4. Email Confirmation Setup

The app now uses separate endpoints for different auth flows:

- **OAuth (Google sign-in)**: `/auth/callback`
- **Email confirmation**: `/auth/email-confirm`

Make sure both URLs are added to your Supabase Auth settings under **Redirect URLs**.

## 5. Environment Variables

Make sure these are set in your environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Common Issues

- **400 Bad Request**: Usually means Google OAuth is not enabled or credentials are incorrect
- **Redirect URI mismatch**: Make sure the redirect URI in Google Cloud Console matches exactly
- **CORS errors**: Check that your domain is allowed in Supabase Auth settings
- **Email confirmation not working**: Ensure `/auth/email-confirm` is added to Redirect URLs in Supabase

## Testing

1. Try signing in with Google
2. Try signing up with email and check email confirmation
3. Check browser network tab for any 400/401 errors
4. Verify redirect URLs are correct in the browser address bar during auth flows
