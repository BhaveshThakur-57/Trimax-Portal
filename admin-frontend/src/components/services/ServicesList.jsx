import { Briefcase } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const DUMMY_CONTACTS = [
  {
    _id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 9876543210',
    services: ['Web Development', 'UI/UX Design'],
    budget: '50,000 - 1,00,000',
    message: 'Need a complete website redesign for my startup.',
    status: 'New',
    submittedAt: '2025-04-10T10:30:00Z',
  },
  {
    _id: '2',
    name: 'Priya Mehta',
    email: 'priya.mehta@outlook.com',
    phone: '+91 9123456780',
    services: ['Mobile Development', 'Cloud Solutions'],
    budget: '1,00,000 - 2,00,000',
    message: 'Looking for a mobile app for our e-commerce platform.',
    status: 'Pending',
    submittedAt: '2025-04-15T08:00:00Z',
  },
  {
    _id: '3',
    name: 'Amit Verma',
    email: 'amit.verma@yahoo.com',
    phone: '+91 9988776655',
    services: ['CRM Solutions', 'Digital Marketing'],
    budget: '30,000 - 60,000',
    message: 'We need CRM integration and a digital marketing strategy.',
    status: 'Resolved',
    submittedAt: '2025-04-20T14:45:00Z',
  },
  {
    _id: '4',
    name: 'Sneha Patil',
    email: 'sneha.patil@gmail.com',
    phone: '+91 9001122334',
    services: ['Web Development'],
    budget: 'Flexible',
    message: 'Personal portfolio website needed urgently.',
    status: 'New',
    submittedAt: '2025-05-01T09:15:00Z',
  },
  {
    _id: '5',
    name: 'Karan Joshi',
    email: 'karan.joshi@company.in',
    phone: '+91 9765432109',
    services: ['Cloud Solutions', 'Web Development', 'UI/UX Design'],
    budget: '2,00,000+',
    message: 'Enterprise-level cloud migration and new dashboard UI required.',
    status: 'Pending',
    submittedAt: '2025-05-05T11:00:00Z',
  },
];

const ServicesList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState('');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setContacts(DUMMY_CONTACTS);
      setLoading(false);
    }, 600);
  }, []);

  const downloadExcel = () => {
    const exportData = contacts.map((c, i) => ({
      '#': i + 1,
      'Name': c.name,
      'Email': c.email,
      'Phone': c.phone,
      'Services': c.services?.join(', ') || '',
      'Budget': `₹${c.budget}`,
      'Message': c.message,
      'Status': c.status,
      'Date': new Date(c.submittedAt).toLocaleDateString('en-IN'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    ws['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 30 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Service Requests');
    XLSX.writeFile(wb, `service-requests-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
  };

  if (loading) return (
    <div className="page-content">
      <div className="loading">Loading service requests...</div>
    </div>
  );

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Briefcase size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Services
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Service requests from website visitors
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: '#ede9fe', color: '#6d28d9', padding: '8px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: '500' }}>
            Total: <strong>{contacts.length}</strong> requests
          </div>
          <button className="excel-btn" onClick={downloadExcel}>
            ⬇️ Download Excel
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Desktop Table */}
      <div className="table-wrapper desktop-view">
        <table className="modern-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Services Requested</th>
              <th>Budget</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact, index) => (
              <tr key={contact._id}>
                <td>{index + 1}</td>
                <td><strong>{contact.name}</strong></td>
                <td>{contact.email}</td>
                <td>{contact.phone}</td>
                <td>
                  <div className="services-tags">
                    {contact.services?.map((s, i) => (
                      <span key={i} className="service-tag">{s}</span>
                    ))}
                  </div>
                </td>
                <td>₹{contact.budget}</td>
                <td className="message-cell">{contact.message}</td>
                <td>
                  <span className={`status-pill status-${contact.status?.toLowerCase()}`}>
                    {contact.status}
                  </span>
                </td>
                <td>{new Date(contact.submittedAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-view">
        {contacts.map((contact, index) => (
          <div key={contact._id} className="contact-card">
            <div className="contact-card-header">
              <span className="card-index">#{index + 1}</span>
              <span className={`status-pill status-${contact.status?.toLowerCase()}`}>
                {contact.status}
              </span>
            </div>
            <h3 className="card-name">{contact.name}</h3>
            <div className="card-row"><span className="card-label">📧</span><span>{contact.email}</span></div>
            <div className="card-row"><span className="card-label">📞</span><span>{contact.phone}</span></div>
            <div className="card-row">
              <span className="card-label">💼</span>
              <div className="services-tags">
                {contact.services?.map((s, i) => (
                  <span key={i} className="service-tag">{s}</span>
                ))}
              </div>
            </div>
            <div className="card-row"><span className="card-label">💰</span><span>₹{contact.budget}</span></div>
            <div className="card-row"><span className="card-label">💬</span><span>{contact.message}</span></div>
            <div className="card-row"><span className="card-label">📅</span><span>{new Date(contact.submittedAt).toLocaleDateString('en-IN')}</span></div>
          </div>
        ))}
      </div>

      {contacts.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontWeight: '500' }}>
          No service requests found
        </div>
      )}

      <style>{`
        .excel-btn {
          background: #16a34a; color: white; border: none;
          padding: 10px 18px; border-radius: 8px; font-size: 14px;
          font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .excel-btn:hover { background: #15803d; }
        .desktop-view { display: block; }
        .mobile-view { display: none; }
        .table-wrapper {
          background: #fff; border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          overflow-x: auto; margin-top: 20px;
        }
        .modern-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .modern-table thead tr { background: #f8f9ff; border-bottom: 2px solid #e8eaf0; }
        .modern-table th { padding: 14px 16px; text-align: left; font-weight: 600; color: #4a5568; white-space: nowrap; }
        .modern-table tbody tr { border-bottom: 1px solid #f0f2f5; transition: background 0.2s; }
        .modern-table tbody tr:hover { background: #f8f9ff; }
        .modern-table td { padding: 12px 16px; color: #2d3748; vertical-align: middle; }
        .services-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .service-tag { background: #ede9fe; color: #6d28d9; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; white-space: nowrap; }
        .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
        .status-new { background: #dbeafe; color: #1d4ed8; }
        .status-resolved { background: #dcfce7; color: #15803d; }
        .status-pending { background: #fef9c3; color: #a16207; }
        .message-cell { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .total-badge { background: #ede9fe; color: #6d28d9; padding: 8px 18px; border-radius: 20px; font-size: 14px; }
        @media (max-width: 768px) {
          .desktop-view { display: none; }
          .mobile-view { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
          .page-header-modern { flex-direction: column; align-items: flex-start; gap: 12px; }
          .contact-card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 8px; }
          .contact-card-header { display: flex; justify-content: space-between; align-items: center; }
          .card-index { font-size: 12px; color: #9ca3af; font-weight: 600; }
          .card-name { font-size: 16px; font-weight: 700; color: #1a202c; margin: 0; }
          .card-row { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: #4a5568; }
          .card-label { font-size: 16px; min-width: 20px; }
        }
      `}</style>
    </div>
  );
};

export default ServicesList;