import { logger } from '@utils/logger';
import Chance from 'chance';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Taxi from './taxi.model';
import AcademicYear from '@components/academic/academic-years.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import User from '@components/users/user.model';
import Customer from '@components/customers/customer.model';
import { markComponentComplete } from '@utils/seedingLogger';

const chance = new Chance();

const seedTenantTaxis = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const existingTaxis = await Taxi.countDocuments();
      if (existingTaxis > 0) {
        markComponentComplete('taxis', tenantId);
        return;
      }

      const existingStudents = await User.countDocuments({ user_type: 'student' });
      if (existingStudents === 0) {
        logger.warn(`[${tenantId}] No students found, skipping taxi seeding.`);

        markComponentComplete('taxis', tenantId);
        return;
      }

      // Get main tenant customer
      const tenantCustomer = await Customer.findOne({ slug: tenantId, is_primary: true });
      if (!tenantCustomer) {
        logger.warn(`[${tenantId}] No tenant customer found, skipping taxi seeding.`);
        markComponentComplete('taxis', tenantId);
        return;
      }

      // Get branches for this tenant
      const branches = await Customer.find({ parent_customer: tenantCustomer._id, is_primary: false });
      if (branches.length === 0) {
        logger.warn(`[${tenantId}] No branches found for tenant, skipping taxi seeding.`);
        markComponentComplete('taxis', tenantId);
        return;
      }

      logger.debug(`[${tenantId}] Starting taxi seeding process...`);

      const academicYear = await AcademicYear.findOne({ is_current: true });
      const academicPeriod = await AcademicPeriod.findOne({ is_active: true });

      // Also check what academic data exists
      const allYears = await AcademicYear.find({});
      const allPeriods = await AcademicPeriod.find({});
      logger.debug(`[${tenantId}] All academic years: ${allYears.map((y) => y.name).join(', ')}`);
      logger.debug(`[${tenantId}] All academic periods: ${allPeriods.map((p) => p.name).join(', ')}`);

      if (!academicYear || !academicPeriod) {
        logger.warn(
          `[${tenantId}] Skipping taxi seeding: Required academic year or period not found. Ensure they are seeded for this tenant.`
        );

        markComponentComplete('taxis', tenantId);
        return;
      }

      const teachers = await User.find({ user_type: 'teacher' }).limit(5);
      const students = await User.find({ user_type: 'student' }).limit(20);

      if (teachers.length === 0 || students.length === 0) {
        logger.warn(
          `[${tenantId}] Skipping taxi seeding: Required users (teachers/students) not found. Ensure they are seeded for this tenant.`
        );

        markComponentComplete('taxis', tenantId);
        return;
      }

      for (let i = 0; i < 5; i++) {
        // Randomly select a branch for this taxi
        const randomBranch = branches[Math.floor(Math.random() * branches.length)];

        await Taxi.create({
          name: `Taxi ${i + 1}`,
          color: chance.color({ format: 'name' }),
          branch: randomBranch.id, // Use branch ID instead of random text
          subject: chance.pickone(['Math', 'Science', 'English', 'History']),
          level: chance.pickone(['Beginner', 'Intermediate', 'Advanced']),
          academic_year: academicYear.id,
          academic_period: academicPeriod.id,
          users: chance.pickset(
            students.map((s) => s.id),
            chance.integer({ min: 5, max: 10 })
          ),
          scap_products: chance.pickset(['Product A', 'Product B', 'Product C'], chance.integer({ min: 1, max: 3 })),
        });
      }

      // Mark taxis as complete for this tenant
      markComponentComplete('taxis', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding taxis:`, error);
      throw error;
    }
  });
};

const seedTaxis = async () => {
  await seedTenantTaxis('supercourse');
  await seedTenantTaxis('piedpiper');
};

export { seedTenantTaxis };
export default seedTaxis;
