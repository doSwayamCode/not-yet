const mongoose = require('mongoose');
const { MONGODB_URI } = process.env; // I'll hardcode or read from .env

require('dotenv').config({ path: '../.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notYET');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

run().catch(console.error);
