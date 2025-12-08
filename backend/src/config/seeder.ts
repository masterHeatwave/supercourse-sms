import permissionService from '@components/permissions/permission.service';
import seedRoles, { seedTenantRoles } from '@components/roles/role.seeder';
import seedUsers, { seedTenantUsers } from '@components/users/user.seeder';
import { seedCustomer } from '@components/customers/customer.seeder';
import seedAcademicYears, { seedTenantAcademicYears } from '@components/academic/academic-years.seeder';
import seedAcademicPeriods, { seedTenantAcademicPeriods } from '@components/academic/academic-periods.seeder';
import seedClassrooms, { seedTenantClassrooms } from '@components/classrooms/classroom.seeder';
import seedTaxis, { seedTenantTaxis } from '@components/taxi/taxi.seeder';
import seedSessions, { seedTenantSessions } from '@components/sessions/session.seeder';
import seedAbsences, { seedTenantAbsences } from '@components/absences/absence.seeder';
import seedPosts, { seedTenantPosts } from '@components/posts/post.seeder';
import seedInventory, { seedTenantInventory } from '@components/inventory/inventory.seeder';
import seedMessaging, { seedTenantMessaging } from '@components/messaging/messaging.seeder';
import { logger } from '@utils/logger';
import { requestContextLocalStorage } from './asyncLocalStorage';
import {
  syncAllStaffAssignments,
  disableSignals,
  enableSignals,
  syncAllStaffAssignmentsAllTenants,
} from '@components/staff-academic-assignments';
import seedAssignmentsForStaff, {
  seedTenantAssignmentsForStaff,
} from '@components/assignments/assignment-staff.seeder';
import seedAssignmentsForStudents, {
  seedTenantAssignmentsForStudents,
} from '@components/assignments/assignment-student.seeder';
import seedMoods, {
  seedMoodVideos,
  seedTenantMoods,
  seedTenantMoodVideos,
} from '@components/wellness-center/mood.seeder';
// import seedEbookBookmarks, { seedTenantEbookBookmarks } from '@components/bookmarks/bookmark.seeder';
import seedCustomActivities, {
  seedTenantCustomActivity,
  seedAssignedCustomActivities,
  seedTenantAssignedCustomActivity,
} from '@components/custom-activities/customActivity.seeder';
import seedEbookBookmarks, { seedTenantEbookBookmarks } from '@components/ebooks/bookmarks/bookmark.seeder';
import seedEbookNotes, { seedTenantEbookNotes } from '@components/ebooks/notes/note.seeder';
import seedStorage, { seedTenantStorage } from '@components/storage/storage.seeder';

/**
 * Seeds all tenant-specific data for a new customer/tenant
 * This function is called when a new school/customer is created
 * Note: This function assumes it's called within a tenant context
 */
export const seedNewTenant = async (
  tenantId: string,
  options: { skipAcademic?: boolean; skipUsers?: boolean } = {}
) => {
  try {
    logger.info(`Starting comprehensive seeding process for new tenant: ${tenantId}`);

    // Disable staff assignment signals during seeding to prevent premature sync attempts
    disableSignals();

    // Seed in the correct order to handle dependencies
    await seedTenantRoles(tenantId);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay for dependencies

    // Seed academic structure before users so assignment hooks can work properly
    if (!options.skipAcademic) {
      await seedTenantAcademicYears(tenantId);
      await seedTenantAcademicPeriods(tenantId);
      // Add a brief delay to ensure academic data is fully committed
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      logger.info(`[${tenantId}] Skipping academic seeding (years/periods) by configuration`);
    }

    // Now seed users - the assignment hooks will work because academic years/periods exist
    if (!options.skipUsers) {
      await seedTenantUsers(tenantId);
    } else {
      logger.info(`[${tenantId}] Skipping user seeding by configuration`);
    }

    await seedTenantClassrooms(tenantId);
    await seedTenantTaxis(tenantId);
    await seedTenantSessions(tenantId);
    await seedTenantAbsences(tenantId);
    await seedTenantPosts(tenantId);
    // Inventory seeding (consolidated: replaces Assets and E‑Library)
    await seedTenantInventory(tenantId);
    await seedTenantMessaging(tenantId);
    await seedTenantAssignmentsForStaff(tenantId);
    await seedTenantAssignmentsForStudents(tenantId);
    await seedTenantMoods(tenantId);
    await seedTenantMoodVideos(tenantId);
    await seedTenantCustomActivity(tenantId);
    await seedTenantEbookBookmarks(tenantId);
    await seedTenantEbookNotes(tenantId);
    await seedTenantStorage(tenantId);
    await seedTenantAssignedCustomActivity(tenantId);

    // Final step: Sync all staff academic assignments now that everything is seeded
    logger.info(`[${tenantId}] Starting final sync of staff academic assignments...`);
    try {
      await syncAllStaffAssignments(tenantId);
      logger.info(`[${tenantId}] Final sync completed successfully`);
    } catch (error) {
      logger.error(`[${tenantId}] Error in final sync:`, error);
    }

    // Re-enable signals for normal operation
    enableSignals();

    // Note: Staff academic assignments are now created automatically via user model hooks

    logger.info(`Comprehensive database seeding completed successfully for tenant: ${tenantId}`);
  } catch (error) {
    logger.error(`Error seeding database for tenant ${tenantId}:`, error);
    throw error;
  }
};

/**
 * Seeds all tenant-specific data for a new customer/tenant with its own context
 * This function creates its own tenant context
 */
export const seedNewTenantWithContext = async (
  tenantId: string,
  options: { skipAcademic?: boolean; skipUsers?: boolean } = {}
) => {
  try {
    logger.info(`Starting seeding process for new tenant: ${tenantId}`);

    await requestContextLocalStorage.run(tenantId, async () => {
      await seedNewTenant(tenantId, options);
    });

    logger.info(`Database seeding completed successfully for tenant: ${tenantId}`);
  } catch (error) {
    logger.error(`Error seeding database for tenant ${tenantId}:`, error);
    throw error;
  }
};

export const seedDatabase = async () => {
  try {
    // Disable staff assignment signals during initial seeding
    disableSignals();

    const permissions = permissionService.getAllPermissions(process.cwd() + '/src/components');
    await permissionService.registerAllPermissions(permissions);

    await seedRoles();
    await seedCustomer();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await seedAcademicYears();
    await seedAcademicPeriods();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await seedUsers();
    await seedClassrooms();
    await seedTaxis();
    await seedSessions();
    await seedAbsences();
    await seedPosts();
    await seedInventory();
    await seedMessaging();
    await seedAssignmentsForStaff();
    await seedAssignmentsForStudents();
    await seedMoods();
    await seedMoodVideos();
    await seedCustomActivities();
    await seedEbookBookmarks();
    await seedEbookNotes();
    await seedStorage();
    await seedAssignedCustomActivities();

    // Final step: Sync all staff academic assignments for all tenants
    await syncAllStaffAssignmentsAllTenants();

    // Re-enable signals for normal operation
    enableSignals();
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
};
