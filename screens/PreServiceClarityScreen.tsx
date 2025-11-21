import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import Accordion from '../components/Accordion';
import { IconName } from '../constants';
import { parseProcedureIntent, parseProcedureIntentWithClarification } from '../services/ai';
import { storageService } from '../services/storage';
import { buildCostProfile, generateId } from '../services/profile';
import { runPricingEngine } from '../services/pricing';
import { getRecommendedProviders } from '../services/providers';
import { Estimate, ProcedureIntent, PricingInputs, Appointment } from '../types';

const popularLookups: { label: string; icon: IconName }[] = [
  { label: 'MRI of the knee', icon: 'mri' },
  { label: 'Standard blood panel', icon: 'bloodTest' },
  { label: 'Physical therapy session', icon: 'therapy' },
  { label: 'Abdominal ultrasound', icon: 'ultrasound' },
];

type Message = {
  author: 'user' | 'ai';
  text: string;
};

interface AiCostEstimatorProps {
  isChatting: boolean;
  initialQuery: string;
  onInitialQueryChange: (value: string) => void;
  onStartChat: () => void;
  messages: Message[];
  currentMessage: string;
  onCurrentMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

const AiCostEstimator: React.FC<AiCostEstimatorProps> = ({
  isChatting,
  initialQuery,
  onInitialQueryChange,
  onStartChat,
  messages,
  currentMessage,
  onCurrentMessageChange,
  onSendMessage,
}) => {
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatting && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isChatting]);

  const handleInitialKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onStartChat();
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  if (!isChatting) {
    return (
      <Card className="bg-white border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="text-center">
            <Icon name="sparkles" className="w-10 h-10 mx-auto text-primary-blue mb-2" />
            <h2 className="text-2xl font-bold text-ink-black">AI Cost Estimator</h2>
            <p className="text-silver-gray mt-2">We'll help you understand what your care might cost before you commit.</p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Icon name="microphone" className="w-6 h-6 text-silver-gray" />
              </div>
              <input
                type="text"
                placeholder="Ask about the cost of any test or procedure"
                value={initialQuery}
                onChange={(e) => onInitialQueryChange(e.target.value)}
                onKeyDown={handleInitialKeyPress}
                className="w-full bg-soft-gray border-2 border-transparent rounded-full py-4 pl-14 pr-40 text-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors"
              />
              <button
                onClick={onStartChat}
                className="absolute inset-y-0 right-0 m-2 flex items-center bg-primary-blue text-white rounded-full px-6 font-semibold hover:bg-blue-700 transition-colors"
              >
                <span>Estimate Cost</span>
              </button>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-sm font-semibold text-silver-gray mb-3">Quick Tips</h3>
            <div className="space-y-3 text-sm text-silver-gray">
              <p>• Be specific about the procedure (e.g., "MRI of left knee" vs "MRI")</p>
              <p>• Include details like contrast, sedation, or site of care when relevant</p>
              <p>• Estimates are more accurate when you have a complete profile</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 bg-soft-gray/50 px-6 py-3">
          <p className="text-xs text-silver-gray text-center">Powered by national price transparency data, regional averages, and your insurance details.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 overflow-hidden flex flex-col h-[70vh] max-h-[700px]">
      <div className="p-4 border-b text-center">
        <h2 className="text-xl font-bold text-ink-black">AI Cost Estimator</h2>
      </div>
      <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-soft-gray/50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.author === 'ai' && <Icon name="sparkles" className="w-6 h-6 text-primary-blue mb-1" />}
            <div className={`max-w-md p-3 rounded-2xl ${msg.author === 'user' ? 'bg-primary-blue text-white rounded-br-none' : 'bg-white text-ink-black rounded-bl-none border'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t bg-white">
        <div className="relative">
          <input
            ref={chatInputRef}
            type="text"
            placeholder="Type your response..."
            value={currentMessage}
            onChange={(e) => onCurrentMessageChange(e.target.value)}
            onKeyDown={handleChatKeyPress}
            className="w-full bg-soft-gray border-2 border-gray-200 rounded-full py-3 pl-5 pr-14 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors"
          />
          <button
            onClick={onSendMessage}
            className="absolute inset-y-0 right-0 m-2 flex items-center justify-center bg-primary-blue text-white rounded-full w-10 h-10 hover:bg-blue-700 transition-colors"
          >
            <Icon name="send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  );
};

const EducationalSection: React.FC = () => {
  const educationalTopics = [
    { title: "How we estimate your costs", content: "Our AI combines federal price transparency data, regional benchmarks, and your specific insurance plan details to generate a highly accurate estimate." },
    { title: "Understanding deductible vs. coinsurance", content: "Your deductible is the amount you pay before your insurance starts paying. Coinsurance is the percentage of costs you pay after your deductible is met." },
    { title: "Why prices vary across facilities", content: "Hospitals and clinics negotiate different rates with insurance companies, and their operating costs can vary, leading to different prices for the same service." },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-ink-black mb-4">Understanding Your Costs</h2>
      <div className="space-y-4">
        {educationalTopics.map(topic => (
          <Card key={topic.title} className="p-4 border border-gray-200 bg-white">
            <Accordion title={<h3 className="font-semibold">{topic.title}</h3>}>
              <p className="text-sm">{topic.content}</p>
            </Accordion>
          </Card>
        ))}
      </div>
    </div>
  );
};

const CostEstimatorScreen: React.FC = () => {
  const [aiQuery, setAiQuery] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [appointmentEstimates, setAppointmentEstimates] = useState<Map<string, string>>(new Map()); // Map of appointment ID to estimate ID
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // FOR DEMO: Just load appointments directly, no loading state
    const loadAppointments = () => {
      // Load appointments from storage
      let appointments = storageService.getAppointments();
      
      // Always ensure Sleep Study appointment exists with correct $590 amount
      const profile = storageService.getUserProfile();
      if (profile) {
        const sleepStudyAppointment: Appointment = {
          id: 'apt-sleep-study',
          date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
          doctor: 'CoxHealth Sleep Disorders Center',
          specialty: 'Sleep Medicine',
          visitType: 'Sleep Study',
          estimatedOop: 590, // Manually set to $590 for demo
          deductibleRemaining: 500,
          createdAt: new Date().toISOString(),
        };
        // Always update/replace the appointment to ensure correct amount
        appointments = [sleepStudyAppointment];
        storageService.saveAppointments(appointments);
      }
      
      // Find estimate IDs for appointments
      const allEstimates = storageService.getEstimates();
      const estimatesMap = new Map<string, string>();
      
      appointments.forEach(appointment => {
        if (appointment.visitType === 'Sleep Study' || appointment.visitType.toLowerCase().includes('sleep')) {
          const estimate = allEstimates.find(e => 
            e.title === 'Sleep Study' || e.title.toLowerCase().includes('sleep')
          );
          if (estimate) {
            estimatesMap.set(appointment.id, estimate.id);
          }
        }
      });
      
      setUpcomingAppointments(appointments);
      setAppointmentEstimates(estimatesMap);
      setIsLoadingAppointments(false);
    };

    loadAppointments();
  }, []); // Only run once on mount

  const handleStartChat = async () => {
    if (!aiQuery.trim()) return;

    // Check if user has profile
    const profile = storageService.getUserProfile();
    if (!profile) {
      alert('Please set up your profile in Settings first.');
      navigate('/settings');
      return;
    }

      // For demo: Always proceed - never ask clarifying questions
      setIsProcessing(true);
      try {
        const parseResult = await parseProcedureIntentWithClarification(aiQuery);
        
        // Always proceed to cost breakdown - never ask questions
        navigate(`/cost-breakdown?query=${encodeURIComponent(aiQuery)}`);
      } catch (error) {
        console.error('Error parsing procedure:', error);
        // On error, still proceed - use best guess
        navigate(`/cost-breakdown?query=${encodeURIComponent(aiQuery)}`);
      }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isProcessing) return;

    const userMsg: Message = { author: 'user', text: currentMessage };
    setMessages(prev => [...prev, userMsg]);
    const messageText = currentMessage;
    setCurrentMessage('');
    setIsProcessing(true);

    try {
      // Combine original query with all conversation messages for context
      const conversationContext = [...messages, userMsg]
        .filter(msg => msg.author === 'user')
        .map(msg => msg.text)
        .join(' ');
      
      // Try to parse with the additional context
      const parseResult = await parseProcedureIntentWithClarification(conversationContext);
      
      // For demo: Always proceed - never ask clarifying questions
      // Skip any clarification logic and proceed directly to estimate

      // For demo: Always proceed - never ask questions, just generate estimate
      try {
        await generateEstimate(parseResult.procedureIntent, conversationContext);
        // Note: generateEstimate will navigate, so we don't need to do anything else here
      } catch (error) {
        console.error('Error in generateEstimate:', error);
        setMessages(prev => [
          ...prev,
          { author: 'ai', text: 'Sorry, I encountered an error generating your estimate. Please try again.' }
        ]);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { author: 'ai', text: 'Sorry, I encountered an error. Please try again or rephrase your question.' }
      ]);
      setIsProcessing(false);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    const estimateId = appointmentEstimates.get(appointment.id);
    if (estimateId) {
      navigate(`/cost-breakdown?id=${estimateId}`);
    } else {
      // Fallback: generate estimate on the fly if somehow missing
      generateEstimateForAppointment(appointment);
    }
  };

  const generateEstimateForAppointment = async (appointment: Appointment) => {
    const profile = storageService.getUserProfile();
    if (!profile) {
      alert('Please set up your profile in Settings first.');
      navigate('/settings');
      return;
    }

    // Parse the appointment visit type to get procedure intent
    setIsProcessing(true);
    try {
      const procedureIntent = await parseProcedureIntent(appointment.visitType);
      
      // If site of service is unknown, default based on appointment type
      if (procedureIntent.siteOfService === 'unknown') {
        if (appointment.specialty === 'Radiology' || appointment.visitType.toLowerCase().includes('mri') || appointment.visitType.toLowerCase().includes('ct')) {
          procedureIntent.siteOfService = 'freestanding';
        } else {
          procedureIntent.siteOfService = 'outpatient';
        }
      }

      const costProfile = buildCostProfile(profile);

      // Run pricing engine
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

      // Get recommended providers
      const recommendedProviders = await getRecommendedProviders(
        procedureIntent,
        profile.zip,
        profile.preferredProviders,
        costProfile,
        3,
        profile.eobData?.providerName
      );

      // Create estimate
      const estimate: Estimate = {
        id: generateId(),
        userId: profile.id,
        title: appointment.visitType,
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

      // Save estimate
      storageService.saveEstimate(estimate);

      // Update appointment with new estimate
      const estimateId = estimate.id;
      setAppointmentEstimates(prev => new Map(prev).set(appointment.id, estimateId));
      setUpcomingAppointments(prev => 
        prev.map(apt => apt.id === appointment.id ? { ...apt, estimatedOop: pricingResult.estimatedOop } : apt)
      );

      // Navigate to cost breakdown with estimate ID
      navigate(`/cost-breakdown?id=${estimateId}`);
    } catch (error) {
      console.error('Error generating estimate for appointment:', error);
      alert('Sorry, I encountered an error generating the estimate. Please try again.');
      setIsProcessing(false);
    }
  };

  const generateEstimate = async (procedureIntent: ProcedureIntent, query: string) => {
    const profile = storageService.getUserProfile();
    if (!profile) return;

    const costProfile = buildCostProfile(profile);

    setMessages(prev => [
      ...prev,
      { author: 'ai', text: 'Perfect! Generating your detailed cost breakdown now...' }
    ]);

    try {
      // Run pricing engine
      const pricingInputs: PricingInputs = {
        procedureIntent,
        costProfile,
        region: profile.zip,
        sourceTags: ['CMS_PFS'],
        payer: profile.payer, // Pass payer for preventive care checks
        planType: profile.planType, // Pass plan type for preventive care checks
        eobData: profile.eobData, // Pass EOB data for copays and actual coinsurance
      };

      const pricingResult = await runPricingEngine(pricingInputs);

      // Get recommended providers
      // Pass EOB provider name if available (confirms in-network status)
      const recommendedProviders = await getRecommendedProviders(
        procedureIntent,
        profile.zip,
        profile.preferredProviders,
        costProfile,
        3,
        profile.eobData?.providerName // Provider from EOB confirms in-network
      );

      // Create estimate
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

      // Save estimate
      storageService.saveEstimate(estimate);

      // Navigate to cost breakdown with estimate ID
      navigate(`/cost-breakdown?id=${estimate.id}`);
    } catch (error) {
      console.error('Error generating estimate:', error);
      setMessages(prev => [
        ...prev,
        { author: 'ai', text: 'Sorry, I encountered an error generating your estimate. Please try again.' }
      ]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-ink-black">Cost Estimator</h1>
        <p className="text-lg text-silver-gray mt-2">Know what your care will cost before you step into the clinic.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <AiCostEstimator
            isChatting={isChatting}
            initialQuery={aiQuery}
            onInitialQueryChange={setAiQuery}
            onStartChat={handleStartChat}
            messages={messages}
            currentMessage={currentMessage}
            onCurrentMessageChange={setCurrentMessage}
            onSendMessage={handleSendMessage}
          />
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6 bg-white border border-gray-200">
            <h2 className="text-xl font-bold text-ink-black mb-4">Upcoming Appointments</h2>
            {isLoadingAppointments ? (
              <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg bg-soft-gray/50">
                <div className="text-center text-silver-gray">
                  <Icon name="clock" className="w-10 h-10 mx-auto text-silver-gray mb-3 animate-pulse" />
                  <p className="mt-2 text-sm font-medium text-ink-black">Generating estimates...</p>
                  <p className="mt-1 text-xs text-silver-gray">Calculating costs for your appointments</p>
                </div>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg bg-soft-gray/50">
                <div className="text-center text-silver-gray">
                  <Icon name="clock" className="w-10 h-10 mx-auto text-silver-gray mb-3" />
                  <p className="mt-2 text-sm font-medium text-ink-black">No upcoming appointments</p>
                  <p className="mt-1 text-xs text-silver-gray">Appointments will appear here when scheduled</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const appointmentDate = new Date(appointment.date);
                  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  
                  // Calculate deductible remaining message
                  const deductibleRemaining = appointment.deductibleRemaining ?? 0;
                  const hasDeductibleMessage = deductibleRemaining > 0;

                  return (
                    <div 
                      key={appointment.id} 
                      onClick={() => handleAppointmentClick(appointment)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-bold text-ink-black mb-1">{appointment.visitType}</p>
                          <p className="text-sm text-silver-gray">{appointment.doctor}</p>
                          <p className="text-sm text-silver-gray">{formattedDate}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-primary-blue">
                            ${appointment.estimatedOop.toLocaleString()}
                          </p>
                          <p className="text-xs text-silver-gray">expected</p>
                        </div>
                      </div>
                      {hasDeductibleMessage && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
                          <Icon name="info" className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                          <p className="text-xs text-yellow-700">
                            ${deductibleRemaining.toLocaleString()} away from deductible
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="pt-4">
        <EducationalSection />
      </div>
    </div>
  );
};

export default CostEstimatorScreen;
