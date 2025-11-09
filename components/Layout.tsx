
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { IconName } from '../constants';
import { storageService } from '../services/storage';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  path: string;
  label: string;
  icon: IconName;
}

const navLinks: NavItemProps[] = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' as const },
  { path: '/cost-estimator', label: 'Cost Estimator', icon: 'preService' as const },
  { path: '/bill-analyzer', label: 'Bill Analyzer', icon: 'search' as const },
  { path: '/assistance', label: 'Get Assistance', icon: 'shieldCheck' as const },
  { path: '/saved-estimates', label: 'Saved Estimates', icon: 'bookmark' as const },
  { path: '/settings', label: 'Settings', icon: 'settings' as const },
];

const NavItem: React.FC<NavItemProps> = ({ path, label, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <NavLink
      to={path}
      className={`flex items-center justify-between px-3 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-primary-blue/10 text-primary-blue'
          : 'text-silver-gray hover:bg-gray-100 hover:text-ink-black'
      }`}
    >
        <div className="flex items-center">
            <Icon name={icon} className="h-6 w-6 mr-3" />
            <span>{label}</span>
        </div>
    </NavLink>
  );
};

const healthSystemNavLinks: NavItemProps[] = [
  { path: '/health-system', label: 'Dashboard', icon: 'dashboard' as const },
  { path: '/health-system/inbox', label: 'Inbox', icon: 'mail' as const },
  { path: '/health-system/contacts', label: 'Contacts', icon: 'userCircle' as const },
  { path: '/health-system/reports', label: 'Reports', icon: 'receipt' as const },
  { path: '/health-system/settings', label: 'Settings', icon: 'settings' as const },
];

const SidebarContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHealthSystemView = location.pathname.startsWith('/health-system');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const userProfile = storageService.getUserProfile();
    setProfile(userProfile);
    
    // Listen for profile updates
    const handleStorageChange = () => {
      const updatedProfile = storageService.getUserProfile();
      setProfile(updatedProfile);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('appointmentsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('appointmentsUpdated', handleStorageChange);
    };
  }, []);

  // Format insurance display
  const getInsuranceDisplay = () => {
    if (!profile) return 'No insurance';
    const payer = profile.payer || 'Unknown';
    const planType = profile.planType || 'PPO';
    return `${payer} ${planType}`;
  };

  return (
    <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-3 mb-4 flex-shrink-0 w-full">
            <img 
                src="/logo.png" 
                alt="BillHarmony" 
                className="h-14 w-auto object-contain"
                style={{ maxWidth: '100%' }}
            />
        </div>

        {/* Navigation - Takes only needed space */}
        <nav className="space-y-2 flex-shrink-0">
            <ul className="space-y-1.5">
                {isHealthSystemView 
                  ? healthSystemNavLinks.map(link => <li key={link.path}><NavItem {...link} /></li>)
                  : navLinks.map(link => <li key={link.path}><NavItem {...link} /></li>)
                }
            </ul>
        </nav>

        {/* Spacer to push profile to bottom */}
        <div className="flex-grow"></div>

        {/* Profile Info - Always at bottom of viewport, clickable to settings */}
        {!isHealthSystemView && (
          <div className="pt-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
            {profile ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Icon name="userCircle" className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-black text-sm truncate">{profile.name || 'User'}</p>
                  <p className="text-xs text-silver-gray truncate">{getInsuranceDisplay()}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Icon name="userCircle" className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-black text-sm">No Profile</p>
                  <p className="text-xs text-silver-gray">Set up profile</p>
                </div>
              </>
            )}
          </button>
        </div>
        )}
        {isHealthSystemView && (
          <div className="pt-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => navigate('/health-system/settings')}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Icon name="userCircle" className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink-black text-sm truncate">Dr. Jane Smith</p>
                <p className="text-xs text-silver-gray truncate">Joplin Regional Alliance for Health</p>
              </div>
            </button>
          </div>
        )}
    </div>
  );
};


const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-soft-gray font-sans text-ink-black flex">
      {/* Desktop Sidebar - Fixed height to viewport */}
      <aside className="w-72 flex-shrink-0 bg-white p-6 hidden md:flex flex-col z-10 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
