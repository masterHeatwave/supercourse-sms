import CustomActivity from './customActivity.model';

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

const seedCustomActivities = async () => {
  await seedTenantCustomActivity('supercourse');
  await seedTenantCustomActivity('piedpiper');
};

export { seedTenantCustomActivity };
export default seedCustomActivities;
