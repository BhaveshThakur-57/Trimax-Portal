import React from 'react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const volumeData = [
  { month: 'Jan', volume: 65, service: 45 },
  { month: 'Feb', volume: 78, service: 52 },
  { month: 'Mar', volume: 70, service: 58 },
  { month: 'Apr', volume: 55, service: 65 },
  { month: 'May', volume: 82, service: 48 },
  { month: 'Jun', volume: 90, service: 70 },
];

const fulfillmentData = [
  { month: 'Jan', fulfilled: 400, pending: 240 },
  { month: 'Feb', fulfilled: 300, pending: 139 },
  { month: 'Mar', fulfilled: 200, pending: 380 },
  { month: 'Apr', fulfilled: 278, pending: 390 },
  { month: 'May', fulfilled: 189, pending: 480 },
  { month: 'Jun', fulfilled: 239, pending: 380 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-slate-500">
          <span className="w-2 h-2 rounded-full inline-block shadow-sm shadow-current" style={{ background: p.color }} />
          <span className="capitalize">{p.dataKey}:</span>
          <span className="font-semibold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, legend, children }) => (
  <div className="glass-panel border border-slate-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6">
    <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
      <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
      <div className="flex gap-4">
        {legend.map((l, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm shadow-current" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
    {children}
  </div>
);

const Charts = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

    <ChartCard
      title="Performance Level"
      legend={[{ label: 'Volume', color: '#a78bfa' }, { label: 'Service', color: '#64748b' }]}
    >
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={volumeData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="volume"  fill="#7c3aed" radius={[6, 6, 0, 0]} />
          <Bar dataKey="service" fill="#475569" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard
      title="Customer Fulfillment"
      legend={[{ label: 'Fulfilled', color: '#10b981' }, { label: 'Pending', color: '#8b5cf6' }]}
    >
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={fulfillmentData}>
          <defs>
            <linearGradient id="colorFulfilled" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="fulfilled" stackId="1"
            stroke="#10b981" strokeWidth={2} fill="url(#colorFulfilled)" />
          <Area type="monotone" dataKey="pending"   stackId="1"
            stroke="#8b5cf6" strokeWidth={2} fill="url(#colorPending)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>

  </div>
);

export default Charts;