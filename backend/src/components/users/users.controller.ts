import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { moveToFinalStorage, cleanupTempFiles } from '@middleware/tempStorage';
import usersService from '@components/users/users.service';
import { CustomerService } from '@components/customers/customer.service';
import {
  archiveSchema,
  createSchema,
  createStaffSchema,
  queryAllSchema,
  updateSchema,
  updateStaffSchema,
  makePrimaryContactSchema,
} from '@components/users/users-validate.schemas';
import redisClient from '@config/redis';
import { sendEmailToCreatePassword } from '@utils/sendEmail';
import RoleModel from '@components/roles/role.model';
import User from '@components/users/user.model';
import { Role as RoleEnum } from '@middleware/constants/role';
import { IUser, IUserType, IUserCreateDTO, IStaffCreateDTO } from './user.interface';
import Session from '@components/sessions/session.model';
import Taxi from '@components/taxi/taxi.model';
import { APIResponses } from '../../types';
import { sendNotification } from '@utils/sendNotification';
import { logger } from '@utils/logger';

const queryAll = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;
  const users = await usersService.queryAll(parsedQuery, reqUser);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: users,
    success: true,
  });
});

const querySingle = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await usersService.querySingle(req.params.id);

  if (!user) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: user,
    success: true,
  });
});

const create = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = createSchema.parse(req.body);
  const userExists = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
  });

  if (userExists) {
    jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      data: {},
      success: false,
    });
  }

  // Ensure tenant access alignment: if branches provided, mirror them to customers for auth checks
  const mirroredCustomers = Array.isArray(parsedBody.branches) ? [...(parsedBody.branches as unknown as string[])] : [];
  const createData = { ...parsedBody, username: parsedBody.username!, customers: mirroredCustomers };
  const user = await usersService.create(createData as IUserCreateDTO);

  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(user.email));
  if (!parsedBody.customers || parsedBody.customers.length === 0) {
    await sendEmailToCreatePassword(user.email, randomHash);
  }

  // The user's customers and branches are already set during user creation
  // No need to update the customer side since customers don't have a users array

  await sendNotification(`User ${user.username} has been created successfully`, 'system');

  jsonResponse(res, {
    status: StatusCodes.CREATED,
    data: user,
    success: true,
    message: 'User created successfully. Email sent to create password.',
  });
});

const createStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = createStaffSchema.parse(req.body);

  // Check for duplicate email/phone/username
  const userExists = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
  });

  if (userExists) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  // Handle files if present
  const staffData = { ...parsedBody } as IStaffCreateDTO;

  // File model setup already imported at the top of the file (or should be)

  // We're already getting the avatar and documents paths from the frontend
  // No need to create additional records, just use the paths directly

  // Only handle avatar or document uploads if they're not already set
  if (!staffData.avatar && req.files && 'avatar' in req.files) {
    const avatarFile = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;
    if (avatarFile) {
      // Just use the path directly - we're no longer creating a File record
      staffData.avatar = `media/${avatarFile.name}`;
    }
  }

  // Handle document files if present and not already set
  if ((!staffData.documents || staffData.documents.length === 0) && req.files && 'documents' in req.files) {
    const documentFiles = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
    staffData.documents = documentFiles.map((file) => `media/${file.name}`);
  }

  // Create the staff member
  const staff = await usersService.createStaff(staffData);

  // Check for successful creation and move files from temp to permanent storage
  if (staff && staff.id) {
    try {
      await moveToFinalStorage(req);
    } catch (error) {
      logger.error(`Error moving files from temp to permanent storage: ${error}`);
      // Continue anyway, as the staff record is created
    }
  } else {
    // Cleanup temp files on failure
    try {
      await cleanupTempFiles(req);
    } catch (error) {
      logger.error(`Error cleaning up temp files: ${error}`);
    }
  }

  // Send password creation email
  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(staff.email));
  await sendEmailToCreatePassword(staff.email, randomHash);

  // Send notification
  await sendNotification(`Staff member ${staff.firstname} ${staff.lastname} created successfully`, 'system');

  jsonResponse(res, {
    status: StatusCodes.CREATED,
    data: staff,
    success: true,
    message: 'Staff created successfully. Email sent to create password.',
  });
});

const update = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = updateSchema.parse({ ...req.body, id: req.params.id });

  // Check if user exists (optional, service might handle)
  const existingUser = await usersService.querySingle(parsedBody.id);
  if (!existingUser) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  // Check for duplicate details excluding self
  const checkForUniqueDetails = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
    excludeId: parsedBody.id,
  });
  if (checkForUniqueDetails) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  const user = await usersService.update(parsedBody);

  // TODO: Add history logging
  // const reqUser = req?.user as IUser;
  // await historyService.addHistory(user.id, HistoryContentTypes.USER_UPDATED_BY, reqUser.email);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: user,
    success: true,
    message: 'User updated successfully.',
  });
});

const updateStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = updateStaffSchema.parse({ ...req.body, id: req.params.id });

  // Check for duplicate details excluding self
  const checkForUniqueDetails = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
    excludeId: parsedBody.id,
  });
  if (checkForUniqueDetails) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  const staff = await usersService.updateStaff(parsedBody);

  if (!staff) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: 'Staff member not found or update failed.',
      success: false,
    });
  }

  // TODO: Add history logging
  // const reqUser = req?.user as IUser;
  // await historyService.addHistory(staff.id, HistoryContentTypes.USER_UPDATED_BY, reqUser.email);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: staff,
    success: true,
    message: 'Staff member updated successfully.',
  });
});

const getAllStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;
  const staffList = await usersService.getAllStaff(parsedQuery, reqUser);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: staffList,
    success: true,
  });
});

const getStaffById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const staff = await usersService.getStaffById(req.params.id);

  if (!staff) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: 'Staff member not found.',
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: staff,
    success: true,
  });
});

const searchStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;
  const staffResults = await usersService.searchStaff(parsedQuery, reqUser);

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: staffResults,
    success: true,
  });
});

const archive = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = archiveSchema.parse(req.body);
  const user = await usersService.archive(parsedBody);

  if (!user) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  const message = parsedBody.archived ? APIResponses.USER.USER_ARCHIVED : APIResponses.USER.USER_UNARCHIVED;

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: user,
    message: message,
    success: true,
  });
});

const deleteStaff = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const staffId = req.params.id;
  const user = await usersService.deleteStaff(staffId);

  if (!user) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: 'Staff member not found.',
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: user,
    message: 'Staff member archived successfully.',
    success: true,
  });
});

const makePrimaryContact = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = makePrimaryContactSchema.parse(req.body);
  const customerServiceInstance = new CustomerService();
  const customer = await customerServiceInstance.getCustomerById(parsedBody.customer_id);

  // Update the user to include this customer in their customers array if not already there
  const user = await usersService.querySingle(parsedBody.user_id);
  if (user) {
    const customerIds = user.customers.map((c) => c.toString());
    if (!customerIds.includes(parsedBody.customer_id)) {
      user.customers.push(parsedBody.customer_id as any);
      await user.save();
    }
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: customer,
    message: APIResponses.USER.USER_PRIMARY_CONTACT_SUCCESS,
    success: true,
  });
});

const resendPasswordEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await usersService.querySingle(req.params.id);

  if (!user) {
    jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
    return;
  }

  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(user.email));
  await sendEmailToCreatePassword(user.email, randomHash);

  jsonResponse(res, {
    status: StatusCodes.OK,
    message: APIResponses.USER.PASSWORD_EMAIL_RESENT,
    success: true,
  });
});

const getAllStudents = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = queryAllSchema.parse(req.query);
  const reqUser = req.user as IUser;
  const students = await usersService.queryAll(
    { ...parsedQuery, overrides: { user_type: IUserType.STUDENT } },
    reqUser
  );

  // Compute on_live_session flag for current page of students
  try {
    const now = new Date();
    // Build branch-aware sessions filter similar to SessionService.getAllSessions
    const branch = parsedQuery.branch?.trim() || '';

    // Resolve taxis for branch (if provided)
    let taxiFilter: any = {};
    if (branch) {
      const taxisInBranch = await Taxi.find({ branch }).select('_id');
      const taxiIds = taxisInBranch.map((t) => t._id);
      taxiFilter = taxiIds.length > 0 ? { taxi: { $in: taxiIds } } : { taxi: { $in: [] } };
    }

    // Reduce scope to current page students for efficiency
    const currentPageStudentIds = Array.isArray(students?.results)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        students.results.map((s: any) => (s?.id || s?._id)?.toString()).filter(Boolean)
      : [];

    // Query active sessions intersecting now and containing any current page student
    const activeSessions = await Session.find({
      start_date: { $lte: now },
      end_date: { $gte: now },
      ...(currentPageStudentIds.length > 0 ? { students: { $in: currentPageStudentIds } } : {}),
      ...taxiFilter,
    }).select('students');

    const liveStudentIds = new Set<string>();
    for (const session of activeSessions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).students?.forEach((sid: any) => liveStudentIds.add(sid.toString()));
    }

    // Annotate current page results only
    // students has shape { results, page, limit, totalResults, totalPages }
    if (Array.isArray(students?.results)) {
      students.results = students.results.map((stu: any) => {
        const id = (stu?.id || stu?._id)?.toString();
        const onLive = id ? liveStudentIds.has(id) : false;
        // Ensure we return a plain object with existing JSON transforms
        const json = typeof stu?.toJSON === 'function' ? stu.toJSON() : stu;
        return { ...json, on_live_session: onLive };
      });
    }
  } catch (e) {
    // Fail-soft: keep original payload if any error occurs
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: students,
    success: true,
  });
});

const createStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = createSchema.parse(req.body);
  parsedBody.user_type = IUserType.STUDENT;

  const userExists = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
  });

  if (userExists) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  // Mirror branches into customers for tenant authorization
  const studentMirroredCustomers = Array.isArray(parsedBody.branches)
    ? [...(parsedBody.branches as unknown as string[])]
    : [];
  // Ensure student has STUDENT role assigned
  const studentRole = await RoleModel.findOne({ title: 'STUDENT' });
  const createData = {
    ...parsedBody,
    username: parsedBody.username!,
    customers: studentMirroredCustomers,
    roles: parsedBody.roles && parsedBody.roles.length > 0 ? parsedBody.roles : studentRole ? [studentRole.id] : [],
  };
  const student = await usersService.create(createData as IUserCreateDTO);

  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(student.email));
  await sendEmailToCreatePassword(student.email, randomHash);

  // Ensure parent/guardian accounts exist for linked contacts and send invites
  try {
    if (Array.isArray(parsedBody.contacts) && parsedBody.contacts.length > 0) {
      // Use student's first branch if provided to grant access to parents
      const branchId: string | undefined =
        Array.isArray(parsedBody.branches) && parsedBody.branches.length > 0
          ? (parsedBody.branches[0] as unknown as string)
          : undefined;

      const parentRole = await RoleModel.findOne({ title: 'PARENT' });
      for (const contact of parsedBody.contacts) {
        if (!contact?.email) continue;

        // Try to find existing user by email
        let existingUser = await usersService.querySingleByEmail(contact.email);
        if (!existingUser) {
          // Create new parent user
          const nameParts = (contact.name || '').trim().split(' ');
          const firstname = nameParts.shift() || contact.name || 'Parent';
          const lastname = nameParts.join(' ') || 'Guardian';

          const createdParent = await usersService.create({
            username: contact.email,
            firstname,
            lastname,
            email: contact.email,
            phone: contact.phone || 'N/A',
            user_type: IUserType.PARENT,
            is_active: true,
            branches: branchId ? [branchId] : [],
            customers: branchId ? [branchId] : [],
            roles: parentRole ? [parentRole.id] : [],
          } as unknown as IUserCreateDTO);

          // Send email to set password for the new parent
          const parentHash = Math.random().toString(36).substring(7);
          await redisClient.set(`reset-password-hash-${parentHash}`, JSON.stringify(contact.email));
          await sendEmailToCreatePassword(contact.email, parentHash);
          // Refetch as a Mongoose document for subsequent logic
          existingUser = await usersService.querySingleByEmail(contact.email);
        } else {
          // Ensure PARENT role and access to branch/customer
          let requiresSave = false;

          if (parentRole) {
            const hasParentRole = (existingUser.roles as any[]).some(
              (r: any) => r.toString() === parentRole.id.toString()
            );
            if (!hasParentRole) {
              (existingUser.roles as any[]).push(parentRole._id);
              requiresSave = true;
            }
          }

          if (branchId) {
            const hasCustomer = (existingUser.customers as any[]).some((c: any) => c.toString() === branchId);
            if (!hasCustomer) {
              (existingUser.customers as any[]).push(branchId as any);
              requiresSave = true;
            }
            const hasBranch = (existingUser.branches as any[]).some((b: any) => b.toString() === branchId);
            if (!hasBranch) {
              (existingUser.branches as any[]).push(branchId as any);
              requiresSave = true;
            }
          }

          if (requiresSave) {
            await (existingUser as any).save();
          }

          // If the user has no password set, send set-password email
          if (!(existingUser as any).passwordHash) {
            const parentHash = Math.random().toString(36).substring(7);
            await redisClient.set(`reset-password-hash-${parentHash}`, JSON.stringify(contact.email));
            await sendEmailToCreatePassword(contact.email, parentHash);
          }
        }
      }
    }
  } catch (err) {
    logger.error('Failed to process parent accounts for student contacts', err as any);
  }

  await sendNotification(`Student ${student.firstname} ${student.lastname} created successfully`, 'system');

  jsonResponse(res, {
    status: StatusCodes.CREATED,
    data: student,
    success: true,
    message: 'Student created successfully. Email sent to create password.',
  });
});

const getStudentById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const student = await usersService.querySingle(req.params.id);

  if (!student || student.user_type !== IUserType.STUDENT) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: student,
    success: true,
  });
});

const updateStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = updateSchema.parse({ ...req.body, id: req.params.id });

  const existingStudent = await usersService.querySingle(parsedBody.id);
  if (!existingStudent || existingStudent.user_type !== IUserType.STUDENT) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  const checkForUniqueDetails = await usersService.isUserDuplicate({
    email: parsedBody.email,
    phone: parsedBody.phone,
    username: parsedBody.username,
    excludeId: parsedBody.id,
  });
  if (checkForUniqueDetails) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.USER.USER_EXISTS,
      success: false,
    });
  }

  // Keep customers in sync with branches for authorization checks
  if (Array.isArray(parsedBody.branches)) {
    (parsedBody as any).customers = [...(parsedBody.branches as unknown as string[])];
  }
  const student = await usersService.update(parsedBody);

  // Ensure parent/guardian accounts exist for linked contacts and send invites
  try {
    if (student && Array.isArray(parsedBody.contacts) && parsedBody.contacts.length > 0) {
      const branchId: string | undefined =
        Array.isArray(parsedBody.branches) && parsedBody.branches.length > 0
          ? (parsedBody.branches[0] as unknown as string)
          : student.branches && student.branches.length > 0
            ? (student.branches[0] as any).toString()
            : undefined;

      const parentRole = await RoleModel.findOne({ title: 'PARENT' });
      for (const contact of parsedBody.contacts) {
        if (!contact?.email) continue;

        let existingUser = await usersService.querySingleByEmail(contact.email);
        if (!existingUser) {
          const nameParts = (contact.name || '').trim().split(' ');
          const firstname = nameParts.shift() || contact.name || 'Parent';
          const lastname = nameParts.join(' ') || 'Guardian';

          const createdParent = await usersService.create({
            username: contact.email,
            firstname,
            lastname,
            email: contact.email,
            phone: contact.phone || 'N/A',
            user_type: IUserType.PARENT,
            is_active: true,
            branches: branchId ? [branchId] : [],
            customers: branchId ? [branchId] : [],
            roles: parentRole ? [parentRole.id] : [],
          } as unknown as IUserCreateDTO);

          const parentHash = Math.random().toString(36).substring(7);
          await redisClient.set(`reset-password-hash-${parentHash}`, JSON.stringify(contact.email));
          await sendEmailToCreatePassword(contact.email, parentHash);
          // Refetch as a Mongoose document for subsequent logic
          existingUser = await usersService.querySingleByEmail(contact.email);
        } else {
          let requiresSave = false;
          if (parentRole) {
            const hasParentRole = (existingUser.roles as any[]).some(
              (r: any) => r.toString() === parentRole.id.toString()
            );
            if (!hasParentRole) {
              (existingUser.roles as any[]).push(parentRole._id);
              requiresSave = true;
            }
          }
          if (branchId) {
            const hasCustomer = (existingUser.customers as any[]).some((c: any) => c.toString() === branchId);
            if (!hasCustomer) {
              (existingUser.customers as any[]).push(branchId as any);
              requiresSave = true;
            }
            const hasBranch = (existingUser.branches as any[]).some((b: any) => b.toString() === branchId);
            if (!hasBranch) {
              (existingUser.branches as any[]).push(branchId as any);
              requiresSave = true;
            }
          }
          if (requiresSave) {
            await (existingUser as any).save();
          }
          if (!(existingUser as any).passwordHash) {
            const parentHash = Math.random().toString(36).substring(7);
            await redisClient.set(`reset-password-hash-${parentHash}`, JSON.stringify(contact.email));
            await sendEmailToCreatePassword(contact.email, parentHash);
          }
        }
      }
    }
  } catch (err) {
    logger.error('Failed to process parent accounts on student update', err as any);
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: student,
    success: true,
    message: 'Student updated successfully.',
  });
});

const getChildren = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const reqUser = req.user as IUser;
  const parentEmail = reqUser?.email;
  if (!parentEmail) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: 'Authenticated user has no email',
      success: false,
    });
  }

  const parsedQuery = queryAllSchema.parse(req.query);
  const results = await usersService.queryAll(
    {
      ...parsedQuery,
      overrides: {
        user_type: IUserType.STUDENT,
        'contacts.email': parentEmail,
      },
    } as any,
    reqUser
  );

  jsonResponse(res, {
    status: StatusCodes.OK,
    data: results,
    success: true,
  });
});

const deleteStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const student = await usersService.querySingle(req.params.id);

  if (!student || student.user_type !== IUserType.STUDENT) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  await usersService.deleteStudent(req.params.id);

  jsonResponse(res, {
    status: StatusCodes.NO_CONTENT,
    success: true,
  });
});

export default {
  queryAll,
  querySingle,
  create,
  createStaff,
  update,
  updateStaff,
  archive,
  deleteStaff,
  getAllStaff,
  getStaffById,
  searchStaff,
  makePrimaryContact,
  resendPasswordEmail,
  getAllStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getChildren,
};
