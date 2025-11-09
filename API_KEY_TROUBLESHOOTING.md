# API Key Troubleshooting

## Issue: 401 Unauthorized Error

You're getting a 401 error which means the API key is being rejected by OpenAI.

### Possible Causes:

1. **Invalid API Key**: The key might be incorrect or copied incorrectly
2. **Expired/Revoked Key**: The key might have been revoked or expired
3. **Wrong Key Type**: Make sure you're using an OpenAI API key, not an organization key or other type
4. **Key Format Issue**: There might be extra spaces or characters

### How to Fix:

1. **Get a New API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Make sure it starts with `sk-` (for OpenAI)

2. **Update `.env.local`**:
   ```bash
   VITE_OPENAI_API_KEY=sk-your-new-key-here
   ```
   - Make sure there are NO spaces around the `=`
   - Make sure there are NO quotes around the key
   - Make sure the entire key is on one line

3. **Restart Your Dev Server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

4. **Verify the Key**:
   - Check the browser console - it should show the key length
   - The key should be around 50-70 characters long
   - It should start with `sk-`

### Alternative: Use a Different Provider

If OpenAI isn't working, you can try:

**Anthropic (Claude)**:
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Google Gemini**:
```bash
VITE_GEMINI_API_KEY=your-gemini-key-here
```

### Testing Your Key

You can test if your OpenAI key works by running this in your browser console after the app loads:

```javascript
// This will attempt to make a test API call
fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
  }
}).then(r => r.json()).then(console.log).catch(console.error)
```

If you get a 401, the key is invalid. If you get a list of models, the key works!

### Note

The app will still work without a valid API key - it will use rule-based fallbacks. But for the best experience, you'll want a working API key.

