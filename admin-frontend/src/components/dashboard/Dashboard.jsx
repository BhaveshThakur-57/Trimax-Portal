import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { StatsCard, Card } from '../common/UI';
import PageHeader from '../common/PageHeader';
import ActivityFeed from './ActivityFeed';
import TopProducts from './TopProducts';
import Charts from './Charts';
import dashboardService from '../../services/dashboardService';
import { Users, MessageSquare, Briefcase, DollarSign, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const formatCurrency = (amt) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amt || 0);

const SkeletonCard = () => (
  <Card className="p-6">
    <div className="flex justify-between items-start mb-5">
      <div className="w-12 h-12 rounded-2xl animate-pulse bg-slate-200" />
      <div className="w-14 h-6 rounded-full animate-pulse bg-slate-200" />
    </div>
    <div className="w-24 h-8 rounded-lg animate-pulse bg-slate-200 mb-2" />
    <div className="w-32 h-3 rounded animate-pulse bg-slate-200 mb-1" />
  </Card>
);

const Dashboard = () => {
  const [stats, setStats]           = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getActivities(),
      ]);

      const statsData =
        statsRes?.data?.stats ??
        statsRes?.stats ??
        statsRes?.data ??
        null;
      setStats(statsData);

      const actData = Array.isArray(activitiesRes)
        ? activitiesRes
        : Array.isArray(activitiesRes?.data)
          ? activitiesRes.data
          : Array.isArray(activitiesRes?.data?.data)
            ? activitiesRes.data.data
            : [];
      setActivities(actData);

    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { 
      title: 'Total Users', value: stats.totalUsers || 0, trend: stats.usersChange, icon: Users, 
      grad: 'from-blue-500 to-blue-600', ring: 'ring-blue-500/20'
    },
    { 
      title: 'Active Inquiries', value: stats.activeInquiries || 0, trend: stats.inquiriesChange, icon: MessageSquare, 
      grad: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-500/20'
    },
    { 
      title: 'Total Services', value: stats.totalServices || 0, trend: stats.servicesChange, icon: Briefcase, 
      grad: 'from-brand-500 to-brand-600', ring: 'ring-brand-500/20'
    },
    { 
      title: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue), trend: stats.revenueChange, icon: DollarSign, 
      grad: 'from-amber-500 to-orange-500', ring: 'ring-amber-500/20'
    }
  ] : [];

  return (
    <motion.div 
      className="p-6 max-w-[1400px] mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <PageHeader 
          title="Dashboard" 
          subtitle="Welcome back! Here's what's happening today."
          icon={LayoutDashboard}
          rightContent={
            <span className="text-sm font-medium text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((stat, i) => <StatsCard key={i} {...stat} />)
        }
      </motion.div>

      <motion.div variants={itemVariants}>
        <Charts />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <TopProducts />

        <Card className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-slate-800 tracking-tight font-display">Recent Activity</h3>
              <p className="text-[13px] text-slate-500 mt-1">Latest updates from your team</p>
            </div>
            <Link to="/admin/inquiries" className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-2xl" />)}
              </div>
            ) : (
              <ActivityFeed activities={activities} />
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;