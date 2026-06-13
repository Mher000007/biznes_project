import Category from '../models/Category.js';

const SEED_CATEGORIES = [
  { name: 'Building Material', slug: 'building-material', description: 'Construction supplies, materials, tools, and hardware', icon: 'Hammer' },
  { name: 'Agriculture',   slug: 'agriculture',   description: 'Farming, food production, and agritech companies',           icon: 'Wheat' },
  { name: 'HoReCa',        slug: 'horeca',        description: 'Hotels, restaurants, cafés, and catering services',          icon: 'UtensilsCrossed' },
  { name: 'Construction',  slug: 'construction',  description: 'Building, architecture, and real estate companies',          icon: 'Building2' },
  { name: 'Finance',       slug: 'finance',       description: 'Banking, insurance, and financial services',                 icon: 'Landmark' },
  { name: 'Healthcare',    slug: 'healthcare',    description: 'Clinics, pharmacies, and medical services',                  icon: 'Heart' },
  { name: 'Education',     slug: 'education',     description: 'Schools, universities, and training centers',               icon: 'GraduationCap' },
  { name: 'Automotive',    slug: 'automotive',    description: 'Car services, dealerships, and transport companies',         icon: 'Car' },
  { name: 'Beauty',        slug: 'beauty',        description: 'Salons, spas, and personal care services',                  icon: 'Sparkles' },
  { name: 'Legal',         slug: 'legal',         description: 'Law firms, notary, and legal advisory services',            icon: 'Scale' },
  { name: 'Logistics',     slug: 'logistics',     description: 'Freight, delivery, and supply chain services',              icon: 'Truck' },
];

/**
 * Seeds categories that don't exist yet.
 * Safe to call on every startup — uses upsert so it's idempotent.
 */
export async function seedCategories(): Promise<void> {
  try {
    const ops = SEED_CATEGORIES.map(cat => ({
      updateOne: {
        filter: { slug: cat.slug },
        update: { $setOnInsert: cat },
        upsert: true,
      },
    }));
    await Category.bulkWrite(ops);
    console.log(`✓ Categories seeded (${SEED_CATEGORIES.length} categories ensured)`);
  } catch (err) {
    console.warn('⚠ Category seeding failed (non-fatal):', err);
  }
}
