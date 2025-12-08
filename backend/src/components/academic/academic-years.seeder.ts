import { logger } from '@utils/logger';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import AcademicYear from './academic-years.model';
import { markComponentComplete } from '@utils/seedingLogger';

const seedTenantAcademicYears = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      logger.info(`[${tenantId}] Starting to seed academic years...`);

      // Check if any academic years exist
      const existingCount = await AcademicYear.countDocuments();
      if (existingCount > 0) {
        logger.info(`[${tenantId}] Academic years already exist, skipping seeding`);
        markComponentComplete('academicYears', tenantId);
        return;
      }

      // Create multiple academic years
      // The 2024-2025 year is marked as manually active since it contains the current date
      const academicYears = [
        {
          name: '2023-2024',
          start_date: new Date('2023-09-01'),
          end_date: new Date('2024-08-31'),
          is_manual_active: false,
        },
        {
          name: '2024-2025',
          start_date: new Date('2024-09-01'),
          end_date: new Date('2025-08-31'),
          is_manual_active: true, // Mark this as manually active (contains current date)
        },
        {
          name: '2025-2026',
          start_date: new Date('2025-09-01'),
          end_date: new Date('2026-08-31'),
          is_manual_active: false,
        },
      ];

      for (const yearData of academicYears) {
        await AcademicYear.create(yearData);
        logger.debug(`[${tenantId}] Created academic year: ${yearData.name}`);
      }

      logger.info(`[${tenantId}] Successfully seeded ${academicYears.length} academic years`);
      markComponentComplete('academicYears', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding academic years:`, error);
      throw error;
    }
  });
};

const seedAcademicYears = async () => {
  await seedTenantAcademicYears('supercourse');
};

export { seedTenantAcademicYears };
export default seedAcademicYears;
