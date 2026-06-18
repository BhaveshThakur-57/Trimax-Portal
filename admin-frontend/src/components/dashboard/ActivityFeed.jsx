import React from 'react';
import { motion } from 'framer-motion';

const colorMap = {
  blue:   { dot: 'bg-blue-500',    ring: 'ring-blue-500/20' },
  green:  { dot: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  orange: { dot: 'bg-amber-500',   ring: 'ring-amber-500/20' },
  red:    { dot: 'bg-red-500',     ring: 'ring-red-500/20' },
};

const ActivityFeed = ({ activities }) => {
  if (!activities?.length) return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
        <span className="text-xl">🔔</span>
      </div>
      <p className="text-sm font-medium">No recent activity</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {activities.map((activity, i) => {
        const c = colorMap[activity.color] || colorMap.blue;
        return (
          <motion.div 
            key={activity.id ?? i}
            whileHover={{ x: 4, backgroundColor: '#f8fafc' }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="
              flex gap-3 px-3 py-3 rounded-2xl
              transition-colors duration-200
              group cursor-pointer
            "
          >
            {/* Dot */}
            <div className="flex-shrink-0 mt-0.5">
              <div className={`w-2.5 h-2.5 rounded-full ${c.dot} ring-4 ${c.ring}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-slate-700 font-medium leading-snug group-hover:text-slate-900 transition-colors">
                {activity.message}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{activity.time}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;