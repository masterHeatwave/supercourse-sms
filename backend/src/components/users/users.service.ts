import { IAdvancedResultsOptions } from '@plugins/advancedResults.interface';
import {
  IUser,
  IUserArchiveDTO,
  IUserCreateDTO,
  IUserDuplicateDTO,
  IUserUpdateDTO,
  IUserType,
  IStaffCreateDTO,
  IStaffUpdateDTO,
} from '@components/users/user.interface';
import { hashPassword } from '@utils/password';
import { generateRandomCode } from '@utils/generateCode';
import { logger } from '@utils/logger';
import User from './user.model';
import Customer from '@components/customers/customer.model';
import Taxi from '@components/taxi/taxi.model';
import Role from '@components/roles/role.model';
import RoleModel from '@components/roles/role.model';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

const queryAll = async (params: IAdvancedResultsOptions, user: IUser) => {
  let overrides: Record<string, unknown> = {};

  // First apply any overrides passed in the params
  if (params.overrides) {
    overrides = { ...params.overrides };
  }

  // Handle is_active filter
  if (params.is_active !== undefined) {
    const isActive = params.is_active.toLowerCase() === 'true';
    overrides = { ...overrides, is_active: isActive };
  }

  // Handle archived filter
  if (params.archived !== undefined) {
    const isArchived = params.archived.toLowerCase() === 'true';
    overrides = { ...overrides, archived: isArchived };
  }

  // Handle branch filter
  if (params.branch !== undefined && params.branch.trim() !== '') {
    overrides = { ...overrides, branches: { $in: [params.branch] } };
  }

  // Handle role filter - filter by role title
  if (params.role !== undefined && params.role.trim() !== '') {
    // We'll handle this in the advancedResults call by using a lookup
    overrides = { ...overrides, roleTitle: params.role.trim() };
  }

  // Handle filters from query params
  if (params?.query) {
    try {
      const parsedQuery = JSON.parse(params.query);
      if (Array.isArray(parsedQuery)) {
        const userTypeFilter = parsedQuery.find((item) => item.user_type);
        const isActiveFilter = parsedQuery.find((item) => item.is_active !== undefined);
        const isArchivedFilter = parsedQuery.find((item) => item.archived !== undefined);

        if (userTypeFilter && !overrides.user_type) {
          overrides = { ...overrides, user_type: userTypeFilter.user_type };
        }
        if (isActiveFilter) {
          overrides = { ...overrides, is_active: isActiveFilter.is_active };
        }
        if (isArchivedFilter) {
          overrides = { ...overrides, archived: isArchivedFilter.archived };
        }
      } else if (typeof parsedQuery === 'object' && parsedQuery !== null) {
        if (parsedQuery.user_type && !overrides.user_type) {
          overrides = { ...overrides, user_type: parsedQuery.user_type };
        }
        if (parsedQuery.is_active !== undefined) {
          overrides = { ...overrides, is_active: parsedQuery.is_active };
        }
        if (parsedQuery.archived !== undefined) {
          overrides = { ...overrides, archived: parsedQuery.archived };
        }
      }
    } catch (e) {
      logger.error('Error parsing query params:', e);
    }
  }

  // Handle role title filtering
  if (overrides.roleTitle) {
    const roleTitle = overrides.roleTitle;
    delete overrides.roleTitle; // Remove from overrides as we'll handle it separately

    // First, find the role by title
    const role = await Role.findOne({ title: roleTitle });
    if (!role) {
      // If role doesn't exist, return empty results
      return {
        results: [],
        page: parseInt(params.page || '1', 10),
        limit: parseInt(params.limit || '20', 10),
        totalPages: 0,
        totalResults: 0,
      };
    }

    // Add the role ID to the overrides
    overrides.roles = { $in: [role._id] };
  }

  return await User.advancedResults({
    page: params.page,
    limit: params.limit,
    sort: params.sort,
    select: params.select,
    populate: [
      { path: 'roles', model: Role },
      { path: 'branches', model: Customer },
      {
        path: 'taxis',
        model: Taxi,
      },
      { path: 'customers', model: Customer },
    ],
    query: params.query,
    branch: params.branch,
    overrides: overrides,
  });
};

const querySingle = async (id: string, user_type?: IUserType) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  let query;
  if (isObjectId) {
    query = User.findById(id);
  } else {
    query = User.findOne({
      $or: [{ username: id }, { email: id }, { phone: id }],
    });
  }

  if (user_type) {
    query.where('user_type').equals(user_type);
  }

  const user = await query.populate([
    {
      path: 'branches',
      model: Customer,
    },
    {
      path: 'default_branch',
      model: Customer,
    },
    {
      path: 'customers',
      model: Customer,
    },
    {
      path: 'taxis',
      model: Taxi,
    },
    {
      path: 'roles',
      model: Role,
      populate: {
        path: 'permissions',
      },
    },
  ]);

  if (user) {
    const userObject = user.toObject({ getters: true, virtuals: true });
    return userObject;
  }

  return user;
};

const querySingleByEmail = async (email: string) => {
  return User.findOne({ email });
};

const isUserDuplicate = async (data: IUserDuplicateDTO) => {
  const { email, phone, username, excludeId } = data;
  const query: Record<string, unknown> = {
    $or: [
      { email: { $exists: true, $eq: email } },
      { phone: { $exists: true, $eq: phone } },
      { username: { $exists: true, $eq: username } },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingUser = await User.findOne(query);
  return !!existingUser;
};

const create = async (data: IUserCreateDTO): Promise<IUser> => {
  const { password, ...userData } = data;
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await hashPassword(password);
  }
  const code = await generateRandomCode();
  return User.create({ ...userData, passwordHash, code });
};

const createStaff = async (data: IStaffCreateDTO): Promise<IUser> => {
  const { password, ...staffData } = data;
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await hashPassword(password);
  }
  const code = await generateRandomCode();

  // If customer ID is provided, add it to the customers array to maintain the relationship
  const customersArray = [];
  if (staffData.customer) {
    customersArray.push(staffData.customer);
  }

  // Ensure user_type is set correctly - default to TEACHER for staff management
  const finalData = {
    ...staffData,
    user_type: staffData.user_type || IUserType.TEACHER, // Use provided type or default to TEACHER
    passwordHash,
    code,
    customers: customersArray,
  };

  return User.create(finalData);
};

const update = async (data: IUserUpdateDTO): Promise<IUser | null> => {
  const { id, password, ...updateData } = data;
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await hashPassword(password);
  }
  const updatePayload = passwordHash ? { ...updateData, passwordHash } : updateData;
  return User.findByIdAndUpdate(id, updatePayload, { new: true });
};

const updateStaff = async (data: IStaffUpdateDTO): Promise<IUser | null> => {
  const { id, password, ...staffUpdateData } = data;
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await hashPassword(password);
  }
  const updatePayload = passwordHash ? { ...staffUpdateData, passwordHash } : staffUpdateData;
  // Ensure we only update staff members (TEACHER or MANAGER user types)
  return User.findOneAndUpdate({ _id: id, user_type: { $in: [IUserType.TEACHER, IUserType.MANAGER] } }, updatePayload, {
    new: true,
  });
};

const archive = async ({ id, archived }: IUserArchiveDTO): Promise<IUser | null> => {
  return User.findByIdAndUpdate(id, { archived }, { new: true });
};

// Get all staff with optional search - uses queryAll with specific override
const getAllStaff = async (params: IAdvancedResultsOptions, user: IUser) => {
  const overrides: Record<string, unknown> = { user_type: { $in: [IUserType.TEACHER, IUserType.MANAGER] } };

  // Handle is_active filter
  if (params.is_active !== undefined) {
    overrides.is_active = params.is_active === 'true';
  }

  // Handle archived filter
  if (params.archived !== undefined) {
    overrides.archived = params.archived === 'true';
  }

  // Handle branch filter
  if (params.branch !== undefined && params.branch.trim() !== '') {
    overrides.branches = { $in: [params.branch] };
  }

  // Handle role filter - filter by role title
  if (params.role !== undefined && params.role.trim() !== '') {
    overrides.roleTitle = params.role.trim();
  }

  return queryAll({ ...params, overrides }, user);
};

// Search staff function that uses the same logic as getAllStaff
// This is kept for backward compatibility with existing API routes
const searchStaff = async (params: IAdvancedResultsOptions, user: IUser) => {
  return getAllStaff(params, user);
};

// Get staff by ID - uses querySingle but checks for TEACHER or MANAGER types
const getStaffById = async (id: string) => {
  const user = await querySingle(id);
  // Ensure the user is a staff member (TEACHER or MANAGER)
  if (user && [IUserType.TEACHER, IUserType.MANAGER].includes(user.user_type)) {
    return user;
  }
  return null;
};

// Delete staff - uses archive mechanism for now
const deleteStaff = async (id: string): Promise<IUser | null> => {
  // Find staff user first to ensure type safety (TEACHER or MANAGER)
  const staff = await User.findOne({ _id: id, user_type: { $in: [IUserType.TEACHER, IUserType.MANAGER] } });
  if (!staff) {
    return null; // Or throw an error
  }
  return archive({ id, archived: true });
};

const deleteStudent = async (id: string): Promise<IUser | null> => {
  // Find student user first to ensure type safety
  const student = await User.findOne({ _id: id, user_type: IUserType.STUDENT });
  if (!student) {
    return null; // Or throw an error
  }
  return User.findByIdAndDelete(id);
};

export default {
  queryAll,
  querySingle,
  querySingleByEmail,
  isUserDuplicate,
  create,
  createStaff,
  update,
  updateStaff,
  archive,
  deleteStaff,
  deleteStudent,
  getAllStaff,
  getStaffById,
  searchStaff,
};
