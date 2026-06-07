import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not found');
  }
  const users = await db.collection('users').find({}).toArray();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

run().catch(console.error);
