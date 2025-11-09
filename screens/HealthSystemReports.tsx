import React, { useState } from 'react';
import Card from '../components/Card';
import { Icon } from '../components/Icon';

const HealthSystemReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const reports = [
    {
      id: '1',
      title: 'Billing Disputes Report',
      description: 'Summary of all billing disputes and resolutions',
      icon: 'alertCircle',
      color: 'bg-red-50 border-red-200 text-red-700',
      lastGenerated: '2 days ago',
      metrics: {
        total: 47,
        resolved: 38,
        pending: 9,
      },
    },
    {
      id: '2',
      title: 'Charity Care Applications',
      description: 'Charity care application status and approval rates',
      icon: 'shieldCheck',
      color: 'bg-green-50 border-green-200 text-green-700',
      lastGenerated: '1 day ago',
      metrics: {
        total: 1247,
        approved: 972,
        pending: 275,
      },
    },
    {
      id: '3',
      title: 'Cost Estimate Usage',
      description: 'Patient engagement with cost estimates',
      icon: 'preService',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      lastGenerated: '3 hours ago',
      metrics: {
        total: 3456,
        saved: 2891,
        shared: 1234,
      },
    },
    {
      id: '4',
      title: 'Payment Plan Performance',
      description: 'Payment plan creation and completion rates',
      icon: 'cardPayment',
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      lastGenerated: '5 hours ago',
      metrics: {
        total: 892,
        active: 678,
        completed: 214,
      },
    },
    {
      id: '5',
      title: 'Patient Satisfaction Survey',
      description: 'Patient feedback and satisfaction scores',
      icon: 'star',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      lastGenerated: '1 week ago',
      metrics: {
        total: 892,
        positive: 756,
        neutral: 98,
      },
    },
    {
      id: '6',
      title: 'System Integration Status',
      description: 'EPIC and CMS integration health metrics',
      icon: 'hospital',
      color: 'bg-gray-50 border-gray-200 text-gray-700',
      lastGenerated: 'Just now',
      metrics: {
        uptime: '99.8%',
        syncRate: '98.5%',
        errors: 3,
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-black">Reports</h1>
          <p className="text-lg text-silver-gray mt-2">
            View and generate reports on patient financial navigation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  selectedPeriod === period
                    ? 'bg-primary-blue text-white'
                    : 'bg-white text-silver-gray hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Icon name="receipt" className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center`}>
                <Icon name={report.icon as any} className="w-6 h-6" />
              </div>
              <span className="text-xs text-silver-gray">{report.lastGenerated}</span>
            </div>
            <h3 className="text-lg font-bold text-ink-black mb-2">{report.title}</h3>
            <p className="text-sm text-silver-gray mb-4">{report.description}</p>
            
            <div className="space-y-2 mb-4">
              {Object.entries(report.metrics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-silver-gray capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="font-semibold text-ink-black">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">
                View Report
              </button>
              <button className="px-4 py-2 bg-white text-ink-black font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors text-sm">
                <Icon name="link" className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-ink-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <Icon name="receipt" className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-semibold text-ink-black">Generate Custom Report</p>
            <p className="text-xs text-silver-gray mt-1">Create a custom report with specific metrics</p>
          </button>
          <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left">
            <Icon name="clipboardCheck" className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-semibold text-ink-black">Export Data</p>
            <p className="text-xs text-silver-gray mt-1">Export reports to CSV or PDF</p>
          </button>
          <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left">
            <Icon name="clock" className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-semibold text-ink-black">Schedule Reports</p>
            <p className="text-xs text-silver-gray mt-1">Set up automated report generation</p>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default HealthSystemReports;

