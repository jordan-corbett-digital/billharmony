# AI Setup Guide for BillHarmony

This guide explains how to configure AI providers for BillHarmony's production features.

## Supported AI Providers

BillHarmony supports three AI providers:
1. **OpenAI** (GPT-4o-mini, GPT-4, etc.) - Recommended
2. **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus, etc.)
3. **Google Gemini** (Gemini 1.5 Flash, Gemini Pro, etc.)

You only need **one** API key. The app will automatically use the first available provider in the order listed above.

## Setup Instructions

### 1. Get an API Key

Choose one provider and get your API key:

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Google Gemini**: https://makersuite.google.com/app/apikey

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (this file is gitignored):

```bash
# For OpenAI (recommended)
VITE_OPENAI_API_KEY=sk-your-key-here
VITE_OPENAI_MODEL=gpt-4o-mini

# OR for Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
VITE_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# OR for Google Gemini
VITE_GEMINI_API_KEY=your-gemini-key-here
VITE_GEMINI_MODEL=gemini-1.5-flash
```

### 3. Restart Development Server

After adding your API key, restart the dev server:

```bash
npm run dev
```

## How It Works

### Automatic Fallback

- If an API key is configured, the app uses real LLM APIs
- If no API key is found, the app automatically falls back to rule-based logic
- If an LLM call fails, it gracefully falls back to rule-based logic

### Features Using AI

1. **Onboarding Assistant**: Conversational flow to collect user insurance information
2. **Procedure Parser**: Maps natural language to CPT codes
3. **Price Explanation**: Generates plain-English explanations of cost estimates

## Testing Without API Keys

The app works perfectly fine without API keys using rule-based fallbacks. This is useful for:
- Development and testing
- Demos without API costs
- Offline development

## Model Recommendations

### OpenAI
- **gpt-4o-mini**: Fast, cost-effective, good for most tasks (recommended)
- **gpt-4o**: More capable, higher cost
- **gpt-3.5-turbo**: Cheaper but less capable

### Anthropic
- **claude-3-5-sonnet-20241022**: Best balance of capability and cost (recommended)
- **claude-3-opus-20240229**: Most capable, highest cost

### Google Gemini
- **gemini-1.5-flash**: Fast and cost-effective (recommended)
- **gemini-1.5-pro**: More capable

## Troubleshooting

### "No LLM API key configured" Error

This means no API key was found. Either:
1. Add an API key to `.env.local`
2. Or the app will use rule-based fallbacks (which is fine for development)

### API Rate Limits

If you hit rate limits:
- Use a model with higher rate limits (e.g., gpt-4o-mini)
- Add retry logic (future enhancement)
- Consider using multiple API keys with load balancing (future enhancement)

### CORS Issues

If you see CORS errors when calling APIs:
- This shouldn't happen as we're calling APIs from the browser
- If it does, you may need to set up a backend proxy (future enhancement)

## Security Notes

⚠️ **Important**: API keys in `.env.local` are exposed to the browser in Vite apps. For production:

1. **Use a backend proxy** to keep API keys server-side
2. **Use environment-specific keys** with rate limiting
3. **Monitor API usage** to prevent abuse
4. **Consider using API key management services** (e.g., Vercel, Netlify)

## Next Steps

For production deployment, consider:
1. Setting up a backend API to proxy LLM calls
2. Implementing rate limiting per user
3. Adding caching for common queries
4. Monitoring API costs and usage

