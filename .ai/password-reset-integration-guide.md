# Password Reset Integration Guide

## Complete Flow Overview

### 1. User Requests Password Reset

**Frontend → Backend:**
```typescript
POST /api/auth/reset-password-request
{
  "email": "user@example.com"
}
```

**Response (always 200):**
```json
{
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

**What happens:**
- Backend sends email via Supabase
- Supabase generates recovery link
- Email sent to user (if account exists)

---

### 2. User Clicks Email Link

**Email link format:**
```
http://127.0.0.1:54321/auth/v1/verify?token=pkce_XXX&type=recovery&redirect_to=http://127.0.0.1:3000/reset-password
```

**What happens:**
1. User clicks link
2. Supabase verifies the token
3. Supabase redirects to your app with tokens in URL hash

**Redirect URL format:**
```
http://127.0.0.1:3000/reset-password#access_token=XXX&refresh_token=YYY&type=recovery
```

---

### 3. Frontend Extracts Token from URL Hash

**Example frontend code (React):**

```typescript
// In your /reset-password page component
import { useEffect, useState } from 'react';

function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Extract tokens from URL hash
    const hash = window.location.hash.substring(1); // Remove '#'
    const params = new URLSearchParams(hash);

    const token = params.get('access_token');
    const type = params.get('type');

    // Verify it's a recovery flow
    if (token && type === 'recovery') {
      setAccessToken(token);
      setShowForm(true);

      // Clean up URL (remove hash)
      window.history.replaceState(null, '', '/reset-password');
    }
  }, []);

  if (!showForm) {
    return <div>Invalid or expired reset link</div>;
  }

  return <ResetPasswordForm accessToken={accessToken!} />;
}
```

---

### 4. User Submits New Password

**Frontend → Backend:**
```typescript
POST /api/auth/reset-password-confirm
{
  "access_token": "eyJhbGc...", // From URL hash
  "password": "NewSecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid token",
  "message": "This reset link is invalid or has expired"
}
```

**What happens:**
- Backend validates access_token
- Creates authenticated session
- Updates password in Supabase
- User can now login with new password

---

## Frontend Implementation Example

### Reset Password Form Component

```tsx
// src/components/auth/ResetPasswordForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordConfirmSchema } from '@/lib/schemas/auth.schema';
import type { z } from 'zod';

interface Props {
  accessToken: string;
}

type FormData = z.infer<typeof ResetPasswordConfirmSchema>;

export function ResetPasswordForm({ accessToken }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ResetPasswordConfirmSchema),
    defaultValues: {
      access_token: accessToken,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: data.access_token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to reset password');
        return;
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h2>Password updated successfully!</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register('access_token')} />

      <div>
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          disabled={isSubmitting}
        />
        {errors.password && (
          <span className="error">{errors.password.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && (
          <span className="error">{errors.confirmPassword.message}</span>
        )}
      </div>

      {error && <div className="error-alert">{error}</div>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}
```

---

## Password Requirements

The following requirements are enforced via Zod schema:

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one number
- ✅ At least one special character

---

## Security Features

### Email Enumeration Prevention
- Password reset request **always returns 200 success**
- Same message whether email exists or not
- Prevents attackers from discovering valid emails

### Token Security
- Access tokens are short-lived JWTs (1 hour default)
- Single-use tokens (invalidated after password update)
- Backend validates token by creating session before update

### Generic Error Messages
- "This reset link is invalid or has expired"
- No differentiation between invalid/expired/used tokens
- Prevents information leakage

---

## Environment Configuration

Make sure you have `SITE_URL` configured:

**.env**
```bash
SITE_URL=http://127.0.0.1:3000  # Development
# SITE_URL=https://yourdomain.com  # Production
```

This URL is used by Supabase for the `redirect_to` parameter in password reset emails.

---

## Supabase Dashboard Configuration

### 1. Site URL
- Navigate to: **Project Settings → API**
- Set **Site URL** to your app URL (e.g., `http://127.0.0.1:3000`)

### 2. Email Template (Optional customization)
- Navigate to: **Authentication → Email Templates → Reset Password**
- Default template should work fine
- Customize if you want branded emails

### 3. Email Provider
- Navigate to: **Authentication → Providers → Email**
- Ensure **Enable Email provider** is ON
- For production, configure SMTP settings (Supabase SMTP works for dev)

---

## Testing Checklist

### Request Flow
- [ ] Can request password reset with valid email
- [ ] Always returns success (even for non-existent email)
- [ ] Email is actually sent to valid email addresses
- [ ] No email sent to invalid addresses (check spam folder)

### Email Link
- [ ] Link in email is correctly formatted
- [ ] Clicking link redirects to your app with tokens in hash
- [ ] Tokens are present: `access_token`, `refresh_token`, `type=recovery`

### Confirm Flow
- [ ] Can extract access_token from URL hash
- [ ] Form shows when valid token detected
- [ ] Password validation works (min 8 chars, uppercase, number, special)
- [ ] Confirm password matching works
- [ ] Can successfully update password
- [ ] Can login with new password after reset

### Error Handling
- [ ] Expired token shows generic error
- [ ] Invalid token shows generic error
- [ ] Weak password shows validation errors
- [ ] Network errors handled gracefully

---

## Troubleshooting

### "This reset link is invalid or has expired"

**Possible causes:**
1. Token already used (single-use)
2. More than 1 hour passed since email sent
3. Token corrupted during URL copy/paste
4. Wrong environment (dev token used in production)

**Solution:** Request a new password reset

### Email not received

**Check:**
1. Spam/junk folder
2. Email provider in Supabase dashboard is enabled
3. SITE_URL matches your actual app URL
4. Supabase logs for email delivery status

### Access token extraction fails

**Check:**
1. URL hash contains `access_token` parameter
2. Supabase redirect_to URL is correct
3. No middleware/router stripping hash fragment
4. Frontend code correctly parses `window.location.hash`

---

## API Endpoints Reference

### POST /api/auth/reset-password-request
Initiates password reset flow

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

---

### POST /api/auth/reset-password-confirm
Confirms password reset and updates password

**Request:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

**Response (400 - Invalid/Expired Token):**
```json
{
  "error": "Invalid token",
  "message": "This reset link is invalid or has expired"
}
```
