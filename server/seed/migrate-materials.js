import mongoose from 'mongoose';
import Material from '../models/Material.js';
import MaterialPurchase from '../models/MaterialPurchase.js';
import { env } from '../config/env.js';

async function run() {
  await mongoose.connect(env.mongoUri);
  const purchases = await MaterialPurchase.find().sort('-date');
  let created = 0;
  let linked = 0;

  for (const purchase of purchases) {
    let material = await Material.findOne({ materialName: purchase.materialName });
    if (!material) {
      material = await Material.create({
        materialName: purchase.materialName,
        category: 'General',
        unit: purchase.unit,
        defaultRate: purchase.ratePerUnit,
        preferredSupplier: purchase.supplier,
        notes: 'Created from existing purchase history'
      });
      created += 1;
    }
    if (!purchase.material) {
      purchase.material = material._id;
      await purchase.save();
      linked += 1;
    }
  }

  console.log(`Material migration complete. Created ${created}, linked ${linked} purchases.`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
