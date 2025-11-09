# Cost Estimator Implementation Plan

## Current State Analysis

### What We Have:
- ✅ Basic pricing engine logic (deductible, coinsurance, OOP max calculations)
- ✅ User profile with insurance details
- ✅ AI procedure parsing framework (`parseProcedureIntent`)
- ✅ Regional benchmark loading structure
- ✅ Provider recommendation system structure
- ✅ Hardcoded CPT benchmarks (10 procedures)
- ✅ Hardcoded provider list (5 providers)

### What's Missing:
- ❌ Real CPT code database/mapping
- ❌ Actual price transparency data integration
- ❌ Insurance-specific negotiated rates
- ❌ Comprehensive AI prompts for CPT identification
- ❌ Data caching/storage strategy
- ❌ Hospital MRF (Machine-Readable File) parsing

---

## Data Sources Available

### 1. **CMS Price Transparency Files (Hospital MRFs)**
- **What**: Hospitals are required by law to publish machine-readable files with:
  - Negotiated rates with all payers
  - Standard charges (cash prices)
  - Shoppable services
- **Format**: JSON, CSV, or proprietary formats
- **Access**: Publicly available on hospital websites
- **Challenges**: 
  - Inconsistent formats across hospitals
  - Large file sizes (can be GBs)
  - Need to aggregate across many hospitals
  - Requires parsing and normalization

### 2. **CMS Physician Fee Schedule (PFS)**
- **What**: Medicare payment rates for CPT codes
- **Format**: Structured data files from CMS
- **Access**: Free download from CMS website
- **Use Case**: Baseline pricing, regional adjustments (GPCI)
- **Limitation**: Medicare rates, not commercial insurance rates

### 3. **CMS Transparency in Coverage (TiC) Files**
- **What**: Insurance companies must publish negotiated rates
- **Format**: JSON files (in-network, out-of-network)
- **Access**: Available from insurance company websites
- **Use Case**: Insurance-specific negotiated rates
- **Challenges**: 
  - Very large files (can be 100+ GB per insurer)
  - Need to filter by user's plan
  - Requires significant storage/processing

### 4. **CPT Code Database**
- **What**: Official CPT code descriptions and metadata
- **Sources**: 
  - AMA CPT database (requires license)
  - CMS HCPCS files (free)
  - Open-source alternatives
- **Use Case**: Procedure identification, validation, descriptions

### 5. **Regional Cost Data**
- **What**: Geographic cost adjustments
- **Sources**:
  - CMS Geographic Practice Cost Index (GPCI)
  - CMSA (Core-Based Statistical Area) data
  - ZIP to CBSA mapping
- **Use Case**: Adjusting base prices for regional variations

### 6. **Provider Directories**
- **What**: Network status, specialties, locations
- **Sources**:
  - Insurance company provider directories
  - CMS NPPES (National Plan and Provider Enumeration System)
  - Google Places API / healthcare-specific APIs
- **Use Case**: Finding in-network providers, distance calculations

---

## AI Capabilities Needed

### 1. **Natural Language → CPT Code Mapping**
**Current**: Basic rule-based + LLM parsing
**Needed**: Enhanced AI with:
- Comprehensive CPT knowledge base
- Understanding of procedure variations:
  - With/without contrast
  - Laterality (left, right, bilateral)
  - Modifiers (e.g., -26 for professional component)
  - Site of service (inpatient, outpatient, freestanding)
- Confidence scoring for ambiguous cases
- Ability to ask clarifying questions

**Implementation**:
```typescript
// Enhanced prompt with CPT knowledge
const CPT_PARSING_PROMPT = `
You are a medical coding expert. Your task is to identify CPT codes from natural language.

Available CPT categories:
- Radiology/Imaging: 70000-79999
- Evaluation & Management: 99201-99499
- Surgery: 10000-69999
- Laboratory: 80000-89999
- Medicine: 90000-99999

For each procedure, identify:
1. Primary CPT code(s)
2. Modifiers (if any)
3. Site of service (inpatient/outpatient/freestanding)
4. Contrast/sedation flags
5. Laterality (left/right/bilateral)

Return structured JSON with confidence scores.
`;
```

### 2. **CPT Code Validation & Expansion**
- Validate that identified CPT codes exist
- Suggest related codes (e.g., if user says "knee MRI", suggest 73721, 73722, 73723)
- Handle bundled procedures
- Identify if prior authorization is typically required

### 3. **Price Explanation Generation**
- Explain why the estimate is what it is
- Break down deductible vs. coinsurance
- Compare to regional averages
- Explain network vs. out-of-network differences

---

## Architecture Plan

### Phase 1: Enhanced CPT Identification (Week 1-2)

**Goal**: Improve AI's ability to identify CPT codes from natural language

**Tasks**:
1. **Create CPT Knowledge Base**
   - Download/acquire CPT code database
   - Create embeddings or structured lookup
   - Include common aliases and variations
   - Store in local JSON/database

2. **Enhance AI Prompting**
   - Add CPT code examples to system prompt
   - Include procedure category hints
   - Add confidence scoring instructions
   - Implement multi-step clarification if needed

3. **CPT Validation Service**
   ```typescript
   // services/cpt.ts
   export interface CPTCode {
     code: string;
     description: string;
     category: string;
     typicalSiteOfService: 'inpatient' | 'outpatient' | 'freestanding';
     requiresPriorAuth: boolean;
     commonModifiers: string[];
   }
   
   export function validateCPTCode(code: string): CPTCode | null;
   export function searchCPTCodes(query: string): CPTCode[];
   export function getRelatedCPTCodes(code: string): CPTCode[];
   ```

4. **Improved parseProcedureIntent**
   - Use LLM with CPT knowledge base
   - Validate codes after extraction
   - Ask clarifying questions for ambiguous cases
   - Return confidence scores

**Deliverable**: AI can accurately identify CPT codes for 80%+ of common procedures

---

### Phase 2: Price Data Integration (Week 3-4)

**Goal**: Integrate real pricing data from multiple sources

**Tasks**:
1. **CMS PFS Integration**
   - Download CMS Physician Fee Schedule files
   - Parse and normalize data
   - Create lookup service by CPT + ZIP → price
   - Apply GPCI regional adjustments

2. **Hospital MRF Parser** (MVP - start with 1-2 hospitals)
   - Identify target hospitals in user's area
   - Download/parse MRF files
   - Extract negotiated rates by payer
   - Normalize to standard format
   - Cache parsed data

3. **Insurance TiC File Parser** (Future - very large files)
   - For major insurers (Aetna, BCBS, UHC, etc.)
   - Parse in-network negotiated rates
   - Filter by user's plan
   - Cache results

4. **Price Aggregation Service**
   ```typescript
   // services/pricing-data.ts
   export interface PriceSource {
     source: 'CMS_PFS' | 'MRF' | 'TIC' | 'BENCHMARK';
     price: number;
     provider?: string;
     payer?: string;
     confidence: number;
   }
   
   export async function getPriceForCPT(
     cpt: string,
     zip: string,
     payer?: string,
     provider?: string
   ): Promise<PriceSource[]>;
   
   export async function aggregatePrices(
     sources: PriceSource[]
   ): Promise<{
     min: number;
     max: number;
     median: number;
     recommended: number; // Based on user's insurance
   }>;
   ```

5. **Update Pricing Engine**
   - Use aggregated prices instead of hardcoded benchmarks
   - Prioritize insurance-specific rates when available
   - Fall back to CMS PFS if no negotiated rate found
   - Update confidence scoring based on data source quality

**Deliverable**: Real pricing data integrated, fallbacks in place

---

### Phase 3: Provider Network Integration (Week 5-6)

**Goal**: Find actual in-network providers and their prices

**Tasks**:
1. **Provider Directory Integration**
   - Parse insurance company provider directories
   - Or use NPPES database
   - Match providers to user's location
   - Verify network status

2. **Provider-Specific Pricing**
   - For each provider, look up their negotiated rate
   - Use MRF data when available
   - Calculate distance from user
   - Sort by price + distance + network status

3. **Update Provider Recommendation Service**
   - Use real provider data
   - Show actual negotiated rates when available
   - Highlight in-network vs. out-of-network
   - Show distance calculations

**Deliverable**: Real provider recommendations with actual prices

---

### Phase 4: Data Pipeline & Caching (Week 7-8)

**Goal**: Efficient data storage and retrieval

**Tasks**:
1. **Data Storage Strategy**
   - Local database (SQLite for MVP, PostgreSQL for production)
   - Cache parsed MRF data
   - Cache CPT lookups
   - Cache price aggregations

2. **Background Jobs**
   - Periodic MRF file downloads
   - Price data updates
   - Provider directory sync

3. **API Design** (if building backend)
   ```typescript
   // API endpoints
   GET /api/cpt/search?q=mri+knee
   GET /api/prices?cpt=73721&zip=94102&payer=Aetna
   GET /api/providers?zip=94102&specialty=radiology&cpt=73721
   ```

4. **Client-Side Caching**
   - Cache CPT lookups
   - Cache price estimates (with TTL)
   - Store user's recent searches

**Deliverable**: Efficient data pipeline with caching

---

## Implementation Recommendations

### MVP Approach (For Competition)

**Start Small, Scale Up**:

1. **Week 1**: Enhanced CPT identification
   - Use free CPT code database (CMS HCPCS or open-source)
   - Improve AI prompts with CPT examples
   - Add validation layer

2. **Week 2**: CMS PFS Integration
   - Download CMS PFS files
   - Parse and create lookup service
   - Replace hardcoded benchmarks with CMS data
   - Apply regional adjustments

3. **Week 3**: 1-2 Hospital MRFs
   - Pick 2-3 major hospitals in common areas
   - Manually download and parse MRF files
   - Extract negotiated rates
   - Show "real hospital prices" for those locations

4. **Week 4**: Polish & Testing
   - Improve error handling
   - Add loading states
   - Test with various procedures
   - Document data sources

### Production Approach

1. **Backend Service**
   - Node.js/Express or Python/FastAPI
   - Database for caching
   - Background workers for MRF parsing
   - API endpoints for frontend

2. **Data Pipeline**
   - Automated MRF downloads
   - Parsing service (handle multiple formats)
   - Normalization layer
   - Update database

3. **Scalability**
   - CDN for static data
   - Database indexing
   - Rate limiting
   - Monitoring

---

## Technical Challenges & Solutions

### Challenge 1: MRF File Formats Vary
**Solution**: 
- Create parser adapters for common formats (JSON, CSV, Excel)
- Use AI to help parse unstructured formats
- Start with well-formatted files, expand gradually

### Challenge 2: Large File Sizes
**Solution**:
- Parse and store only relevant data (filter by CPT codes we care about)
- Use streaming parsers
- Store in database, not memory
- Compress stored data

### Challenge 3: CPT Code Ambiguity
**Solution**:
- Multi-step AI conversation
- Show user options if ambiguous
- Use context (previous procedures, user history)
- Confidence scoring

### Challenge 4: Insurance Plan Matching
**Solution**:
- Ask user for specific plan name/ID during onboarding
- Use plan name matching
- Fall back to payer-level rates if plan not found
- Allow user to select plan from list

### Challenge 5: Real-Time vs. Cached Data
**Solution**:
- Cache aggressively (prices don't change daily)
- Update cache weekly/monthly
- Show "last updated" timestamp
- Allow manual refresh

---

## Data Sources Priority

### High Priority (Start Here):
1. ✅ **CMS PFS** - Free, structured, comprehensive
2. ✅ **CMS HCPCS** - Free CPT code database
3. ✅ **Hospital MRFs** - Real negotiated rates (start with 2-3 hospitals)

### Medium Priority:
4. **Insurance TiC Files** - Very large, but most accurate
5. **NPPES Provider Directory** - Free provider data

### Low Priority (Future):
6. **Commercial CPT Databases** - If budget allows
7. **Third-party APIs** - If available and affordable

---

## Success Metrics

### MVP Goals:
- ✅ Identify CPT codes for top 50 most common procedures
- ✅ Real pricing data for at least 20 procedures
- ✅ Show prices from at least 2 real hospitals
- ✅ 80%+ accuracy in CPT identification
- ✅ Estimates within 20% of actual costs (when data available)

### Production Goals:
- ✅ 1000+ procedures covered
- ✅ 100+ hospitals with MRF data
- ✅ All major insurance companies
- ✅ 90%+ accuracy in CPT identification
- ✅ Estimates within 10% of actual costs

---

## Next Steps

1. **Immediate (This Week)**:
   - Download CMS PFS files
   - Set up CPT code database (free source)
   - Enhance AI prompts for CPT identification
   - Test with 10 common procedures

2. **Short-term (Next 2 Weeks)**:
   - Integrate CMS PFS data
   - Parse 2-3 hospital MRF files
   - Update pricing engine to use real data
   - Improve error handling

3. **Medium-term (Next Month)**:
   - Expand to more hospitals
   - Add insurance-specific rate lookups
   - Improve provider recommendations
   - Add data refresh mechanism

---

## Questions to Consider

1. **Backend vs. Client-Side**: 
   - For competition: Can we do client-side with cached data?
   - For production: Need backend for MRF parsing and storage

2. **Data Licensing**:
   - CMS data is free
   - AMA CPT codes require license (or use free alternatives)
   - Hospital MRFs are public but may have usage restrictions

3. **Rate Limiting**:
   - LLM API rate limits
   - Hospital website scraping limits
   - Need to cache aggressively

4. **User Privacy**:
   - Don't store sensitive health data
   - Anonymize search queries
   - Comply with HIPAA if storing any PHI

---

## Recommended Starting Point

**For the competition, I recommend**:

1. **Week 1**: Enhance CPT identification
   - Use free CPT database
   - Improve AI prompts
   - Add validation

2. **Week 2**: Integrate CMS PFS
   - Download and parse CMS files
   - Replace hardcoded benchmarks
   - Add regional adjustments

3. **Week 3**: Add 2-3 Hospital MRFs
   - Pick major hospitals (e.g., Mayo Clinic, Cleveland Clinic)
   - Parse their MRF files
   - Show "real hospital prices" for demo

This gives you:
- ✅ Real pricing data
- ✅ Demonstrable value
- ✅ Scalable foundation
- ✅ Impressive for competition

Want to start with Phase 1 (Enhanced CPT Identification)?

