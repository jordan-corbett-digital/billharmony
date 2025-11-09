import React, { useState } from 'react';
import Card from '../components/Card';
import { Icon } from '../components/Icon';
import Modal from '../components/Modal';

interface Contact {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'available' | 'busy' | 'away';
  createdAt: string;
  lastActivity: string;
  tags: string[];
}

const HealthSystemContacts: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [addContactMode, setAddContactMode] = useState<'choice' | 'upload' | 'manual'>('choice');
  const [isUploading, setIsUploading] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zip: '',
    city: '',
    state: '',
    age: '',
    payer: '',
    planType: '',
    deductibleTotal: '',
    deductibleMet: '',
    coinsurance: '',
    oopMax: '',
    inNetworkPreference: false,
    preferredProviders: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['name', 'phone', 'email', 'created', 'lastActivity', 'tags']));
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const departments = ['Billing', 'Patient Services', 'Financial Assistance', 'Clinical', 'IT Support', 'Administration'];

  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Jennifer Martinez',
      role: 'Billing Manager',
      department: 'Billing',
      email: 'j.martinez@healthsystem.com',
      phone: '(417) 555-0123',
      status: 'available',
      createdAt: 'Jan 08 2023 11:58 AM',
      lastActivity: '2 days ago',
      tags: ['Manager', 'Billing'],
    },
    {
      id: '2',
      name: 'Robert Chen',
      role: 'Patient Financial Navigator',
      department: 'Patient Services',
      email: 'r.chen@healthsystem.com',
      phone: '(417) 555-0124',
      status: 'available',
      createdAt: 'Jan 15 2023 09:30 AM',
      lastActivity: '1 hour ago',
      tags: ['Navigator'],
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      role: 'Charity Care Coordinator',
      department: 'Financial Assistance',
      email: 's.johnson@healthsystem.com',
      phone: '(417) 555-0125',
      status: 'busy',
      createdAt: 'Feb 01 2023 02:15 PM',
      lastActivity: '5 minutes ago',
      tags: ['Coordinator', 'Charity'],
    },
    {
      id: '4',
      name: 'Michael Thompson',
      role: 'Revenue Cycle Director',
      department: 'Billing',
      email: 'm.thompson@healthsystem.com',
      phone: '(417) 555-0126',
      status: 'available',
      createdAt: 'Jan 20 2023 10:45 AM',
      lastActivity: '3 days ago',
      tags: ['Director', 'Revenue'],
    },
    {
      id: '5',
      name: 'Emily Rodriguez',
      role: 'Patient Advocate',
      department: 'Patient Services',
      email: 'e.rodriguez@healthsystem.com',
      phone: '(417) 555-0127',
      status: 'away',
      createdAt: 'Jan 12 2023 08:20 AM',
      lastActivity: '1 week ago',
      tags: ['Advocate'],
    },
    {
      id: '6',
      name: 'David Kim',
      role: 'Financial Counselor',
      department: 'Financial Assistance',
      email: 'd.kim@healthsystem.com',
      phone: '(417) 555-0128',
      status: 'available',
      createdAt: 'Jan 25 2023 03:30 PM',
      lastActivity: '30 minutes ago',
      tags: ['Counselor'],
    },
    {
      id: '7',
      name: 'Lisa Anderson',
      role: 'Clinical Coordinator',
      department: 'Clinical',
      email: 'l.anderson@healthsystem.com',
      phone: '(417) 555-0129',
      status: 'available',
      createdAt: 'Feb 05 2023 11:00 AM',
      lastActivity: '1 day ago',
      tags: ['Clinical', 'Coordinator'],
    },
    {
      id: '8',
      name: 'James Wilson',
      role: 'Systems Administrator',
      department: 'IT Support',
      email: 'j.wilson@healthsystem.com',
      phone: '(417) 555-0130',
      status: 'available',
      createdAt: 'Jan 18 2023 01:15 PM',
      lastActivity: '4 hours ago',
      tags: ['IT', 'Admin'],
    },
    {
      id: '9',
      name: 'Amanda Davis',
      role: 'Chief Financial Officer',
      department: 'Administration',
      email: 'a.davis@healthsystem.com',
      phone: '(417) 555-0131',
      status: 'busy',
      createdAt: 'Jan 10 2023 09:00 AM',
      lastActivity: '15 minutes ago',
      tags: ['CFO', 'Executive'],
    },
  ];

  const filteredContacts = contacts.filter(contact => {
    const matchesDepartment = selectedDepartment === 'all' || contact.department === selectedDepartment;
    const matchesSearch = searchQuery === '' || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    return matchesDepartment && matchesSearch;
  });

  const totalPages = Math.ceil(filteredContacts.length / pageSize);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === paginatedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(paginatedContacts.map(c => c.id)));
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const columnOptions = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'created', label: 'Created' },
    { key: 'lastActivity', label: 'Last Activity' },
    { key: 'tags', label: 'Tags' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-black">Contacts</h1>
          <p className="text-lg text-silver-gray mt-2">
            Manage team members and departments
          </p>
        </div>
        <button
          onClick={() => setShowAddContactModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icon name="plus" className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left side - Action icons */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Add"
              onClick={() => setShowAddContactModal(true)}
            >
              <Icon name="plus" className="w-5 h-5 text-silver-gray" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Filter"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Icon name="filter" className="w-5 h-5 text-silver-gray" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <Icon name="refresh" className="w-5 h-5 text-silver-gray" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Duplicate"
              disabled={selectedContacts.size === 0}
            >
              <Icon name="copy" className="w-5 h-5 text-silver-gray" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Delete"
              disabled={selectedContacts.size === 0}
            >
              <Icon name="trash" className="w-5 h-5 text-silver-gray" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Star"
              disabled={selectedContacts.size === 0}
            >
              <Icon name="star" className="w-5 h-5 text-silver-gray" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Icon name="download" className="w-5 h-5 text-silver-gray" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Upload"
            >
              <Icon name="upload" className="w-5 h-5 text-silver-gray" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Grid View"
            >
              <Icon name="grid" className="w-5 h-5 text-silver-gray" />
            </button>
          </div>

          {/* Right side - Search and filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-ink-black"
              >
                Columns
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
                  {columnOptions.map(col => (
                    <label key={col.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={(e) => {
                          const newVisible = new Set(visibleColumns);
                          if (e.target.checked) {
                            newVisible.add(col.key);
                          } else {
                            newVisible.delete(col.key);
                          }
                          setVisibleColumns(newVisible);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-ink-black">{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-silver-gray" />
              <input
                type="text"
                placeholder="Quick search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm w-48"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-ink-black"
            >
              <Icon name="filter" className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Department Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2 overflow-x-auto">
              {['all', ...departments].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                    selectedDepartment === dept
                      ? 'bg-primary-blue text-white'
                      : 'bg-white text-silver-gray hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Pagination Summary */}
      <div className="flex items-center justify-between text-sm text-silver-gray">
        <div>
          Total {filteredContacts.length} records | {currentPage} of {totalPages} Pages
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          <span className="px-3 py-1 bg-primary-blue text-white rounded">{currentPage}</span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={10}>Page Size: 10</option>
            <option value={20}>Page Size: 20</option>
            <option value={50}>Page Size: 50</option>
            <option value={100}>Page Size: 100</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                {visibleColumns.has('name') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-ink-black">
                    Name
                    <Icon name="chevronDown" className="w-4 h-4 inline-block ml-1 text-silver-gray" />
                  </th>
                )}
                {visibleColumns.has('phone') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-ink-black">
                    Phone
                    <Icon name="chevronDown" className="w-4 h-4 inline-block ml-1 text-silver-gray" />
                  </th>
                )}
                {visibleColumns.has('email') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-ink-black">
                    Email
                    <Icon name="chevronDown" className="w-4 h-4 inline-block ml-1 text-silver-gray" />
                  </th>
                )}
                {visibleColumns.has('created') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-ink-black">
                    Created
                    <Icon name="chevronDown" className="w-4 h-4 inline-block ml-1 text-silver-gray" />
                  </th>
                )}
                {visibleColumns.has('lastActivity') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-ink-black">
                    Last Activity
                    <Icon name="chevronDown" className="w-4 h-4 inline-block ml-1 text-silver-gray" />
                  </th>
                )}
                {visibleColumns.has('tags') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-ink-black">
                    Tags
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleContactClick(contact)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={() => toggleSelectContact(contact.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                  </td>
                  {visibleColumns.has('name') && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-600">{getInitials(contact.name)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-ink-black">{contact.name}</p>
                          <p className="text-xs text-silver-gray">{contact.role}</p>
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('phone') && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-ink-black">
                        <Icon name="phone" className="w-4 h-4 text-silver-gray" />
                        {contact.phone}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('email') && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-ink-black">
                        <Icon name="mail" className="w-4 h-4 text-silver-gray" />
                        {contact.email}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('created') && (
                    <td className="px-4 py-3 text-sm text-silver-gray">
                      {contact.createdAt}
                    </td>
                  )}
                  {visibleColumns.has('lastActivity') && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-silver-gray">
                        <Icon name="clock" className="w-4 h-4" />
                        {contact.lastActivity}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('tags') && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="Message"
                      >
                        <Icon name="mail" className="w-4 h-4 text-silver-gray" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="Call"
                      >
                        <Icon name="phone" className="w-4 h-4 text-silver-gray" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="More"
                      >
                        <Icon name="more" className="w-4 h-4 text-silver-gray" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginatedContacts.length === 0 && (
          <div className="p-12 text-center">
            <Icon name="userCircle" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-silver-gray">No contacts found</p>
            <p className="text-sm text-silver-gray mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </Card>

      {/* Contact Details Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setSelectedContact(null);
        }}
        title={selectedContact?.name || 'Contact Details'}
      >
        {selectedContact && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-semibold text-gray-600">{getInitials(selectedContact.name)}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-ink-black mb-1">{selectedContact.name}</h2>
                <p className="text-lg text-silver-gray mb-2">{selectedContact.role}</p>
                <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg">
                  {selectedContact.department}
                </span>
              </div>
              <div className="relative">
                <div className={`w-4 h-4 ${getStatusColor(selectedContact.status)} rounded-full`}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-semibold text-silver-gray mb-1 block">Email</label>
                <div className="flex items-center gap-2 text-ink-black">
                  <Icon name="mail" className="w-4 h-4 text-silver-gray" />
                  <a href={`mailto:${selectedContact.email}`} className="hover:text-primary-blue">
                    {selectedContact.email}
                  </a>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-silver-gray mb-1 block">Phone</label>
                <div className="flex items-center gap-2 text-ink-black">
                  <Icon name="phone" className="w-4 h-4 text-silver-gray" />
                  <a href={`tel:${selectedContact.phone}`} className="hover:text-primary-blue">
                    {selectedContact.phone}
                  </a>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-silver-gray mb-1 block">Created</label>
                <p className="text-ink-black">{selectedContact.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-silver-gray mb-1 block">Last Activity</label>
                <p className="text-ink-black">{selectedContact.lastActivity}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-semibold text-silver-gray mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button className="flex-1 px-4 py-2 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Send Message
              </button>
              <button className="px-4 py-2 bg-white text-ink-black font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors">
                <Icon name="phone" className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        isOpen={showAddContactModal}
        onClose={() => {
          setShowAddContactModal(false);
          setAddContactMode('choice');
          setIsUploading(false);
          // Reset form
          setFormData({
            name: '',
            email: '',
            phone: '',
            zip: '',
            city: '',
            state: '',
            age: '',
            payer: '',
            planType: '',
            deductibleTotal: '',
            deductibleMet: '',
            coinsurance: '',
            oopMax: '',
            inNetworkPreference: false,
            preferredProviders: '',
          });
        }}
        title="Add New Contact"
      >
        {addContactMode === 'choice' ? (
          <div className="p-6">
            <p className="text-silver-gray mb-6 text-center">How would you like to add this contact?</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsUploading(true);
                  setAddContactMode('upload');
                  // Mock upload - simulate processing
                  setTimeout(() => {
                    setIsUploading(false);
                    // Mock extracted data from upload
                    setFormData({
                      name: 'John Doe',
                      email: 'john.doe@example.com',
                      phone: '(417) 555-0123',
                      zip: '64801',
                      city: 'Joplin',
                      state: 'MO',
                      age: '42',
                      payer: 'BlueCross BlueShield',
                      planType: 'PPO',
                      deductibleTotal: '3000',
                      deductibleMet: '500',
                      coinsurance: '20',
                      oopMax: '8000',
                      inNetworkPreference: true,
                      preferredProviders: 'Mercy Hospital, CoxHealth',
                    });
                    setAddContactMode('manual');
                  }, 1500);
                }}
                className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-lg hover:border-primary-blue hover:bg-blue-50 transition-colors"
              >
                <Icon name="upload" className="w-12 h-12 text-primary-blue mb-3" />
                <span className="font-semibold text-ink-black">Upload</span>
                <span className="text-sm text-silver-gray mt-1">Upload a file or document</span>
              </button>
              <button
                onClick={() => setAddContactMode('manual')}
                className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-lg hover:border-primary-blue hover:bg-blue-50 transition-colors"
              >
                <Icon name="edit" className="w-12 h-12 text-primary-blue mb-3" />
                <span className="font-semibold text-ink-black">Enter Manually</span>
                <span className="text-sm text-silver-gray mt-1">Fill out the form</span>
              </button>
            </div>
            <button
              onClick={() => {
                setShowAddContactModal(false);
                setAddContactMode('choice');
              }}
              className="w-full mt-6 px-4 py-2 bg-gray-100 text-ink-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : isUploading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mb-4"></div>
            <p className="text-ink-black font-semibold">Processing upload...</p>
            <p className="text-silver-gray text-sm mt-2">Extracting contact information</p>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="font-semibold text-ink-black mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-black mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-black mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-black mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="(417) 555-0123"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="font-semibold text-ink-black mb-4">Location</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-ink-black mb-1">Zip Code *</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="64801"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-ink-black mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Joplin"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-ink-black mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="MO"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-ink-black mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="35"
                />
              </div>
            </div>

            {/* Insurance Information */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="font-semibold text-ink-black mb-4">Insurance Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-black mb-1">Insurance Payer *</label>
                  <input
                    type="text"
                    value={formData.payer}
                    onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="e.g., BlueCross BlueShield, Aetna, UnitedHealthcare"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-black mb-1">Plan Type *</label>
                  <select
                    value={formData.planType}
                    onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Select plan type</option>
                    <option value="HMO">HMO</option>
                    <option value="PPO">PPO</option>
                    <option value="EPO">EPO</option>
                    <option value="POS">POS</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-black mb-1">Deductible Total *</label>
                    <input
                      type="number"
                      value={formData.deductibleTotal}
                      onChange={(e) => setFormData({ ...formData, deductibleTotal: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="3000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-black mb-1">Deductible Met *</label>
                    <input
                      type="number"
                      value={formData.deductibleMet}
                      onChange={(e) => setFormData({ ...formData, deductibleMet: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-black mb-1">Coinsurance (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.coinsurance}
                      onChange={(e) => setFormData({ ...formData, coinsurance: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-black mb-1">Out-of-Pocket Max</label>
                    <input
                      type="number"
                      value={formData.oopMax}
                      onChange={(e) => setFormData({ ...formData, oopMax: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="8000"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.inNetworkPreference}
                      onChange={(e) => setFormData({ ...formData, inNetworkPreference: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-semibold text-ink-black">Prefer In-Network Providers</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-black mb-1">Preferred Providers</label>
                  <textarea
                    value={formData.preferredProviders}
                    onChange={(e) => setFormData({ ...formData, preferredProviders: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Enter preferred provider names, separated by commas"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setAddContactMode('choice');
                  setIsUploading(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-ink-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowAddContactModal(false);
                  setAddContactMode('choice');
                  setIsUploading(false);
                }}
                className="flex-1 px-4 py-2 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Contact
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HealthSystemContacts;
