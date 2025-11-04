import { IInternalUserCreateDTO, IUser, IInternalSchoolCreateDTO, IBranchCreateDTO, IUserType } from './user.interface';
import User from './user.model';
import Customer from '@components/customers/customer.model';
import { ICustomer } from '@components/customers/customer.interface';
import Role from '@components/roles/role.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@config/config';
import { ErrorResponse } from '@utils/errorResponse';
import { seedNewTenant } from '@config/seeder';
import { logger } from '@utils/logger';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const sanitizeDbName = (slug: string): string => {
  return slug.toLowerCase().replace(/[/."$ ]/g, '_');
};

export class InternalService {
  async createUser(userData: IInternalUserCreateDTO): Promise<{ user: IUser; token: string }> {
    const emailExists = await User.findOne({ email: userData.email });
    if (emailExists) {
      throw new ErrorResponse('Email already exists', 400);
    }
    const usernameExists = await User.findOne({ username: userData.username });
    if (usernameExists) {
      throw new ErrorResponse('Username already exists', 400);
    }
    const phoneExists = await User.findOne({ phone: userData.phone });
    if (phoneExists) {
      throw new ErrorResponse('Phone number already exists', 400);
    }

    if (!userData.roles || userData.roles.length === 0) {
      const studentRole = await Role.findOne({ title: 'Student' });
      if (!studentRole) {
        throw new ErrorResponse('Default role not found', 500);
      }
      userData.roles = [studentRole.id];
    }

    const userToCreate = {
      username: userData.username,
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      phone: userData.phone,
      mobile: userData.phone, // Use phone as mobile if not provided separately
      city: userData.city,
      country: userData.country,
      address: userData.address,
      zipcode: userData.zipcode,
      birthday: userData.birthday,
      is_active: userData.is_active !== undefined ? userData.is_active : true,
      passwordHash: bcrypt.hashSync(userData.password, 10),
      roles: userData.roles,
      customers: userData.customers || [],
    };
    const savedUser = await User.create(userToCreate);

    const token = jwt.sign({ id: savedUser._id }, config.JWT_SECRET, { expiresIn: '1h' });
    return { user: savedUser, token };
  }

  async createSchool(
    schoolData: IInternalSchoolCreateDTO
  ): Promise<{ mainCustomer: ICustomer; branchCustomer: ICustomer; user: IUser }> {
    const mainCustomerExists = await Customer.findOne({ slug: schoolData.main_customer.slug });
    if (mainCustomerExists) {
      throw new ErrorResponse(`Main customer slug '${schoolData.main_customer.slug}' already exists`, 400);
    }
    const branchCustomerExists = await Customer.findOne({ slug: schoolData.branch_customer.slug });
    if (branchCustomerExists) {
      throw new ErrorResponse(`Branch customer slug '${schoolData.branch_customer.slug}' already exists`, 400);
    }
    if (schoolData.main_customer.slug === schoolData.branch_customer.slug) {
      throw new ErrorResponse('Main customer slug and branch customer slug cannot be the same', 400);
    }
    const emailExists = await User.findOne({ email: schoolData.user.email });
    if (emailExists) {
      throw new ErrorResponse(`User email '${schoolData.user.email}' already exists globally`, 400);
    }
    const usernameExists = await User.findOne({ username: schoolData.user.username });
    if (usernameExists) {
      throw new ErrorResponse(`Username '${schoolData.user.username}' already exists globally`, 400);
    }
    const phoneExists = await User.findOne({ phone: schoolData.user.phone });
    if (phoneExists) {
      throw new ErrorResponse(`Phone number '${schoolData.user.phone}' already exists globally`, 400);
    }

    let mainCustomerInMainDb: ICustomer | null = null;
    let branchCustomerInMainDb: ICustomer | null = null;
    let userInTenantCollections: IUser | null = null;

    const tenantId = sanitizeDbName(schoolData.main_customer.slug);

    try {
      mainCustomerInMainDb = await Customer.create({
        ...schoolData.main_customer,
        is_main_customer: true,
      });

      branchCustomerInMainDb = await Customer.create({
        ...schoolData.branch_customer,
        parent_customer: mainCustomerInMainDb?._id,
        is_main_customer: false,
      });

      await requestContextLocalStorage.run(tenantId, async () => {
        logger.info(`[${tenantId}] Starting setup for new tenant.`);

        const tenantMainCustomerData = {
          ...schoolData.main_customer,
          is_main_customer: true,
          is_primary: true,
        };
        delete (tenantMainCustomerData as any)._id; // Remove ID for new creation
        const savedTenantMainCustomer = await Customer.create(tenantMainCustomerData);

        const tenantBranchCustomerData = {
          ...schoolData.branch_customer,
          parent_customer: savedTenantMainCustomer._id,
          is_main_customer: false,
          is_primary: false,
        };
        delete (tenantBranchCustomerData as any)._id;
        const savedTenantBranchCustomer = await Customer.create(tenantBranchCustomerData);

        logger.info(`[${tenantId}] Starting comprehensive database seeding...`);
        await seedNewTenant(tenantId);
        logger.info(`[${tenantId}] Comprehensive database seeding complete.`);

        const adminRoleInTenant = await Role.findOne({ title: 'ADMIN' });
        if (!adminRoleInTenant) {
          throw new ErrorResponse(`[${tenantId}] ADMIN role not found after seeding. Critical error.`, 500);
        }

        const newUserTenantData = {
          ...schoolData.user,
          mobile: schoolData.user.phone, // Add mobile field using phone number
          passwordHash: bcrypt.hashSync(schoolData.user.password, 10),
          roles: [adminRoleInTenant._id],
          customers: [savedTenantBranchCustomer._id],
          is_active: true,
          user_type: IUserType.ADMIN,
        };
        delete (newUserTenantData as any)._id;
        userInTenantCollections = await User.create(newUserTenantData);
        logger.info(`[${tenantId}] Admin user created successfully.`);
      });

      if (!userInTenantCollections) {
        throw new ErrorResponse(
          `[${tenantId}] Failed to create user in tenant collections, but no specific error was caught.`,
          500
        );
      }

      return {
        mainCustomer: mainCustomerInMainDb!,
        branchCustomer: branchCustomerInMainDb!,
        user: userInTenantCollections!,
      };
    } catch (error) {
      logger.error(`Error during school creation process for tenant '${tenantId}':`, error);

      if (branchCustomerInMainDb) await Customer.deleteOne({ _id: branchCustomerInMainDb._id });
      if (mainCustomerInMainDb) await Customer.deleteOne({ _id: mainCustomerInMainDb._id });

      try {
        await requestContextLocalStorage.run(tenantId, async () => {
          logger.warn(`[${tenantId}] Attempting cleanup in tenant-specific collections...`);
          await Customer.deleteOne({ slug: schoolData.main_customer.slug });
          await Customer.deleteOne({ slug: schoolData.branch_customer.slug });

          await User.deleteOne({ username: schoolData.user.username });

          logger.info(`[${tenantId}] Cleanup attempt finished for tenant-specific collections.`);
        });
      } catch (cleanupError) {
        logger.error(`[${tenantId}] Failed during cleanup of tenant-specific collections:`, cleanupError);
      }

      if (error instanceof ErrorResponse) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ErrorResponse(`Failed to create school. Tenant: '${tenantId}'. Error: ${errorMessage}`, 500);
    }
  }

  async createBranch(branchData: IBranchCreateDTO): Promise<{ branchCustomer: ICustomer }> {
    // Find parent customer in SMS system using scap_id that matches parent_supercourse_customer_id
    let parentCustomer = await Customer.findOne({
      is_main_customer: true,
      scap_id: branchData.parent_supercourse_customer_id,
    });

    // Fallback: If scap_id lookup fails, try to find by extracting the base name from branch name
    // This handles existing customers that don't have scap_id set
    if (!parentCustomer) {
      const branchName = branchData.branch_customer.name;
      const baseName = branchName.replace(' - Branch', ''); // Remove " - Branch" suffix to get parent name

      parentCustomer = await Customer.findOne({
        is_main_customer: true,
        name: baseName,
      });

      if (parentCustomer) {
        logger.warn(
          `Found parent customer '${baseName}' by name fallback. Consider updating scap_id field for customer ${parentCustomer._id}`
        );
      }
    }

    if (!parentCustomer) {
      // Debug: List all main customers to understand what's in the database
      const allMainCustomers = await Customer.find({ is_main_customer: true }).select('name slug scap_id');
      logger.error(
        `Parent customer with supercourse ID '${branchData.parent_supercourse_customer_id}' not found. Available main customers:`,
        allMainCustomers.map((c) => ({ name: c.name, slug: c.slug, scap_id: c.scap_id }))
      );

      throw new ErrorResponse(
        `Parent customer with supercourse ID '${branchData.parent_supercourse_customer_id}' not found`,
        400
      );
    }

    // Check if branch already exists by supercourse_sub_customer_id first (most reliable)
    const existingBranchBySubCustomerId = await Customer.findOne({
      supercourse_sub_customer_id: branchData.supercourse_sub_customer_id,
      is_main_customer: false,
    });

    if (existingBranchBySubCustomerId) {
      logger.info(`Branch for supercourse sub-customer '${branchData.supercourse_sub_customer_id}' already exists`);
      return { branchCustomer: existingBranchBySubCustomerId };
    }

    // Check if branch slug already exists
    const existingBranchBySlug = await Customer.findOne({
      slug: branchData.branch_customer.slug,
      is_main_customer: false,
    });

    if (existingBranchBySlug) {
      // If slug exists but for different sub-customer, generate a unique slug
      const timestamp = Date.now();
      const uniqueSlug = `${branchData.branch_customer.slug}-${timestamp}`;
      logger.warn(
        `Branch slug '${branchData.branch_customer.slug}' already exists for different sub-customer. Using unique slug: ${uniqueSlug}`
      );
      branchData.branch_customer.slug = uniqueSlug;
      branchData.branch_customer.name = `${branchData.branch_customer.name} (${timestamp})`;
    }

    const tenantId = sanitizeDbName(parentCustomer.slug);
    let branchCustomerInMainDb: ICustomer | null = null;

    try {
      // Create branch customer in main database
      branchCustomerInMainDb = await Customer.create({
        ...branchData.branch_customer,
        parent_customer: parentCustomer._id,
        is_main_customer: false,
        supercourse_sub_customer_id: branchData.supercourse_sub_customer_id,
      });

      // Create branch in parent's tenant database (not its own tenant)
      await requestContextLocalStorage.run(tenantId, async () => {
        logger.info(`[${tenantId}] Creating branch customer in parent's tenant database`);

        // Check if branch already exists in tenant database
        const existingTenantBranch = await Customer.findOne({
          slug: branchData.branch_customer.slug,
        });

        if (!existingTenantBranch) {
          await Customer.create({
            ...branchData.branch_customer,
            parent_customer: parentCustomer._id,
            is_main_customer: false,
            supercourse_sub_customer_id: branchData.supercourse_sub_customer_id,
          });
          logger.info(`[${tenantId}] Branch customer created successfully in parent's tenant`);
        } else {
          logger.info(`[${tenantId}] Branch customer already exists in tenant database`);
        }
      });

      return { branchCustomer: branchCustomerInMainDb as ICustomer };
    } catch (error) {
      logger.error(
        `Error during branch creation for supercourse sub-customer '${branchData.supercourse_sub_customer_id}':`,
        error
      );

      // Cleanup on error
      if (branchCustomerInMainDb) {
        await Customer.deleteOne({ _id: branchCustomerInMainDb._id });
      }

      // Try to cleanup tenant database as well
      try {
        await requestContextLocalStorage.run(tenantId, async () => {
          await Customer.deleteOne({ slug: branchData.branch_customer.slug });
        });
      } catch (cleanupError) {
        logger.error(`Failed to cleanup tenant database during branch creation error:`, cleanupError);
      }

      if (error instanceof ErrorResponse) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ErrorResponse(`Failed to create branch: ${errorMessage}`, 500);
    }
  }
}
