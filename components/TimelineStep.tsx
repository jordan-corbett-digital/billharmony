
import React from 'react';

interface TimelineStepProps {
  title: string;
  isComplete: boolean;
  isLast?: boolean;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ title, isComplete, isLast = false }) => {
  return (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        <div className={`w-5 h-5 rounded-full border-2 ${isComplete ? 'bg-primary-blue border-primary-blue' : 'border-gray-300'}`}></div>
        {!isLast && <div className={`w-0.5 h-16 ${isComplete ? 'bg-primary-blue' : 'bg-gray-300'}`}></div>}
      </div>
      <div className={`pt-0.5 ${isComplete ? 'font-semibold text-ink-black' : 'text-silver-gray'}`}>
        {title}
      </div>
    </div>
  );
};

export default TimelineStep;
