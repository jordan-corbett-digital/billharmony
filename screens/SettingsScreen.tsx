import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import OnboardingFlow from '../components/OnboardingFlow';
import { Icon } from '../components/Icon';
import { storageService } from '../services/storage';
import { buildCostProfile } from '../services/profile';
import { UserProfile, PlanType } from '../types';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const userProfile = storageService.getUserProfile();
    setProfile(userProfile);
    setIsLoading(false);
    
    // Show onboarding if no profile exists
    if (!userProfile && !storageService.isOnboardingComplete()) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    // Initialize edit form when profile loads - always editable
    if (profile) {
      setEditForm({
        name: profile.name || '',
        zip: profile.zip || '',
        city: profile.city || '',
        state: profile.state || '',
        payer: profile.payer || '',
        planType: profile.planType || 'PPO',
        deductibleTotal: profile.deductibleTotal || 0,
        deductibleMet: profile.deductibleMet || 0,
        coinsurance: profile.coinsurance || 0.2,
        oopMax: profile.oopMax,
        // Include copays from EOB data if available
        eobData: profile.eobData,
        inNetworkPreference: profile.inNetworkPreference !== undefined ? profile.inNetworkPreference : true,
        preferredProviders: profile.preferredProviders || [],
      });
    }
  }, [profile]);

  const handleOnboardingComplete = () => {
    const userProfile = storageService.getUserProfile();
    setProfile(userProfile);
    setShowOnboarding(false);
    storageService.setOnboardingComplete(true);
    // Navigate to dashboard (handled by OnboardingFlow)
  };

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleSave = () => {
    if (!profile) return;

    const updatedProfile: UserProfile = {
      ...profile,
      ...editForm,
      updatedAt: new Date().toISOString(),
    } as UserProfile;

    storageService.saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
    // Show success message (optional)
    alert('Profile updated successfully!');
  };

  const handleDeleteProfile = () => {
    if (!profile) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your profile? This action cannot be undone.'
    );
    
    if (confirmed) {
      storageService.deleteUserProfile();
      storageService.setOnboardingComplete(false);
      setProfile(null);
      setEditForm({});
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-ink-black">Settings</h1>
        <Card className="p-6">
          <p className="text-silver-gray">Loading...</p>
        </Card>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="space-y-6">
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onCancel={() => setShowOnboarding(false)}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-ink-black">Settings</h1>
        <Card className="p-6 text-center">
          <p className="text-silver-gray mb-4">No profile found. Let's set up your profile to get started.</p>
          <button
            onClick={handleStartOnboarding}
            className="bg-primary-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Setup
          </button>
        </Card>
      </div>
    );
  }

  const costProfile = buildCostProfile(profile);
  const deductibleRemaining = profile.deductibleTotal - profile.deductibleMet;
  const coinsurancePercent = Math.round(profile.coinsurance * 100);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-black">Settings</h1>
        <button
          onClick={handleDeleteProfile}
          className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-2"
        >
          <Icon name="trash" className="w-5 h-5" />
          <span>Delete Profile</span>
        </button>
      </div>
      
      {/* Health System View Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-black mb-1">Health System View</h2>
            <p className="text-sm text-silver-gray">Switch to health system administrator view</p>
          </div>
          <button
            onClick={() => navigate('/health-system')}
            className="flex items-center gap-3 px-4 py-2.5 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon name="hospital" className="w-5 h-5" />
            <span>Switch View</span>
          </button>
        </div>
      </Card>
      
      {/* Profile Information - Always Editable */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">Name</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">ZIP Code</label>
              <input
                type="text"
                value={editForm.zip || ''}
                onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                placeholder="63101"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">City</label>
              <input
                type="text"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                placeholder="Springfield"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">State</label>
              <input
                type="text"
                value={editForm.state || ''}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                placeholder="MO"
                maxLength={2}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Insurance Plan - Always Editable */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Insurance Plan</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">Insurance Company</label>
              <input
                type="text"
                value={editForm.payer || ''}
                onChange={(e) => setEditForm({ ...editForm, payer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                placeholder="Aetna, BCBS, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">Plan Type</label>
              <select
                value={editForm.planType || 'PPO'}
                onChange={(e) => setEditForm({ ...editForm, planType: e.target.value as PlanType })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              >
                <option value="PPO">PPO</option>
                <option value="HMO">HMO</option>
                <option value="EPO">EPO</option>
                <option value="POS">POS</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Financial Overview - Always Editable */}
      <h2 className="text-2xl font-bold text-ink-black pt-4">Your Financials</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-3">Deductible Progress</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">Deductible Total</label>
              <input
                type="number"
                value={editForm.deductibleTotal || ''}
                onChange={(e) => setEditForm({ ...editForm, deductibleTotal: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                placeholder="2000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">Deductible Met</label>
              <input
                type="number"
                value={editForm.deductibleMet || ''}
                onChange={(e) => setEditForm({ ...editForm, deductibleMet: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                placeholder="0"
              />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold mb-3">Coinsurance & Copays</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-black mb-2">Coinsurance Percentage</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={editForm.coinsurance ? Math.round(editForm.coinsurance * 100) : ''}
                  onChange={(e) => {
                    const percent = parseInt(e.target.value) || 0;
                    setEditForm({ ...editForm, coinsurance: percent / 100 });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  placeholder="20"
                />
                <span className="text-silver-gray font-semibold">%</span>
              </div>
              <p className="text-xs text-silver-gray mt-2">
                {profile.eobData?.coinsurance !== undefined 
                  ? `✅ Extracted from EOB: ${Math.round(profile.eobData.coinsurance * 100)}%`
                  : 'Your percentage of costs after deductible is met'}
              </p>
            </div>
            
            {/* Show copays if available from EOB */}
            {(profile.eobData?.copays?.primaryCare || profile.eobData?.copays?.specialist || 
              profile.eobData?.copays?.urgentCare || profile.eobData?.copays?.emergency) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-ink-black mb-2">Copays (from EOB):</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {profile.eobData.copays.primaryCare && (
                    <div className="text-silver-gray">
                      <span className="font-semibold">Primary Care:</span> ${profile.eobData.copays.primaryCare}
                    </div>
                  )}
                  {profile.eobData.copays.specialist && (
                    <div className="text-silver-gray">
                      <span className="font-semibold">Specialist:</span> ${profile.eobData.copays.specialist}
                    </div>
                  )}
                  {profile.eobData.copays.urgentCare && (
                    <div className="text-silver-gray">
                      <span className="font-semibold">Urgent Care:</span> ${profile.eobData.copays.urgentCare}
                    </div>
                  )}
                  {profile.eobData.copays.emergency && (
                    <div className="text-silver-gray">
                      <span className="font-semibold">Emergency:</span> ${profile.eobData.copays.emergency}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Preferred Providers - Always Editable */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Preferred Providers</h2>
        <div>
          <label className="block text-sm font-semibold text-ink-black mb-2">Provider Names (comma-separated)</label>
          <input
            type="text"
            value={editForm.preferredProviders?.join(', ') || ''}
            onChange={(e) => setEditForm({ 
              ...editForm, 
              preferredProviders: e.target.value.split(',').map(p => p.trim()).filter(p => p.length > 0)
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            placeholder="St. Jude's Hospital, Community Health"
          />
          <p className="text-xs text-silver-gray mt-2">Separate multiple providers with commas</p>
        </div>
      </Card>

      {/* Single Save Button */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          className="bg-primary-blue text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save All Changes
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
