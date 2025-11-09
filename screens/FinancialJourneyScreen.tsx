import React from 'react';
import Card from '../components/Card';
import { Icon } from '../components/Icon';

const FinancialJourneyScreen: React.FC = () => {
    const journeySteps = [
        { name: 'Estimate Generated', status: 'Complete', date: 'Mar 1, 2024', description: 'We analyzed your upcoming procedure and provided a verified cost estimate.' },
        { name: 'Appointment', status: 'Complete', date: 'Mar 15, 2024', description: 'You had your visit with Dr. Lee for your annual check-up.' },
        { name: 'Bill Received', status: 'Complete', date: 'Mar 28, 2024', description: 'The hospital sent the bill, and we started our automated analysis immediately.' },
        { name: 'Review & Resolve', status: 'Current', date: 'Now', description: 'We found some potential issues. Now you can review the analysis and take action.' },
    ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-ink-black">Your Financial Journey</h1>
      <p className="text-lg text-silver-gray">Follow every step of your care, from estimate to resolution.</p>

      <Card className="p-8">
        <div className="relative">
            {/* The line connecting steps */}
            <div className="absolute left-5 top-5 h-[calc(100%-2rem)] border-l-2 border-gray-200"></div>

            {journeySteps.map((step, index) => (
                <div key={index} className="relative pl-12 pb-12 last:pb-0">
                    {/* Circle indicator */}
                    <div className={`absolute left-0 top-1.5 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center border-2 ${step.status === 'Complete' ? 'bg-primary-blue border-primary-blue text-white' : 'border-primary-blue bg-white text-primary-blue ring-4 ring-blue-100'}`}>
                        {step.status === 'Complete' ? <Icon name="check" className="w-5 h-5"/> : <span className="font-bold">{index+1}</span>}
                    </div>
                    
                    <p className="text-sm text-silver-gray">{step.date}</p>
                    <h2 className="text-xl font-bold text-ink-black mt-1">{step.name}</h2>
                    <p className="mt-2 text-silver-gray">{step.description}</p>
                </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default FinancialJourneyScreen;
