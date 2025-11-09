import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import AssistanceProgramCard from '../components/AssistanceProgramCard';
import { getAllPrograms, AssistanceProgram } from '../services/assistance-programs';
import { storageService } from '../services/storage';
import Modal from '../components/Modal';

type FilterType = 'all' | 'charity' | 'payment-plan' | 'discount' | 'insurance-assistance' | 'prescription';

const AssistanceProgramsScreen: React.FC = () => {
  const [allPrograms, setAllPrograms] = useState<AssistanceProgram[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<AssistanceProgram[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedProgram, setSelectedProgram] = useState<AssistanceProgram | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    // Load all programs
    const programs = getAllPrograms();
    setAllPrograms(programs);
    setFilteredPrograms(programs);
  }, []);

  useEffect(() => {
    // Filter programs based on active filter
    if (activeFilter === 'all') {
      setFilteredPrograms(allPrograms);
    } else {
      setFilteredPrograms(allPrograms.filter(program => program.type === activeFilter));
    }
  }, [activeFilter, allPrograms]);

  const filterTabs: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'charity', label: 'Charity Care' },
    { id: 'payment-plan', label: 'Payment Plans' },
    { id: 'discount', label: 'Discounts' },
    { id: 'insurance-assistance', label: 'Insurance Assistance' },
    { id: 'prescription', label: 'Prescription' },
  ];

  const handleApply = (program: AssistanceProgram) => {
    // In production, this would navigate to application form or open application modal
    alert(`Application for ${program.name} would open here. In production, this would navigate to an application form.`);
  };

  const handleLearnMore = (program: AssistanceProgram) => {
    setSelectedProgram(program);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink-black">Financial Assistance Programs</h1>
        <p className="text-lg text-silver-gray mt-2">
          We found several assistance programs that may help reduce your medical costs.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeFilter === tab.id
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-silver-gray hover:text-ink-black hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrograms.map((program) => (
            <AssistanceProgramCard
              key={program.id}
              program={program}
              onApplyClick={handleApply}
              onLearnMoreClick={handleLearnMore}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Icon name="info" className="w-12 h-12 mx-auto text-silver-gray mb-4" />
          <p className="text-lg font-semibold text-ink-black mb-2">No programs found</p>
          <p className="text-sm text-silver-gray">
            No assistance programs match this filter. Try selecting a different category.
          </p>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-4">
          <Icon name="info" className="w-6 h-6 text-primary-blue flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-ink-black mb-2">Need Help Choosing?</h3>
            <p className="text-sm text-ink-black mb-3">
              If you're unsure which program is right for you, start with the Charity Care Program. 
              It's the most comprehensive and can cover up to 100% of your costs if you qualify.
            </p>
            <p className="text-sm text-silver-gray">
              You can apply for multiple programs, but most patients only need one. Our team can help 
              you determine the best option for your situation.
            </p>
          </div>
        </div>
      </Card>

      {/* Program Details Modal */}
      {selectedProgram && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={selectedProgram.name}
        >
          <div className="p-6 space-y-6">
            {/* Description */}
            <div className="bg-soft-gray/50 rounded-lg p-4">
              <h3 className="font-bold text-ink-black mb-2 text-base">Description</h3>
              <p className="text-sm text-ink-black leading-relaxed">{selectedProgram.description}</p>
            </div>

            {/* Eligibility Criteria */}
            <div>
              <h3 className="font-bold text-ink-black mb-3 text-base flex items-center gap-2">
                <Icon name="check" className="w-5 h-5 text-accent-green" />
                Eligibility Criteria
              </h3>
              <ul className="space-y-2.5">
                {selectedProgram.eligibilityCriteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-ink-black bg-white border border-gray-100 rounded-lg p-3">
                    <Icon name="check" className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="font-bold text-ink-black mb-3 text-base flex items-center gap-2">
                <Icon name="star" className="w-5 h-5 text-yellow-500" />
                Benefits
              </h3>
              <ul className="space-y-2.5">
                {selectedProgram.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-ink-black bg-green-50 border border-green-100 rounded-lg p-3">
                    <Icon name="check" className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Documents */}
            <div>
              <h3 className="font-bold text-ink-black mb-3 text-base flex items-center gap-2">
                <Icon name="receipt" className="w-5 h-5 text-primary-blue" />
                Required Documents
              </h3>
              <ul className="space-y-2.5">
                {selectedProgram.requiredDocuments.map((doc, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-ink-black bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <Icon name="receipt" className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Processing Time */}
            <div className="flex items-center gap-3 bg-soft-gray/50 rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                <Icon name="clock" className="w-5 h-5 text-primary-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-black">Processing Time</p>
                <p className="text-sm text-silver-gray">{selectedProgram.estimatedProcessingTime}</p>
              </div>
            </div>

            {/* Contact Info (if available) */}
            {(selectedProgram.applicationUrl || selectedProgram.phoneNumber) && (
              <div className="bg-primary-blue/5 border border-primary-blue/20 rounded-lg p-4">
                <h3 className="font-bold text-ink-black mb-3 text-base">How to Apply</h3>
                {selectedProgram.applicationUrl && (
                  <a
                    href={selectedProgram.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-primary-blue hover:text-blue-700 font-semibold text-sm mb-2"
                  >
                    Apply Online →
                  </a>
                )}
                {selectedProgram.phoneNumber && (
                  <p className="text-sm text-silver-gray">
                    Call: <a href={`tel:${selectedProgram.phoneNumber}`} className="text-primary-blue hover:text-blue-700 font-semibold">{selectedProgram.phoneNumber}</a>
                  </p>
                )}
              </div>
            )}

            {/* Apply Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  handleApply(selectedProgram);
                  setShowDetailsModal(false);
                }}
                className="w-full bg-primary-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Apply for {selectedProgram.name}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssistanceProgramsScreen;

