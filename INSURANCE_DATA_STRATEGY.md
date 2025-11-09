# Insurance Data Strategy: Moving from Assumptions to Real Plan Data

## Current State (What We're Doing Now)

### What We Collect:
- Insurance company name (e.g., "BCBS", "Aetna")
- Deductible total (user-provided)
- Deductible met (user-provided)
- ZIP code (for regional pricing)

### What We Guess:
- **Coinsurance percentage** - We estimate 20% for PPO, 0% for HMO, etc.
- **Plan type** - We default to "PPO" 
- **Network status** - We assume "in-network" preference
- **Coverage** - We assume everything is covered
- **Copays** - We don't check copays at all (many plans use copays, not coinsurance!)
- **Allowed amounts** - We use regional averages, not plan-specific negotiated rates
- **Prior auth** - We guess based on procedure type, not actual plan rules

### The Problem:
Users don't know their coinsurance, copays, or plan details. We're making educated guesses that may be wrong.

---

## Better Approaches (Ranked by Feasibility for MVP)

### Option 1: EOB (Explanation of Benefits) Upload & AI Parsing ⭐⭐⭐⭐⭐
**Best for MVP/Competition**

**How it works:**
1. User uploads a recent EOB (PDF or image)
2. AI extracts:
   - Actual coinsurance percentage
   - Copay amounts
   - Network status (in/out of network)
   - Allowed amounts
   - Plan type
   - Member ID, Group number
   - OOP max
   - Coverage details

**Pros:**
- Users have EOBs (they get them after every visit)
- No API integration needed
- Can extract real plan data
- Works for any insurance company
- Can learn from multiple EOBs

**Cons:**
- Requires OCR/AI parsing (but we have LLM!)
- Users need to upload documents
- Privacy concerns (but we can process client-side)

**Implementation:**
- Add file upload to Settings
- Use vision model (GPT-4 Vision, Gemini Vision) to parse EOB
- Extract structured data into UserProfile
- Use extracted data instead of estimates

---

### Option 2: Insurance Card Scanning ⭐⭐⭐⭐
**Good for MVP**

**How it works:**
1. User scans insurance card (front/back)
2. Extract:
   - Member ID
   - Group number
   - Plan name/number
   - Insurance company
   - Payer ID (for API lookups)

**Pros:**
- Users have their card
- Can extract member ID for future API integration
- Can identify plan name/number
- Quick onboarding

**Cons:**
- Still need API or database to look up plan details
- Card formats vary widely
- May not have all details on card

**Implementation:**
- Add camera/upload to onboarding
- Use vision model to extract text
- Store member ID, group number
- Use for future API lookups or plan matching

---

### Option 3: Smart Questioning with Better Defaults ⭐⭐⭐
**Improvement on current approach**

**How it works:**
1. Ask smarter questions:
   - "Do you pay a copay or coinsurance after deductible?" (instead of guessing)
   - "What's your copay for specialist visits?" (if copay plan)
   - "Do you have separate deductibles for medical vs pharmacy?"
   - "Is this provider in-network?" (per estimate)

2. Use insurance company + ZIP to look up common plans
3. Build a database of common plan structures

**Pros:**
- No external dependencies
- Can improve over time
- Users might know some answers

**Cons:**
- Still relies on user knowledge
- Many users don't know their plan details
- Time-consuming for users

---

### Option 4: Insurance API Integration ⭐⭐
**Best for production, complex for MVP**

**APIs Available:**
- **Change Healthcare** (formerly Emdeon) - Real-time eligibility, benefits
- **Availity** - Eligibility, benefits, prior auth
- **CoverMyMeds** - Prior auth
- **Surescripts** - Eligibility
- **Insurance company direct APIs** (BCBS, Aetna, etc.)

**How it works:**
1. User provides Member ID, DOB, Group number
2. Call API to get:
   - Real-time eligibility
   - Actual benefits (deductible, coinsurance, copays)
   - Network status
   - Coverage details
   - Prior auth requirements

**Pros:**
- Most accurate data
- Real-time
- Can check network status
- Can get actual negotiated rates

**Cons:**
- Requires provider credentials (NPI, Tax ID)
- Expensive (per API call)
- Complex integration
- Not feasible for competition/MVP
- Many APIs require HIPAA compliance

---

### Option 5: Hybrid Approach (Recommended for MVP) ⭐⭐⭐⭐⭐
**Combine multiple methods**

**Phase 1: EOB Upload (Primary)**
- Ask users to upload 1-2 recent EOBs
- Extract all plan details
- Store in UserProfile

**Phase 2: Insurance Card (Secondary)**
- Scan card for Member ID, Group number
- Use for plan identification

**Phase 3: Smart Defaults (Fallback)**
- If no EOB, use improved defaults
- Ask 2-3 key questions:
  - "Do you pay copays or coinsurance?"
  - "What's your typical copay for specialist visits?"
  - "Is this provider in your network?"

**Phase 4: Learning System**
- When users correct estimates, learn from it
- Build database of plan patterns
- Improve defaults over time

---

## Recommended Implementation Plan

### Step 1: EOB Upload Feature (Highest Impact)
1. Add file upload to Settings screen
2. Use GPT-4 Vision or Gemini Vision to parse EOB
3. Extract:
   ```typescript
   {
     coinsurance: number, // Actual from EOB
     copays: {
       primaryCare: number,
       specialist: number,
       urgentCare: number,
       emergency: number
     },
     deductible: number, // Verify against user input
     oopMax: number,
     planType: string,
     memberId: string,
     groupNumber: string,
     networkStatus: 'in-network' | 'out-of-network',
     allowedAmount: number // From EOB
   }
   ```
4. Update UserProfile with extracted data
5. Use extracted data instead of estimates

### Step 2: Enhanced Cost Calculation
Update pricing engine to:
- Check for copays first (many plans use copays, not coinsurance!)
- Use actual coinsurance from EOB
- Use actual allowed amounts from EOB if available
- Check network status per provider

### Step 3: Insurance Card Scanning
- Add as optional step in onboarding
- Extract Member ID, Group number
- Store for future use

### Step 4: Better Questioning (If No EOB)
- Ask: "Do you pay copays or coinsurance?"
- If copays: Ask for copay amounts
- If coinsurance: Ask for percentage (or use estimate)

---

## Technical Implementation

### EOB Parser Service
```typescript
// services/eob-parser.ts
export async function parseEOB(file: File): Promise<EOBData> {
  // 1. Convert to image/base64
  // 2. Send to vision model with prompt
  // 3. Extract structured data
  // 4. Validate and return
}

interface EOBData {
  memberId: string;
  groupNumber: string;
  serviceDate: string;
  provider: string;
  procedure: string;
  cptCode?: string;
  billedAmount: number;
  allowedAmount: number;
  deductibleApplied: number;
  coinsuranceDue: number;
  copay?: number;
  totalOop: number;
  networkStatus: 'in-network' | 'out-of-network';
  planType?: string;
}
```

### Updated UserProfile
```typescript
export interface UserProfile {
  // ... existing fields
  
  // From EOB
  eobData?: {
    coinsurance: number; // Actual from EOB
    copays?: {
      primaryCare?: number;
      specialist?: number;
      urgentCare?: number;
      emergency?: number;
    };
    oopMax?: number;
    planType?: string;
    memberId?: string;
    groupNumber?: string;
    lastEOBDate?: string;
  };
  
  // From insurance card
  insuranceCard?: {
    memberId?: string;
    groupNumber?: string;
    planName?: string;
  };
}
```

### Updated Pricing Logic
```typescript
// Check copays first (many plans use copays, not coinsurance!)
if (profile.eobData?.copays?.specialist) {
  // Use copay instead of coinsurance calculation
  estimatedOop = profile.eobData.copays.specialist;
} else if (profile.eobData?.coinsurance) {
  // Use actual coinsurance from EOB
  coinsurance = profile.eobData.coinsurance;
} else {
  // Fall back to estimate
  coinsurance = estimateCoinsurance(planType, payer);
}
```

---

## Next Steps

1. **Implement EOB upload** (highest ROI)
2. **Add insurance card scanning** (quick win)
3. **Improve questioning** (if no EOB available)
4. **Build plan database** (long-term learning)

Which approach should we start with?

