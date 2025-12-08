import { logger } from '@utils/logger';
import Chance from 'chance';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Taxi from './taxi.model';
import AcademicYear from '@components/academic/academic-years.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import User from '@components/users/user.model';
import Customer from '@components/customers/customer.model';
import { markComponentComplete } from '@utils/seedingLogger';
import { getSubjectValues, getLevelValues } from '@utils/subject-level-mapping';

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

      // Get academic year using dual-state logic: prefer manually active, fall back to date-derived
      let academicYear = await AcademicYear.findOne({ is_manual_active: true });
      if (!academicYear) {
        const currentDate = new Date();
        academicYear = await AcademicYear.findOne({
          start_date: { $lte: currentDate },
          end_date: { $gte: currentDate },
        });
      }
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

      const teachers = await User.find({ user_type: 'teacher' });
      const students = await User.find({ user_type: 'student' });

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

        // Filter students that belong to the same branch as the taxi
        const studentsInBranch = students.filter((student) => {
          // Check if student has the branch in their branches array or customers array
          const studentBranches = student.branches?.map((b: any) => b.toString()) || [];
          const studentCustomers = student.customers?.map((c: any) => c.toString()) || [];

          const branchId = randomBranch.id.toString();
          return studentBranches.includes(branchId) || studentCustomers.includes(branchId);
        });

        // Filter teachers that belong to the same branch as the taxi
        const teachersInBranch = teachers.filter((teacher) => {
          // Check if teacher has the branch in their branches array or customers array
          const teacherBranches = teacher.branches?.map((b: any) => b.toString()) || [];
          const teacherCustomers = teacher.customers?.map((c: any) => c.toString()) || [];

          const branchId = randomBranch.id.toString();
          return teacherBranches.includes(branchId) || teacherCustomers.includes(branchId);
        });

        if (studentsInBranch.length === 0) {
          logger.warn(
            `[${tenantId}] No students found for branch ${randomBranch.name}, skipping taxi ${i + 1} creation.`
          );
          continue;
        }

        // Generate a unique code for the taxi (optional, will auto-generate if not provided)
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const generateCode = () =>
          Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

        let taxiCode = generateCode();
        let codeExists = await Taxi.exists({ code: taxiCode });
        let attempts = 0;

        // Ensure unique code
        while (codeExists && attempts < 10) {
          taxiCode = generateCode();
          codeExists = await Taxi.exists({ code: taxiCode });
          attempts++;
        }

        // Select random users from the branch-filtered lists
        const selectedStudents = chance.pickset(
          studentsInBranch.map((s) => s.id),
          Math.min(studentsInBranch.length, chance.integer({ min: 5, max: 10 }))
        );

        // Optionally include teachers from the same branch
        const selectedTeachers =
          teachersInBranch.length > 0
            ? chance.pickset(
                teachersInBranch.map((t) => t.id),
                Math.min(teachersInBranch.length, chance.integer({ min: 1, max: 3 }))
              )
            : [];

        // Get available subjects and levels
        const subjects = getSubjectValues();
        const levels = getLevelValues();

        const allUsers = [...selectedStudents, ...selectedTeachers];

        const taxi = await Taxi.create({
          name: `Taxi ${i + 1}`,
          code: taxiCode, // Explicitly set the code
          color: chance.color({ format: 'hex' }),
          branch: randomBranch.id, // Use branch ID instead of random text
          subject: chance.pickone(subjects),
          level: chance.pickone(levels),
          academic_year: academicYear.id,
          academic_period: academicPeriod.id,
          users: allUsers, // Only users from the same branch
          scap_products: chance.pickset(['Product A', 'Product B', 'Product C'], chance.integer({ min: 1, max: 3 })),
          archived: false,
          notes: chance.bool() ? chance.sentence({ words: chance.integer({ min: 5, max: 15 }) }) : undefined,
        });

        // Update users' taxis arrays to include this taxi
        if (allUsers.length > 0) {
          await User.updateMany({ _id: { $in: allUsers } }, { $addToSet: { taxis: taxi._id } });
        }
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
};

export { seedTenantTaxis };
export default seedTaxis;
