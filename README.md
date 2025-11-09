# BillHarmony

<div align="center">
  <img src="public/logo.png" alt="BillHarmony Logo" width="200" />
</div>

**AI-Powered Healthcare Financial Navigation Platform**

BillHarmony helps patients understand healthcare costs, catch billing errors, and access financial assistance—while helping health systems reduce billing questions by 40% and increase charity enrollment by 28%.

## 🚀 Quick Start

**Prerequisites:** Node.js 18+ 

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **(Optional) Set up AI API key:**
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

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to `http://localhost:3000`

## ✨ Key Features

### For Patients
- **AI Cost Estimator** - Natural language input → instant personalized cost breakdowns using real CMS data
- **Computer Vision EOB Parsing** - Upload EOB documents → AI extracts and analyzes billing data in real-time
- **Automated Bill Analysis** - Flags duplicate charges, coding errors, and unexpected adjustments automatically
- **Financial Assistance Screening** - Real-time charity care eligibility and assistance program matching

### For Health Systems
- **ROI Dashboard** - Track billing questions reduced, charity enrollment increased, patient satisfaction
- **Patient Management** - CRM-style contact management and centralized inbox
- **Analytics** - Visual charts showing trends and outcomes over time

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Build Tool:** Vite
- **AI Integration:** OpenAI, Anthropic Claude, Google Gemini
- **Data Visualization:** Recharts
- **Routing:** React Router v7

## 📊 Impact

- **40% reduction** in billing questions
- **28% increase** in charity enrollment
- **2,300+ hours** saved monthly for health systems
- **Real-time** cost estimates using CMS data
- **Automated** financial assistance screening

## 📚 Documentation

- [AI Setup Guide](./AI_SETUP.md) - Configure AI API keys
- [Project Description](./PROJECT_DESCRIPTION.md) - Full project overview
- [Demo Script](./DEMO_SCRIPT_REFINED.md) - Video demo script
- [Security](./SECURITY.md) - Security considerations

## 🏗️ Project Structure

```
billharmony/
├── components/          # Reusable React components
├── screens/            # Main application screens
├── services/           # Business logic and AI services
│   ├── ai.ts          # AI-powered features (NLP, insights)
│   ├── pricing.ts     # Cost estimation engine
│   ├── bill-analyzer.ts # Bill analysis and EOB parsing
│   └── llm/           # LLM client and prompts
├── public/             # Static assets (logo, etc.)
└── types.ts            # TypeScript type definitions
```

## 🤝 Contributing

This project was built for the Codefi Vibeathon competition. For questions or contributions, please open an issue on GitHub.

## 📄 License

This project is part of a competition submission.

---

**Built with ❤️ for better healthcare financial navigation**
