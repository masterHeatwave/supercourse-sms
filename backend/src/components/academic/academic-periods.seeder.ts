import { logger } from '@utils/logger';
import AcademicPeriod from './academic-periods.model';
import AcademicYear from './academic-years.model';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import { markComponentComplete } from '@utils/seedingLogger';

const seedTenantAcademicPeriods = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      logger.info(`[${tenantId}] Starting to seed academic periods...`);

      // Check if any academic periods exist
      const existingCount = await AcademicPeriod.countDocuments();
      if (existingCount > 0) {
        logger.info(`[${tenantId}] Academic periods already exist, skipping seeding`);
        markComponentComplete('academicPeriods', tenantId);
        return;
      }

      // Get the current academic year (prefer manually active, fall back to date-derived)
      let currentAcademicYear = await AcademicYear.findOne({ is_manual_active: true });
      if (!currentAcademicYear) {
        // Fall back to date-derived academic year
        const currentDate = new Date();
        currentAcademicYear = await AcademicYear.findOne({
          start_date: { $lte: currentDate },
          end_date: { $gte: currentDate },
        });
      }
      if (!currentAcademicYear) {
        logger.warn(`[${tenantId}] No current academic year found, cannot seed periods`);
        return;
      }

      const periods = [
        {
          name: 'Fall 2024',
          start_date: new Date('2024-09-01'),
          end_date: new Date('2024-12-31'),
          is_active: true,
        },
        {
          name: 'Spring 2025',
          start_date: new Date('2025-01-01'),
          end_date: new Date('2025-04-30'),
          is_active: true,
        },
        {
          name: 'Summer 2025',
          start_date: new Date('2025-05-01'),
          end_date: new Date('2025-08-31'),
          is_active: true,
        },
      ];

      for (const period of periods) {
        await AcademicPeriod.create({
          ...period,
          academic_year: currentAcademicYear._id,
        });
        logger.debug(`[${tenantId}] Created academic period: ${period.name}`);
      }

      logger.info(`[${tenantId}] Successfully seeded ${periods.length} academic periods`);
      markComponentComplete('academicPeriods', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding academic periods:`, error);
      throw error;
    }
  });
};

const seedAcademicPeriods = async () => {
  await seedTenantAcademicPeriods('supercourse');
};

export { seedTenantAcademicPeriods };
export default seedAcademicPeriods;
