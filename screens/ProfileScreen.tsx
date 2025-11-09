
import React from 'react';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';

const ProfileScreen: React.FC = () => {
  const insurancePlan = {
    name: 'Blue Cross Blue Shield PPO',
    memberId: 'XG123456789',
    groupNumber: 'BCBS98765',
    deductible: {
      individual: 5000,
      individualMet: 2150,
    },
    outOfPocketMax: {
      individual: 8000,
      individualMet: 3500,
    },
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-ink-black">Profile & Insurance</h1>
      
      {/* Plan Details */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">{insurancePlan.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-silver-gray">
          <div><span className="font-semibold text-ink-black">Member ID:</span> {insurancePlan.memberId}</div>
          <div><span className="font-semibold text-ink-black">Group #:</span> {insurancePlan.groupNumber}</div>
        </div>
      </Card>
      
      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
            <h3 className="font-bold mb-3">Deductible Progress</h3>
            <ProgressBar value={insurancePlan.deductible.individualMet} max={insurancePlan.deductible.individual} />
            <div className="flex justify-between mt-2 text-sm">
                <span className="font-semibold text-ink-black">${insurancePlan.deductible.individualMet.toLocaleString()} Met</span>
                <span className="text-silver-gray">of ${insurancePlan.deductible.individual.toLocaleString()}</span>
            </div>
        </Card>
        <Card className="p-6">
            <h3 className="font-bold mb-3">Out-of-Pocket Max</h3>
            <ProgressBar value={insurancePlan.outOfPocketMax.individualMet} max={insurancePlan.outOfPocketMax.individual} colorClass="bg-accent-green" />
            <div className="flex justify-between mt-2 text-sm">
                <span className="font-semibold text-ink-black">${insurancePlan.outOfPocketMax.individualMet.toLocaleString()} Met</span>
                <span className="text-silver-gray">of ${insurancePlan.outOfPocketMax.individual.toLocaleString()}</span>
            </div>
        </Card>
      </div>

    </div>
  );
};

export default ProfileScreen;