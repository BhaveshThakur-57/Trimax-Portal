/**
 * One-time script to fix legacy role values in the database.
 * Converts "Admin" → "admin", "user" → "employee", etc.
 * 
 * Usage: node src/scripts/fixRoles.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

async function fixRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Fix "Admin" (capital A) → "admin"
    const adminResult = await User.updateMany(
      { role: { $regex: /^admin$/i, $ne: 'admin' } },
      { $set: { role: 'admin' } }
    );
    console.log(`📝 Fixed ${adminResult.modifiedCount} admin roles`);

    // Fix "user" → "employee"
    const userResult = await User.updateMany(
      { role: { $regex: /^user$/i } },
      { $set: { role: 'employee' } }
    );
    console.log(`📝 Fixed ${userResult.modifiedCount} user→employee roles`);

    // Fix "Employee" (capital E) → "employee"  
    const empResult = await User.updateMany(
      { role: { $regex: /^employee$/i, $ne: 'employee' } },
      { $set: { role: 'employee' } }
    );
    console.log(`📝 Fixed ${empResult.modifiedCount} employee roles`);

    // Show all users and their roles
    const users = await User.find({}, 'name email role').lean();
    console.log('\n📋 Current users:');
    users.forEach(u => console.log(`   ${u.name} (${u.email}) — role: "${u.role}"`));

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixRoles();
