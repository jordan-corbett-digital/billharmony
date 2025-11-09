import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { Icon } from '../components/Icon';

const HealthSystemSettings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-black">Settings</h1>
          <p className="text-lg text-silver-gray mt-2">
            Manage your health system account and preferences
          </p>
        </div>
      </div>

      {/* Back to Patient View */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-black mb-2">Patient View</h2>
            <p className="text-silver-gray">
              Switch back to the patient-facing view of BillHarmony
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon name="arrowRight" className="w-5 h-5" />
            Back to Patient View
          </button>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-ink-black mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Icon name="userCircle" className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-ink-black text-lg">Dr. Jane Smith</p>
              <p className="text-sm text-silver-gray">Joplin Regional Alliance for Health</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Settings Sections */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-ink-black mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink-black">Email Notifications</p>
              <p className="text-sm text-silver-gray">Receive email updates about patient activity</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink-black">SMS Notifications</p>
              <p className="text-sm text-silver-gray">Receive SMS alerts for urgent matters</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HealthSystemSettings;

