
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardScreen from './screens/DashboardScreen';
import CostEstimatorScreen from './screens/PreServiceClarityScreen';
import CostBreakdownScreen from './screens/CostBreakdownScreen';
import SavedEstimatesScreen from './screens/SavedEstimatesScreen';
import SettingsScreen from './screens/SettingsScreen';
import AssistanceProgramsScreen from './screens/AssistanceProgramsScreen';
import HealthSystemDashboard from './screens/HealthSystemDashboard';
import HealthSystemInbox from './screens/HealthSystemInbox';
import HealthSystemContacts from './screens/HealthSystemContacts';
import HealthSystemReports from './screens/HealthSystemReports';
import HealthSystemSettings from './screens/HealthSystemSettings';
import BillAnalyzerScreen from './screens/BillAnalyzerScreen';
import BillDetailsScreen from './screens/BillDetailsScreen';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardScreen />} />
          <Route path="/cost-estimator" element={<CostEstimatorScreen />} />
          <Route path="/cost-breakdown" element={<CostBreakdownScreen />} />
          <Route path="/saved-estimates" element={<SavedEstimatesScreen />} />
          <Route path="/assistance" element={<AssistanceProgramsScreen />} />
          <Route path="/bill-analyzer" element={<BillAnalyzerScreen />} />
          <Route path="/bill-details" element={<BillDetailsScreen />} />
          <Route path="/health-system" element={<HealthSystemDashboard />} />
          <Route path="/health-system/inbox" element={<HealthSystemInbox />} />
          <Route path="/health-system/contacts" element={<HealthSystemContacts />} />
          <Route path="/health-system/reports" element={<HealthSystemReports />} />
          <Route path="/health-system/settings" element={<HealthSystemSettings />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
