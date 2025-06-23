# Email Confirmation Testing Guide

## How to Test Email Confirmation

### 1. Setup Requirements
- Ensure Supabase is configured with both redirect URLs:
  - `http://localhost:5173/auth/callback` (for OAuth)
  - `http://localhost:5173/auth/email-confirm` (for email confirmation)

### 2. Test Flow
1. Go to `/auth/sign-up`
2. Enter a valid email and password
3. Submit the form
4. You should see: "Success! Please check your email and click the confirmation link to activate your account."
5. Check your email for a confirmation link
6. Click the confirmation link
7. You should be redirected to `/auth/email-confirm`
8. The page should show "Confirming your email..." then "Email Confirmed!"
9. After 2 seconds, you should be redirected to `/dashboard`

### 3. URL Formats Handled

The email confirmation page can handle multiple URL formats:

**Format 1 (Modern Supabase)**:
```
/auth/email-confirm?access_token=...&refresh_token=...&expires_in=...&token_type=bearer&type=signup
```

**Format 2 (Legacy/OTP)**:
```
/auth/email-confirm?token_hash=...&type=email_confirmation
```

**Format 3 (Alternative)**:
```
/auth/email-confirm?token=...&type=email
```

### 4. Debugging
- Check browser console for detailed logs
- Look for "Email confirmation params:" in console
- Verify URL parameters in the confirmation link

### 5. Common Issues
- **"Invalid confirmation link"**: URL missing required parameters
- **"Token expired"**: User waited too long to click the link
- **Redirect loops**: Check that both auth pages are properly configured in Supabase

### 6. Fallback Flow
If email confirmation fails, users can:
1. Click "Try Creating Account Again" to restart signup
2. Click "Sign In Instead" if they believe their account is already active
