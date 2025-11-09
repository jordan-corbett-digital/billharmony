
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import Card from '../components/Card';

const billedVsExpectedData = [
  { name: 'Jan', billed: 400, expected: 380 },
  { name: 'Mar', billed: 300, expected: 300 },
  { name: 'Apr', billed: 1200, expected: 950 },
  { name: 'Jul', billed: 278, expected: 250 },
  { name: 'Sep', billed: 189, expected: 189 },
  { name: 'Oct', billed: 812, expected: 640 },
];

const savingsData = [
  { name: 'Apr', saved: 250 },
  { name: 'Oct', saved: 172 },
];

const breakdownData = [
    { name: 'Radiology', value: 1590 },
    { name: 'Consultation', value: 489 },
    { name: 'Lab Work', value: 678 },
    { name: 'Pharmacy', value: 210 },
]

const HistoryScreen: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-ink-black">Financial History & Trends</h1>
      
      {/* Stats */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
            <div className="p-6 text-center">
                <p className="text-4xl font-bold text-accent-green">$312</p>
                <p className="text-silver-gray">Saved This Year</p>
            </div>
            <div className="p-6 text-center">
                <p className="text-4xl font-bold text-accent-green">$845</p>
                <p className="text-silver-gray">Total Savings Found</p>
            </div>
            <div className="p-6 text-center">
                <p className="text-4xl font-bold text-accent-green">4</p>
                <p className="text-silver-gray">Disputes Resolved</p>
            </div>
        </div>
      </Card>
      
      {/* Billed vs. Expected */}
      <Card className="p-6 h-96">
        <h2 className="text-xl font-bold mb-4">Billed vs. Expected Costs</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={billedVsExpectedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(4px)',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
              }}
            />
            <Legend />
            <Bar dataKey="billed" fill="#F7A81B" name="Billed Amount" radius={[4, 4, 0, 0]}/>
            <Bar dataKey="expected" fill="#4CC38A" name="Expected Amount" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Money Saved Over Time */}
        <Card className="p-6 h-96">
            <h2 className="text-xl font-bold mb-4">Money Saved from Disputes</h2>
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={savingsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="saved" name="Savings ($)" stroke="#3A73F0" strokeWidth={3} activeDot={{ r: 8 }} />
            </LineChart>
            </ResponsiveContainer>
        </Card>

        {/* Breakdown by Service Type */}
        <Card className="p-6 h-96">
            <h2 className="text-xl font-bold mb-4">Spending by Service Type</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" name="Total Billed" fill="#3A73F0" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default HistoryScreen;