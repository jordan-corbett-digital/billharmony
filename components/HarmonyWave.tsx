import React from 'react';

interface HarmonyWaveProps {
  steps: number;
  currentStep: number;
  className?: string;
}

/**
 * HarmonyWave - Visual element showing flow/connection
 * Represents the journey: EOB → Profile → Estimate → Assistance
 */
const HarmonyWave: React.FC<HarmonyWaveProps> = ({ steps, currentStep, className = '' }) => {
  const progress = (currentStep / steps) * 100;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Wave SVG */}
      <svg
        width="100%"
        height="60"
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Background wave (light) */}
        <path
          d="M 0 30 Q 100 20, 200 30 T 400 30"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        
        {/* Progress wave (brand colors) */}
        <path
          d="M 0 30 Q 100 20, 200 30 T 400 30"
          stroke="url(#waveGradient)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="400"
          strokeDashoffset={400 - (progress / 100) * 400}
          className="transition-all duration-500 ease-out"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3A73F0" stopOpacity="1" />
            <stop offset="50%" stopColor="#20B2AA" stopOpacity="1" />
            <stop offset="100%" stopColor="#4CC38A" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Step indicators */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: steps }, (_, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${
              index <= currentStep ? 'opacity-100' : 'opacity-40'
            } transition-opacity duration-300`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index < currentStep
                  ? 'bg-accent-green'
                  : index === currentStep
                  ? 'bg-primary-blue ring-4 ring-primary-blue/20'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-silver-gray mt-1 text-center">
              {index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HarmonyWave;


