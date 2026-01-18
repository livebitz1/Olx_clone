# Firebase Phone Authentication Setup Guide

This guide will help you set up Firebase Phone Authentication for your OLX Clone app.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or select existing project)
3. Enter project name (e.g., "OLX Clone")
4. Enable/disable Google Analytics as needed
5. Click **"Create project"**

## Step 2: Add a Web App to Firebase

1. In your Firebase project, click the **gear icon** → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** `</>` to add a web app
4. Enter app nickname (e.g., "OLX Clone Web")
5. Click **"Register app"**
6. Copy the Firebase configuration object - you'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // → EXPO_PUBLIC_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com",  // → EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "your-project-id",       // → EXPO_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "xxx.appspot.com",   // → EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",     // → EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123"     // → EXPO_PUBLIC_FIREBASE_APP_ID
};
```

## Step 3: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"** if not already enabled
3. Go to **"Sign-in method"** tab
4. Click **"Phone"** provider
5. **Enable** the toggle
6. Click **"Save"**

## Step 4: Add Test Phone Numbers (Development)

For development/testing without using real SMS:

1. In **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **"Phone numbers for testing"**
3. Click **"Add phone number"**
4. Add test numbers like:
   - Phone: `+91 1234567890`, Code: `123456`
   - Phone: `+91 9876543210`, Code: `654321`
5. Click **"Save"**

> ⚠️ Test phone numbers bypass real SMS and don't count toward quota.

## Step 5: Configure Environment Variables

### Option A: Local Development (.env file)

Edit `/test-1/.env` and add your Firebase config:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

### Option B: EAS Build (for APK/Production)

Edit `/test-1/eas.json` and add your Firebase config in each build profile:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "AIzaSyD...",
        "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN": "your-project.firebaseapp.com",
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "your-project-id",
        "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET": "your-project.appspot.com",
        "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "123456789012",
        "EXPO_PUBLIC_FIREBASE_APP_ID": "1:123456789012:web:abc123def456"
      }
    }
  }
}
```

## Step 6: Add Authorized Domains (for Web)

For web platform to work with reCAPTCHA:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (when deployed)

## Step 7: Test the Integration

### Local Development:
```bash
cd test-1
npx expo start
```

### Build APK:
```bash
cd test-1
npx eas build --platform android --profile preview
```

## Troubleshooting

### "Firebase not configured" Error
- Make sure all `EXPO_PUBLIC_FIREBASE_*` variables are set in `.env`
- Restart the Expo dev server after changing `.env`

### "auth/too-many-requests" Error
- You've exceeded the SMS quota
- Use test phone numbers for development
- Wait a few hours for quota reset

### "auth/invalid-phone-number" Error
- Ensure phone number format is correct: `+91XXXXXXXXXX`
- Check that the country code is included

### "auth/captcha-check-failed" Error (Web)
- Make sure `localhost` is in authorized domains
- Check that reCAPTCHA container exists in the DOM

### OTP Not Received
- Check that phone number is correct
- Verify SMS is enabled in your region
- Check Firebase Phone Auth is enabled in console

## Cost Information

Firebase Phone Auth pricing:
- **Free**: First 10,000 SMS verifications/month
- **After free tier**: ~$0.01-0.06 per SMS (varies by country)

For India:
- Most SMS cost ~$0.01 each after free tier

## Files Changed

The following files are configured for Firebase Auth:

- `/lib/firebase.ts` - Firebase configuration and initialization
- `/contexts/FirebaseAuthContext.tsx` - Auth context with phone authentication
- `/contexts/OTPAuthContext.tsx` - Re-exports Firebase auth (backward compatible)
- `/app/auth/login.tsx` - Login screen with 6-digit OTP input
- `/app/_layout.tsx` - reCAPTCHA container for web
- `/.env` - Environment variables
- `/eas.json` - Build environment variables
