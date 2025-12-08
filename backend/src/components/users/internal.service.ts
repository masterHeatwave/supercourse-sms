import {
  IInternalUserCreateDTO,
  IUser,
  IInternalSchoolCreateDTO,
  IBranchCreateDTO,
  ISetPrimaryBranchDTO,
  IUserType,
} from './user.interface';
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
  ): Promise<{ mainCustomer: ICustomer; branchCustomer?: ICustomer; user: IUser }> {
    const mainCustomerExists = await Customer.findOne({ slug: schoolData.main_customer.slug });
    if (mainCustomerExists) {
      throw new ErrorResponse(`Main customer slug '${schoolData.main_customer.slug}' already exists`, 400);
    }

    // Only validate branch customer if it's provided
    if (schoolData.branch_customer) {
      const branchCustomerExists = await Customer.findOne({ slug: schoolData.branch_customer!.slug });
      if (branchCustomerExists) {
        throw new ErrorResponse(`Branch customer slug '${schoolData.branch_customer!.slug}' already exists`, 400);
      }
      if (schoolData.main_customer.slug === schoolData.branch_customer!.slug) {
        throw new ErrorResponse('Main customer slug and branch customer slug cannot be the same', 400);
      }
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

      // Only create branch customer if provided
      if (schoolData.branch_customer) {
        branchCustomerInMainDb = await Customer.create({
          ...schoolData.branch_customer,
          parent_customer: mainCustomerInMainDb?._id,
          is_main_customer: false,
          is_primary: true,
        });
      }

      await requestContextLocalStorage.run(tenantId, async () => {
        logger.info(`[${tenantId}] Starting setup for new tenant.`);

        const tenantMainCustomerData = {
          ...schoolData.main_customer,
          is_main_customer: true,
          is_primary: true,
        };
        delete (tenantMainCustomerData as any)._id; // Remove ID for new creation
        const savedTenantMainCustomer = await Customer.create(tenantMainCustomerData);

        let savedTenantBranchCustomer: ICustomer | null = null;

        // Only create branch customer in tenant if provided
        if (schoolData.branch_customer) {
          const tenantBranchCustomerData = {
            ...schoolData.branch_customer,
            parent_customer: savedTenantMainCustomer._id,
            is_main_customer: false,
            is_primary: true,
          };
          delete (tenantBranchCustomerData as any)._id;
          savedTenantBranchCustomer = await Customer.create(tenantBranchCustomerData);
        }

        logger.info(`[${tenantId}] Starting comprehensive database seeding...`);

        // Skip academic and user seeding for all new customers created via API
        // Academic years/periods and users should be managed manually by the customer
        logger.info(`[${tenantId}] Skipping academic years/periods and user seeding for new customer`);

        await seedNewTenant(tenantId, { skipAcademic: true, skipUsers: true });
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
          customers: [savedTenantBranchCustomer?._id || savedTenantMainCustomer._id],
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
        branchCustomer: branchCustomerInMainDb || undefined,
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
          if (schoolData.branch_customer) {
            await Customer.deleteOne({ slug: schoolData.branch_customer!.slug });
          }

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

    const hasExistingBranches = await Customer.exists({
      parent_customer: parentCustomer._id,
      is_main_customer: false,
    });
    const isFirstBranch = !hasExistingBranches;

    const branchCustomerForCreation = {
      ...branchData.branch_customer,
      is_primary: isFirstBranch,
    };

    const tenantId = sanitizeDbName(parentCustomer.slug);
    let branchCustomerInMainDb: ICustomer | null = null;

    try {
      // Create branch customer in main database
      branchCustomerInMainDb = await Customer.create({
        ...branchCustomerForCreation,
        parent_customer: parentCustomer._id,
        is_main_customer: false,
        supercourse_sub_customer_id: branchData.supercourse_sub_customer_id,
      });

      // Create branch in parent's tenant database (not its own tenant)
      await requestContextLocalStorage.run(tenantId, async () => {
        logger.info(`[${tenantId}] Creating branch customer in parent's tenant database`);

        // Find parent in tenant DB (prefer scap_id, fallback to slug)
        const tenantParent =
          (await Customer.findOne({ is_main_customer: true, scap_id: branchData.parent_supercourse_customer_id })) ||
          (await Customer.findOne({ is_main_customer: true, slug: parentCustomer.slug }));

        if (!tenantParent) {
          logger.warn(`[${tenantId}] Tenant parent not found; skipping tenant branch creation`);
          return;
        }

        // Check if branch already exists in tenant database
        const existingTenantBranch = await Customer.findOne({
          slug: branchData.branch_customer.slug,
        });

        if (!existingTenantBranch) {
          await Customer.create({
            ...branchCustomerForCreation,
            parent_customer: tenantParent._id, // use TENANT parent's id
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

  async setPrimaryBranch(data: ISetPrimaryBranchDTO): Promise<void> {
    // Find parent customer in SMS system using scap_id that matches parent_supercourse_customer_id
    let parentCustomer = await Customer.findOne({
      is_main_customer: true,
      scap_id: data.parent_supercourse_customer_id,
    });

    // Fallback: If scap_id lookup fails, try to find by name (similar to createBranch)
    if (!parentCustomer) {
      const allMainCustomers = await Customer.find({ is_main_customer: true }).select('name slug scap_id');
      logger.error(
        `Parent customer with supercourse ID '${data.parent_supercourse_customer_id}' not found. Available main customers:`,
        allMainCustomers.map((c) => ({ name: c.name, slug: c.slug, scap_id: c.scap_id }))
      );

      throw new ErrorResponse(
        `Parent customer with supercourse ID '${data.parent_supercourse_customer_id}' not found`,
        400
      );
    }

    // Find the target branch by supercourse_sub_customer_id
    const targetBranch = await Customer.findOne({
      supercourse_sub_customer_id: data.supercourse_sub_customer_id,
      is_main_customer: false,
    });

    if (!targetBranch) {
      throw new ErrorResponse(
        `Branch with supercourse sub-customer ID '${data.supercourse_sub_customer_id}' not found`,
        404
      );
    }

    const tenantId = sanitizeDbName(parentCustomer.slug);

    try {
      // Update in main database: set target branch to primary and siblings to false
      logger.info(
        `[Main DB] Setting branch '${targetBranch.slug}' as primary and siblings to false for parent '${parentCustomer.slug}'`
      );

      // Set target branch to primary
      await Customer.findByIdAndUpdate(targetBranch._id, { is_primary: true });

      // Set all sibling branches (same parent, not the target) to false
      await Customer.updateMany(
        {
          parent_customer: parentCustomer._id,
          is_main_customer: false,
          _id: { $ne: targetBranch._id },
        },
        { is_primary: false }
      );

      // Update in tenant database
      await requestContextLocalStorage.run(tenantId, async () => {
        logger.info(`[${tenantId}] Setting branch as primary in tenant database`);

        // Find the tenant parent customer
        const tenantParent = await Customer.findOne({
          slug: parentCustomer.slug,
          is_main_customer: true,
        });

        if (!tenantParent) {
          logger.warn(`[${tenantId}] Parent customer not found in tenant database, skipping tenant update`);
          return;
        }

        // Find target branch in tenant by supercourse_sub_customer_id or slug
        const tenantTargetBranch = await Customer.findOne({
          supercourse_sub_customer_id: data.supercourse_sub_customer_id,
          is_main_customer: false,
        });

        if (!tenantTargetBranch) {
          logger.warn(
            `[${tenantId}] Target branch with supercourse_sub_customer_id '${data.supercourse_sub_customer_id}' not found in tenant database`
          );
          return;
        }

        // Set target branch to primary
        await Customer.findByIdAndUpdate(tenantTargetBranch._id, { is_primary: true });

        // Set all sibling branches to false
        await Customer.updateMany(
          {
            parent_customer: tenantParent._id,
            is_main_customer: false,
            _id: { $ne: tenantTargetBranch._id },
          },
          { is_primary: false }
        );

        logger.info(`[${tenantId}] Successfully updated primary branch in tenant database`);
      });

      logger.info(
        `Successfully set branch '${targetBranch.slug}' as primary for parent '${parentCustomer.slug}' in both main and tenant databases`
      );
    } catch (error) {
      logger.error(`Error setting primary branch: ${error}`);
      if (error instanceof ErrorResponse) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ErrorResponse(`Failed to set primary branch: ${errorMessage}`, 500);
    }
  }
}
