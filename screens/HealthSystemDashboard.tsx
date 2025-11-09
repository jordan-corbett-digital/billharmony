import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Card from '../components/Card';
import { Icon } from '../components/Icon';

/**
 * Health System Dashboard Mockup
 * Shows ROI metrics and B2B value for health systems
 * This is a mockup/demo screen - metrics are simulated
 */
const HealthSystemDashboard: React.FC = () => {
  // Simulated metrics - in production, these would come from real data
  // Individual clinician metrics (not entire hospital)
  const clinicianName = 'Dr. Jane Smith';
  const metrics = {
    billingQuestionsReduced: 38,
    charityEnrollmentIncrease: 24,
    patientSatisfaction: 94,
    averageCostSavingsPerPatient: 850,
    totalPatientsServed: 127,
    totalCostSavings: 107950,
    averageResponseTime: '1.2 hours',
    complianceScore: 98,
  };

  const kpiCards = [
    {
      title: 'Billing Questions Reduced',
      value: `${metrics.billingQuestionsReduced}%`,
      change: '+12%',
      trend: 'up',
      icon: 'questionMark',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Charity Enrollment Increase',
      value: `${metrics.charityEnrollmentIncrease}%`,
      change: '+8%',
      trend: 'up',
      icon: 'shieldCheck',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      title: 'Patient Satisfaction',
      value: `${metrics.patientSatisfaction}%`,
      change: '+3%',
      trend: 'up',
      icon: 'star',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600',
    },
    {
      title: 'Total Cost Savings',
      value: `$${(metrics.totalCostSavings / 1000).toFixed(0)}K`,
      change: 'This month',
      trend: 'up',
      icon: 'cardPayment',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
    },
  ];

  const recentActivity = [
    { type: 'Charity Application', count: 8, status: 'Approved', time: '2 hours ago' },
    { type: 'Cost Estimate', count: 23, status: 'Generated', time: '4 hours ago' },
    { type: 'Payment Plan', count: 5, status: 'Created', time: '6 hours ago' },
    { type: 'EOB Upload', count: 12, status: 'Processed', time: '8 hours ago' },
  ];

  // Chart data for trends over time (individual clinician scale)
  const trendData = [
    { month: 'Jan', billingQuestions: 32, charityEnrollment: 14, patientSatisfaction: 88 },
    { month: 'Feb', billingQuestions: 28, charityEnrollment: 16, patientSatisfaction: 90 },
    { month: 'Mar', billingQuestions: 24, charityEnrollment: 19, patientSatisfaction: 91 },
    { month: 'Apr', billingQuestions: 20, charityEnrollment: 21, patientSatisfaction: 92 },
    { month: 'May', billingQuestions: 18, charityEnrollment: 23, patientSatisfaction: 93 },
    { month: 'Jun', billingQuestions: 16, charityEnrollment: 26, patientSatisfaction: 94 },
  ];

  // Monthly activity data (individual clinician scale)
  const monthlyActivityData = [
    { month: 'Jan', estimates: 18, charityApps: 7, paymentPlans: 5 },
    { month: 'Feb', estimates: 22, charityApps: 9, paymentPlans: 6 },
    { month: 'Mar', estimates: 26, charityApps: 11, paymentPlans: 8 },
    { month: 'Apr', estimates: 31, charityApps: 13, paymentPlans: 9 },
    { month: 'May', estimates: 35, charityApps: 15, paymentPlans: 11 },
    { month: 'Jun', estimates: 42, charityApps: 18, paymentPlans: 13 },
  ];

  // Patient outcomes breakdown (individual clinician scale)
  const outcomesData = [
    { name: 'Charity Care', value: 31, color: '#10B981' },
    { name: 'Payment Plans', value: 52, color: '#3B82F6' },
    { name: 'Cost Estimates', value: 174, color: '#8B5CF6' },
    { name: 'Other Assistance', value: 12, color: '#F59E0B' },
  ];

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-black">Dashboard</h1>
          <p className="text-lg text-silver-gray mt-1">
            Welcome back, {clinicianName}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-silver-gray">Last updated</p>
            <p className="text-sm font-semibold text-ink-black">Just now</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Icon name="check" className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className={`p-6 border-2 ${kpi.color}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`w-16 h-16 rounded-lg ${kpi.color} flex items-center justify-center`}>
                <Icon 
                  name={kpi.icon as any} 
                  className={`w-8 h-8 ${kpi.iconColor}`} 
                />
              </div>
              <span className={`text-sm font-semibold ${
                kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.change}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-silver-gray mb-0">{kpi.title}</h3>
            <p className="text-3xl font-bold text-ink-black">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - ROI Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* ROI Summary */}
          <Card className="p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-ink-black mb-4">ROI Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-silver-gray">Time Saved</p>
                  <p className="text-2xl font-bold text-ink-black">18 hours/month</p>
                </div>
                <Icon name="clock" className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-silver-gray">Response Time</p>
                  <p className="text-2xl font-bold text-ink-black">{metrics.averageResponseTime}</p>
                </div>
                <Icon name="check" className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-silver-gray">Patient Retention</p>
                  <p className="text-2xl font-bold text-ink-black">87%</p>
                </div>
                <Icon name="userCircle" className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Trends Over Time Chart */}
          <Card className="p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-ink-black mb-4">Key Metrics Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="billingQuestions" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Billing Questions"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="charityEnrollment" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Charity Enrollment"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="patientSatisfaction" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Patient Satisfaction"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Activity Chart */}
          <Card className="p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-ink-black mb-4">Monthly Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyActivityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="estimates" fill="#3B82F6" name="Cost Estimates" radius={[4, 4, 0, 0]} />
                <Bar dataKey="charityApps" fill="#10B981" name="Charity Applications" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paymentPlans" fill="#8B5CF6" name="Payment Plans" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Patient Outcomes */}
          <Card className="p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-ink-black mb-4">Patient Outcomes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink-black">Charity Care Applications</span>
                    <span className="text-sm text-silver-gray">31 total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: '81%' }}></div>
                  </div>
                  <p className="text-xs text-silver-gray mt-1">81% approval rate</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink-black">Payment Plans Created</span>
                    <span className="text-sm text-silver-gray">52 total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '73%' }}></div>
                  </div>
                  <p className="text-xs text-silver-gray mt-1">73% completion rate</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink-black">Cost Estimates Generated</span>
                    <span className="text-sm text-silver-gray">174 total</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-purple-600 h-3 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  <p className="text-xs text-silver-gray mt-1">94% patient engagement</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-black mb-4">Outcomes Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={outcomesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={75}
                      fill="#8884d8"
                      dataKey="value"
                      fontSize={11}
                    >
                      {outcomesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Integration Status */}
          <Card className="p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-ink-black mb-4">System Integration</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon name="shieldCheck" className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-ink-black">EPIC Integration</span>
                </div>
                <span className="text-sm text-green-600 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon name="shieldCheck" className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-ink-black">CMS Compliance</span>
                </div>
                <span className="text-sm text-green-600 font-semibold">98% Score</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon name="shieldCheck" className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-ink-black">Price Transparency Files</span>
                </div>
                <span className="text-sm text-green-600 font-semibold">Synced</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Activity & Quick Stats */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card className="p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-ink-black mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon name="check" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-black">{activity.type}</p>
                    <p className="text-xs text-silver-gray">
                      {activity.count} {activity.status.toLowerCase()} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 border border-gray-200 bg-gradient-to-br from-primary-blue/5 to-accent-green/5">
            <h2 className="text-xl font-bold text-ink-black mb-4">This Month</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-silver-gray">Patients Served</p>
                <p className="text-3xl font-bold text-ink-black">{metrics.totalPatientsServed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-silver-gray">Avg. Cost Savings per Patient</p>
                <p className="text-2xl font-bold text-green-600">${metrics.averageCostSavingsPerPatient.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-silver-gray">Avg. Response Time</p>
                <p className="text-xl font-bold text-ink-black">{metrics.averageResponseTime}</p>
              </div>
            </div>
          </Card>

          {/* Support */}
          <Card className="p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-ink-black mb-4">Need Help?</h2>
            <p className="text-sm text-silver-gray mb-4">
              Our team is here to support you and your patients.
            </p>
            <button className="w-full bg-primary-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Contact Support
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HealthSystemDashboard;

