const cron = require('node-cron');
const Task = require('../models/Task');
const Leave = require('../models/Leave');
const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');

const initCronJobs = () => {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily automation jobs...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      // 1. Task Due Reminders (Tasks due tomorrow)
      const tasksDueTomorrow = await Task.find({
        status: { $nin: ['Completed', 'Cancelled'] },
        dueDate: { $gte: tomorrow, $lt: nextDay }
      }).populate('assignedTo');

      for (const task of tasksDueTomorrow) {
        if (task.assignedTo) {
          await createNotification(
            task.assignedTo._id,
            'Task Due Tomorrow',
            `Your task "${task.title}" is due tomorrow.`,
            'alert',
            '/admin/tasks'
          );
        }
      }

      // 2. Task Overdue Reminders
      const overdueTasks = await Task.find({
        status: { $nin: ['Completed', 'Cancelled'] },
        dueDate: { $lt: today }
      }).populate('assignedTo');

      for (const task of overdueTasks) {
        if (task.assignedTo) {
          await createNotification(
            task.assignedTo._id,
            'Task Overdue',
            `Your task "${task.title}" is overdue!`,
            'alert',
            '/admin/tasks'
          );
        }
      }

      // 3. Leave Starting Today
      const leavesToday = await Leave.find({
        status: 'Approved',
        startDate: { $lte: today },
        endDate: { $gte: today }
      }).populate('employee');

      if (leavesToday.length > 0) {
        // Notify Admins
        const admins = await User.find({ role: 'Admin' });
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'Employees on Leave Today',
            `${leavesToday.length} employee(s) are on leave today.`,
            'alert',
            '/admin/leaves'
          );
        }
      }

      // 4. Pending Inquiries Follow-up (Older than 2 days)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const pendingInquiries = await Inquiry.find({
        status: 'New',
        date: { $lte: twoDaysAgo },
        followUpSent: { $ne: true } // We need a way to track if sent, maybe we just notify admin instead? Wait, the user asked for follow-up reminders.
      });

      if (pendingInquiries.length > 0) {
        // Send follow-up email to customers
        const { sendFollowUpEmail } = require('./emailService');
        for (const inquiry of pendingInquiries) {
          await sendFollowUpEmail(inquiry);
          // Assuming we want to mark them to avoid resending:
          inquiry.status = 'In Progress'; // or add a field
          await inquiry.save();
        }

        // Find admins to notify
        const admins = await User.find({ role: 'Admin' });
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'Pending Inquiries Follow-up',
            `Follow-up emails were sent for ${pendingInquiries.length} inquiries.`,
            'inquiry',
            '/admin/inquiries'
          );
        }
      }

      console.log('✅ Daily automation jobs completed.');
    } catch (error) {
      console.error('❌ Error running daily automation jobs:', error);
    }
  });

  console.log('⏰ Daily reminder cron jobs initialized.');
};

module.exports = { initCronJobs };
