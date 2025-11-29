const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

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

module.exports = {
  connectTestDB,
  clearDatabase,
  disconnectTestDB,
};
