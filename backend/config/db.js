const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Drop old problematic indexes after connection
    await dropOldIndexes(conn);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Drop old indexes that may cause issues
 * This runs on startup to clean up legacy indexes
 */
const dropOldIndexes = async (conn) => {
  try {
    const db = conn.connection.db;
    
    // Check and drop old 'name_1' index on habittemplates collection if it exists
    const habittemplatesCollection = db.collection('habittemplates');
    const indexes = await habittemplatesCollection.indexes();
    
    // Look for the old 'name_1' unique index (not the compound creatorId_1_name_1 index)
    const oldNameIndex = indexes.find(idx => 
      idx.name === 'name_1' && idx.unique === true
    );
    
    if (oldNameIndex) {
      console.log('Dropping old unique name_1 index from habittemplates...');
      await habittemplatesCollection.dropIndex('name_1');
      console.log('Successfully dropped old name_1 index');
    }
  } catch (error) {
    // Index might not exist, that's okay
    if (error.code !== 27) { // 27 = IndexNotFound
      console.log('Note: Could not drop old index (may not exist):', error.message);
    }
  }
};

module.exports = connectDB;