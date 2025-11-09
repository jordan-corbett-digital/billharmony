import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import { storageService } from '../services/storage';
import { Estimate } from '../types';

const SavedEstimatesScreen: React.FC = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = storageService.getEstimates();
    // Sort by most recent first
    const sorted = saved.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setEstimates(sorted);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this estimate?')) {
      storageService.deleteEstimate(id);
      setEstimates(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleEstimateClick = (id: string) => {
    navigate(`/cost-breakdown?id=${id}`);
  };

  if (estimates.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-ink-black">Saved Estimates</h1>
        <p className="text-lg text-silver-gray">Review and manage the cost estimates you've saved.</p>

        <Card className="p-8 text-center border-2 border-dashed border-gray-300 bg-gray-50/50 min-h-[300px] flex flex-col justify-center items-center">
          <Icon name="bookmark" className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-ink-black">No Saved Estimates Yet</h3>
          <p className="text-silver-gray mt-2 mb-4">When you save an estimate, it will appear here for easy access.</p>
          <button
            onClick={() => navigate('/cost-estimator')}
            className="bg-primary-blue text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create an Estimate
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ink-black">Saved Estimates</h1>
      <p className="text-lg text-silver-gray">Review and manage the cost estimates you've saved.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {estimates.map((estimate) => {
          const date = new Date(estimate.createdAt);
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <Card
              key={estimate.id}
              onClick={() => handleEstimateClick(estimate.id)}
              className="p-6 border border-gray-200/80 bg-white cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-ink-black mb-1">{estimate.title}</h3>
                  <p className="text-sm text-silver-gray">{formattedDate}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(estimate.id, e)}
                  className="p-2 text-silver-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete estimate"
                >
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-4xl font-extrabold text-primary-blue">${estimate.results.estimatedOop.toLocaleString()}</p>
                <p className="text-sm text-silver-gray">estimated out-of-pocket</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    estimate.results.confidence >= 80
                      ? 'bg-green-100 text-green-800'
                      : estimate.results.confidence >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {estimate.results.confidence}% confidence
                  </span>
                </div>
                <div className="flex items-center text-silver-gray">
                  <Icon name="clock" className="w-4 h-4 mr-1" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {estimate.recommendedProviders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-silver-gray mb-2">Recommended Providers:</p>
                  <div className="space-y-1">
                    {estimate.recommendedProviders.slice(0, 2).map((provider, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-ink-black">{provider.provider.name}</span>
                        <span className="text-primary-blue font-semibold">${provider.estimatedPrice.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SavedEstimatesScreen;
