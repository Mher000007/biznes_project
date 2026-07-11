import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') }); // in case it's in backend/.env

import Business from '../src/models/Business.js';
import BusinessLocation from '../src/models/BusinessLocation.js';

const migrateLocations = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not defined in env');
      process.exit(1);
    }

    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    const businesses = await Business.find({});
    console.log(`Found ${businesses.length} businesses. Starting migration...`);

    let createdCount = 0;
    for (const business of businesses) {
      // Check if location exists
      const existingLocations = await BusinessLocation.find({ business: business._id });
      
      if (existingLocations.length === 0) {
        console.log(`Migrating location for business: ${business.name} (${business._id})`);
        
        await BusinessLocation.create({
          business: business._id,
          name: 'Main Location',
          address: business.address || 'Not specified',
          city: business.city || 'Yerevan',
          coordinates: business.coordinates || { latitude: 40.1872, longitude: 44.5152 },
          phone: business.phone || '',
          isPrimary: true,
          active: true
        });
        createdCount++;
      }
    }

    console.log(`Migration completed. Created ${createdCount} location records.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateLocations();
