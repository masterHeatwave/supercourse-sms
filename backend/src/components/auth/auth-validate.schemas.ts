import { CustomerType } from '@components/customers/customer.interface';
import { z } from 'zod';
import { UserSchema } from '@components/users/users-validate.schemas';

const includesOneDigit: RegExp = new RegExp('.*\\d.*');
const includesOneUppercase: RegExp = new RegExp('.*[A-Z].*');
const includesOneLowercase: RegExp = new RegExp('.*[a-z].*');
const includesOneSpecial: RegExp = new RegExp('[*@!#%&()^~{}[:;<>,.?~`+_-]+');

const validatePassword = (value: string): string[] => {
  let errors: string[] = [];
  if (value.length < 8 || value.length > 32) errors = errors.concat('password must be between 8 and 32 characters');

  if (!includesOneDigit.test(value)) errors = errors.concat('password must contain at least one number');

  if (!includesOneUppercase.test(value)) errors = errors.concat('password must contain at least one uppercase letter');

  if (!includesOneLowercase.test(value)) errors = errors.concat('password must contain at least one lowercase letter');

  if (!includesOneSpecial.test(value)) errors = errors.concat('password must contain at least one special character');

  return errors;
};

const authenticateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authenticateAsSchema = z.object({
  distributorId: z.string(),
});

const passwordSchema = z.string().refine(
  (value) => {
    const errors = validatePassword(value);
    return errors.length === 0;
  },
  {
    message: 'Password does not meet complexity requirements',
    path: ['password'], // This specifies which field the error is for
  }
);

const registerSchema = z
  .object({
    username: z.string().min(1),
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10).max(10),
    password: passwordSchema,
    confirmPassword: z.string(),
    mobile: z.string(),
    customer: z.object({
      name: z.string(),
      slug: z.string(),
      nickname: z.string(),
      afm: z.string().optional(),
      facebook_link: z.string().optional(),
      instagram: z.string().optional(),
      twitter_link: z.string().optional(),
      youtube: z.string().optional(),
      website: z.string().optional(),
      customer_type: z.nativeEnum(CustomerType, { required_error: 'Customer type is required' }),
      erp_code: z.string(),
      scap_id: z.string(),
      is_primary: z.boolean(),
      is_main_customer: z.boolean(),
      email: z.string(),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const refreshSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

const forgetPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  password: passwordSchema,
});

// Auth response schemas
export const AuthResponseSchema = z
  .object({
    token: z.string(),
    refreshToken: z.string(),
    user: UserSchema,
    authHeader: z.string().optional(),
  })
  .openapi({
    title: 'AuthResponse',
    description: 'Authentication response model',
  });

export const ImpersonateStudentParamsSchema = z.object({
  id: z.string(),
});

export const SuccessResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.any().optional(),
  })
  .openapi({
    title: 'SuccessResponse',
    description: 'Success response model',
  });

export const ErrorResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.any().optional(),
  })
  .openapi({
    title: 'ErrorResponse',
    description: 'Error response model',
  });

export {
  registerSchema,
  validatePassword,
  authenticateSchema,
  refreshSchema,
  verifyEmailSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  authenticateAsSchema,
};
