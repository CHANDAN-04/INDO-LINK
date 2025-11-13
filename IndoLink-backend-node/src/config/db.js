const mongoose = require('mongoose');

let isConnected = false;

async function connectToDatabase(mongoUri) {
  if (isConnected) return mongoose.connection;
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
  isConnected = true;
  console.log('Connected to MongoDB');
  return mongoose.connection;
}

module.exports = { connectToDatabase };


