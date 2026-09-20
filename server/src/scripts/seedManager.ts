import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Manager } from '../models/Manager';

async function main() {
  await mongoose.connect(process.env.MONGO_URI as string);

  const email = process.env.MANAGER_EMAIL as string;
  const password = process.env.MANAGER_PASSWORD as string;
  const passwordHash = await bcrypt.hash(password, 10);

  await Manager.findOneAndUpdate(
    { email },
    { email, passwordHash },
    { upsert: true }
  );

  console.log(`Manager account ready: ${email}`);
  await mongoose.disconnect();
}

main();
