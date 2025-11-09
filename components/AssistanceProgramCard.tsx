import React from 'react';
import Card from './Card';
import { Icon } from './Icon';
import { AssistanceProgram } from '../services/assistance-programs';

interface AssistanceProgramCardProps {
  program: AssistanceProgram;
  onApplyClick?: (program: AssistanceProgram) => void;
  onLearnMoreClick?: (program: AssistanceProgram) => void;
}

/**
 * Assistance Program Card
 * Beautiful card displaying an assistance program
 */
const AssistanceProgramCard: React.FC<AssistanceProgramCardProps> = ({
  program,
  onApplyClick,
  onLearnMoreClick,
}) => {
  const typeColors = {
    charity: 'bg-green-50 border-green-200',
    'payment-plan': 'bg-blue-100 border-2 border-blue-300',
    discount: 'bg-yellow-50 border-yellow-200',
    'insurance-assistance': 'bg-purple-50 border-purple-200',
    prescription: 'bg-pink-50 border-pink-200',
  };

  const typeLabels = {
    charity: 'Financial Assistance',
    'payment-plan': 'Payment Plan',
    discount: 'Discount Program',
    'insurance-assistance': 'Insurance Help',
    prescription: 'Prescription Help',
  };

  // Remove outer box (Card) for payment-plan type
  const content = (
    <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          program.type === 'charity' ? 'bg-green-100' :
          program.type === 'payment-plan' ? 'bg-blue-100' :
          program.type === 'discount' ? 'bg-yellow-100' :
          program.type === 'insurance-assistance' ? 'bg-purple-100' :
          'bg-pink-100'
        }`}>
          <Icon 
            name={program.icon as any} 
            className={`w-6 h-6 ${
              program.type === 'charity' ? 'text-green-600' :
              program.type === 'payment-plan' ? 'text-blue-600' :
              program.type === 'discount' ? 'text-yellow-600' :
              program.type === 'insurance-assistance' ? 'text-purple-600' :
              'text-pink-600'
            }`} 
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-ink-black">{program.name}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  program.type === 'charity' ? 'bg-green-100 text-green-800' :
                  program.type === 'payment-plan' ? 'bg-blue-100 text-blue-800' :
                  program.type === 'discount' ? 'bg-yellow-100 text-yellow-800' :
                  program.type === 'insurance-assistance' ? 'bg-purple-100 text-purple-800' :
                  'bg-pink-100 text-pink-800'
                }`}>
                  {typeLabels[program.type]}
                </span>
              </div>
              <p className="text-sm text-silver-gray mb-3">{program.description}</p>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-ink-black mb-2">Key Benefits:</p>
            <ul className="space-y-1">
              {program.benefits.slice(0, 3).map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-silver-gray">
                  <Icon name="check" className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Processing Time */}
          <div className="flex items-center gap-2 text-xs text-silver-gray mb-4">
            <Icon name="clock" className="w-4 h-4" />
            <span>Processing time: {program.estimatedProcessingTime}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {onApplyClick && (
              <button
                onClick={() => onApplyClick(program)}
                className="flex-1 bg-primary-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Apply Now
              </button>
            )}
            {onLearnMoreClick && (
              <button
                onClick={() => onLearnMoreClick(program)}
                className="px-4 py-2 text-primary-blue font-semibold hover:bg-primary-blue/10 rounded-lg transition-colors text-sm"
              >
                Learn More
              </button>
            )}
          </div>
        </div>
      </div>
  );

  // Return with or without Card wrapper based on type
  if (program.type === 'payment-plan') {
    return (
      <div className={`p-6 ${typeColors[program.type]} hover:shadow-xl transition-shadow rounded-lg shadow-md`}>
        {content}
      </div>
    );
  }

  return (
    <Card className={`p-6 border-2 ${typeColors[program.type]} hover:shadow-lg transition-shadow`}>
      {content}
    </Card>
  );
};

export default AssistanceProgramCard;

