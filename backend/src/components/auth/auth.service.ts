import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '@config/config';
import User from '@components/users/user.model';
import { IUser } from '@components/users/user.interface';
import {
  ForgotPasswordParams,
  ResetPasswordParams,
  ValidateResetTokenParams,
  RegisterDto,
  AuthenticateDto,
  RefreshDto,
  VerifyEmailDto,
  AuthResponse,
} from './auth.interface';
import redisClient from '@config/redis';
import { sendPasswordResetEmail, sendVerificationEmail } from '@utils/sendEmail';
import { IResponse, APIResponses } from '../../types';
import { logger } from '@utils/logger';
import RoleModel from '@components/roles/role.model';
import { ErrorResponse } from '@utils/errorResponse';

const generateToken = (user: IUser) => {
  return jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '1h' });
};

const generateRefreshToken = (user: IUser) => {
  return jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' });
};

const refresh = async (params: RefreshDto) => {
  const { refreshToken } = params;
  const decoded = verifyToken(refreshToken);
  const user = await User.findById(decoded.id).populate('roles');

  if (!user) {
    throw new Error(APIResponses.RESOURCE_NOT_FOUND);
  }

  return {
    user,
    token: generateToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

const getAuthUserByToken = async (token: string) => {
  const decoded = verifyToken(token);
  return User.findById(decoded.id);
};

const getAuthUserRolesByToken = async (token: string) => {
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.id);
  return user?.roles || [];
};

const authenticate = async (params: AuthenticateDto): Promise<IResponse<AuthResponse>> => {
  const { email, password } = params;

  const user = await User.findOne({ email }).populate({
    path: 'roles',
    model: RoleModel,
  });

  if (!user) {
    throw new ErrorResponse(APIResponses.INVALID_CREDENTIALS, 401);
  }

  if (!user.is_active) {
    throw new ErrorResponse(APIResponses.AUTH.ACCOUNT_INACTIVE, 403);
  }

  if (!user.passwordHash) {
    logger.error(`User ${user.email} (ID: ${user._id}) found but has no passwordHash.`);
    throw new ErrorResponse(APIResponses.INVALID_CREDENTIALS, 401);
  }

  if (bcrypt.compareSync(password, user.passwordHash)) {
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      success: true,
      message: APIResponses.AUTH.AUTHENTICATION_SUCCESS,
      data: {
        token,
        refreshToken,
        user,
      },
    };
  }

  throw new ErrorResponse(APIResponses.INVALID_CREDENTIALS, 401);
};

const isEmailTaken = async (email: string) => {
  return User.exists({ email });
};

const isUsernameTaken = async (username: string) => {
  return User.exists({ username });
};

const isPhoneTaken = async (phone: string) => {
  return User.exists({ phone });
};

const register = async (params: RegisterDto) => {
  const studentRole = await RoleModel.findOne({ title: 'Student' });

  if (!studentRole) {
    throw new Error('Student role not found');
  }

  const user = new User({
    username: params.username,
    firstname: params.firstname,
    lastname: params.lastname,
    email: params.email,
    phone: params.phone,
    mobile: params.mobile,
    passwordHash: bcrypt.hashSync(params.password, 10),
    roles: [studentRole._id],
    is_active: true,
  });

  await user.save();
  return {
    user,
    token: generateToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

const verificationEmail = async (email: string) => {
  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`verification-email-hash-${randomHash}`, JSON.stringify(email));
  await sendVerificationEmail(randomHash, config.WEB_HOST, email);

  return randomHash;
};

const resetPasswordEmail = async (email: string) => {
  const randomHash = Math.random().toString(36).substring(7);
  await redisClient.set(`reset-password-hash-${randomHash}`, JSON.stringify(email));
  await sendPasswordResetEmail(randomHash, email);

  return randomHash;
};

const verifyEmail = async (params: VerifyEmailDto) => {
  const { token } = params;

  const redisToken = await redisClient.get(`verification-email-hash-${token}`);
  if (redisToken === null) {
    throw new Error(APIResponses.INVALID_TOKEN);
  }

  const email = JSON.parse(redisToken);
  const user = await User.findOne({ email });

  await redisClient.del(`verification-email-hash-${token}`);

  if (!user) {
    throw new Error(APIResponses.RESOURCE_NOT_FOUND);
  }

  return user;
};

const forgotPassword = async (params: ForgotPasswordParams): Promise<boolean> => {
  const user = await User.findOne({ email: params.email });
  if (user) {
    await resetPasswordEmail(user.email);
    return true;
  }
  throw new Error(APIResponses.RESOURCE_NOT_FOUND);
};

const resetPassword = async (params: ResetPasswordParams): Promise<boolean> => {
  const savedToken = await redisClient.get(`reset-password-hash-${params.token}`);

  if (!savedToken) {
    throw new Error(APIResponses.INVALID_TOKEN);
  }

  const email = JSON.parse(savedToken);
  if (email !== params.email) {
    throw new Error(APIResponses.INVALID_TOKEN);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error(APIResponses.RESOURCE_NOT_FOUND);
  }

  user.passwordHash = bcrypt.hashSync(params.password, 10);
  await user.save();
  await redisClient.del(`reset-password-hash-${params.token}`);

  return true;
};

const validateResetToken = async (params: ValidateResetTokenParams) => {
  const savedToken = await redisClient.get(`reset-password-hash-${params.token}`);

  if (!savedToken) {
    return { valid: false };
  }

  const email = JSON.parse(savedToken);
  if (email === params.email) {
    return { valid: true };
  }

  return { valid: false };
};

const verifyToken = (token: string): { id: string } => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as { id: string };
  } catch (err) {
    logger.error(err);
    throw new Error(APIResponses.INVALID_TOKEN);
  }
};

const authenticateAs = async (distributorId: string) => {
  return { token: '', refreshToken: '', user: null };
};

export default {
  generateToken,
  refresh,
  generateRefreshToken,
  getAuthUserByToken,
  getAuthUserRolesByToken,
  authenticate,
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
  validateResetToken,
  isEmailTaken,
  isUsernameTaken,
  isPhoneTaken,
  verificationEmail,
  resetPasswordEmail,
  authenticateAs,
};
