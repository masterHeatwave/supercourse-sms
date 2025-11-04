import { logger } from '@utils/logger';
import bcrypt from 'bcryptjs';
import { config } from '@config/config';
import { IUserType } from './user.interface'; // Added IUser
import Chance from 'chance';
import { generateRandomCode } from '@utils/generateCode';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import User from './user.model';
import Role from '@components/roles/role.model';
import Customer from '@components/customers/customer.model';
import { markComponentComplete } from '@utils/seedingLogger';

const chance = new Chance();

const seedTenantUsers = async (tenantId: string) => {
  await requestContextLocalStorage.run(tenantId, async () => {
    try {
      const existingAdmin = await User.findOne({ email: 'admin@example.com' });
      if (existingAdmin) {
        markComponentComplete('users', tenantId);
        return;
      }

      const adminRole = await Role.findOne({ title: 'ADMIN' });
      const managerRole = await Role.findOne({ title: 'MANAGER' });
      const teacherRole = await Role.findOne({ title: 'TEACHER' });
      const studentRole = await Role.findOne({ title: 'STUDENT' });
      const parentRole = await Role.findOne({ title: 'PARENT' });

      if (!adminRole || !managerRole || !teacherRole || !studentRole || !parentRole) {
        throw new Error(
          `[${tenantId}] Required roles not found. Ensure all 5 roles (ADMIN, MANAGER, TEACHER, STUDENT, PARENT) are seeded for this tenant.`
        );
      }

      const tenantCustomer = await Customer.findOne({ slug: tenantId, is_primary: true });
      if (!tenantCustomer) {
        throw new Error(
          `[${tenantId}] Tenant customer record with slug '${tenantId}' not found. This customer should exist to associate users.`
        );
      }

      const branches = await Customer.find({ parent_customer: tenantCustomer._id, is_primary: false });
      if (!branches.length) {
        throw new Error(
          `[${tenantId}] No branches found for tenant '${tenantId}'. Ensure branches are seeded before users.`
        );
      }

      const adminCode = await generateRandomCode();
      await User.create({
        username: 'admin',
        code: adminCode,
        firstname: 'Admin',
        lastname: 'User',
        email: 'admin@example.com',
        phone: '+301234567890',
        mobile: '+301234567890',
        user_type: IUserType.ADMIN,
        passwordHash: bcrypt.hashSync('password123', 10),
        roles: [adminRole.id, managerRole.id, teacherRole.id, studentRole.id, parentRole.id],
        customers: [tenantCustomer.id],
        branches: branches.map((b) => b.id),
        is_active: true,
      });

      const userTypes = [
        { type: IUserType.MANAGER, role: managerRole, count: 3 },
        { type: IUserType.TEACHER, role: teacherRole, count: 10 },
        { type: IUserType.STUDENT, role: studentRole, count: 30 },
        { type: IUserType.PARENT, role: parentRole, count: 5 },
      ];

      for (const { type, role, count } of userTypes) {
        for (let i = 0; i < count; i++) {
          const firstName = chance.first();
          const lastName = chance.last();
          const email = chance.email({ domain: `${tenantId}.example.com` });
          const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;
          const phone = `+30${chance.string({ length: 10, pool: '0123456789' })}`;

          const existingUser = await User.findOne({ email });
          if (!existingUser) {
            // Randomly assign user to one of the branches
            const randomBranch = branches[Math.floor(Math.random() * branches.length)];

            const userData: any = {
              username,
              code: await generateRandomCode(),
              firstname: firstName,
              lastname: lastName,
              email,
              phone,
              mobile: phone, // Use the same phone number for mobile
              user_type: type,
              passwordHash: bcrypt.hashSync('password123', 10),
              roles: [role.id],
              customers: [tenantCustomer.id],
              branches: [randomBranch.id],
              is_active: true,
            };

            await User.create(userData);
          }
        }
      }
      markComponentComplete('users', tenantId);
    } catch (error) {
      logger.error(`[${tenantId}] Error seeding users:`, error);
      throw error;
    }
  });
};

const seedUsers = async () => {
  try {
    const existingGlobalAdmin = await User.findOne({ email: config.ADMIN_USER.EMAIL });
    if (!existingGlobalAdmin) {
      const globalAdminRole = await Role.findOne({ title: 'ADMIN' });
      if (globalAdminRole) {
        const adminCode = await generateRandomCode();
        await User.create({
          username: 'admin',
          code: adminCode,
          firstname: 'admin',
          lastname: 'admin',
          email: config.ADMIN_USER.EMAIL,
          phone: config.ADMIN_USER.PHONE,
          mobile: config.ADMIN_USER.PHONE,
          internal_number: '001',
          user_type: IUserType.ADMIN,
          passwordHash: bcrypt.hashSync(config.ADMIN_USER.PASSWORD, 10),
          roles: [globalAdminRole._id],
          archived: false,
        });
      } else {
        logger.warn('Global ADMIN role not found, cannot seed global admin user.');
      }
    }
  } catch (error) {
    logger.error('Error seeding global admin user:', error);
  }

  await seedTenantUsers('supercourse');
  await seedTenantUsers('piedpiper');
};

export { seedTenantUsers };
export default seedUsers;
