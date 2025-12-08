import { logger } from '@utils/logger';
import Chance from 'chance';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Inventory from './inventory.model';
import User from '@components/users/user.model';
import Customer from '@components/customers/customer.model';
import { markComponentComplete } from '@utils/seedingLogger';

const chance = new Chance();

const assetTitles = [
  'Projector',
  'Laptop Dell XPS',
  '3D Printer',
  'Microscope',
  'Chemistry Set',
  'Graphing Calculator',
  'Digital Camera',
  'VR Headset',
  'Robotics Kit',
  'Drone',
  'Smart Board',
  'Sound Mixer',
];

const bookTitles = [
  'Introduction to Physics',
  'Advanced Algebra',
  'World History',
  'Creative Writing',
  'Environmental Science',
  'Modern Web Development',
  'The Art of Public Speaking',
  'Data Structures and Algorithms',
  'Organic Chemistry',
  'Introduction to Psychology',
  'Music Theory for Beginners',
];

const randomRecentDate = (days = 60) => {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - days);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
};

const seedTenantInventory = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const existing = await Inventory.countDocuments();
      if (existing > 0) {
        markComponentComplete('inventory', tenantId);
        return;
      }

      const tenantCustomer = await Customer.findOne({ slug: tenantId, is_primary: true });
      if (!tenantCustomer) {
        logger.warn(`[${tenantId}] Skipping inventory seeding: no tenant customer found.`);
        markComponentComplete('inventory', tenantId);
        return;
      }

      const borrowers = await User.find({}).limit(50);
      if (borrowers.length === 0) {
        logger.warn(`[${tenantId}] Skipping inventory seeding: no users found.`);
        markComponentComplete('inventory', tenantId);
        return;
      }

      const total = chance.integer({ min: 25, max: 50 });
      for (let i = 0; i < total; i++) {
        const isAsset = chance.bool();
        const title = isAsset ? chance.pickone(assetTitles) : chance.pickone(bookTitles);
        const user = chance.pickone(borrowers);
        const billingDate = randomRecentDate(90);
        const returned = chance.bool({ likelihood: 55 });

        await Inventory.create({
          user: user._id as any,
          customer: tenantCustomer._id as any,
          title,
          billing_date: billingDate,
          return_date: returned
            ? new Date(billingDate.getTime() + chance.integer({ min: 1, max: 20 }) * 86400000)
            : undefined,
          notes: chance.bool({ likelihood: 35 })
            ? chance.sentence({ words: chance.integer({ min: 4, max: 10 }) })
            : undefined,
          item_type: isAsset ? 'ASSET' : 'ELIBRARY',
        });
      }

      logger.info(`[${tenantId}] Inventory items seeded successfully`);
      markComponentComplete('inventory', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding inventory:`, error);
      throw error;
    }
  });
};

const seedInventory = async () => {
  await seedTenantInventory('supercourse');
};

export { seedTenantInventory };
export default seedInventory;
