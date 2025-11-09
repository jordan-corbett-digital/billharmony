
import React from 'react';
import Card from '../components/Card';
import { Icon } from '../components/Icon';

const DisputeActionsScreen: React.FC = () => {
    const suggestedPrompts = [
        "Why was I charged twice?",
        "Is this covered?",
        "How do I appeal?",
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-ink-black">Dispute Assistance</h1>
            
            {/* Auto-Drafted Dispute Letter */}
            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Auto-Drafted Dispute Letter</h2>
                <div className="border rounded-lg p-4 bg-gray-50 h-64 overflow-y-auto font-mono text-sm">
                    <p>To Whom It May Concern,</p>
                    <br/>
                    <p>I am writing to dispute charges on my recent medical bill (Account #: 123456789) for services received on October 24, 2023.</p>
                    <br/>
                    <p>Specifically, I am disputing the following line items:</p>
                    <ul className="list-disc pl-6 my-2">
                        <li>CPT Code 73721 (MRI KNEE WO/CONTR): Billed at $950. Per my insurer's allowable rates and local transparency data, this charge is excessive.</li>
                        <li>CPT Code 99213 (CONSULTATION): Billed at $150. This appears to be a duplicate charge, as a similar consultation was billed on October 21, 2023.</li>
                    </ul>
                    <p>Please review these charges and provide a corrected bill. I have attached supporting documentation from my insurer.</p>
                    <br/>
                    <p>Sincerely,</p>
                    <p>Olivia Chen</p>
                </div>
                <div className="flex space-x-4 mt-4">
                    <button className="bg-primary-blue text-white font-semibold py-2 px-4 rounded-lg">Download</button>
                    <button className="bg-gray-200 text-ink-black font-semibold py-2 px-4 rounded-lg">Copy</button>
                    <button className="bg-gray-200 text-ink-black font-semibold py-2 px-4 rounded-lg">Send</button>
                </div>
            </Card>

            {/* Call Script */}
            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Your Call Script</h2>
                <div className="space-y-4">
                    <div className="flex">
                        <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">Y</div>
                        <div className="bg-gray-100 rounded-lg p-3">
                           <p>"Hello, I'm calling about a bill for Olivia Chen, account number 123456789. I believe there are a few errors I'd like to discuss."</p>
                        </div>
                    </div>
                    <div className="flex">
                        <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">Y</div>
                        <div className="bg-gray-100 rounded-lg p-3">
                            <p>"The first is a charge for an MRI, CPT code 73721. It was billed at $950, which seems to be above the standard rate."</p>
                            <p className="text-xs text-silver-gray mt-1">Wait for their response. They may ask for more info.</p>
                        </div>
                    </div>
                     <div className="flex">
                        <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">Y</div>
                        <div className="bg-gray-100 rounded-lg p-3">
                           <p>"The second is a consultation fee that looks like a duplicate from a previous visit. Can you check that for me?"</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* AI Copilot */}
            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">AI Copilot</h2>
                <p className="text-silver-gray mb-4">Have questions? Ask our AI for help.</p>
                <div className="relative">
                    <textarea className="w-full border-gray-300 rounded-lg p-3 pr-12 focus:ring-primary-blue focus:border-primary-blue" rows={3} placeholder="Ask a question..."></textarea>
                    <button className="absolute right-3 top-3 bg-primary-blue text-white rounded-full p-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                       </svg>
                    </button>
                </div>
                 <div className="flex flex-wrap gap-2 mt-3">
                    {suggestedPrompts.map(prompt => (
                        <button key={prompt} className="text-xs bg-gray-100 text-silver-gray font-semibold px-3 py-1.5 rounded-full hover:bg-gray-200">
                            {prompt}
                        </button>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default DisputeActionsScreen;
