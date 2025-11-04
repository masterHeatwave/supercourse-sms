import { AssignmentForStaff } from './assignment-staff.model';

import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const seedTenantAssignmentsForStaff = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await AssignmentForStaff.find({});
    } catch (error) {
      throw error;
    }
  });
};

const seedAssignmentsForStaff = async () => {
  await seedTenantAssignmentsForStaff('supercourse');
  await seedTenantAssignmentsForStaff('piedpiper');
};

export { seedTenantAssignmentsForStaff };
export default seedAssignmentsForStaff;
