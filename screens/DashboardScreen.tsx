import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import ConnectionNodes from '../components/ConnectionNodes';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { IconName } from '../constants';
import { storageService } from '../services/storage';
import { buildCostProfile } from '../services/profile';
import { getProvidersNearZip } from '../services/data';
import { Estimate, UserProfile, Appointment, SavedBill } from '../types';
import Modal from '../components/Modal';
import OnboardingFlow from '../components/OnboardingFlow';

interface ActionCardProps {
  title: string;
  description: string;
  icon: IconName;
  color: string;
  linkTo: string;
  comingSoon?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, color, linkTo, comingSoon }) => (
  <Link to={linkTo} className={`block rounded-2xl p-4 transition-all duration-300 ${comingSoon ? 'bg-gray-100 cursor-not-allowed' : 'bg-white shadow-soft hover:shadow-lg hover:-translate-y-1'}`}>
    <div className="flex items-start">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${color}`}>
        <Icon name={icon} className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-bold text-ink-black">{title} {comingSoon && <span className="text-xs text-silver-gray font-medium">(coming soon)</span>}</h3>
        <p className="text-sm text-silver-gray">{description}</p>
      </div>
    </div>
  </Link>
);

const DashboardScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedEstimates, setSavedEstimates] = useState<Estimate[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [billsNeedingReview, setBillsNeedingReview] = useState<SavedBill[]>([]);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // For demo: JRAH partnership - in production this would come from health system config
  const deployedBy = 'Joplin Regional Alliance for Health';

  useEffect(() => {
    const loadData = () => {
      try {
        const userProfile = storageService.getUserProfile();
        console.log('Dashboard: Loading profile:', userProfile);
        setProfile(userProfile);

        const estimates = storageService.getEstimates();
        // Sort by most recent and take last 2
        const sorted = estimates
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2);
        setSavedEstimates(sorted);

        // Load bills and find ones needing review - EXACT same logic as Bill Analyzer
        const allBills = storageService.getBills();
        const needsReview = allBills
          .filter(bill => {
            // Use EXACT same logic as Bill Analyzer renderBillCard
            const billStatus = bill.status || 'uploaded';
            const totalIssues = bill.analysis.summary.unexpectedCharges +
              bill.analysis.summary.possibleDuplicates +
              bill.analysis.lineItems.filter((item: any) => item.tags.includes('Coding Issue')).length;
            const needsReview = billStatus === 'needs_review' || (totalIssues > 0 && billStatus === 'uploaded');
            return needsReview;
          })
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setBillsNeedingReview(needsReview);

        // FOR DEMO: Clear all and only show Sleep Study
        // Find and update the Sleep Study estimate to have $590
        const allEstimates = storageService.getEstimates();
        let sleepEstimate = allEstimates.find(e => e.title === 'Sleep Study' || e.title.toLowerCase().includes('sleep'));

        // Update existing estimate to have $590 and current insurance profile
        if (sleepEstimate && userProfile) {
          // Update the existing estimate with $590 and current profile
          const costProfile = buildCostProfile(userProfile);
          const deductibleApplied = Math.min(costProfile.deductibleRemaining, 590);
          const remainingAfterDeductible = 590 - deductibleApplied;
          const coinsuranceDue = remainingAfterDeductible * (userProfile.coinsurance || 0.2);
          const allowedAmount = 590 / (1 - (userProfile.coinsurance || 0.2)); // Estimate allowed amount

          // Get the correct Sleep Study providers and update their prices to match $590
          // Do this asynchronously to avoid blocking
          getProvidersNearZip(userProfile.zip, 50).then(sleepProviders => {
            const sleepStudyProviders = sleepProviders.filter(p =>
              p.specialties?.some(s => s.toLowerCase().includes('sleep'))
            );

            // Create recommended providers with correct $590 pricing
            const recommendedProviders = sleepStudyProviders.slice(0, 3).map(provider => {
              // All providers should show $590 for consistency with the estimate
              // Small variation based on price bias for realism
              const priceVariation = provider.priceBias === 'low' ? 0.95 : provider.priceBias === 'high' ? 1.05 : 1.0;
              const providerPrice = Math.round(590 * priceVariation);

              return {
                provider: provider,
                estimatedPrice: providerPrice,
                distance: '2.5 mi', // Placeholder distance
                isInNetwork: provider.networkHint === 'in' || userProfile.inNetworkPreference,
                isPreferred: userProfile.preferredProviders?.some(pref =>
                  provider.name.toLowerCase().includes(pref.toLowerCase()) ||
                  pref.toLowerCase().includes(provider.name.toLowerCase())
                ) || false,
              };
            });

            const updatedEstimate = {
              ...sleepEstimate,
              userId: userProfile.id,
              inputsSnapshot: {
                profile: userProfile,
                costProfile: costProfile,
              },
              results: {
                ...sleepEstimate.results,
                estimatedOop: 590, // Update to $590
                deductibleApplied: deductibleApplied,
                coinsuranceDue: Math.round(coinsuranceDue),
                allowedAmount: Math.round(allowedAmount),
                totalBilled: Math.round(allowedAmount * 1.75), // Estimate total billed
                insuranceAdjustment: Math.round(allowedAmount * 0.75), // Estimate adjustment
              },
              recommendedProviders: recommendedProviders, // Update with correct sleep study providers
              updatedAt: new Date().toISOString(),
            };
            storageService.saveEstimate(updatedEstimate);
            console.log('Dashboard: Updated Sleep Study estimate to $590 with correct providers', updatedEstimate);
          }).catch(err => {
            console.error('Error updating providers:', err);
          });
        } else if (userProfile && !sleepEstimate) {
          // If no estimate exists, we'll let it be created when user clicks
          // For now, just note that we need one
          console.log('Dashboard: No Sleep Study estimate found, will be created on click');
        }

        let deductibleRemaining = 0;
        // Always use $590 for demo
        const estimatedOop = 590;

        if (sleepEstimate && sleepEstimate.results && sleepEstimate.inputsSnapshot) {
          // Keep estimatedOop at 590 for demo
          // Get the deductible applied from the estimate results
          const deductibleApplied = sleepEstimate.results.deductibleApplied || 0;
          // Get the current deductible BEFORE the procedure from the cost profile
          const deductibleBefore = sleepEstimate.inputsSnapshot.costProfile?.deductibleRemaining || 0;
          // Calculate remaining AFTER this procedure
          deductibleRemaining = Math.max(0, deductibleBefore - deductibleApplied);
          console.log('Dashboard: Deductible calculation', {
            deductibleBefore,
            deductibleApplied,
            deductibleRemaining,
            estimatedOop,
            hasEstimate: !!sleepEstimate
          });
        } else if (userProfile) {
          // Fallback: use profile deductible if estimate not found
          const costProfile = buildCostProfile(userProfile);
          deductibleRemaining = costProfile.deductibleRemaining || 0;
          console.log('Dashboard: Using profile deductible (no estimate found)', {
            deductibleRemaining,
            deductibleTotal: userProfile.deductibleTotal,
            deductibleMet: userProfile.deductibleMet
          });
        }

        // Ensure we have a deductible value - use profile if estimate calculation failed
        if (deductibleRemaining === 0 && userProfile) {
          const costProfile = buildCostProfile(userProfile);
          deductibleRemaining = costProfile.deductibleRemaining;
          // If still 0, calculate what it would be after the procedure
          if (deductibleRemaining === 0) {
            // Deductible is met, so no badge needed
            deductibleRemaining = 0;
          } else {
            // Calculate remaining after procedure
            const deductibleApplied = Math.min(deductibleRemaining, estimatedOop);
            deductibleRemaining = Math.max(0, deductibleRemaining - deductibleApplied);
          }
          console.log('Dashboard: Final deductible calculation', {
            deductibleRemaining,
            estimatedOop,
            fromProfile: true
          });
        }

        const sleepStudyAppointment: Appointment = {
          id: 'apt-sleep-study',
          date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
          doctor: 'CoxHealth Sleep Disorders Center',
          specialty: 'Sleep Medicine',
          visitType: 'Sleep Study',
          estimatedOop: 590, // Manually set to $590 for demo
          deductibleRemaining: 500, // Demo: hardcoded to $500
          createdAt: new Date().toISOString(),
        };
        const appointments = [sleepStudyAppointment];
        storageService.saveAppointments(appointments);
        console.log('Dashboard: Set Sleep Study appointment only', { estimatedOop, deductibleRemaining });
        setUpcomingAppointments(appointments);

        // Never show onboarding modal in demo - profile is auto-created
        // Only show if explicitly needed (which we don't want for demo)
        // if (!userProfile && !storageService.isOnboardingComplete()) {
        //   setShowOnboardingModal(true);
        // }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();

    // Also listen for storage events (in case profile or appointments are saved in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'billharmony_user_profile' || e.key === 'billharmony_appointments') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom storage events (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadData();
    };
    window.addEventListener('appointmentsUpdated', handleCustomStorageChange);

    // Listen for bill updates - EXACT same logic as Bill Analyzer
    const handleBillsUpdated = () => {
      const allBills = storageService.getBills();
      const needsReview = allBills.filter(bill => {
        // Use EXACT same logic as Bill Analyzer renderBillCard
        const billStatus = bill.status || 'uploaded';
        const totalIssues = bill.analysis.summary.unexpectedCharges +
          bill.analysis.summary.possibleDuplicates +
          bill.analysis.lineItems.filter((item: any) => item.tags.includes('Coding Issue')).length;
        const needsReview = billStatus === 'needs_review' || (totalIssues > 0 && billStatus === 'uploaded');
        return needsReview;
      }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setBillsNeedingReview(needsReview);
    };
    window.addEventListener('billsUpdated', handleBillsUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('appointmentsUpdated', handleCustomStorageChange);
      window.removeEventListener('billsUpdated', handleBillsUpdated);
    };
  }, [location.pathname]); // Reload when route changes (e.g., coming back from settings)

  const handleOnboardingComplete = () => {
    const userProfile = storageService.getUserProfile();
    setProfile(userProfile);
    setShowOnboardingModal(false);
    // Reload data to refresh the UI
    const estimates = storageService.getEstimates();
    const sorted = estimates
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    setSavedEstimates(sorted);

    // Reload bills needing review - EXACT same logic as Bill Analyzer
    const allBills = storageService.getBills();
    const needsReview = allBills.filter(bill => {
      // Use EXACT same logic as Bill Analyzer renderBillCard
      const billStatus = bill.status || 'uploaded';
      const totalIssues = bill.analysis.summary.unexpectedCharges +
        bill.analysis.summary.possibleDuplicates +
        bill.analysis.lineItems.filter((item: any) => item.tags.includes('Coding Issue')).length;
      const needsReview = billStatus === 'needs_review' || (totalIssues > 0 && billStatus === 'uploaded');
      return needsReview;
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    setBillsNeedingReview(needsReview);
  };

  const insights = [
    { icon: 'megaphone' as const, color: 'bg-blue-100 text-blue-600', title: 'New Feature: Cheaper Providers', description: 'Instantly compare local providers to find the best price.' },
    { icon: 'star' as const, color: 'bg-yellow-100 text-yellow-600', title: 'Pro Tip: Understand Your EOB', description: 'Your Explanation of Benefits is not a bill. We can help you read it.' },
    { icon: 'sparkles' as const, color: 'bg-purple-100 text-purple-600', title: 'AI Model Upgraded', description: 'Our AI is now faster and more accurate at finding billing errors.' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-ink-black">Dashboard</h1>
        <p className="text-lg text-silver-gray mt-1">
          Welcome back, {profile?.name || 'Guest'}.
        </p>
      </div>

      {/* Deployed by Branding - Shows B2B2C Model */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon name="hospital" className="w-5 h-5 text-primary-blue flex-shrink-0" />
          <p className="text-sm text-ink-black">
            <span className="text-silver-gray">Powered by BillHarmony for </span>
            <span className="font-semibold text-primary-blue">{deployedBy}</span>
          </p>
        </div>
        <div className="text-xs text-silver-gray font-medium">
          Partnership Program
        </div>
      </div>

      {/* 2. ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ActionCard title="Estimate Cost" description="Start with a procedure or test." icon="preService" color="bg-primary-blue" linkTo="/cost-estimator" />
        <ActionCard title="Analyze a Bill" description="Upload a bill to check for errors." icon="search" color="bg-warning-orange" linkTo="/bill-analyzer" />
        <ActionCard title="Get Assistance" description="Find help" icon="shieldCheck" color="bg-accent-green" linkTo="/assistance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT & CENTER CONTENT */}
        <div className="lg:col-span-2 space-y-6">

          {/* Two Column Modules: Upcoming Appointments & Bills Needing Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Appointments Module */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-ink-black">Upcoming Appointments</h2>
                {upcomingAppointments.length > 1 && (
                  <Link
                    to="/cost-estimator"
                    className="text-primary-blue hover:text-blue-700 font-semibold text-sm"
                  >
                    View all
                  </Link>
                )}
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg bg-soft-gray/50">
                  <div className="text-center text-silver-gray">
                    <Icon name="clock" className="w-10 h-10 mx-auto text-silver-gray" />
                    <p className="mt-2 text-sm font-medium">No upcoming appointments</p>
                    <p className="mt-1 text-xs text-silver-gray">Appointments will appear here when scheduled</p>
                  </div>
                </div>
              ) : (
                <div>
                  {(() => {
                    // Show only the most recent (first) appointment
                    const appointment = upcomingAppointments[0];
                    const appointmentDate = new Date(appointment.date);
                    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    // Calculate deductible remaining message
                    const deductibleRemaining = appointment.deductibleRemaining ?? 0;
                    const hasDeductibleMessage = deductibleRemaining > 0;

                    return (
                      <div>
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <Icon name="clock" className="w-4 h-4 text-primary-blue" />
                          <span className="text-xs font-bold text-primary-blue uppercase tracking-wide">UPCOMING VISIT</span>
                        </div>

                        {/* Appointment Details */}
                        <div className="mb-3">
                          <p className="text-ink-black text-sm font-semibold mb-1">{appointment.visitType}</p>
                          <p className="text-xs text-silver-gray">
                            {formattedDate}
                            <span className="mx-1">•</span>
                            {appointment.doctor}
                          </p>
                        </div>

                        {/* Estimated Cost */}
                        <div className="mb-3">
                          <p className="text-2xl font-bold text-ink-black">${appointment.estimatedOop.toLocaleString()}</p>
                          <p className="text-xs text-silver-gray mt-0.5">expected out-of-pocket</p>
                        </div>

                        {/* Deductible Status */}
                        {hasDeductibleMessage && (
                          <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
                            <Icon name="info" className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <p className="text-xs text-yellow-700">
                              ${deductibleRemaining.toLocaleString()} away from deductible
                            </p>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            // Find the Sleep Study estimate and navigate to it
                            const allEstimates = storageService.getEstimates();
                            const sleepEstimate = allEstimates.find(e =>
                              e.title === 'Sleep Study' || e.title.toLowerCase().includes('sleep')
                            );
                            if (sleepEstimate) {
                              navigate(`/cost-breakdown?id=${sleepEstimate.id}`);
                            } else {
                              // Fallback: navigate to cost estimator
                              navigate(`/cost-estimator?procedure=${encodeURIComponent(appointment.visitType)}`);
                            }
                          }}
                          className="w-full bg-primary-blue text-white font-semibold py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>

            {/* Bills Needing Review Module */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-ink-black">Bills Needing Review</h2>
                {billsNeedingReview.length > 0 && (
                  <Link
                    to="/bill-analyzer?status=needs_review"
                    className="text-warning-orange hover:text-orange-600 font-semibold text-sm"
                  >
                    View all
                  </Link>
                )}
              </div>
              {billsNeedingReview.length === 0 ? (
                <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg bg-soft-gray/50">
                  <div className="text-center text-silver-gray">
                    <Icon name="check" className="w-10 h-10 mx-auto text-accent-green" />
                    <p className="mt-2 text-sm font-medium text-ink-black">All bills reviewed</p>
                    <p className="mt-1 text-xs text-silver-gray">No bills need your attention right now</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {billsNeedingReview.slice(0, 2).map((bill) => {
                    const totalIssues = bill.analysis.summary.unexpectedCharges +
                      bill.analysis.summary.possibleDuplicates +
                      bill.analysis.lineItems.filter((item: any) => item.tags.includes('Coding Issue')).length;
                    const uploadDate = new Date(bill.uploadedAt);
                    const formattedDate = uploadDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <Link
                        key={bill.id}
                        to={`/bill-details?id=${bill.id}`}
                        className="block p-4 bg-white border-2 border-warning-orange/30 rounded-lg hover:bg-warning-orange/5 hover:border-warning-orange/50 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-warning-orange/20 flex items-center justify-center flex-shrink-0">
                            <Icon name="warningTriangle" className="w-5 h-5 text-warning-orange" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-ink-black truncate">{bill.provider || bill.fileName}</p>
                            <p className="text-sm text-silver-gray mt-1">{formattedDate}</p>
                            <p className="text-xs text-warning-orange mt-1 font-medium">
                              {totalIssues} {totalIssues === 1 ? 'issue' : 'issues'} found
                            </p>
                          </div>
                          <Icon name="chevronRight" className="w-5 h-5 text-silver-gray flex-shrink-0 mt-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Saved Estimates */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ink-black">Recent Saved Estimates</h2>
              {savedEstimates.length > 0 && (
                <Link to="/saved-estimates" className="text-primary-blue hover:text-blue-700 font-semibold text-sm">
                  View all
                </Link>
              )}
            </div>
            {savedEstimates.length === 0 ? (
              <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg bg-soft-gray/50">
                <div className="text-center text-silver-gray">
                  <Icon name="receipt" className="w-12 h-12 mx-auto text-silver-gray mb-3" />
                  <p className="mt-2 text-sm font-medium text-ink-black">No saved estimates yet</p>
                  <p className="mt-1 text-xs text-silver-gray">Create cost estimates to see them here</p>
                  <Link
                    to="/cost-estimator"
                    className="mt-4 inline-block text-primary-blue hover:text-blue-700 font-semibold text-sm"
                  >
                    Create your first estimate
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {savedEstimates.map((estimate) => {
                  const date = new Date(estimate.createdAt);
                  const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <Link
                      key={estimate.id}
                      to={`/cost-breakdown?id=${estimate.id}`}
                      className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md hover:border-primary-blue/30 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Icon name="receipt" className="w-5 h-5 text-primary-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-ink-black truncate">{estimate.title}</p>
                              <p className="text-sm text-silver-gray mt-1">{formattedDate}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-2xl font-bold text-primary-blue">${estimate.results.estimatedOop.toLocaleString()}</p>
                          <p className="text-xs text-silver-gray">expected</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Profile */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-ink-black mb-4">Active Profile</h2>
            {profile ? (
              <>
                <div className="flex items-center">
                  <Icon name="userCircle" className="w-10 h-10 mr-4 text-silver-gray" />
                  <div>
                    <p className="font-bold text-ink-black">{profile.name}</p>
                    <p className="text-sm text-silver-gray">{profile.payer} {profile.planType}</p>
                  </div>
                </div>
                <Link to="/settings">
                  <button className="w-full mt-4 bg-gray-100 text-ink-black font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                    Manage Profile
                  </button>
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <Icon name="userCircle" className="w-10 h-10 mr-4 text-silver-gray" />
                  <div>
                    <p className="font-bold text-ink-black">No Profile</p>
                    <p className="text-sm text-silver-gray">Set up your profile to get started</p>
                  </div>
                </div>
                <Link to="/settings">
                  <button className="w-full bg-primary-blue text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                    Set Up Profile
                  </button>
                </Link>
              </>
            )}
          </Card>

          {/* Updates & Insights */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-ink-black mb-4">Updates & Insights</h2>
            <div className="space-y-3">
              {insights.map(item => (
                <Link to="#" key={item.title} className="block p-3.5 rounded-xl bg-soft-gray/60 hover:bg-gray-200/60 transition-colors">
                  <div className="flex items-start">
                    <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center mr-3 ${item.color}`}>
                      <Icon name={item.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink-black">{item.title}</h4>
                      <p className="text-sm text-silver-gray">{item.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Onboarding Modal */}
      <Modal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        title="Set Up Your Profile"
        showCloseButton={true}
      >
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onCancel={() => setShowOnboardingModal(false)}
        />
      </Modal>
    </div>
  );
};

export default DashboardScreen;
