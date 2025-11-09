<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gHYdPuXmTLjyQCNPX8rZksE7spLvK5Ns

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set up AI API key:
   - Create a `.env.local` file in the project root
   - Add one of the following (you only need one):
     ```
     VITE_OPENAI_API_KEY=your_key_here
     # OR
     VITE_ANTHROPIC_API_KEY=your_key_here
     # OR
     VITE_GEMINI_API_KEY=your_key_here
     ```
   - See [AI_SETUP.md](./AI_SETUP.md) for detailed instructions
   - **Note**: The app works without API keys using rule-based fallbacks

3. Run the app:
   ```bash
   npm run dev
   ```

## AI Configuration

For production AI features, see [AI_SETUP.md](./AI_SETUP.md) for:
- Supported AI providers (OpenAI, Anthropic, Gemini)
- API key setup
- Model recommendations
- Troubleshooting
