import { EventEmitter } from 'events';
import { logger } from '@utils/logger';
import { syncStaffMemberAssignments } from './staff-academic-assignments.sync';

// Create a singleton event emitter for staff assignment signals
class StaffAssignmentSignals extends EventEmitter {}
const staffAssignmentSignals = new StaffAssignmentSignals();

// Flag to control whether signals should be processed (useful during seeding)
let signalsEnabled = true;

export const disableSignals = () => {
  signalsEnabled = false;
  logger.debug('Staff assignment signals disabled');
};

export const enableSignals = () => {
  signalsEnabled = true;
  logger.debug('Staff assignment signals enabled');
};

// Signal types
export enum StaffAssignmentSignalType {
  USER_CREATED = 'user:created',
  USER_UPDATED = 'user:updated',
  USER_ROLES_CHANGED = 'user:roles_changed',
  USER_BRANCHES_CHANGED = 'user:branches_changed',
  USER_TAXIS_CHANGED = 'user:taxis_changed',
  CUSTOMER_UPDATED = 'customer:updated', // When branch details change
  TAXI_CREATED = 'taxi:created',
  TAXI_UPDATED = 'taxi:updated',
  TAXI_DELETED = 'taxi:deleted',
}

// Signal payload interfaces
export interface UserSignalPayload {
  userId: string;
  userType: string;
  previousData?: {
    roles?: string[];
    branches?: string[];
    taxis?: string[];
  };
  currentData?: {
    roles?: string[];
    branches?: string[];
    taxis?: string[];
  };
}

export interface CustomerSignalPayload {
  customerId: string;
  affectedStaffIds?: string[];
}

export interface TaxiSignalPayload {
  taxiId: string;
  branchId?: string;
  academicYear?: string;
  academicPeriod?: string;
  affectedStaffIds?: string[];
}

// Signal handlers
const handleUserSignal = async (payload: UserSignalPayload) => {
  if (!signalsEnabled) {
    return; // Skip processing during seeding
  }

  try {
    logger.debug(`Processing staff assignment signal for user ${payload.userId}`);
    await syncStaffMemberAssignments(payload.userId);
  } catch (error) {
    logger.error(`Error handling user signal for ${payload.userId}:`, error);
  }
};

const handleCustomerSignal = async (payload: CustomerSignalPayload) => {
  if (!signalsEnabled) {
    return; // Skip processing during seeding
  }

  try {
    if (payload.affectedStaffIds && payload.affectedStaffIds.length > 0) {
      logger.debug(`Processing customer signal affecting ${payload.affectedStaffIds.length} staff members`);

      // Sync assignments for all affected staff
      for (const staffId of payload.affectedStaffIds) {
        await syncStaffMemberAssignments(staffId);
      }
    }
  } catch (error) {
    logger.error(`Error handling customer signal for ${payload.customerId}:`, error);
  }
};

const handleTaxiSignal = async (payload: TaxiSignalPayload) => {
  if (!signalsEnabled) {
    return; // Skip processing during seeding
  }

  try {
    if (payload.affectedStaffIds && payload.affectedStaffIds.length > 0) {
      logger.debug(`Processing taxi signal affecting ${payload.affectedStaffIds.length} staff members`);

      // Sync assignments for all affected staff
      for (const staffId of payload.affectedStaffIds) {
        await syncStaffMemberAssignments(staffId);
      }
    }
  } catch (error) {
    logger.error(`Error handling taxi signal for ${payload.taxiId}:`, error);
  }
};

// Register signal handlers
staffAssignmentSignals.on(StaffAssignmentSignalType.USER_CREATED, handleUserSignal);
staffAssignmentSignals.on(StaffAssignmentSignalType.USER_UPDATED, handleUserSignal);
staffAssignmentSignals.on(StaffAssignmentSignalType.USER_ROLES_CHANGED, handleUserSignal);
staffAssignmentSignals.on(StaffAssignmentSignalType.USER_BRANCHES_CHANGED, handleUserSignal);
staffAssignmentSignals.on(StaffAssignmentSignalType.USER_TAXIS_CHANGED, handleUserSignal);
staffAssignmentSignals.on(StaffAssignmentSignalType.CUSTOMER_UPDATED, handleCustomerSignal);
staffAssignmentSignals.on(StaffAssignmentSignalType.TAXI_CREATED, handleTaxiSignal);
staffAssignmentSignals.on(StaffAssignmentSignalType.TAXI_UPDATED, handleTaxiSignal);
staffAssignmentSignals.on(StaffAssignmentSignalType.TAXI_DELETED, handleTaxiSignal);

// Utility functions to emit signals
export const emitUserSignal = (type: StaffAssignmentSignalType, payload: UserSignalPayload) => {
  staffAssignmentSignals.emit(type, payload);
};

export const emitCustomerSignal = (type: StaffAssignmentSignalType, payload: CustomerSignalPayload) => {
  staffAssignmentSignals.emit(type, payload);
};

export const emitTaxiSignal = (type: StaffAssignmentSignalType, payload: TaxiSignalPayload) => {
  staffAssignmentSignals.emit(type, payload);
};

export default staffAssignmentSignals;
