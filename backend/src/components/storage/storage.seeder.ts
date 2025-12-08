import StorageFile from '@components/storage/storage-file.model';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const seedTenantStorage = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      await StorageFile.create();
    } catch (error) {
      throw error;
    }
  });
};

const seedStorage = async () => {
  await seedTenantStorage('supercourse');
  await seedTenantStorage('piedpiper');
};

export { seedTenantStorage };
export default seedStorage;
