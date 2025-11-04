/**
 * Staff Academic Assignments Module
 *
 * This module provides automatic synchronization of staff academic assignments
 * based on changes to users, customers (branches), and taxis (classes).
 *
 * The module uses a signal-based architecture where:
 * - User model emits signals when staff members are created/updated
 * - Customer model emits signals when branch details change
 * - Taxi model emits signals when class details change
 *
 * These signals are then handled by the sync functions to update
 * staff academic assignments accordingly.
 */

// Import all components to ensure signals are registered
import './staff-academic-assignments.signals';
import './staff-academic-assignments.sync';
import './staff-academic-assignments.model';

export {
  syncStaffMemberAssignments,
  syncAllStaffForNewPeriod,
  syncAllStaffAssignments,
  syncAllStaffAssignmentsAllTenants,
} from './staff-academic-assignments.sync';
export { disableSignals, enableSignals } from './staff-academic-assignments.signals';
export { default as StaffAcademicAssignment } from './staff-academic-assignments.model';
export type { IStaffAcademicAssignment } from './staff-academic-assignments.interface';
