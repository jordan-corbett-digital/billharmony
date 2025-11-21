# Firebase Hosting Setup Guide

## Prerequisites

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

## Initial Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" or select an existing project
   - Note your project ID

2. **Initialize Firebase in your project**:
   ```bash
   firebase init hosting
   ```
   
   When prompted:
   - **Select an existing project** (or create a new one)
   - **Public directory**: `dist` (this is where Vite builds to)
   - **Configure as single-page app**: `Yes` (for HashRouter support)
   - **Set up automatic builds**: `No` (unless you want GitHub Actions)
   - **Overwrite index.html**: `No` (we already have firebase.json configured)

3. **Verify `.firebaserc` file**:
   The file should contain your project ID:
   ```json
   {
     "projects": {
       "default": "your-project-id"
     }
   }
   ```

## Building and Deploying

1. **Build your app**:
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**:
   ```bash
   npm run deploy
   ```
   
   Or use the Firebase CLI directly:
   ```bash
   firebase deploy --only hosting
   ```

3. **Your app will be live at**:
   `https://your-project-id.web.app` or `https://your-project-id.firebaseapp.com`

## Custom Domain (Optional)

1. In Firebase Console → Hosting → Add custom domain
2. Follow the verification steps
3. Update DNS records as instructed

## Environment Variables

⚠️ **Important**: For the AI features to work in production, you MUST configure your API keys in Firebase Functions.

We've provided a script to make this easy:

```bash
./scripts/setup-firebase-env.sh
```

This script will:
1. Ask for your API key (Gemini, OpenAI, or Anthropic)
2. Set it in the Firebase configuration
3. Offer to redeploy your functions

Alternatively, you can set it manually:

```bash
# For Gemini
firebase functions:config:set gemini.key="your-key-here"

# Then redeploy functions
firebase deploy --only functions
```

Since you're using Vite, environment variables prefixed with `VITE_` are included in the build automatically, but **API keys should NOT be exposed in client-side code** for production. The app is configured to use Firebase Functions as a secure proxy.

## Troubleshooting

- **404 errors on routes**: The `firebase.json` is already configured with rewrites to handle HashRouter
- **Build fails**: Make sure all dependencies are installed (`npm install`)
- **Deploy fails**: Check that you're logged in (`firebase login`) and have the correct project selected

## Quick Deploy Commands

```bash
# Build and deploy in one command
npm run deploy

# Just build
npm run build

# Preview build locally
npm run preview
```

