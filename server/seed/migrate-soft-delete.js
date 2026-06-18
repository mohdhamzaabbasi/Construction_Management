import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Client from '../models/Client.js';
import Supplier from '../models/Supplier.js';
import Labourer from '../models/Labourer.js';
import Material from '../models/Material.js';

async function run() {
  await mongoose.connect(env.mongoUri);

  const collections = [
    ['clients', Client],
    ['suppliers', Supplier],
    ['labourers', Labourer],
    ['materials', Material]
  ];

  for (const [name, Model] of collections) {
    const result = await Model.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'Active' } }
    );
    console.log(`${name}: updated ${result.modifiedCount}`);
  }

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
