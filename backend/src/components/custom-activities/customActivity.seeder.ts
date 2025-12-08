import CustomActivity, { AssignedCustomActivity } from './customActivity.model';

import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const seedTenantCustomActivity = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await CustomActivity.find();
    } catch (error) {
      throw error;
    }
  });
};

const seedTenantAssignedCustomActivity = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await AssignedCustomActivity.find();
    } catch (error) {
      throw error;
    }
  });
};

const seedCustomActivities = async () => {
  await seedTenantCustomActivity('supercourse');
  await seedTenantCustomActivity('piedpiper');
  await seedTenantCustomActivity('lexis-fls');
};

const seedAssignedCustomActivities = async () => {
  await seedTenantAssignedCustomActivity('supercourse');
  await seedTenantAssignedCustomActivity('piedpiper');
  await seedTenantAssignedCustomActivity('lexis-fls');
};

export { seedTenantCustomActivity, seedAssignedCustomActivities, seedTenantAssignedCustomActivity };
export default seedCustomActivities;
