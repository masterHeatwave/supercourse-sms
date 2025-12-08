import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import authService from './auth.service';
import {
  authenticateAsSchema,
  authenticateSchema,
  forgetPasswordSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@components/auth/auth-validate.schemas';
import { APIResponses } from '../../types';
import { CustomerService } from '@components/customers/customer.service';
import usersService from '@components/users/users.service';
import { IUserType } from '@components/users/user.interface';

const authenticate = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = authenticateSchema.parse(req.body);
  const { success, data, message } = await authService.authenticate(parsedBody);

  // Format the auth header for convenience
  if (data?.user?.roles && data?.user?.roles.length > 0 && data?.token) {
    data.authHeader = `${data.user.roles[0].id}:${data.token}:${data.user.id}`;
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    message,
    data,
    success,
  });
});

const authenticateAs = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { distributorId } = authenticateAsSchema.parse(req.params);
  const data = await authService.authenticateAs(distributorId);

  jsonResponse(res, {
    status: StatusCodes.OK,
    message: APIResponses.AUTH.AUTHENTICATE_AS_CREDENTIAL_SUCCESS,
    data,
  });
});

const register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = registerSchema.parse(req.body);
  const customerService = new CustomerService();

  const isUsernameTaken = await authService.isUsernameTaken(parsedBody.username);
  const isEmailTaken = await authService.isEmailTaken(parsedBody.email);
  const isPhoneTaken = await authService.isPhoneTaken(parsedBody.phone);

  if (isUsernameTaken || isEmailTaken || isPhoneTaken) {
    return jsonResponse(res, {
      status: StatusCodes.BAD_REQUEST,
      message: APIResponses.RESOURCE_EXISTS,
      success: false,
    });
  }

  const resp = await authService.register(parsedBody);
  const customerData = parsedBody.customer;
  await customerService.createCustomer(customerData);

  await authService.verificationEmail(resp.user.email);

  jsonResponse(res, {
    status: StatusCodes.CREATED,
    message: APIResponses.USER.USER_REGISTERED_SUCCESS,
    data: resp,
    success: true,
  });
});

const refresh = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = refreshSchema.parse(req.body);
  const data = await authService.refresh(parsedBody);
  jsonResponse(res, {
    status: StatusCodes.OK,
    message: APIResponses.AUTH.TOKEN_REFRESHED_SUCCESS,
    data,
    success: true,
  });
});

const verifyEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedQuery = verifyEmailSchema.parse(req.query);
  const user = await authService.verifyEmail(parsedQuery);
  jsonResponse(res, {
    status: StatusCodes.OK,
    message: APIResponses.AUTH.EMAIL_VERIFICATION_SUCCESS,
    data: user,
    success: true,
  });
});

const forgotPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = forgetPasswordSchema.parse(req.body);
  const forgotPasswordSuccess = await authService.forgotPassword(parsedBody);

  if (!forgotPasswordSuccess) {
    jsonResponse(res, {
      status: StatusCodes.UNAUTHORIZED,
      message: APIResponses.RESOURCE_NOT_FOUND,
      data: {},
      success: false,
    });
  }

  jsonResponse(res, {
    status: StatusCodes.OK,
    message: APIResponses.AUTH.RESET_TOKEN_SENT,
    data: {},
    success: true,
  });
});

const resetPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const parsedBody = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(parsedBody);

  jsonResponse(res, {
    status: StatusCodes.OK,
    message: APIResponses.AUTH.PASSWORD_RESET_SUCCESS,
    success: true,
  });
});

const logout = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  jsonResponse(res, {
    status: StatusCodes.OK,
    message: APIResponses.AUTH.LOGOUT_SUCCESS,
    success: true,
    data: {},
  });
});

const impersonateStudent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const studentId = req.params.id;

  // Verify student exists
  const reqUser = req.user as any;
  const isAdmin = reqUser?.roles?.some((role: any) => role.title === 'ADMIN');
  const includeInactive = isAdmin;

  const student = await usersService.querySingle(studentId, IUserType.STUDENT, includeInactive);
  if (!student) {
    return jsonResponse(res, {
      status: StatusCodes.NOT_FOUND,
      message: APIResponses.RESOURCE_NOT_FOUND,
      success: false,
    });
  }

  // Check if student is active (only for non-admin users)
  if (!isAdmin && !student.is_active) {
    return jsonResponse(res, {
      status: StatusCodes.FORBIDDEN,
      message: 'Cannot impersonate inactive student account',
      success: false,
    });
  }

  // Verify that the authenticated user's email is one of the student's contact emails
  const parentEmail = reqUser?.email;
  const linkedEmails: string[] = Array.isArray((student as any).contacts)
    ? (student as any).contacts.map((c: any) => c.email).filter(Boolean)
    : [];

  const isLinked =
    parentEmail && linkedEmails.some((e) => String(e).toLowerCase() === String(parentEmail).toLowerCase());

  // Also allow ADMIN/MANAGER to impersonate for support purposes
  const isAdminOrManager = Array.isArray(reqUser?.roles)
    ? reqUser.roles.some((r: any) => ['ADMIN', 'MANAGER'].includes(r.title))
    : false;

  if (!isLinked && !isAdminOrManager) {
    return jsonResponse(res, {
      status: StatusCodes.FORBIDDEN,
      message: 'You are not allowed to impersonate this student',
      success: false,
    });
  }

  // Issue tokens for the student
  const token = authService.generateToken(student as any);
  const refreshToken = authService.generateRefreshToken(student as any);

  jsonResponse(res, {
    status: StatusCodes.OK,
    message: 'Impersonation successful',
    success: true,
    data: {
      token,
      refreshToken,
      user: student,
      authHeader:
        student?.roles?.[0]?.id && token && student?.id ? `${student.roles[0].id}:${token}:${student.id}` : undefined,
    },
  });
});

export default {
  authenticate,
  register,
  refresh,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  authenticateAs,
  impersonateStudent,
};
