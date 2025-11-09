
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import Accordion from '../components/Accordion';
import { analyzeBillImage } from '../services/bill-analyzer';
import { storageService } from '../services/storage';
import { SavedBill, BillStatus } from '../types';
import { generateId } from '../services/profile';

const BillAnalyzerScreen: React.FC = () => {
    const navigate = useNavigate();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
    const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | '3months' | 'year'>('all');
    const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load saved bills
        let bills = storageService.getBills();
        
        // For demo: Always ensure we have sample bills (create if none exist)
        if (bills.length === 0) {
            const sampleBills: SavedBill[] = [
                {
                    id: generateId(),
                    fileName: 'Mercy Hospital - MRI Bill.pdf',
                    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                    provider: 'Mercy Hospital',
                    dateOfService: '2024-01-15',
                    analysis: {
                        billTotal: 2850,
                        expectedTotal: 2200,
                        difference: 650,
                        lineItems: [
                            {
                                id: 'item-1',
                                name: 'MRI KNEE WO/CONTR',
                                cptCode: '73721',
                                billedAmount: 2850,
                                expectedRange: [2000, 2400],
                                tags: ['Unexpected Charge'],
                                details: 'This MRI charge is $650 higher than typical rates for in-network facilities. The expected range for this CPT code is $2,000-$2,400.',
                                suggestedAction: 'Contact billing department to verify network status and negotiate rate',
                            },
                        ],
                        summary: {
                            unexpectedCharges: 1,
                            possibleDuplicates: 0,
                            codingVerified: true,
                            inNetworkConfirmed: true,
                        },
                        explanation: 'Think of it like this: you went to the store expecting to pay $22.00 for a toy. But at the checkout, they charged you $28.50. We looked at your receipt and it seems they charged too much for the MRI scan. Don\'t worry, we\'ll help you talk to the store to fix it.',
                    },
                },
                {
                    id: generateId(),
                    fileName: 'Dr. Smith - Consultation Bill.pdf',
                    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                    provider: 'Dr. Smith Family Practice',
                    dateOfService: '2024-01-20',
                    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y5ZmFmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Eci4gU21pdGggQ29uc3VsdGF0aW9uPC90ZXh0Pjwvc3ZnPg==',
                    analysis: {
                        billTotal: 450,
                        expectedTotal: 450,
                        difference: 0,
                        lineItems: [
                            {
                                id: 'item-1',
                                name: 'Office Visit - Established Patient',
                                cptCode: '99213',
                                billedAmount: 150,
                                expectedRange: [120, 180],
                                tags: [],
                                details: 'Charge is within the expected range based on transparency data.',
                            },
                            {
                                id: 'item-2',
                                name: 'Lab Work - Blood Test',
                                cptCode: '80053',
                                billedAmount: 300,
                                expectedRange: [250, 350],
                                tags: [],
                                details: 'Charge is within the expected range for comprehensive metabolic panel.',
                            },
                        ],
                        summary: {
                            unexpectedCharges: 0,
                            possibleDuplicates: 0,
                            codingVerified: true,
                            inNetworkConfirmed: true,
                        },
                        explanation: 'Great news! Your bill looks correct. All charges are within the expected ranges for these services. No action needed.',
                    },
                },
                {
                    id: generateId(),
                    fileName: 'Emergency Room Visit.pdf',
                    uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
                    provider: 'Springfield Regional Hospital',
                    dateOfService: '2024-01-10',
                    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y5ZmFmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FbWVyZ2VuY3kgUm9vbTwvdGV4dD48L3N2Zz4=',
                    analysis: {
                        billTotal: 3200,
                        expectedTotal: 2800,
                        difference: 400,
                        lineItems: [
                            {
                                id: 'item-1',
                                name: 'Emergency Room Visit',
                                cptCode: '99284',
                                billedAmount: 1200,
                                expectedRange: [1000, 1300],
                                tags: [],
                                details: 'Charge is within the expected range for emergency room visit.',
                            },
                            {
                                id: 'item-2',
                                name: 'CT Scan - Head',
                                cptCode: '70450',
                                billedAmount: 1500,
                                expectedRange: [1200, 1400],
                                tags: ['Unexpected Charge'],
                                details: 'This CT scan charge is $100-$300 higher than typical rates. Verify if this was performed with or without contrast.',
                                suggestedAction: 'Verify CT scan details and negotiate rate if possible',
                            },
                            {
                                id: 'item-3',
                                name: 'Lab Work',
                                cptCode: '80048',
                                billedAmount: 500,
                                expectedRange: [400, 500],
                                tags: [],
                                details: 'Charge is within the expected range.',
                            },
                        ],
                        summary: {
                            unexpectedCharges: 1,
                            possibleDuplicates: 0,
                            codingVerified: true,
                            inNetworkConfirmed: true,
                        },
                        explanation: 'Your emergency room bill shows one charge that might be a bit high - the CT scan. Everything else looks correct. We can help you check if the CT scan was done with contrast (which costs more) or if there\'s room to negotiate.',
                    },
                },
            ];
            
            // Save sample bills
            sampleBills.forEach(bill => {
                // Set default status if not present
                if (!bill.status) {
                    bill.status = 'uploaded';
                }
                storageService.saveBill(bill);
            });
            bills = sampleBills;
        }
        
        // Ensure all bills have a status
        bills = bills.map(bill => ({
            ...bill,
            status: bill.status || 'uploaded'
        }));
        
        // Set bills to state
        setSavedBills(bills);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            // Convert file to data URL for storage
            const imageUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const result = await analyzeBillImage(file);
            
            // Save the bill with image URL
            const savedBill: SavedBill = {
                id: generateId(),
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                analysis: result,
                imageUrl: imageUrl,
                status: 'uploaded',
            };
            storageService.saveBill(savedBill);
            setSavedBills(storageService.getBills());
            
            // Navigate to the bill details page
            navigate(`/bill-details?id=${savedBill.id}`);
        } catch (err) {
            console.error('Error analyzing bill:', err);
            setError(err instanceof Error ? err.message : 'Failed to analyze bill. Please try again.');
        } finally {
            setIsAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleBillSelect = (bill: SavedBill) => {
        navigate(`/bill-details?id=${bill.id}`);
    };

    const handleDeleteBill = (billId: string) => {
        // Move to trash instead of deleting
        const bills = storageService.getBills();
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            bill.status = 'trash';
            storageService.saveBill(bill);
            setSavedBills(storageService.getBills());
        }
    };

    const handleApproveBill = (billId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const bills = storageService.getBills();
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            bill.status = 'approved';
            storageService.saveBill(bill);
            setSavedBills(storageService.getBills());
            window.dispatchEvent(new Event('billsUpdated'));
        }
    };

    const handleMarkForReview = (billId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const bills = storageService.getBills();
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            bill.status = 'needs_review';
            storageService.saveBill(bill);
            setSavedBills(storageService.getBills());
            window.dispatchEvent(new Event('billsUpdated'));
        }
    };

    // Filter bills by date and status
    const getFilteredBills = (): SavedBill[] => {
        let filtered = savedBills;
        
        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(bill => (bill.status || 'uploaded') === statusFilter);
        }
        
        // Filter by date
        if (dateFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            
            switch (dateFilter) {
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case '3months':
                    filterDate.setMonth(now.getMonth() - 3);
                    break;
                case 'year':
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            
            filtered = filtered.filter(bill => {
                const billDate = new Date(bill.uploadedAt);
                return billDate >= filterDate;
            });
        }
        
        // Sort: Review Needed bills first, then Approved, then others
        return filtered.sort((a, b) => {
            const aStatus = a.status || 'uploaded';
            const bStatus = b.status || 'uploaded';
            
            // Calculate if bills need review
            const aTotalIssues = a.analysis.summary.unexpectedCharges + 
                               a.analysis.summary.possibleDuplicates + 
                               a.analysis.lineItems.filter((item: any) => item.tags.includes('Coding Issue')).length;
            const bTotalIssues = b.analysis.summary.unexpectedCharges + 
                               b.analysis.summary.possibleDuplicates + 
                               b.analysis.lineItems.filter((item: any) => item.tags.includes('Coding Issue')).length;
            
            const aNeedsReview = aStatus === 'needs_review' || (aTotalIssues > 0 && aStatus === 'uploaded');
            const bNeedsReview = bStatus === 'needs_review' || (bTotalIssues > 0 && bStatus === 'uploaded');
            const aIsApproved = aStatus === 'approved';
            const bIsApproved = bStatus === 'approved';
            
            // Review needed bills come first
            if (aNeedsReview && !bNeedsReview) return -1;
            if (!aNeedsReview && bNeedsReview) return 1;
            
            // Approved bills come after review needed
            if (aIsApproved && !bIsApproved && !aNeedsReview) return 1;
            if (!aIsApproved && bIsApproved && !bNeedsReview) return -1;
            
            // Within same category, sort by date (newest first)
            return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        });
    };

    const filteredBills = getFilteredBills();

    const renderBillCard = (bill: SavedBill) => {
        const billStatus = bill.status || 'uploaded';
        const totalIssues = bill.analysis.summary.unexpectedCharges + 
                           bill.analysis.summary.possibleDuplicates + 
                           bill.analysis.lineItems.filter((item: any) => item.tags.includes('Coding Issue')).length;
        const needsReview = billStatus === 'needs_review' || (totalIssues > 0 && billStatus === 'uploaded');
        const isApproved = billStatus === 'approved';
        const isDisputed = billStatus === 'disputed';
        return (
            <Card
                key={bill.id}
                className={`p-5 border-2 transition-all cursor-pointer h-full ${
                    needsReview 
                        ? 'border-warning-orange/50 bg-warning-orange/5 hover:border-warning-orange hover:shadow-md' 
                        : isApproved
                        ? 'border-accent-green/50 bg-accent-green/5 hover:border-accent-green hover:shadow-md'
                        : isDisputed
                        ? 'border-error-red/50 bg-error-red/5 hover:border-error-red hover:shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => handleBillSelect(bill)}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Icon name="receipt" className={`w-8 h-8 flex-shrink-0 ${
                                needsReview ? 'text-warning-orange' : 
                                isApproved ? 'text-accent-green' : 
                                isDisputed ? 'text-error-red' :
                                'text-primary-blue'
                            }`} />
                            {needsReview && (
                                <span className="text-xs bg-warning-orange/20 text-orange-700 font-semibold px-2 py-1 rounded-full">
                                    {billStatus === 'needs_review' ? 'Needs Review' : 'Review Needed'}
                                </span>
                            )}
                            {isApproved && (
                                <span className="text-xs bg-accent-green/20 text-green-700 font-semibold px-2 py-1 rounded-full">
                                    Approved
                                </span>
                            )}
                            {isDisputed && (
                                <span className="text-xs bg-error-red/20 text-red-700 font-semibold px-2 py-1 rounded-full">
                                    Disputed
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {billStatus !== 'approved' && billStatus !== 'trash' && billStatus !== 'disputed' && billStatus !== 'needs_review' && (
                                <button
                                    onClick={(e) => handleMarkForReview(bill.id, e)}
                                    className="text-silver-gray hover:text-warning-orange transition-colors"
                                    title="Mark for Review"
                                >
                                    <Icon name="warningTriangle" className="w-5 h-5" />
                                </button>
                            )}
                            {billStatus !== 'approved' && billStatus !== 'trash' && billStatus !== 'disputed' && (
                                <button
                                    onClick={(e) => handleApproveBill(bill.id, e)}
                                    className="text-silver-gray hover:text-accent-green transition-colors"
                                    title="Approve"
                                >
                                    <Icon name="check" className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBill(bill.id);
                                }}
                                className="text-silver-gray hover:text-error-red transition-colors"
                                title="Move to Trash"
                            >
                                <Icon name="trash" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                <h4 className="font-bold text-ink-black mb-2 line-clamp-2">{bill.fileName}</h4>
                {bill.provider && (
                    <p className="text-sm text-silver-gray mb-2">{bill.provider}</p>
                )}
                <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-silver-gray">Bill Total</span>
                        <span className="font-semibold text-ink-black">${bill.analysis.billTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-silver-gray">Difference</span>
                        <span className={`font-semibold ${bill.analysis.difference > 0 ? 'text-warning-orange' : bill.analysis.difference < 0 ? 'text-accent-green' : 'text-ink-black'}`}>
                            {bill.analysis.difference > 0 ? '+' : ''}${bill.analysis.difference.toLocaleString()}
                        </span>
                    </div>
                    <div className="min-h-[28px]">
                        {totalIssues > 0 ? (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-xs bg-warning-orange/20 text-orange-700 font-semibold px-2 py-1 rounded-full">
                                    {totalIssues} Issue{totalIssues > 1 ? 's' : ''} Found
                                </span>
                            </div>
                        ) : null}
                    </div>
                    <p className="text-xs text-silver-gray mt-2">
                        Uploaded {new Date(bill.uploadedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
        </Card>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header with Date Filter */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-ink-black">Bill Analyzer</h1>
                    <p className="text-lg text-silver-gray mt-2">
                        Upload and analyze your medical bills for errors, overcharges, and billing issues.
                    </p>
                </div>
                {/* Date Filter */}
                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as 'all' | 'week' | 'month' | '3months' | 'year')}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-ink-black focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none"
                >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last Month</option>
                    <option value="3months">Last 3 Months</option>
                    <option value="year">Last Year</option>
                </select>
            </div>

            {/* Status Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                    {[
                        { id: 'all' as const, label: 'All Bills', count: savedBills.length },
                        { id: 'uploaded' as const, label: 'Uploads', count: savedBills.filter(b => (b.status || 'uploaded') === 'uploaded').length },
                        { id: 'sent' as const, label: 'Sent from Provider', count: savedBills.filter(b => b.status === 'sent').length },
                        { id: 'approved' as const, label: 'Approved', count: savedBills.filter(b => b.status === 'approved').length },
                        { id: 'needs_review' as const, label: 'Needs Review', count: savedBills.filter(b => b.status === 'needs_review').length },
                        { id: 'disputed' as const, label: 'Disputed', count: savedBills.filter(b => b.status === 'disputed').length },
                        { id: 'trash' as const, label: 'Trash', count: savedBills.filter(b => b.status === 'trash').length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`
                                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${statusFilter === tab.id
                                    ? 'border-primary-blue text-primary-blue'
                                    : 'border-transparent text-silver-gray hover:text-ink-black hover:border-gray-300'
                                }
                            `}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                    statusFilter === tab.id
                                        ? 'bg-primary-blue/20 text-primary-blue'
                                        : 'bg-gray-100 text-silver-gray'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* First Row: Upload + First 2 Bills */}
            <div className={`grid grid-cols-1 ${(statusFilter === 'all' || statusFilter === 'uploaded') ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
                {/* Column 1: Upload New Bill - Only show on All Bills and Uploads tabs */}
                {(statusFilter === 'all' || statusFilter === 'uploaded') && (
                    <div className="lg:col-span-1">
                        <Card className="p-5 border-2 border-dashed border-primary-blue bg-primary-blue/5 h-full">
                            <div className="flex flex-col h-full">
                                <div className="w-16 h-16 rounded-full bg-primary-blue/20 flex items-center justify-center mb-2 mx-auto mt-2.5">
                                    <Icon name="search" className="w-8 h-8 text-primary-blue" />
                                </div>
                                <h3 className="font-bold text-ink-black mb-1 text-center">Upload New Bill</h3>
                                <p className="text-sm text-silver-gray text-center mb-4">
                                    Upload an image or PDF to analyze for errors and overcharges.
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isAnalyzing}
                                    className="w-full bg-primary-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md mt-5"
                                >
                                    <Icon name="search" className="w-5 h-5" />
                                    {isAnalyzing ? 'Analyzing...' : 'Upload Bill'}
                                </button>
                                {error && (
                                    <p className="text-error-red mt-3 text-sm text-center">{error}</p>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* Columns 2 & 3: First Bills */}
                <div className="lg:col-span-2">
                    {filteredBills.length > 0 ? (
                        <div className={`grid grid-cols-1 gap-6 ${statusFilter === 'all' || statusFilter === 'uploaded' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                            {filteredBills.slice(0, statusFilter === 'all' || statusFilter === 'uploaded' ? 2 : 3).map(renderBillCard)}
                        </div>
                    ) : (
                        <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                            <Icon name="receipt" className="w-12 h-12 mx-auto text-silver-gray mb-3" />
                            <p className="text-silver-gray">No bills found in this category.</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Additional bills row */}
            {filteredBills.length > (statusFilter === 'all' || statusFilter === 'uploaded' ? 2 : 3) && (
                <div className={`grid grid-cols-1 gap-6 ${statusFilter === 'all' || statusFilter === 'uploaded' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                    {filteredBills.slice(statusFilter === 'all' || statusFilter === 'uploaded' ? 2 : 3).map(renderBillCard)}
                </div>
            )}
        </div>
    );
};

export default BillAnalyzerScreen;
