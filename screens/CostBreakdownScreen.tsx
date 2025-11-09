import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import Accordion from '../components/Accordion';
import CharityEligibilityBanner from '../components/CharityEligibilityBanner';
import { IconName } from '../constants';
import { storageService } from '../services/storage';
import { Estimate, RecommendedProvider, UserProfile, ProcedureIntent, PricingInputs } from '../types';
import { checkCharityEligibility, CharityEligibilityResult } from '../services/charity-screening';
import { getRecommendedPrograms, AssistanceProgram } from '../services/assistance-programs';
import AssistanceProgramCard from '../components/AssistanceProgramCard';
import { generateCostInsights, generateMoneySavingTips, parseProcedureIntent } from '../services/ai';
import { runPricingEngine } from '../services/pricing';
import { getRecommendedProviders } from '../services/providers';
import { buildCostProfile, generateId } from '../services/profile';

const simpleCostItems = (estimate: Estimate): { label: string; amount: number; isSubtle?: boolean; isFinal?: boolean; icon: IconName }[] => [
  { label: 'Total Billed Amount', amount: estimate.results.totalBilled || 0, icon: 'cardPayment' },
  { label: 'Insurance Adjustment', amount: -(estimate.results.insuranceAdjustment || 0), isSubtle: true, icon: 'shieldCheck' },
  { label: 'Allowed Amount', amount: estimate.results.allowedAmount || 0, isSubtle: true, icon: 'shieldCheck' },
  { label: 'We Found Your Estimated Cost', amount: estimate.results.estimatedOop, isFinal: true, icon: 'check' },
];

const StarRating: React.FC<{ rating: number; maxRating?: number }> = ({ rating, maxRating = 5 }) => (
  <div className="flex items-center">
    {Array.from({ length: maxRating }, (_, index) => (
      <Icon
        key={index}
        name="star"
        className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const InfoLine: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-b-0">
    <span className="text-silver-gray flex items-center text-sm">{label}</span>
    <div className="text-sm font-semibold text-ink-black text-right">{children}</div>
  </div>
);

const ProviderModal: React.FC<{ provider: RecommendedProvider | null; onClose: () => void }> = ({ provider, onClose }) => {
  if (!provider) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl m-4 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-ink-black">Provider Details</h2>
            <button onClick={onClose} className="p-1 rounded-full text-silver-gray hover:bg-gray-100">
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT: Image */}
            <div className="bg-soft-gray rounded-lg p-6 flex justify-center items-center min-h-[300px]">
              <Icon name="hospital" className="w-32 h-32 text-gray-300" />
            </div>

            {/* RIGHT: Details */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <h3 className="text-2xl font-bold text-ink-black mb-2">{provider.provider.name}</h3>
              </div>

              {/* Address */}
              <div>
                <div className="flex items-start gap-2">
                  <Icon name="location" className="w-5 h-5 text-silver-gray mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-ink-black font-medium">{provider.provider.address}</p>
                    <p className="text-silver-gray">{provider.provider.city}, {provider.provider.state} {provider.provider.zip}</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <div className="flex items-center gap-2">
                  <StarRating rating={4} />
                  <span className="text-sm text-silver-gray">(4.0 rating)</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-ink-black leading-relaxed">
                  {provider.provider.specialties && provider.provider.specialties.length > 0
                    ? `Specializing in ${provider.provider.specialties.join(', ')}. ${provider.isInNetwork ? 'This provider is in your network.' : 'This provider may be out of network.'}`
                    : provider.isInNetwork 
                      ? 'This provider is in your network and accepts your insurance.'
                      : 'This provider may be out of network. Please verify with your insurance.'}
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="phone" className="w-5 h-5 text-silver-gray" />
                  <span className="text-ink-black font-medium">(417) 555-0123</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <InfoLine label="Estimated Price">
                  <span className="text-primary-blue font-bold text-lg">${provider.estimatedPrice.toLocaleString()}</span>
                </InfoLine>
                <InfoLine label="Distance">{provider.distance}</InfoLine>
                <InfoLine label="Network Status">
                  <span className={`font-semibold px-2 py-1 rounded-md text-xs ${
                    provider.isInNetwork ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {provider.isInNetwork ? 'In-Network' : 'Out-of-Network'}
                  </span>
                </InfoLine>
                {provider.isPreferred && (
                  <InfoLine label="Status">
                    <span className="font-semibold bg-primary-blue text-white px-2 py-1 rounded-md text-xs">Your Preferred Provider</span>
                  </InfoLine>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CostBreakdownScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<RecommendedProvider | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [charityEligibility, setCharityEligibility] = useState<CharityEligibilityResult | null>(null);
  const [recommendedPrograms, setRecommendedPrograms] = useState<AssistanceProgram[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [moneySavingTips, setMoneySavingTips] = useState<string[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCostSummary, setShowCostSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Loading overlay component - shows over the content
  const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-primary-blue/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-xl font-bold text-ink-black mb-3">{message}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-silver-gray">
          <Icon name="sparkles" className="w-4 h-4 text-primary-blue animate-pulse" />
          <span>Using AI to analyze your specific situation...</span>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const estimateId = searchParams.get('id');
    const query = searchParams.get('query');
    
    if (estimateId) {
      // Load existing estimate
      const found = storageService.getEstimate(estimateId);
      if (found) {
        setEstimate(found);
        setIsSaved(true);
      } else {
        navigate('/cost-estimator');
      }
    } else if (query) {
      // Set loading state immediately before generating
      setIsGenerating(true);
      setLoadingMessage('Initializing cost estimate...');
      // Generate new estimate from query
      generateEstimateFromQuery(query);
    } else {
      // No ID or query, redirect to estimator
      navigate('/cost-estimator');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const generateEstimateFromQuery = async (query: string) => {
    // isGenerating is already set in useEffect
    const profile = storageService.getUserProfile();
    if (!profile) {
      alert('Please set up your profile in Settings first.');
      navigate('/settings');
      return;
    }

    try {
      // Step 1: Parse procedure intent
      setLoadingMessage('Identifying procedure codes and medical terminology...');
      const procedureIntent = await parseProcedureIntent(query);
      
      // Auto-set site of service if unknown
      if (procedureIntent.siteOfService === 'unknown' && procedureIntent.cpts.length > 0) {
        const primaryCpt = procedureIntent.cpts[0];
        if (primaryCpt.startsWith('7')) {
          procedureIntent.siteOfService = 'freestanding';
        } else {
          procedureIntent.siteOfService = 'outpatient';
        }
      }

      // Step 2: Build cost profile
      setLoadingMessage('Analyzing your insurance plan details and deductible status...');
      const costProfile = buildCostProfile(profile);

      // Step 3: Run pricing engine
      setLoadingMessage('Cross-referencing CMS fee schedules and hospital price transparency data...');
      const pricingInputs: PricingInputs = {
        procedureIntent,
        costProfile,
        region: profile.zip,
        sourceTags: ['CMS_PFS'],
        payer: profile.payer,
        planType: profile.planType,
        eobData: profile.eobData,
      };
      const pricingResult = await runPricingEngine(pricingInputs);

      // Step 4: Get recommended providers
      setLoadingMessage('Scanning network providers and comparing regional pricing...');
      const recommendedProviders = await getRecommendedProviders(
        procedureIntent,
        profile.zip,
        profile.preferredProviders,
        costProfile,
        3,
        profile.eobData?.providerName
      );

      // Step 5: Create estimate object
      setLoadingMessage('Generating personalized cost breakdown...');
      const estimate: Estimate = {
        id: generateId(),
        userId: profile.id,
        title: procedureIntent.label,
        procedureIntent,
        inputsSnapshot: {
          profile,
          costProfile,
        },
        pricingInputs,
        results: pricingResult,
        explanationBullets: pricingResult.explanationBullets,
        recommendedProviders,
        createdAt: new Date().toISOString(),
      };

      // Step 6: Generate AI insights BEFORE setting the estimate
      setLoadingMessage('Generating AI-powered cost insights and money-saving strategies...');
      const [insights, tips] = await Promise.all([
        generateCostInsights(estimate).catch((err) => {
          console.error('Error generating cost insights:', err);
          return [];
        }),
        generateMoneySavingTips(estimate).catch((err) => {
          console.error('Error generating money-saving tips:', err);
          return [];
        }),
      ]);

      // Add insights to estimate
      const estimateWithInsights = {
        ...estimate,
        aiInsights: insights || [],
        moneySavingTips: tips || [],
      };

      // Save estimate with insights
      storageService.saveEstimate(estimateWithInsights);

      // Update URL to use estimate ID and set estimate
      navigate(`/cost-breakdown?id=${estimateWithInsights.id}`, { replace: true });
      setEstimate(estimateWithInsights);
      
      // Set AI insights state immediately so they don't regenerate
      setAiInsights(insights || []);
      setMoneySavingTips(tips || []);
      
      // Check charity eligibility and programs (quick operations)
      setLoadingMessage('Finalizing assistance program matches...');
      const eligibility = checkCharityEligibility({
        estimatedOop: pricingResult.estimatedOop,
        zipCode: profile.zip,
        annualIncome: undefined,
        householdSize: undefined,
        hasInsurance: !!profile.payer && profile.payer !== 'Unknown',
        procedureType: procedureIntent.label,
      });
      setCharityEligibility(eligibility);

      const programs = getRecommendedPrograms({
        estimatedOop: pricingResult.estimatedOop,
        hasInsurance: !!profile.payer && profile.payer !== 'Unknown',
        zipCode: profile.zip,
        procedureType: procedureIntent.label,
        isEmergency: procedureIntent.label.toLowerCase().includes('emergency'),
      });
      setRecommendedPrograms(programs);
      
      // Done loading
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating estimate:', error);
      setIsGenerating(false);
      alert('Sorry, we encountered an error generating your estimate. Please try again.');
      navigate('/cost-estimator');
    }
  };

  // Check charity eligibility and get recommended programs when estimate loads
  // (AI insights are now generated during estimate creation, but generate if missing)
  useEffect(() => {
    if (!estimate || !estimate.inputsSnapshot || !estimate.inputsSnapshot.profile || !estimate.results) {
      return; // Don't process if estimate is incomplete
    }

    const loadInsights = async () => {
      try {
        const profile = estimate.inputsSnapshot.profile;
        
        // Load AI insights if they exist in the estimate
        const savedInsights = (estimate as any).aiInsights;
        const savedTips = (estimate as any).moneySavingTips;
        
        if (savedInsights && savedInsights.length > 0) {
          // Use saved insights (already set during generation, but ensure they're set)
          setAiInsights(savedInsights);
          setMoneySavingTips(savedTips || []);
          setIsGeneratingInsights(false);
        } else {
          // No insights yet - generate them now
          setIsGeneratingInsights(true);
          try {
            const [insights, tips] = await Promise.all([
              generateCostInsights(estimate).catch((err) => {
                console.error('Error generating cost insights:', err);
                return [];
              }),
              generateMoneySavingTips(estimate).catch((err) => {
                console.error('Error generating money-saving tips:', err);
                return [];
              }),
            ]);
            
            // Update the estimate with the new insights
            const updatedEstimate = {
              ...estimate,
              aiInsights: insights || [],
              moneySavingTips: tips || [],
              updatedAt: new Date().toISOString(),
            };
            
            // Save the updated estimate
            storageService.saveEstimate(updatedEstimate);
            
            // Update state
            setEstimate(updatedEstimate);
            setAiInsights(insights || []);
            setMoneySavingTips(tips || []);
            setIsGeneratingInsights(false);
          } catch (error) {
            console.error('Error generating insights:', error);
            setAiInsights([]);
            setMoneySavingTips([]);
            setIsGeneratingInsights(false);
          }
        }

        // Check charity eligibility (quick operation)
        const eligibility = checkCharityEligibility({
          estimatedOop: estimate.results.estimatedOop,
          zipCode: profile.zip,
          annualIncome: undefined,
          householdSize: undefined,
          hasInsurance: !!profile.payer && profile.payer !== 'Unknown',
          procedureType: estimate.procedureIntent?.label || estimate.title,
        });
        setCharityEligibility(eligibility);

        // Get recommended assistance programs (quick operation)
        const programs = getRecommendedPrograms({
          estimatedOop: estimate.results.estimatedOop,
          hasInsurance: !!profile.payer && profile.payer !== 'Unknown',
          zipCode: profile.zip,
          procedureType: estimate.procedureIntent?.label || estimate.title,
          isEmergency: (estimate.procedureIntent?.label || estimate.title).toLowerCase().includes('emergency'),
        });
        setRecommendedPrograms(programs);
      } catch (error) {
        console.error('Error in useEffect for estimate:', error);
        setAiInsights([]);
        setMoneySavingTips([]);
        setIsGeneratingInsights(false);
      }
    };

    loadInsights();
  }, [estimate]);

  const handleSave = () => {
    if (!estimate) return;
    storageService.saveEstimate(estimate);
    setIsSaved(true);
  };

  // Show overlay if generating, even if estimate doesn't exist yet
  if (!estimate && !isGenerating) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-ink-black">Loading...</h1>
      </div>
    );
  }

  // Safety checks - ensure all required data exists (but allow rendering if generating)
  if (estimate && (!estimate.results || !estimate.inputsSnapshot || !estimate.inputsSnapshot.profile || !estimate.inputsSnapshot.costProfile)) {
    console.error('Invalid estimate data:', estimate);
    if (!isGenerating) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-ink-black">Error</h1>
          <p className="text-silver-gray">Unable to load estimate. Please try generating a new estimate.</p>
          <button
            onClick={() => navigate('/cost-estimator')}
            className="bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Cost Estimator
          </button>
        </div>
      );
    }
  }

  // If generating but no estimate yet, show empty content with overlay
  if (isGenerating && !estimate) {
    return (
      <>
        <LoadingOverlay message={loadingMessage} />
        <div className="space-y-8 opacity-50 pointer-events-none">
          <h1 className="text-3xl font-bold text-ink-black">Cost Estimate Details</h1>
        </div>
      </>
    );
  }

  const costItems = simpleCostItems(estimate);
  const profile = estimate.inputsSnapshot.profile;
  const costProfile = estimate.inputsSnapshot.costProfile;
  const coinsurancePercent = Math.round((costProfile.normalizedCoinsurance || 0.2) * 100);

  // Sort providers: preferred first, then by price
  const sortedProviders = (estimate.recommendedProviders || []).sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) {
      return a.isPreferred ? -1 : 1;
    }
    return a.estimatedPrice - b.estimatedPrice;
  });

  return (
    <>
      {isGenerating && <LoadingOverlay message={loadingMessage} />}
      <div className={`space-y-8 ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
        <h1 className="text-3xl font-bold text-ink-black">Cost Estimate Details</h1>

        {/* Hero Banner */}
        <Card className="p-6 sm:p-8 bg-white border border-gray-200/80">
          <div className="flex justify-between items-start">
            <div className="text-left">
              <p className="text-6xl font-extrabold text-ink-black">${estimate.results.estimatedOop}</p>
              {estimate.results.estimatedOop === 0 && (estimate.results.explanationBullets || []).some(b => b.includes('preventive care') || b.includes('Preventive care')) ? (
                <div className="mt-2">
                  <p className="text-2xl text-green-600 font-semibold">Covered as Preventive Care</p>
                  <p className="text-sm text-green-700 mt-1">This procedure is typically covered at 100% under the Affordable Care Act</p>
                </div>
              ) : (
                <p className="text-2xl text-silver-gray mt-2">We found that your {estimate.title} should cost around this much.</p>
              )}
              <p className="text-sm text-silver-gray mt-3">Based on your insurance details and local transparency data.</p>
            </div>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors border text-sm ${
                isSaved
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-white text-primary-blue border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon name={isSaved ? 'bookmark-solid' : 'bookmark'} className="w-5 h-5" />
              <span>{isSaved ? 'Saved' : 'Save Estimate'}</span>
            </button>
          </div>
        </Card>

        {/* Main Content Layout - 2 Column: Recommended Providers + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Recommended Providers */}
          <Card className="p-6 border border-gray-200/80">
            <h3 className="text-xl font-bold text-ink-black mb-6">Recommended Providers</h3>
            <div className="space-y-3">
              {sortedProviders.length > 0 ? (
                sortedProviders.map((provider, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedProvider(provider)}
                    className="w-full text-left bg-white p-4 rounded-lg border border-gray-200/80 relative transition-all duration-200 hover:shadow-md hover:border-primary-blue/50"
                  >
                    {provider.isPreferred && (
                      <span className="absolute -top-2.5 left-4 text-xs font-semibold bg-primary-blue text-white px-2 py-0.5 rounded-full">Your Provider</span>
                    )}
                    {!provider.isPreferred && index === 0 && (
                      <span className="absolute -top-2.5 left-4 text-xs font-semibold bg-accent-green text-white px-2 py-0.5 rounded-full">Best Price</span>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-ink-black">{provider.provider.name}</p>
                        <p className="text-xs text-silver-gray mt-1">{provider.distance}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <StarRating rating={4} />
                          {provider.isInNetwork && (
                            <span className="text-xs text-green-700 font-semibold">In-Network</span>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-2xl text-primary-blue ml-4">${provider.estimatedPrice.toLocaleString()}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-silver-gray text-center py-4">No provider recommendations available</p>
              )}
            </div>
          </Card>

          {/* RIGHT: AI Insights - Concise Version */}
          <Card className="p-6 border border-gray-200/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-ink-black">Key Insights</h3>
              {isGeneratingInsights && (
                <div className="flex items-center gap-2 text-silver-gray">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-blue"></div>
                  <span className="text-xs">Generating...</span>
                </div>
              )}
            </div>
            
            {isGeneratingInsights ? (
              <div className="flex items-center justify-center py-8 text-silver-gray">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-blue mr-3"></div>
                <span className="text-sm">Generating personalized insights...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show insights (already limited to 2 by AI) */}
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Icon name="sparkles" className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-ink-black leading-relaxed flex-1">
                      {insight}
                    </p>
                  </div>
                ))}
                
                {/* Show money-saving tips (already limited to 2 by AI) */}
                {moneySavingTips.map((tip, idx) => (
                  <div key={`tip-${idx}`} className="flex items-start gap-3">
                    <Icon name="lightbulb" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-ink-black leading-relaxed flex-1">
                      {tip}
                    </p>
                  </div>
                ))}

                {/* Compact Key Details - Enhanced */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-silver-gray text-xs mb-1.5 font-medium">Network Status</p>
                      <span className={`font-semibold px-3 py-1.5 rounded-md text-sm inline-block ${
                        costProfile.inNetworkPreference ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {costProfile.inNetworkPreference ? 'In-Network' : 'Out-of-Network'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-silver-gray text-xs mb-1.5 font-medium">Coinsurance</p>
                      <span className="font-semibold bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md text-sm inline-block">{coinsurancePercent}%</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-silver-gray text-xs mb-1.5 font-medium">Deductible</p>
                      <p className="text-ink-black font-semibold text-base">
                        {costProfile.deductibleRemaining > 0 
                          ? `$${costProfile.deductibleRemaining.toLocaleString()} left`
                          : 'Met ✓'}
                      </p>
                    </div>
                    {estimate.procedureIntent?.requiresPriorAuth ? (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-silver-gray text-xs mb-1.5 font-medium">Prior Authorization</p>
                        <span className="font-semibold bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-md text-sm inline-block">Required</span>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-silver-gray text-xs mb-1.5 font-medium">Price Range</p>
                        {estimate.results.regionalBenchmark ? (
                          <p className="text-ink-black font-semibold text-sm">
                            ${estimate.results.regionalBenchmark.min.toLocaleString()} - ${estimate.results.regionalBenchmark.max.toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-silver-gray text-sm">Not available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Financial Assistance Programs - Shows Charity Banner if eligible, otherwise regular programs */}
        {charityEligibility && charityEligibility.isEligible ? (
          <CharityEligibilityBanner
            eligibility={charityEligibility}
            estimatedOop={estimate.results.estimatedOop}
            onApplyClick={() => {
              // TODO: Open charity application flow
              alert('Charity application flow would open here. In production, this would navigate to an application form or open a modal.');
            }}
            onLearnMoreClick={() => {
              // Handled by banner's expand/collapse
            }}
          />
        ) : recommendedPrograms.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="heart" className="w-5 h-5 text-primary-blue" />
                <span className="font-semibold text-ink-black">Financial Assistance Programs</span>
              </div>
              <button
                onClick={() => navigate('/assistance')}
                className="text-sm font-semibold text-primary-blue hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recommendedPrograms.slice(0, 2).map((program) => (
                <AssistanceProgramCard
                  key={program.id}
                  program={program}
                  onApplyClick={() => {
                    alert(`Application for ${program.name} would open here.`);
                  }}
                  onLearnMoreClick={() => navigate('/assistance')}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Cost Summary - Now Collapsible (Collapsed by Default) */}
        <Card className="p-4 bg-white border border-gray-200/80">
          <button
            onClick={() => setShowCostSummary(!showCostSummary)}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Icon name="receipt" className="w-5 h-5 text-primary-blue" />
              <span className="font-semibold text-ink-black">Cost Summary</span>
            </div>
            <div className="bg-green-100 rounded-full p-1">
              <Icon name={showCostSummary ? 'chevron-up' : 'chevron-down'} className="w-5 h-5 text-green-700" />
            </div>
          </button>
          {showCostSummary && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                {costItems.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center py-2 ${item.isFinal ? 'pt-3 border-t border-gray-200' : ''}`}>
                    <span className={`text-base flex items-center ${item.isFinal ? 'font-bold text-lg' : ''} ${item.isSubtle ? 'text-silver-gray' : 'text-ink-black'}`}>
                      <Icon name={item.icon} className={`w-5 h-5 mr-3 ${item.isSubtle ? 'text-accent-green' : 'text-silver-gray'}`} />
                      {item.label}
                    </span>
                    <span className={`font-medium ${item.isFinal ? 'font-bold text-lg' : ''} ${item.isSubtle ? 'text-accent-green' : 'text-ink-black'}`}>
                      {item.amount < 0 ? `-$${Math.abs(item.amount).toLocaleString()}` : `$${item.amount.toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
                className="text-sm font-semibold text-primary-blue hover:underline mt-4"
              >
                {isBreakdownExpanded ? 'Hide' : 'Show'} detailed breakdown
              </button>

              {isBreakdownExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-silver-gray">Allowed Amount</span>
                      <span className="text-ink-black font-medium">${estimate.results.allowedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-silver-gray">Deductible Applied</span>
                      <span className="text-ink-black font-medium">${estimate.results.deductibleApplied.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-silver-gray">Coinsurance Due</span>
                      <span className="text-ink-black font-medium">${estimate.results.coinsuranceDue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Collapsible Sections - Less Prominent */}
        <div className="space-y-3">
          {/* Quick Explanation - Collapsible */}
          {(estimate.results.explanationBullets || []).length > 0 && (
            <Card className="p-4 bg-white border border-gray-200/80">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon name="info" className="w-5 h-5 text-primary-blue" />
                  <span className="font-semibold text-ink-black">How this estimate was calculated</span>
                </div>
                <div className="bg-green-100 rounded-full p-1">
                  <Icon name={showExplanation ? 'chevron-up' : 'chevron-down'} className="w-5 h-5 text-green-700" />
                </div>
              </button>
              {showExplanation && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  {estimate.results.explanationBullets.map((bullet, idx) => (
                    <p key={idx} className="text-sm text-ink-black leading-relaxed">
                      {bullet}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Technical Details - Collapsible */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs text-silver-gray hover:text-primary-blue flex items-center gap-1"
            >
              <Icon name={showTechnicalDetails ? 'chevron-up' : 'chevron-down'} className="w-4 h-4" />
              {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
            </button>
          </div>
          
          {showTechnicalDetails && (
            <Card className="p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-start gap-3">
                <Icon name="info" className="w-5 h-5 text-silver-gray flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-black mb-1">Procedure Codes</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(estimate.procedureIntent?.cpts || []).map((cpt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-md bg-gray-200 text-gray-700 text-sm font-mono font-semibold"
                      >
                        {cpt}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-silver-gray mt-2">
                    Label: {estimate.procedureIntent?.label || 'Unknown'} | 
                    Site: {estimate.procedureIntent?.siteOfService || 'Unknown'} | 
                    Confidence: {estimate.procedureIntent?.confidence ? Math.round(estimate.procedureIntent.confidence * 100) : 0}% | 
                    Prior Auth: {estimate.procedureIntent?.requiresPriorAuth ? 'Yes' : 'No'}
                  </p>
                  {estimate.results.regionalBenchmark && (
                    <p className="text-xs text-silver-gray mt-1">
                      Regional Price Range: ${estimate.results.regionalBenchmark.min.toLocaleString()} - ${estimate.results.regionalBenchmark.max.toLocaleString()}
                    </p>
                  )}
                  {estimate.results.confidence < 80 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <Icon name="info" className="w-3 h-3 inline mr-1" />
                      This estimate has {estimate.results.confidence}% confidence. For more accuracy, upload an EOB from a similar procedure.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
        <p className="text-center text-xs text-silver-gray pt-8">
          This is not a bill — it's our best estimate based on your insurance details and local transparency data.
        </p>
      </div>
      <ProviderModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
    </>
  );
};

export default CostBreakdownScreen;
