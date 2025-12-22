const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const adminUsers = [
  {
    name: 'Muneeb Admin',
    email: 'muneeb@admin.com',
    username: 'muneebadmin',
    password: 'simplesimple',
    userType: 'Admin',
    isEmailVerified: true,
  },
  {
    name: 'Hassan Admin',
    email: 'hassan@admin.com',
    username: 'hassanadmin',
    password: 'simplesimple',
    userType: 'Admin',
    isEmailVerified: true,
  },
  {
    name: 'Faisal Admin',
    email: 'faisal@admin.com',
    username: 'faisaladmin',
    password: 'simplesimple',
    userType: 'Admin',
    isEmailVerified: true,
  },
];

const seedAdmins = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/peersupporthub';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    for (const adminData of adminUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email: adminData.email }, { username: adminData.username }] 
      });

      if (existingUser) {
        // Update to admin if not already
        if (existingUser.userType !== 'Admin') {
          existingUser.userType = 'Admin';
          await existingUser.save();
          console.log(`Updated ${adminData.email} to Admin`);
        } else {
          console.log(`Admin ${adminData.email} already exists`);
        }
      } else {
        // Create new admin user
        const newAdmin = new User(adminData);
        await newAdmin.save();
        console.log(`Created admin user: ${adminData.email}`);
      }
    }

    console.log('\nAdmin seeding completed successfully!');
    console.log('Admin accounts created:');
    adminUsers.forEach(admin => {
      console.log(`  - ${admin.email} (password: simplesimple)`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admins:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmins();
