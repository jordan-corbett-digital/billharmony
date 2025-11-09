
import React from 'react';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import { IconName } from '../constants';

interface Alert {
    type: 'warning' | 'error' | 'info';
    text: string;
    subtext: string;
    icon: IconName;
    color: 'orange' | 'red' | 'blue';
    insight: string;
}

const allAlerts: Alert[] = [
    { 
        type: 'warning' as const, 
        text: 'Unexpected charge', 
        subtext: 'Cardiologist Fee', 
        icon: 'warningTriangle' as const, 
        color: 'orange',
        insight: 'This fee is 34% higher than typical in your region.'
    },
    { 
        type: 'error' as const, 
        text: 'Possible duplicate billing', 
        subtext: 'Lab Work', 
        icon: 'errorCircle' as const, 
        color: 'red',
        insight: 'This appears to be the same CPT code billed twice.'
    },
    { 
        type: 'info' as const, 
        text: 'Find a Cheaper Facility', 
        subtext: 'Lab Work', 
        icon: 'searchLocation' as const, 
        color: 'blue',
        insight: 'You could save $45 by switching providers.'
    },
    { 
        type: 'warning' as const, 
        text: 'Out-of-Network Provider', 
        subtext: 'Anesthesiologist at St. Jude\'s', 
        icon: 'warningTriangle' as const, 
        color: 'orange',
        insight: 'This provider may not be covered by your plan, leading to higher costs.'
    },
];

const alertColors = {
    orange: 'border-warning-orange text-warning-orange',
    red: 'border-error-red text-error-red',
    blue: 'border-primary-blue text-primary-blue',
};
  
const AlertsScreen: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ink-black">All Alerts</h1>
      <p className="text-lg text-silver-gray">Review all notifications and potential issues we've found for you.</p>

      <Card className="p-6">
        <div className="space-y-4">
          {allAlerts.map((alert, index) => (
            <div key={index} className={`p-4 rounded-lg cursor-pointer border-l-4 ${alertColors[alert.color]} bg-gray-50/50`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-start">
                        <Icon name={alert.icon} className="w-6 h-6 mr-4 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-ink-black">{alert.text}</p>
                            <p className="text-sm text-silver-gray">{alert.subtext}</p>
                            <p className="text-sm text-silver-gray mt-2 italic">"{alert.insight}"</p>
                        </div>
                    </div>
                    <Icon name="chevronRight" className="w-5 h-5 text-gray-400" />
                </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AlertsScreen;