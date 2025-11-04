import { logger } from '@utils/logger';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import Permission from '@components/permissions/permission.model';
import Role from './role.model';
import { markComponentComplete } from '@utils/seedingLogger';

// Helper function to create roles with the given permissions
const createRoles = async (permissions: any[]) => {
  const roles = [
    {
      title: 'ADMIN',
      description: 'Administrator with full access',
      permissions: permissions.map((p) => p._id),
    },
    {
      title: 'MANAGER',
      description: 'Manager with access to management features',
      permissions: permissions
        .filter((p) => p.name.includes('customer') || p.name.includes('user') || p.name.includes('branch'))
        .map((p) => p._id),
    },
    {
      title: 'TEACHER',
      description: 'Teacher with access to teaching related features',
      permissions: permissions
        .filter((p) => p.name.includes('session') || p.name.includes('course') || p.name.includes('student'))
        .map((p) => p._id),
    },
    {
      title: 'STUDENT',
      description: 'Student with access to student related features',
      permissions: permissions.filter((p) => p.name.includes('session') || p.name.includes('course')).map((p) => p._id),
    },
    {
      title: 'PARENT',
      description: 'Parent/Guardian with access to child-related features',
      permissions: permissions
        .filter((p) => p.name.includes('student') || p.name.includes('session'))
        .map((p) => p._id),
    },
  ];

  for (const role of roles) {
    const existingRole = await Role.findOne({ title: role.title });
    if (!existingRole) {
      await Role.create(role);
    } else {
      await Role.findOneAndUpdate(
        { title: role.title },
        { description: role.description, permissions: role.permissions },
        { new: true }
      );
    }
  }
};

export const seedTenantRoles = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const allPermissions = await Permission.find({});

      await createRoles(allPermissions);

      markComponentComplete('roles', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding roles for tenant:`, error);
      throw error;
    }
  });
};

const seedRoles = async () => {
  // First create global roles (outside any tenant context)
  try {
    const allPermissions = await Permission.find({});
    await createRoles(allPermissions);
    logger.info('Global roles seeded successfully');
  } catch (error) {
    logger.error('Error seeding global roles:', error);
  }

  // Then create tenant-specific roles
  await seedTenantRoles('supercourse');
  await seedTenantRoles('piedpiper');
};

export default seedRoles;
