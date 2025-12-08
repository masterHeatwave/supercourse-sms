import { logger } from '@utils/logger';
import Chance from 'chance';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Classroom from './classroom.model';
import Customer from '@components/customers/customer.model';
import { markComponentComplete } from '@utils/seedingLogger';

const chance = new Chance();

const seedTenantClassrooms = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const existingClassrooms = await Classroom.countDocuments();
      if (existingClassrooms > 0) {
        markComponentComplete('classrooms', tenantId);
        return;
      }

      // Find the main customer first
      const mainCustomer = await Customer.findOne({ slug: tenantId, is_main_customer: true });
      if (!mainCustomer) {
        throw new Error(`Main customer not found for tenant ${tenantId}`);
      }

      logger.info(`Found main customer for ${tenantId}: ${mainCustomer.name}`);

      // Find all branch customers for this tenant
      const branchCustomers = await Customer.find({
        parent_customer: mainCustomer._id,
        is_main_customer: false,
      });

      logger.info(`Found ${branchCustomers.length} branches for tenant ${tenantId}`);

      if (branchCustomers.length === 0) {
        logger.warn(`No branches found for tenant ${tenantId}, skipping classroom seeding`);
        markComponentComplete('classrooms', tenantId);
        return;
      }

      // Create 4 classrooms for each branch
      for (const branch of branchCustomers) {
        for (let i = 0; i < 4; i++) {
          await Classroom.create({
            name: `${branch.name} - Room ${i + 1}`,
            capacity: chance.integer({ min: 20, max: 40 }),
            location: chance.string({ length: 3, pool: '0123456789' }),
            equipment: chance.pickset(
              ['Projector', 'Whiteboard', 'Computers', 'Smart Board'],
              chance.integer({ min: 1, max: 3 })
            ),
            customer: branch._id,
            type: chance.pickone([
              'standard',
              'computer_lab',
              'science_lab',
              'art_studio',
              'music_room',
              'gymnasium',
              'library',
              'conference_room',
            ]),
            availability: chance.pickone(['available', 'unavailable', 'out_of_order', 'under_maintenance']),
            description: `A ${chance.pickone(['modern', 'spacious', 'well-equipped', 'comfortable'])} classroom for ${branch.name}`,
          });
        }
      }
      markComponentComplete('classrooms', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding classrooms:`, error);
      throw error;
    }
  });
};

const seedClassrooms = async () => {
  await seedTenantClassrooms('supercourse');
};

export { seedTenantClassrooms };
export default seedClassrooms;
