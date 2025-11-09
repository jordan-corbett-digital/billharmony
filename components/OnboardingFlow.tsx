import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { Icon } from './Icon';
import HarmonyWave from './HarmonyWave';
import { OnboardingAssistant } from '../services/ai';
import { OnboardingMessage, UserProfile } from '../types';
import { storageService } from '../services/storage';
import { generateId } from '../services/profile';

interface OnboardingFlowProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onCancel }) => {
  const [assistant] = useState(() => new OnboardingAssistant());
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isProcessingEOB, setIsProcessingEOB] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Start conversation with welcome message
    const welcomeMsg: OnboardingMessage = {
      role: 'assistant',
      content: "Welcome to BillHarmony! I'm here to help you get personalized cost estimates. Let's start with your location. What's your ZIP code?",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!currentInput.trim() || isComplete) return;

    // Save the input before clearing it
    const inputValue = currentInput.trim();
    
    // Check if we're on EOB step and user said "skip"
    const currentState = assistant.getState();
    if (currentState.currentStep === 'eob' && (inputValue.toLowerCase().includes('skip') || inputValue.toLowerCase().includes("don't have"))) {
      assistant.handleEOBSkip();
      const newState = assistant.getState();
      const aiResponse = assistant.generateResponse();
      const aiMsg: OnboardingMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentInput('');
      return;
    }
    
    const userMsg: OnboardingMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setCurrentInput('');

    // Process with assistant using the saved input value
    const response = await assistant.processMessage(inputValue);
    const state = assistant.getState();

    console.log('OnboardingFlow: After processMessage, state:', {
      isComplete: state.isComplete,
      currentStep: state.currentStep,
      collectedData: state.collectedData,
    });

    // Check if response indicates completion (AI said profile is ready)
    const responseLower = response.toLowerCase();
    const completionIndicators = [
      'profile is ready',
      'profile ready',
      'everything i need',
      'all set',
      'complete',
      'ready to go'
    ];
    const responseIndicatesCompletion = completionIndicators.some(indicator => 
      responseLower.includes(indicator)
    );

    // Add AI response message first
    const aiMsg: OnboardingMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, aiMsg]);

    // Check if onboarding is complete after processing
    console.log('OnboardingFlow: Checking if complete, isComplete:', state.isComplete);
    console.log('OnboardingFlow: Response indicates completion:', responseIndicatesCompletion);
    
    if (state.isComplete || responseIndicatesCompletion) {
      console.log('OnboardingFlow: ✅ Completion detected! Starting save and redirect...');
      setIsComplete(true);
      
      // Save profile
      const userId = generateId();
      const profile = assistant.buildProfile(userId, 'User'); // In production, get name from user
      
      console.log('Saving profile:', profile);
      storageService.saveUserProfile(profile);
      storageService.setOnboardingComplete(true);
      
      // Verify it was saved
      const savedProfile = storageService.getUserProfile();
      console.log('Profile saved, verification:', savedProfile);
      
      // Add completion message if not already in response
      if (!responseIndicatesCompletion) {
        const completionMsg: OnboardingMessage = {
          role: 'assistant',
          content: "Perfect! Your profile has been set up. Redirecting you to the dashboard...",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, completionMsg]);
      }
      
      // Close modal and refresh dashboard after a brief delay
      setTimeout(() => {
        console.log('OnboardingFlow: Completing onboarding...');
        if (onComplete) {
          onComplete();
        }
        // Don't navigate if we're in a modal - just close it
        // The parent component will handle the refresh
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Calculate progress for harmony wave
  const getCurrentStepNumber = () => {
    const state = assistant.getState();
    const steps = ['location', 'eob', 'insurance', 'deductible', 'providers', 'complete'];
    const currentIndex = steps.indexOf(state.currentStep);
    return Math.max(0, currentIndex);
  };

  const totalSteps = 5; // location, eob, insurance, deductible, providers

  return (
    <div className="p-6">
      <Card className="p-6 bg-white border border-gray-200 overflow-hidden flex flex-col h-[60vh] max-h-[600px]">
        <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-soft-gray/50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <Icon name="sparkles" className="w-6 h-6 text-primary-blue mb-1 flex-shrink-0" />
              )}
              <div
                className={`max-w-md p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-primary-blue text-white rounded-br-none'
                    : 'bg-white text-ink-black rounded-bl-none border'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isComplete && (
            <div className="flex items-center gap-2 justify-start">
              <Icon name="sparkles" className="w-6 h-6 text-primary-blue mb-1 flex-shrink-0" />
              <div className="max-w-md p-3 rounded-2xl bg-green-100 text-green-800 rounded-bl-none border border-green-200">
                ✓ Profile setup complete! Redirecting...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          {assistant.getState().currentStep === 'eob' && !isComplete ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsProcessingEOB(true);
                    try {
                      await assistant.handleEOBUpload(file);
                      const aiMsg: OnboardingMessage = {
                        role: 'assistant',
                        content: "Perfect! I've extracted your insurance details from the EOB. Your profile is ready!",
                        timestamp: new Date().toISOString(),
                      };
                      setMessages(prev => [...prev, aiMsg]);
                      setIsComplete(true);
                      
                      // Save profile
                      const userId = generateId();
                      const profile = assistant.buildProfile(userId, 'User');
                      storageService.saveUserProfile(profile);
                      storageService.setOnboardingComplete(true);
                      
                      setTimeout(() => {
                        if (onComplete) onComplete();
                      }, 2000);
                    } catch (error) {
                      console.error('❌ Error processing EOB:', error);
                      console.error('Error details:', {
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        name: error instanceof Error ? error.name : undefined,
                      });
                      const errorMessage = error instanceof Error 
                        ? error.message 
                        : 'Unknown error occurred';
                      const errorMsg: OnboardingMessage = {
                        role: 'assistant',
                        content: `I had trouble reading your EOB: ${errorMessage}. You can try uploading again (make sure it's a clear image or PDF) or say 'skip' to continue with questions.`,
                        timestamp: new Date().toISOString(),
                      };
                      setMessages(prev => [...prev, errorMsg]);
                    } finally {
                      setIsProcessingEOB(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingEOB}
                className="w-full bg-primary-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Icon name="document" className="w-5 h-5" />
                {isProcessingEOB ? 'Processing EOB...' : 'Upload EOB (PDF or Image)'}
              </button>
              <button
                onClick={() => {
                  assistant.handleEOBSkip();
                  const aiResponse = assistant.generateResponse();
                  const aiMsg: OnboardingMessage = {
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date().toISOString(),
                  };
                  setMessages(prev => [...prev, aiMsg]);
                }}
                disabled={isProcessingEOB}
                className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Skip - Continue with Questions
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={isComplete ? "Setup complete!" : "Type your response..."}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isComplete}
                className="w-full bg-soft-gray border-2 border-gray-200 rounded-full py-3 pl-5 pr-14 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isComplete || !currentInput.trim()}
                className="absolute inset-y-0 right-0 m-2 flex items-center justify-center bg-primary-blue text-white rounded-full w-10 h-10 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="send" className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </Card>

      <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4">
        <div className="flex items-start">
          <Icon name="info" className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Why we need this information:</p>
            <p className="text-blue-700">
              We use your insurance details and location to provide accurate, personalized cost estimates. This information is secure and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

