import React, { useState } from 'react';
import Card from '../components/Card';
import { Icon } from '../components/Icon';

interface Message {
  id: string;
  type: 'dispute' | 'question' | 'assistance' | 'general';
  from: string;
  subject: string;
  preview: string;
  time: string;
  status: 'new' | 'in-progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
}

const HealthSystemInbox: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'disputes' | 'questions' | 'assistance'>('all');

  const messages: Message[] = [
    {
      id: '1',
      type: 'dispute',
      from: 'Sarah Johnson',
      subject: 'Dispute: MRI Left Knee billing discrepancy',
      preview: 'Patient is disputing the $850 charge for MRI Left Knee. They received an estimate of $190...',
      time: '2 hours ago',
      status: 'new',
      priority: 'high',
    },
    {
      id: '2',
      type: 'question',
      from: 'Michael Chen',
      subject: 'Question about Sleep Study coverage',
      preview: 'Patient wants to know if their insurance covers sleep studies and what the out-of-pocket cost would be...',
      time: '4 hours ago',
      status: 'in-progress',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'assistance',
      from: 'Emily Rodriguez',
      subject: 'Charity Care Application - Needs Review',
      preview: 'Patient has submitted a charity care application. Income verification documents attached...',
      time: '6 hours ago',
      status: 'new',
      priority: 'high',
    },
    {
      id: '4',
      type: 'dispute',
      from: 'David Thompson',
      subject: 'Dispute: Follow-up Consultation charge',
      preview: 'Patient received a bill for $120 but the estimate showed $80. Requesting clarification...',
      time: '1 day ago',
      status: 'resolved',
      priority: 'medium',
    },
    {
      id: '5',
      type: 'question',
      from: 'Lisa Anderson',
      subject: 'Payment plan modification request',
      preview: 'Patient is requesting to modify their payment plan due to financial hardship...',
      time: '1 day ago',
      status: 'in-progress',
      priority: 'low',
    },
    {
      id: '6',
      type: 'general',
      from: 'Robert Martinez',
      subject: 'EOB upload assistance needed',
      preview: 'Patient is having trouble uploading their EOB. Needs technical support...',
      time: '2 days ago',
      status: 'resolved',
      priority: 'low',
    },
  ];

  const filteredMessages = filter === 'all' 
    ? messages 
    : messages.filter(m => m.type === filter || (filter === 'disputes' && m.type === 'dispute'));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dispute': return 'alertCircle';
      case 'question': return 'chat';
      case 'assistance': return 'shieldCheck';
      default: return 'mail';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dispute': return 'bg-red-50 border-red-200 text-red-700';
      case 'question': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'assistance': return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-black">Inbox</h1>
          <p className="text-lg text-silver-gray mt-2">
            Manage patient disputes, questions, and assistance requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-silver-gray">Unread</p>
            <p className="text-sm font-semibold text-ink-black">
              {messages.filter(m => m.status === 'new').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Icon name="mail" className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {(['all', 'disputes', 'questions', 'assistance'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === f
                ? 'bg-primary-blue text-white'
                : 'bg-white text-silver-gray hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-3">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-4 border-2 cursor-pointer transition-all ${
                selectedMessage?.id === message.id
                  ? 'border-primary-blue bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMessage(message)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${getTypeColor(message.type)} flex items-center justify-center flex-shrink-0`}>
                  <Icon name={getTypeIcon(message.type) as any} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-ink-black truncate">{message.from}</p>
                    {message.status === 'new' && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-ink-black mb-1 truncate">{message.subject}</p>
                  <p className="text-xs text-silver-gray mb-2 line-clamp-2">{message.preview}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(message.status)}`}>
                      {message.status}
                    </span>
                    <span className="text-xs text-silver-gray">{message.time}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card className="p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-lg ${getTypeColor(selectedMessage.type)} flex items-center justify-center`}>
                      <Icon name={getTypeIcon(selectedMessage.type) as any} className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-ink-black">{selectedMessage.subject}</h2>
                      <p className="text-sm text-silver-gray">From: {selectedMessage.from}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded ${getStatusBadge(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                  <span className="text-xs text-silver-gray">{selectedMessage.time}</span>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-ink-black mb-4">{selectedMessage.preview}</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-silver-gray mb-2">Full Message:</p>
                  <p className="text-ink-black">
                    {selectedMessage.type === 'dispute' && (
                      <>
                        Hello, I am writing to dispute a charge on my recent bill. The estimate I received through BillHarmony showed a different amount than what I was billed. I would appreciate a review of this discrepancy and clarification on the charges.
                      </>
                    )}
                    {selectedMessage.type === 'question' && (
                      <>
                        I have a question about my upcoming procedure. Could you please provide more information about coverage and out-of-pocket costs? I want to make sure I understand my financial responsibility before scheduling.
                      </>
                    )}
                    {selectedMessage.type === 'assistance' && (
                      <>
                        I have submitted a charity care application and attached all required documentation. I would appreciate a review of my application at your earliest convenience. Thank you for your assistance.
                      </>
                    )}
                    {selectedMessage.type === 'general' && (
                      <>
                        I need help with uploading my EOB document. I'm having trouble with the upload feature and would appreciate technical support.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-4 py-2 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Mark as In Progress
                </button>
                <button className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                  Resolve
                </button>
                <button className="px-4 py-2 bg-white text-ink-black font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors">
                  Reply
                </button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 border border-gray-200 text-center">
              <Icon name="mail" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-silver-gray">Select a message to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthSystemInbox;

