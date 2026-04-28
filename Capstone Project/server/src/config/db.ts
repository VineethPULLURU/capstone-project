const moongoose = require('mongoose');
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mini-jira';

const connectDB = async () => {
  try {
    await moongoose.connect(dbURI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  } 
}

module.exports = connectDB;