# Backend Setup Guide - Secure API Key Storage

## Overview

The API keys are now stored securely in Firebase Functions (server-side) instead of being exposed in the client bundle.

## ✅ Already Completed

1. ✅ Functions code created (`functions/src/index.ts`)
2. ✅ Functions dependencies installed
3. ✅ API key set in Firebase config: `firebase functions:config:set gemini.key="..."`

## Next Steps

### 1. Enable Required APIs (if not already enabled)

Go to [Google Cloud Console](https://console.cloud.google.com/apis/library?project=spitegarden) and enable:
- Cloud Functions API
- Cloud Build API
- Artifact Registry API

Or wait a few minutes if you hit quota limits, then try deploying again.

### 2. Deploy Functions

```bash
npm run deploy:functions
```

Or deploy everything (hosting + functions):

```bash
npm run deploy:all
```

### 3. Verify Deployment

Check Firebase Console → Functions to see if `callLLM` function is deployed.

## How It Works

1. **Client** calls `callLLM()` in `services/llm/client.ts`
2. **Client** sends request to Firebase Function `callLLM` (no API key in request)
3. **Firebase Function** (server-side) retrieves API key from secure config
4. **Firebase Function** makes the actual API call to Gemini/OpenAI/Anthropic
5. **Firebase Function** returns the response to the client

## Security Benefits

✅ API keys never reach the browser  
✅ API keys not in source code  
✅ API keys not in Git  
✅ Can add rate limiting  
✅ Can add authentication  
✅ Can monitor usage  

## Troubleshooting

**"Quota exceeded" error:**
- Wait 1-2 minutes and try again
- Or enable APIs manually in Google Cloud Console

**"Function not found" errors:**
- Make sure functions are deployed: `npm run deploy:functions`
- Check Firebase Console → Functions
- Check browser console for specific error messages

## How It Works

1. **Client** calls `callLLM()` in `services/llm/client.ts`
2. **Client** sends request to Firebase Function `callLLM`
3. **Firebase Function** (server-side) has the API key
4. **Firebase Function** makes the actual API call to Gemini/OpenAI/Anthropic
5. **Firebase Function** returns the response to the client

## Security Benefits

✅ API keys never reach the browser  
✅ API keys not in source code  
✅ API keys not in Git  
✅ Can add rate limiting  
✅ Can add authentication  
✅ Can monitor usage  

## Testing Locally

You can test functions locally with:

```bash
cd functions
npm run serve
```

Then use the Firebase emulator URL in your local dev environment.

## Troubleshooting

If you get "Function not found" errors:
1. Make sure functions are deployed: `firebase deploy --only functions`
2. Check Firebase Console → Functions to see if `callLLM` is deployed
3. Check browser console for specific error messages

