import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

const STATUS_COLORS = {
  'New': 'border-blue-500 bg-blue-50',
  'Contacted': 'border-amber-500 bg-amber-50',
  'Qualified': 'border-brand-500 bg-brand-50',
  'Proposal Sent': 'border-orange-500 bg-orange-50',
  'Won': 'border-emerald-500 bg-emerald-50',
  'Lost': 'border-red-500 bg-red-50',
};

const LeadKanbanBoard = ({ leads, updateLeadStatus, openModal, handleDelete }) => {
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set
    e.dataTransfer.setData('text/plain', leadId);
    // Slight delay to allow drag image to generate before adding opacity class
    setTimeout(() => {
      e.target.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e) => {
    setDraggedLeadId(null);
    e.target.classList.remove('opacity-50');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (!draggedLeadId) return;
    
    const lead = leads.find(l => l._id === draggedLeadId);
    if (lead && lead.status !== targetStatus) {
      updateLeadStatus(draggedLeadId, targetStatus);
    }
    setDraggedLeadId(null);
  };

  // Group leads by status
  const groupedLeads = STATUSES.reduce((acc, status) => {
    acc[status] = leads.filter(l => l.status === status);
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px] snap-x">
      {STATUSES.map(status => (
        <div 
          key={status}
          className="flex-shrink-0 w-80 bg-slate-100 rounded-2xl p-3 flex flex-col snap-start"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className={`border-t-4 ${STATUS_COLORS[status].split(' ')[0]} rounded-t-xl mb-3 px-3 pt-3 pb-1 flex justify-between items-center bg-white shadow-sm`}>
            <h3 className="font-bold text-slate-800 text-sm">{status}</h3>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {groupedLeads[status].length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2 custom-scrollbar">
            {groupedLeads[status].map(lead => (
              <div
                key={lead._id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead._id)}
                onDragEnd={handleDragEnd}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-brand-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm truncate">{lead.name}</p>
                    {lead.company && <p className="text-[11px] text-slate-400 truncate">{lead.company}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(lead)} className="p-1 text-slate-400 hover:text-brand-600 rounded">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(lead._id)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lead.priority === 'High' ? 'bg-red-50 text-red-600' :
                    lead.priority === 'Medium' ? 'bg-blue-50 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {lead.priority}
                  </span>
                  {lead.score > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-600">
                      Score: {lead.score}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-[11px] text-slate-500">
                  {lead.dealValue > 0 && (
                    <div className="font-semibold text-emerald-600">
                      Value: ₹{lead.dealValue.toLocaleString()}
                    </div>
                  )}
                  {lead.followUpDate && (
                    <div className={new Date(lead.followUpDate) < new Date() ? 'text-red-500 font-bold' : ''}>
                      Follow-up: {formatDate(lead.followUpDate)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {groupedLeads[status].length === 0 && (
              <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-medium">
                Drop leads here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadKanbanBoard;
