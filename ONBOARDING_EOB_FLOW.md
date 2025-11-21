# Onboarding Flow with EOB Option

## Recommended Approach: Two-Path Onboarding

### Path 1: EOB Upload (Fast & Accurate) ⚡
**User chooses: "I have an EOB"**

1. Upload EOB (PDF or photo)
2. AI extracts all plan details:
   - Coinsurance percentage
   - Copay amounts
   - Deductible (verify)
   - OOP max
   - Plan type
   - Member ID, Group number
3. Ask for ZIP code (for regional pricing)
4. **Done!** - Profile complete with real data

**Time: ~30 seconds** (just upload + ZIP)

### Path 2: Quick Questions (Current Flow) ⚡
**User chooses: "I don't have an EOB" or skips**

1. ZIP code
2. Insurance company
3. Deductible (optional)
4. Preferred providers (optional)
5. **Done!** - Profile complete with estimates

**Time: ~1-2 minutes** (conversational)

### At the End (Both Paths):
Offer: *"Want more accurate estimates? You can upload an EOB anytime in Settings to use your actual plan details."*

---

## UI Flow

### Initial Screen (Modal):
```
┌─────────────────────────────────────┐
│  Set Up Your Profile                │
├─────────────────────────────────────┤
│                                     │
│  For the most accurate estimates,   │
│  we can use your insurance EOB.    │
│                                     │
│  [📄 I have an EOB]                │
│                                     │
│  [💬 Answer a few questions]       │
│                                     │
└─────────────────────────────────────┘
```

### If EOB Path:
1. File upload component
2. "Processing your EOB..." (AI extraction)
3. "What's your ZIP code?" (for regional pricing)
4. "Profile complete! ✅"

### If Questions Path:
- Current conversational flow
- At end: "Profile complete! You can upload an EOB later in Settings for more accurate estimates."

---

## Benefits

✅ **Low friction** - Users can skip EOB if they don't have it
✅ **Fast either way** - EOB path is actually FASTER (no questions!)
✅ **Accurate when possible** - EOB gives real data
✅ **Can improve later** - Upload EOB in Settings anytime
✅ **Best of both worlds** - Fast onboarding + accurate data when available

---

## Implementation

### Step 1: Add EOB Upload Option to Onboarding
- Add initial choice screen
- File upload component
- EOB parser service

### Step 2: Update Onboarding Flow
- If EOB uploaded: Skip questions, extract data, ask ZIP
- If no EOB: Current conversational flow

### Step 3: Settings Integration
- Add "Upload EOB" option in Settings
- Can update profile anytime with real data

---

## Technical Details

### EOB Parser
```typescript
// services/eob-parser.ts
export async function parseEOB(file: File): Promise<EOBData> {
  // 1. Convert to base64
  // 2. Send to vision model (GPT-4 Vision or Gemini Vision)
  // 3. Extract structured data
  // 4. Return EOBData
}
```

### Updated Onboarding Flow
```typescript
// components/OnboardingFlow.tsx
const OnboardingFlow = () => {
  const [hasEOB, setHasEOB] = useState<boolean | null>(null);
  const [eobData, setEobData] = useState<EOBData | null>(null);
  
  if (hasEOB === null) {
    // Show choice screen
    return <EOBChoiceScreen onChoose={setHasEOB} />;
  }
  
  if (hasEOB && !eobData) {
    // Show EOB upload
    return <EOBUpload onUpload={setEobData} />;
  }
  
  if (hasEOB && eobData) {
    // EOB path: Just ask for ZIP
    return <ZIPOnlyFlow eobData={eobData} />;
  }
  
  // Questions path: Current flow
  return <CurrentConversationalFlow />;
};
```

---

## Alternative: Simpler Approach

If we want to keep it even simpler:

1. **Start with current questions** (fast, low friction)
2. **At the end**: "Want more accurate estimates? Upload an EOB to use your actual plan details."
   - Optional button: "Upload EOB"
   - If clicked: Upload → Extract → Update profile
   - If skipped: Done with estimates

This way:
- Onboarding stays exactly the same (no changes)
- EOB is optional enhancement
- Can be added later without disrupting flow

---

## Recommendation

I recommend the **simpler approach**:
- Keep current onboarding flow as-is
- Add EOB upload as optional at the end
- Also add EOB upload to Settings

This gives us:
- ✅ No disruption to current flow
- ✅ EOB available when users want it
- ✅ Can improve accuracy anytime
- ✅ Easier to implement

What do you think?


