import { logger } from '@utils/logger';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import StaffAcademicAssignment from './staff-academic-assignments.model';
import User from '@components/users/user.model';
import AcademicYear from '@components/academic/academic-years.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import Customer from '@components/customers/customer.model';
import { IUserType } from '@components/users/user.interface';
import { AcademicYearService } from '@components/academic/academic-years.service';

// Import signals to ensure they are initialized
import './staff-academic-assignments.signals';

/**
 * Utility function to create or update assignments for a specific staff member
 * This is useful when a staff member's roles or branches are updated
 */
const syncStaffMemberAssignments = async (staffMemberId: string) => {
  const currentTenant = requestContextLocalStorage.getStore();
  await requestContextLocalStorage.run(currentTenant, async () => {
    try {
      logger.debug(`[${currentTenant}] Syncing assignments for staff member: ${staffMemberId}`);

      // Check current tenant context
      const staffMember = await User.findById(staffMemberId).populate('roles').populate('branches').populate('taxis');

      if (!staffMember) {
        logger.warn(`[${currentTenant}] Staff member with ID ${staffMemberId} not found`);
        return;
      }

      // Get current academic year using the dual-state logic
      const academicYearService = new AcademicYearService();
      let currentAcademicYear = await academicYearService.getCurrentAcademicYear();

      if (!currentAcademicYear) {
        logger.warn('No academic year found, cannot sync staff assignments');
        return;
      }

      const activePeriods = await AcademicPeriod.find({
        academic_year: currentAcademicYear._id,
        is_active: true,
        end_date: { $gte: new Date() }, // Only future or current periods
      });

      if (!activePeriods.length) {
        logger.debug('No active academic periods found for assignment sync');
        return;
      }

      const primaryRole = staffMember.roles && staffMember.roles.length > 0 ? staffMember.roles[0] : null;

      if (!primaryRole) {
        logger.warn(`Staff member ${staffMember.email} has no roles, cannot create assignments`);
        return;
      }

      if (!staffMember.branches || !staffMember.branches.length) {
        logger.warn(`Staff member ${staffMember.email} has no branches, cannot create assignments`);
        return;
      }

      // Update or create assignments for active periods
      for (const period of activePeriods) {
        const existingAssignment = await StaffAcademicAssignment.findOne({
          staff_member: staffMemberId,
          academic_period: period._id,
          academic_year: currentAcademicYear._id,
        });

        // Get classes/taxis assigned to this staff member for this period
        const assignedTaxis = staffMember.taxis || [];
        const classes = assignedTaxis.map((taxi: any) => taxi._id?.toString() || taxi.toString());

        const assignmentData = {
          role: primaryRole._id,
          role_title: primaryRole.title,
          branches: staffMember.branches.map((branch: any) => branch._id),
          classes,
          is_active: staffMember.is_active,
          notes:
            existingAssignment?.notes || `Auto-synced assignment for ${staffMember.firstname} ${staffMember.lastname}`,
        };

        if (existingAssignment) {
          // Update existing assignment
          await StaffAcademicAssignment.findByIdAndUpdate(existingAssignment._id, assignmentData, { new: true });
          logger.debug(`Updated assignment for ${staffMember.email} in period ${period.name}`);
        } else {
          // Create new assignment
          const newAssignment = await StaffAcademicAssignment.create({
            staff_member: staffMemberId,
            academic_year: currentAcademicYear._id,
            academic_period: period._id,
            start_date: period.start_date,
            end_date: period.end_date,
            ...assignmentData,
          });
          logger.debug(
            `Created new assignment for ${staffMember.email} in period ${period.name} (ID: ${newAssignment._id})`
          );
        }
      }

      logger.info(`Successfully synced assignments for staff member ${staffMember.email}`);
    } catch (error) {
      logger.error(`Error syncing assignments for staff member ${staffMemberId}:`, error);
      throw error;
    }
  });
};

/**
 * Utility function to create assignments for all existing staff when a new academic period is created
 */
const syncAllStaffForNewPeriod = async (periodId: string, academicYearId: string) => {
  try {
    // Check current tenant context
    const currentTenant = requestContextLocalStorage.getStore();
    logger.debug(`Creating staff assignments for new period ${periodId} in tenant context: ${currentTenant}`);

    logger.info(`Creating staff assignments for new academic period: ${periodId}`);

    // Get all active staff members
    const staffMembers = await User.find({
      user_type: { $in: [IUserType.ADMIN, IUserType.MANAGER, IUserType.TEACHER] },
      is_active: true,
    })
      .populate('roles')
      .populate('branches')
      .populate('taxis');

    if (!staffMembers.length) {
      logger.debug('No staff members found to create assignments for new period');
      return;
    }

    // Get the academic period details
    const academicPeriod = await AcademicPeriod.findById(periodId);
    if (!academicPeriod) {
      logger.warn(`Academic period ${periodId} not found`);
      return;
    }

    let assignmentsCreated = 0;

    // Create assignments for each staff member
    for (const staffMember of staffMembers) {
      if (!staffMember.roles || !staffMember.roles.length) {
        logger.debug(`Staff member ${staffMember.email} has no roles, skipping assignment for new period`);
        continue;
      }

      if (!staffMember.branches || !staffMember.branches.length) {
        logger.debug(`Staff member ${staffMember.email} has no branches, skipping assignment for new period`);
        continue;
      }

      // Check if assignment already exists for this period
      const existingAssignment = await StaffAcademicAssignment.findOne({
        staff_member: staffMember._id,
        academic_period: periodId,
        academic_year: academicYearId,
      });

      if (existingAssignment) {
        logger.debug(`Assignment already exists for ${staffMember.email} in period ${academicPeriod.name}`);
        continue;
      }

      const primaryRole = staffMember.roles[0];

      // Get classes/taxis assigned to this staff member
      const assignedTaxis = staffMember.taxis || [];
      const classes = assignedTaxis.map((taxi: any) => taxi._id?.toString() || taxi.toString());

      try {
        await StaffAcademicAssignment.create({
          staff_member: staffMember._id,
          academic_year: academicYearId,
          academic_period: periodId,
          role: primaryRole._id,
          role_title: primaryRole.title,
          branches: staffMember.branches.map((branch: any) => branch._id),
          classes,
          start_date: academicPeriod.start_date,
          end_date: academicPeriod.end_date,
          is_active: true,
          notes: `Auto-generated assignment for new period ${academicPeriod.name}`,
        });

        assignmentsCreated++;
        logger.debug(`Created assignment for ${staffMember.email} in new period ${academicPeriod.name}`);
      } catch (error) {
        logger.error(`Error creating assignment for ${staffMember.email} in new period:`, error);
        // Continue with other assignments even if one fails
      }
    }

    logger.info(
      `Successfully created ${assignmentsCreated} staff assignments for new academic period ${academicPeriod.name}`
    );
  } catch (error) {
    logger.error(`Error syncing all staff for new period ${periodId}:`, error);
    throw error;
  }
};

/**
 * Utility function to sync all staff members for a tenant after seeding is complete
 * This ensures all staff have proper assignments when initial seeding is done
 */
const syncAllStaffAssignments = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      logger.info(`[${tenantId}] Starting final sync of all staff academic assignments...`);

      // Get all users (not just staff) to filter properly
      const allUsers = await User.find({
        is_active: true,
      })
        .populate('roles')
        .populate('branches')
        .populate('taxis');

      if (!allUsers.length) {
        logger.info(`[${tenantId}] No users found for final sync`);
        return;
      }

      // Filter for staff members only
      const staffMembers = allUsers;

      if (!staffMembers.length) {
        logger.info(`[${tenantId}] No staff members found for final sync (found ${allUsers.length} total users)`);
        return;
      }

      logger.info(
        `[${tenantId}] Found ${staffMembers.length} staff members to sync (out of ${allUsers.length} total users)`
      );

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const staffMember of staffMembers) {
        try {
          logger.debug(`[${tenantId}] Processing staff member: ${staffMember.email} (${staffMember.user_type})`);
          logger.debug(
            `[${tenantId}] - Roles: ${staffMember.roles?.length || 0}, Branches: ${staffMember.branches?.length || 0}, Taxis: ${staffMember.taxis?.length || 0}`
          );

          // Check if staff member has required data
          if (!staffMember.roles || !staffMember.roles.length) {
            logger.warn(`[${tenantId}] Skipping ${staffMember.email}: No roles assigned`);
            skippedCount++;
            continue;
          }

          if (!staffMember.branches || !staffMember.branches.length) {
            logger.warn(`[${tenantId}] Skipping ${staffMember.email}: No branches assigned`);
            skippedCount++;
            continue;
          }

          await syncStaffMemberAssignments((staffMember as any)._id.toString());
          logger.info(`[${tenantId}] ✓ Successfully synced assignments for ${staffMember.email}`);
          successCount++;
        } catch (error) {
          logger.error(`[${tenantId}] ✗ Error syncing assignments for ${staffMember.email}:`, error);
          errorCount++;
        }
      }

      logger.info(
        `[${tenantId}] Final staff assignment sync completed: ${successCount} successful, ${errorCount} errors, ${skippedCount} skipped`
      );
    } catch (error) {
      logger.error(`[${tenantId}] Error in final staff assignment sync:`, error);
      throw error;
    }
  });
};

/**
 * Utility function to sync all staff members across all tenants after initial seeding is complete
 * This ensures all staff have proper assignments when initial seeding is done
 */
const syncAllStaffAssignmentsAllTenants = async () => {
  try {
    logger.info('Starting final sync of staff academic assignments for all tenants...');

    // Get all main customers (tenants)
    const tenants = await Customer.find({ is_main_customer: true });

    if (!tenants.length) {
      logger.warn('No tenants found for staff assignment sync');
      return;
    }

    logger.info(`Found ${tenants.length} tenants to sync: ${tenants.map((t: any) => t.slug).join(', ')}`);

    for (const tenant of tenants) {
      try {
        logger.info(`[${tenant.slug}] Starting sync for tenant...`);

        // Run sync for this specific tenant
        await requestContextLocalStorage.run(tenant.slug, async () => {
          await syncAllStaffAssignments(tenant.slug);
        });

        // Note: Individual counts are logged within syncAllStaffAssignments
      } catch (error) {
        logger.error(`[${tenant.slug}] Error syncing staff assignments for tenant:`, error);
      }
    }

    logger.info(`Completed final sync across all ${tenants.length} tenants`);
  } catch (error) {
    logger.error('Error in final staff assignment sync for all tenants:', error);
    throw error;
  }
};

export {
  syncStaffMemberAssignments,
  syncAllStaffForNewPeriod,
  syncAllStaffAssignments,
  syncAllStaffAssignmentsAllTenants,
};
