const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let mongoServer;

const connectTestDB = async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    dbName: 'peersupporthub_test',
  });
};

const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  const deletionPromises = Object.values(collections).map((collection) =>
    collection.deleteMany()
  );
  await Promise.all(deletionPromises);
};

const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

// Generate JWT token for testing
const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret', {
    expiresIn: '1h',
  });
};

// Create a test user
const createTestUser = async (userData = {}) => {
  const defaultData = {
    name: 'Test User',
    email: `testuser_${Date.now()}@test.com`,
    username: `testuser_${Date.now()}`,
    password: 'Password123!',
    isEmailVerified: true,
    userType: 'User',
    ...userData,
  };

  const user = await User.create(defaultData);
  const token = generateTestToken(user._id);

  return { user, token };
};

// Create a test admin user
const createTestAdmin = async (userData = {}) => {
  const defaultData = {
    name: 'Test Admin',
    email: `testadmin_${Date.now()}@test.com`,
    username: `testadmin_${Date.now()}`,
    password: 'AdminPassword123!',
    isEmailVerified: true,
    userType: 'Admin',
    ...userData,
  };

  const user = await User.create(defaultData);
  const token = generateTestToken(user._id);

  return { user, token };
};

module.exports = {
  connectTestDB,
  clearDatabase,
  disconnectTestDB,
  generateTestToken,
  createTestUser,
  createTestAdmin,
};
