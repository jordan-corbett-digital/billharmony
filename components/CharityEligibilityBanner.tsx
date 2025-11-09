import React, { useState } from 'react';
import Card from './Card';
import { Icon } from './Icon';
import { CharityEligibilityResult } from '../services/charity-screening';

interface CharityEligibilityBannerProps {
  eligibility: CharityEligibilityResult;
  estimatedOop: number;
  onApplyClick?: () => void;
  onLearnMoreClick?: () => void;
}

/**
 * Charity Eligibility Banner
 * Beautiful, empathetic banner showing charity care eligibility
 */
const CharityEligibilityBanner: React.FC<CharityEligibilityBannerProps> = ({
  eligibility,
  estimatedOop,
  onApplyClick,
  onLearnMoreClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!eligibility.isEligible) {
    return null;
  }

  const confidenceColor = {
    high: 'bg-green-50 border-green-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-blue-50 border-blue-200',
  }[eligibility.confidence];

  const confidenceIcon = {
    high: 'shieldCheck',
    medium: 'info',
    low: 'info',
  }[eligibility.confidence] as any;

  return (
    <Card className={`p-6 border-2 ${confidenceColor} shadow-lg`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          eligibility.confidence === 'high' ? 'bg-green-100' : 
          eligibility.confidence === 'medium' ? 'bg-yellow-100' : 
          'bg-blue-100'
        }`}>
          <Icon 
            name={confidenceIcon} 
            className={`w-6 h-6 ${
              eligibility.confidence === 'high' ? 'text-green-600' : 
              eligibility.confidence === 'medium' ? 'text-yellow-600' : 
              'text-blue-600'
            }`} 
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-ink-black mb-2">
                We Found Financial Assistance Options for You
              </h3>
              <p className="text-base text-ink-black mb-3">
                {eligibility.message}
                {eligibility.estimatedReduction > 0 && (
                  <span className="block mt-2 text-lg font-semibold text-green-600">
                    Potential savings: ${eligibility.estimatedReduction.toLocaleString()}
                    {eligibility.eligibilityPercentage > 0 && (
                      <span className="text-base font-normal text-silver-gray ml-2">
                        (up to {eligibility.eligibilityPercentage}% reduction)
                      </span>
                    )}
                  </span>
                )}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onApplyClick}
                  className="flex-1 bg-primary-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="shieldCheck" className="w-5 h-5" />
                  <span>Apply for Financial Assistance</span>
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-4 py-3 text-primary-blue font-semibold hover:bg-primary-blue/10 rounded-lg transition-colors"
                >
                  {isExpanded ? 'Show Less' : 'Learn More'}
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-ink-black mb-2">How Charity Care Works</h4>
              <ul className="space-y-2 text-sm text-silver-gray mb-4">
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Charity care programs help patients who cannot afford their medical bills</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Eligibility is based on income, household size, and financial hardship</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>If approved, your bill may be reduced or eliminated</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>The application process is confidential and free</span>
                </li>
              </ul>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-ink-black">
                  <strong>Next Steps:</strong> Click "Apply for Financial Assistance" to start your application. 
                  You'll need to provide proof of income and household size. The process typically takes 2-4 weeks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CharityEligibilityBanner;

