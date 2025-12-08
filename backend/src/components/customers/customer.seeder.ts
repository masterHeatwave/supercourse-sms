import Customer from './customer.model'; // Assuming CustomerSchema is the name of the schema export
import { CustomerType } from './customer.interface';
import { logger } from '@utils/logger';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import { markComponentComplete } from '@utils/seedingLogger';
import Chance from 'chance';
import { generateRandomCode } from '@utils/generateCode';
import User from '@components/users/user.model';
import { IUserType, IUser } from '@components/users/user.interface';
import bcrypt from 'bcryptjs';
import Role from '@components/roles/role.model';

const chance = new Chance();

const createBranch = async (mainCustomer: any, branchNumber: number, tenantId: string) => {
  let adminUser: IUser | null = null;
  let managerUser: IUser | null = null;

  await requestContextLocalStorage.run(tenantId, async () => {
    // Find roles for this tenant
    const adminRole = await Role.findOne({ title: 'ADMIN' });
    const managerRole = await Role.findOne({ title: 'MANAGER' });

    if (!adminRole || !managerRole) {
      throw new Error(`Required roles (ADMIN, MANAGER) not found. Ensure roles are seeded for tenant ${tenantId}.`);
    }

    // Find the main customer to associate with these users
    const tenantCustomer = await Customer.findOne({ slug: tenantId });
    if (!tenantCustomer) {
      throw new Error(`Customer record with slug '${tenantId}' not found for creating users.`);
    }

    // Add timestamp to ensure email uniqueness
    const timestamp = Date.now();

    // Create a new admin user for this branch
    const adminEmail = `admin.branch${branchNumber}.${timestamp}@${mainCustomer.slug}.com`;
    const adminCode = await generateRandomCode();
    adminUser = await User.create({
      firstname: `Admin${branchNumber}`,
      lastname: `${mainCustomer.name}`,
      email: adminEmail,
      phone: chance.phone(),
      mobile: chance.phone(),
      user_type: IUserType.ADMIN,
      code: adminCode,
      is_active: true,
      passwordHash: bcrypt.hashSync('password123', 10),
      roles: [adminRole.id],
      customers: [tenantCustomer.id],
      branches: [mainCustomer.id],
    });

    // Create a new manager user for this branch
    const managerEmail = `manager.branch${branchNumber}.${timestamp}@${mainCustomer.slug}.com`;
    const managerCode = await generateRandomCode();
    managerUser = await User.create({
      firstname: `Manager${branchNumber}`,
      lastname: `${mainCustomer.name}`,
      email: managerEmail,
      phone: chance.phone(),
      mobile: chance.phone(),
      user_type: IUserType.MANAGER,
      code: managerCode,
      is_active: true,
      passwordHash: bcrypt.hashSync('password123', 10),
      roles: [managerRole.id],
      customers: [tenantCustomer.id],
      branches: [mainCustomer.id],
    });
  });

  const code = await generateRandomCode();

  if (!adminUser || !managerUser) {
    throw new Error('Failed to create admin or manager user');
  }

  return {
    name: `${mainCustomer.name} Branch ${branchNumber}`,
    slug: `${mainCustomer.slug}-branch-${branchNumber}`,
    customer_type: mainCustomer.customer_type,
    is_primary: false,
    is_main_customer: false,
    parent_customer: mainCustomer.id,
    email: `branch${branchNumber}@${mainCustomer.slug}.com`,
    avatar: chance.avatar({ protocol: 'https' }),
    website: `https://branch${branchNumber}.${mainCustomer.slug}.com`,
    nickname: `Branch ${branchNumber}`,
    order: branchNumber,
    administrator: (adminUser as IUser).id,
    manager: (managerUser as IUser).id,
    address: chance.address(),
    phone: chance.phone(),
    code: code,
    vat: chance.ssn().replace(/-/g, ''),
    mapLocation: 'https://maps.google.com/maps?q=37.9838,23.7275&z=15&output=embed',
  };
};

export const seedCustomer = async () => {
  try {
    const tenants = [
      {
        slug: 'supercourse',
        name: 'Supercourse Tenant',
        email: 'contact@supercourse.com',
      },
    ];

    for (const tenant of tenants) {
      // First create the tenant-specific customer
      await requestContextLocalStorage.run(tenant.slug, async () => {
        const tenantSpecificCustomer = await Customer.findOne({ slug: tenant.slug });

        if (!tenantSpecificCustomer) {
          const code = await generateRandomCode();
          const mainCustomer = await Customer.create({
            name: tenant.name,
            slug: tenant.slug,
            customer_type: CustomerType.PRIVATE_SCHOOL,
            is_primary: true,
            is_main_customer: true,
            email: tenant.email,
            address: chance.address(),
            phone: chance.phone(),
            code: code,
            vat: chance.ssn().replace(/-/g, ''),
            mapLocation: 'https://maps.google.com/maps?q=37.9838,23.7275&z=15&output=embed',
          });

          // Create branches after the main customer exists
          for (let i = 1; i <= 3; i++) {
            await Customer.create(await createBranch(mainCustomer, i, tenant.slug));
          }
        }

        markComponentComplete('customers', tenant.slug);
      });
    }

    // Create default customer
    const defaultCustomerSlug = 'default-customer';
    const defaultCustomer = await Customer.findOne({ slug: defaultCustomerSlug });

    if (!defaultCustomer) {
      const code = await generateRandomCode();
      await Customer.create({
        name: 'Default Customer',
        slug: defaultCustomerSlug,
        customer_type: CustomerType.PRIVATE_SCHOOL,
        is_primary: false,
        is_main_customer: false,
        email: 'default@customer.com',
        address: chance.address(),
        phone: chance.phone(),
        code: code,
        vat: chance.ssn().replace(/-/g, ''),
        mapLocation: 'https://maps.google.com/maps?q=37.9838,23.7275&z=15&output=embed',
      });
    }
  } catch (error) {
    logger.error('Error seeding customer(s):', error);
    throw error;
  }
};
