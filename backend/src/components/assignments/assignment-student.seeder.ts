import { AssignmentForStudent } from './assignment-student.model';

import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const seedTenantAssignmentsForStudents = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await AssignmentForStudent.find({});
    } catch (error) {
      throw error;
    }
  });
};

const seedAssignmentsForStudents = async () => {
  await seedTenantAssignmentsForStudents('supercourse');
  await seedTenantAssignmentsForStudents('piedpiper');
};

export { seedTenantAssignmentsForStudents };
export default seedAssignmentsForStudents;
