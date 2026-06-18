import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const products = [
  { id: 1, name: 'Web Development',        popularity: 85, sales: '48%' },
  { id: 2, name: 'Mobile App Development', popularity: 72, sales: '35%' },
  { id: 3, name: 'Cloud Solutions',        popularity: 65, sales: '28%' },
  { id: 4, name: 'UI/UX Design',           popularity: 58, sales: '22%' },
  { id: 5, name: 'SEO Optimization',       popularity: 45, sales: '15%' },
];

/* color per rank */
const rankColors = [
  'from-brand-500 to-brand-600',
  'from-blue-500 to-brand-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-500',
];

const TopProducts = () => (
  <div className="glass-panel border border-slate-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-[15px] font-bold text-slate-800">Top Products</h3>
        <p className="text-[12px] text-slate-500 mt-0.5">By popularity & sales</p>
      </div>
      <Link to="/admin/services" className="text-[13px] font-medium text-brand-600 hover:text-brand-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50 inline-block">
        View All →
      </Link>
    </div>

    {/* Column headers */}
    <div className="grid grid-cols-[32px_1fr_1.4fr_56px] gap-3 px-3 mb-2">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">#</div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Popularity</div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Sales</div>
    </div>

    {/* Rows */}
    <div className="flex flex-col gap-1.5">
      {products.map((product, index) => (
        <motion.div 
          key={product.id}
          whileHover={{ x: 4, backgroundColor: '#f8fafc' }}
          className="
            grid grid-cols-[32px_1fr_1.4fr_56px] gap-3
            px-3 py-3 rounded-2xl items-center
            transition-colors duration-200
            group cursor-pointer
          "
        >
          {/* Rank number */}
          <div className={`
            w-6 h-6 rounded-md flex items-center justify-center
            text-[10px] font-bold text-white flex-shrink-0
            bg-gradient-to-br ${rankColors[index]}
            shadow-sm shadow-black/20
          `}>
            {index + 1}
          </div>

          {/* Name */}
          <div className="text-[13px] font-medium text-slate-700 truncate group-hover:text-slate-900 transition-colors">
            {product.name}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${product.popularity}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${rankColors[index]} rounded-full`}
              />
            </div>
            <span className="text-[11px] text-slate-500 w-7 flex-shrink-0">{product.popularity}%</span>
          </div>

          {/* Sales */}
          <div className="text-[13px] font-semibold text-slate-800 text-right">
            {product.sales}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default TopProducts;