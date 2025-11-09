import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import Modal from '../components/Modal';
import { storageService } from '../services/storage';
import { SavedBill, BillStatus } from '../types';
import { analyzeBillImage, BillAnalysis } from '../services/bill-analyzer';

const BillDetailsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const billId = searchParams.get('id');
    
    const [bill, setBill] = useState<SavedBill | null>(null);
    const [analysis, setAnalysis] = useState<BillAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insights, setInsights] = useState<string[]>([]);
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [disputeMessage, setDisputeMessage] = useState('');
    const [shareMessage, setShareMessage] = useState('');
    const [isGeneratingDispute, setIsGeneratingDispute] = useState(false);

    useEffect(() => {
        if (!billId) {
            navigate('/bill-analyzer');
            return;
        }

        const bills = storageService.getBills();
        const foundBill = bills.find(b => b.id === billId);
        
        if (!foundBill) {
            navigate('/bill-analyzer');
            return;
        }

        setBill(foundBill);
        setAnalysis(foundBill.analysis);

        // Generate additional AI insights if we have analysis
        if (foundBill.analysis) {
            generateInsights(foundBill.analysis);
        }
    }, [billId, navigate]);

    const generateInsights = async (billAnalysis: BillAnalysis) => {
        setIsGeneratingInsights(true);
        try {
            // Use AI to generate actionable insights
            const { callLLM, getDefaultLLMConfig } = await import('../services/llm/client');
            const config = getDefaultLLMConfig();
            
            if (!config) {
                setInsights([
                    'Review each line item carefully for accuracy',
                    'Compare charges with your insurance EOB if available',
                    'Contact the provider if you notice any discrepancies'
                ]);
                return;
            }

            const prompt = `Based on this medical bill analysis, provide 3-5 actionable insights and recommendations for the patient. Be specific and helpful.

Bill Total: $${billAnalysis.billTotal}
Expected Total: $${billAnalysis.expectedTotal}
Difference: $${billAnalysis.difference}
Issues Found: ${billAnalysis.summary.unexpectedCharges} unexpected charges, ${billAnalysis.summary.possibleDuplicates} possible duplicates

Line Items:
${billAnalysis.lineItems.map(item => 
    `- ${item.name}: $${item.billedAmount}${item.tags.length > 0 ? ` (${item.tags.join(', ')})` : ''}`
).join('\n')}

Provide insights as a JSON array of strings, like: ["insight 1", "insight 2", "insight 3"]`;

            const response = await callLLM([
                { role: 'system', content: 'You are a helpful medical billing advocate. Provide clear, actionable insights.' },
                { role: 'user', content: prompt }
            ], config);

            // Parse insights
            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setInsights(Array.isArray(parsed) ? parsed : []);
            } else {
                // Fallback: extract insights from text
                const lines = response.content.split('\n').filter(line => line.trim().match(/^[-•\d]/));
                setInsights(lines.slice(0, 5).map(line => line.replace(/^[-•\d.\s]+/, '').trim()));
            }
        } catch (error) {
            console.error('Error generating insights:', error);
            setInsights([
                'Review each line item carefully for accuracy',
                'Compare charges with your insurance EOB if available',
                'Contact the provider if you notice any discrepancies'
            ]);
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    const generateDisputeMessage = async () => {
        if (!analysis) return;
        
        setIsGeneratingDispute(true);
        try {
            const { callLLM, getDefaultLLMConfig } = await import('../services/llm/client');
            const config = getDefaultLLMConfig();
            
            if (!config) {
                // Fallback message
                setDisputeMessage(`Dear ${bill?.provider || 'Provider'},

I am writing to dispute several charges on my bill dated ${new Date(bill?.uploadedAt || Date.now()).toLocaleDateString()}.

After reviewing my bill, I have identified the following concerns:
${analysis.lineItems.filter(item => item.tags.length > 0).map(item => `- ${item.name}: ${item.tags.join(', ')}`).join('\n')}

I would appreciate a review of these charges and clarification on the billing discrepancies.

Thank you for your attention to this matter.`);
                setIsGeneratingDispute(false);
                return;
            }

            const prompt = `Generate a professional, polite dispute letter for a medical bill. The letter should:
1. Be professional and respectful
2. Clearly state the concerns based on the analysis
3. Request a review of the charges
4. Be concise (2-3 paragraphs)

Bill Details:
- Provider: ${bill?.provider || 'Unknown'}
- Bill Total: $${analysis.billTotal}
- Expected Total: $${analysis.expectedTotal}
- Difference: $${analysis.difference}

Issues Found:
${analysis.lineItems.filter(item => item.tags.length > 0).map(item => 
    `- ${item.name} ($${item.billedAmount}): ${item.tags.join(', ')}${item.details ? ` - ${item.details}` : ''}`
).join('\n')}

Generate the letter text only (no greeting/signature needed, just the body).`;

            const response = await callLLM([
                { role: 'system', content: 'You are a professional medical billing advocate. Write clear, respectful dispute letters.' },
                { role: 'user', content: prompt }
            ], config);

            // Clean up the response
            let message = response.content.trim();
            // Remove markdown formatting if present
            message = message.replace(/```[\w]*\n?/g, '').trim();
            
            setDisputeMessage(message);
        } catch (error) {
            console.error('Error generating dispute message:', error);
            // Fallback message
            setDisputeMessage(`Dear ${bill?.provider || 'Provider'},

I am writing to dispute several charges on my bill. After reviewing my bill, I have identified concerns with the following items:

${analysis.lineItems.filter(item => item.tags.length > 0).map(item => `- ${item.name}: ${item.tags.join(', ')}`).join('\n')}

I would appreciate a review of these charges and clarification on the billing discrepancies.

Thank you for your attention to this matter.`);
        } finally {
            setIsGeneratingDispute(false);
        }
    };

    const handleOpenDispute = async () => {
        setShowDisputeModal(true);
        if (!disputeMessage) {
            await generateDisputeMessage();
        }
    };

    const handleSendDispute = () => {
        // TODO: Implement actual sending functionality
        alert('Dispute message would be sent to provider. In production, this would send an email or create a ticket.');
        // Update bill status to 'disputed'
        if (bill) {
            bill.status = 'disputed';
            storageService.saveBill(bill);
            setBill({ ...bill }); // Update state
        }
        setShowDisputeModal(false);
    };

    const handleSendShare = () => {
        // TODO: Implement actual sending functionality
        alert('Message would be shared with provider. In production, this would send an email or create a ticket.');
        // Update bill status to 'sent'
        if (bill) {
            bill.status = 'sent';
            storageService.saveBill(bill);
        }
        setShowShareModal(false);
        setShareMessage('');
    };

    const handleApproveBill = () => {
        if (bill) {
            bill.status = 'approved';
            storageService.saveBill(bill);
            setBill({ ...bill }); // Update state
        }
    };


    const calculateScore = (): number => {
        if (!analysis) return 0;
        
        let score = 100;
        
        // Count coding issues from line items
        const codingIssues = analysis.lineItems.filter(item => 
            item.tags.includes('Coding Issue')
        ).length;
        
        // Deduct points for issues
        score -= analysis.summary.unexpectedCharges * 15;
        score -= analysis.summary.possibleDuplicates * 20;
        score -= codingIssues * 15; // Deduct for coding issues
        if (!analysis.summary.codingVerified) score -= 10;
        if (!analysis.summary.inNetworkConfirmed) score -= 10;
        
        // Deduct points for large differences
        if (analysis.difference > 0) {
            const percentDiff = (analysis.difference / analysis.billTotal) * 100;
            score -= Math.min(percentDiff * 2, 30);
        }
        
        return Math.max(0, Math.min(100, score));
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-accent-green';
        if (score >= 60) return 'text-warning-orange';
        return 'text-error-red';
    };

    const getScoreLabel = (score: number): string => {
        if (score >= 80) return 'Good';
        if (score >= 60) return 'Needs Review';
        return 'Issues Found';
    };

    if (!bill) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-silver-gray">Loading bill...</p>
            </div>
        );
    }

    const score = calculateScore();
    const codingIssuesCount = analysis ? analysis.lineItems.filter(item => item.tags.includes('Coding Issue')).length : 0;
    const hasIssues = analysis && (
        analysis.summary.unexpectedCharges > 0 || 
        analysis.summary.possibleDuplicates > 0 || 
        codingIssuesCount > 0 ||
        analysis.difference > 0
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/bill-analyzer')}
                        className="flex items-center gap-2 text-silver-gray hover:text-ink-black mb-4 transition-colors"
                    >
                        <Icon name="chevronRight" className="w-5 h-5 rotate-180" />
                        <span>Back to Bills</span>
                    </button>
                    <h1 className="text-3xl font-bold text-ink-black">{bill.fileName}</h1>
                    {bill.provider && (
                        <p className="text-lg text-silver-gray mt-2">Provider: {bill.provider}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Bill Image */}
                <div className="space-y-6">
                    <Card className="p-4 border border-gray-200">
                        <h2 className="text-xl font-bold text-ink-black mb-4">Bill Document</h2>
                        {bill.imageUrl ? (
                            <img
                                src={bill.imageUrl}
                                alt={bill.fileName}
                                className="w-full rounded-lg border border-gray-200"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-soft-gray rounded-lg">
                                <p className="text-silver-gray">No image available</p>
                            </div>
                        )}
                        <div className="mt-4 text-sm text-silver-gray">
                            <p>Uploaded: {new Date(bill.uploadedAt).toLocaleDateString()}</p>
                        </div>
                    </Card>

                    {/* Next Steps */}
                    {analysis && (
                        <Card className="p-6 border-2 border-primary-blue/30 bg-primary-blue/5">
                            <h3 className="text-lg font-bold text-ink-black mb-4">Next Steps</h3>
                            <div className="space-y-3">
                                {hasIssues ? (
                                    <button
                                        onClick={handleOpenDispute}
                                        className="w-full bg-warning-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icon name="warningTriangle" className="w-5 h-5" />
                                        Dispute This Bill
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowShareModal(true)}
                                        className="w-full bg-white border-2 border-primary-blue text-primary-blue hover:bg-primary-blue/10 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icon name="link" className="w-5 h-5" />
                                        Share with Provider
                                    </button>
                                )}
                                {bill && bill.status !== 'approved' && (
                                    <button
                                        onClick={handleApproveBill}
                                        className="w-full bg-accent-green hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icon name="check" className="w-5 h-5" />
                                        Approve Bill
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        // TODO: Implement download/export functionality
                                        alert('Download functionality coming soon!');
                                    }}
                                    className="w-full bg-white border-2 border-primary-blue text-primary-blue hover:bg-primary-blue/10 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icon name="receipt" className="w-5 h-5" />
                                    Download Analysis Report
                                </button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right: AI Analysis */}
                <div className="space-y-6">
                    {analysis ? (
                        <>
                            {/* Score Card */}
                            <Card className="p-6 border-2 border-gray-200 bg-gradient-to-br from-white to-soft-gray">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-ink-black">Bill Health Score</h2>
                                    <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                                        {score}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        score >= 80 ? 'bg-accent-green/20 text-accent-green' :
                                        score >= 60 ? 'bg-warning-orange/20 text-warning-orange' :
                                        'bg-error-red/20 text-error-red'
                                    }`}>
                                        {getScoreLabel(score)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all ${
                                            score >= 80 ? 'bg-accent-green' :
                                            score >= 60 ? 'bg-warning-orange' :
                                            'bg-error-red'
                                        }`}
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                            </Card>

                            {/* Quick Summary */}
                            <Card className="p-4 border border-gray-200">
                                <h3 className="text-sm font-semibold text-ink-black mb-3">Quick Summary</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-silver-gray">Bill Total</p>
                                        <p className="text-lg font-bold text-ink-black">${(analysis.billTotal || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-silver-gray">Expected Total</p>
                                        <p className="text-lg font-bold text-ink-black">${(analysis.expectedTotal || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-silver-gray">Difference</p>
                                        <p className={`text-lg font-bold ${
                                            analysis.difference > 0 ? 'text-warning-orange' :
                                            analysis.difference < 0 ? 'text-accent-green' :
                                            'text-ink-black'
                                        }`}>
                                            {analysis.difference > 0 ? '+' : ''}${(analysis.difference || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-silver-gray">Issues Found</p>
                                        <p className="text-lg font-bold text-ink-black">
                                            {analysis.summary.unexpectedCharges + 
                                             analysis.summary.possibleDuplicates + 
                                             codingIssuesCount}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Simple Explanation */}
                            {analysis.explanation && (
                                <Card className="p-6 border border-gray-200 bg-primary-blue/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon name="info" className="w-5 h-5 text-primary-blue" />
                                        <h3 className="text-lg font-bold text-ink-black">Simple Explanation</h3>
                                    </div>
                                    <p className="text-ink-black leading-relaxed">{analysis.explanation}</p>
                                </Card>
                            )}

                            {/* Line Items Breakdown */}
                            {analysis.lineItems.length > 0 && (
                                <Card className="p-6 border border-gray-200">
                                    <h3 className="text-lg font-bold text-ink-black mb-4">Line Items Breakdown</h3>
                                    <div className="space-y-4">
                                        {analysis.lineItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`p-4 rounded-lg border ${
                                                    item.tags.length > 0
                                                        ? 'border-warning-orange/30 bg-warning-orange/5'
                                                        : 'border-gray-200 bg-soft-gray/50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-ink-black">{item.name}</h4>
                                                        {item.cptCode && (
                                                            <p className="text-sm text-silver-gray">CPT: {item.cptCode}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-ink-black">${(item.billedAmount || 0).toLocaleString()}</p>
                                                        {item.expectedRange && item.expectedRange[0] != null && item.expectedRange[1] != null && (
                                                            <p className="text-xs text-silver-gray">
                                                                Expected: ${item.expectedRange[0].toLocaleString()} - ${item.expectedRange[1].toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {item.tags.map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-warning-orange/20 text-warning-orange text-xs font-semibold rounded-full"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.details && (
                                                    <p className="text-sm text-ink-black mt-2">{item.details}</p>
                                                )}
                                                {item.suggestedAction && (
                                                    <p className="text-sm text-primary-blue mt-2 font-semibold">
                                                        💡 {item.suggestedAction}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* AI Insights */}
                            <Card className="p-6 border border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <Icon name="lightbulb" className="w-6 h-6 text-primary-blue" />
                                    <h3 className="text-lg font-bold text-ink-black">AI Insights & Recommendations</h3>
                                </div>
                                {isGeneratingInsights ? (
                                    <div className="flex items-center gap-2 text-silver-gray">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-blue"></div>
                                        <span>Generating insights...</span>
                                    </div>
                                ) : insights.length > 0 ? (
                                    <ul className="space-y-3">
                                        {insights.map((insight, idx) => {
                                            // Parse markdown-style bold (**text**) to HTML
                                            const parseMarkdown = (text: string) => {
                                                return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                            };
                                            const parsedInsight = parseMarkdown(insight);
                                            return (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <Icon name="check" className="w-5 h-5 text-accent-green mt-0.5 flex-shrink-0" />
                                                    <span className="text-ink-black" dangerouslySetInnerHTML={{ __html: parsedInsight }} />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-silver-gray">No additional insights available.</p>
                                )}
                            </Card>
                        </>
                    ) : (
                        <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                            <Icon name="receipt" className="w-12 h-12 mx-auto text-silver-gray mb-3" />
                            <p className="text-silver-gray mb-4">No analysis available for this bill.</p>
                            {isAnalyzing ? (
                                <div className="flex items-center justify-center gap-2 text-primary-blue">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-blue"></div>
                                    <span>Analyzing bill...</span>
                                </div>
                            ) : (
                                <button
                                    onClick={async () => {
                                        if (!bill.imageUrl) return;
                                        setIsAnalyzing(true);
                                        setError(null);
                                        try {
                                            // Convert image URL to File object
                                            const response = await fetch(bill.imageUrl);
                                            const blob = await response.blob();
                                            const file = new File([blob], bill.fileName, { type: blob.type });
                                            
                                            const newAnalysis = await analyzeBillImage(file);
                                            setAnalysis(newAnalysis);
                                            
                                            // Update saved bill
                                            const bills = storageService.getBills();
                                            const updatedBills = bills.map(b => 
                                                b.id === bill.id ? { ...b, analysis: newAnalysis } : b
                                            );
                                            storageService.saveBills(updatedBills);
                                            
                                            generateInsights(newAnalysis);
                                        } catch (err) {
                                            setError(err instanceof Error ? err.message : 'Failed to analyze bill');
                                        } finally {
                                            setIsAnalyzing(false);
                                        }
                                    }}
                                    className="bg-primary-blue hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                                >
                                    Analyze This Bill
                                </button>
                            )}
                            {error && (
                                <p className="text-error-red mt-4 text-sm">{error}</p>
                            )}
                        </Card>
                    )}
                </div>
            </div>

            {/* Dispute Modal */}
            <Modal
                isOpen={showDisputeModal}
                onClose={() => setShowDisputeModal(false)}
                title="Dispute This Bill"
            >
                <div className="p-6">
                    <p className="text-sm text-silver-gray mb-4">
                        We've drafted a dispute letter based on the issues found in your bill. You can edit it before sending.
                    </p>
                    {isGeneratingDispute ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2 text-silver-gray">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-blue"></div>
                                <span>Generating dispute letter...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={disputeMessage}
                                onChange={(e) => setDisputeMessage(e.target.value)}
                                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="Dispute message will be generated..."
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowDisputeModal(false)}
                                    className="flex-1 border-2 border-gray-300 text-ink-black hover:bg-soft-gray font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendDispute}
                                    disabled={!disputeMessage.trim()}
                                    className="flex-1 bg-primary-blue hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Icon name="receipt" className="w-5 h-5" />
                                    Send to Provider
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Share Modal */}
            <Modal
                isOpen={showShareModal}
                onClose={() => {
                    setShowShareModal(false);
                    setShareMessage('');
                }}
                title="Share with Provider"
            >
                <div className="p-6">
                    <p className="text-sm text-silver-gray mb-4">
                        Add a message to share your bill analysis with your provider.
                    </p>
                    <textarea
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        placeholder="Enter your message here..."
                    />
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => {
                                setShowShareModal(false);
                                setShareMessage('');
                            }}
                            className="flex-1 border-2 border-gray-300 text-ink-black hover:bg-soft-gray font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSendShare}
                            disabled={!shareMessage.trim()}
                            className="flex-1 bg-primary-blue hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Icon name="send" className="w-5 h-5" />
                            Send to Provider
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BillDetailsScreen;

