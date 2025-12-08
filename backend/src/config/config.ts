import { ENV } from './config.interface';
import { config as dotenvConfig } from 'dotenv';
import * as process from 'node:process';
import { z } from 'zod';

dotenvConfig();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3193'),
  MONGO_URI: z.string().min(1),
  MONGO_USER: z.string().default('root'),
  MONGO_PASSWORD: z.string().default('securePassword'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRE: z.string().default('30d'),
  OS_JWT_SECRET: z.string().min(32),
  OS_JWT_SUB: z.string().min(10),
  OS_JWT_EXPIRE_AT: z.coerce.number().default(86400),
  API_KEY: z.string().min(1),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.string().transform(Number).default('2525'),
  SMTP_EMAIL: z.string().default('81a8d5f9febc47'),
  SMTP_PASSWORD: z.string().default('21ba64d136bb41'),
  FROM_EMAIL: z.string().email().default('mobile@softwebpages.eu'),
  FROM_NAME: z.string().default('starterApi'),
  WEB_HOST: z.string().url().default('http://localhost:4200'),
  ADMIN_HOST: z.string().url().default('http://localhost:3193'),
  API_HOST: z.string().url().default('http://localhost:3193'),
  SUPERCOURSE_API_URL: z.string().url().default('http://localhost:3000'),
  SCAP_API_KEY: z.string().min(1),
});

const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
};

const validatedEnv = validateEnv();

export const config: ENV = {
  NODE_ENV: validatedEnv.NODE_ENV,
  PORT: validatedEnv.PORT,
  MONGO_URI: validatedEnv.MONGO_URI,
  MONGO_USER: validatedEnv.MONGO_USER,
  MONGO_PASSWORD: validatedEnv.MONGO_PASSWORD,
  JWT_SECRET: validatedEnv.JWT_SECRET,
  JWT_EXPIRE: validatedEnv.JWT_EXPIRE,
  OS_JWT_SECRET: validatedEnv.OS_JWT_SECRET,
  OS_JWT_SUB: validatedEnv.OS_JWT_SUB,
  OS_JWT_EXPIRE_AT: validatedEnv.OS_JWT_EXPIRE_AT,
  API_KEY: validatedEnv.API_KEY,
  SCAP_API_KEY: validatedEnv.SCAP_API_KEY,
  REDIS: {
    HOST: validatedEnv.REDIS_HOST,
    PORT: validatedEnv.REDIS_PORT,
  },
  SMTP_HOST: validatedEnv.SMTP_HOST,
  SMTP_PORT: validatedEnv.SMTP_PORT,
  SMTP_EMAIL: validatedEnv.SMTP_EMAIL,
  SMTP_PASSWORD: validatedEnv.SMTP_PASSWORD,
  FROM_EMAIL: validatedEnv.FROM_EMAIL,
  FROM_NAME: validatedEnv.FROM_NAME,
  WEB_HOST: validatedEnv.WEB_HOST,
  ADMIN_HOST: validatedEnv.ADMIN_HOST,
  API_HOST: validatedEnv.API_HOST,
  SUPERCOURSE_API_URL: validatedEnv.SUPERCOURSE_API_URL,
  AUTH: {
    LOGIN_STRATEGY: process.env.AUTH_LOGIN_STRATEGY || 'emailLoginStrategy',
    MAX_LOGGEN_IN_DEVICES: Number(process.env.AUTH_MAX_LOGGEN_IN_DEVICES) || 2,
    GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_ID_IOS: process.env.AUTH_GOOGLE_CLIENT_ID_IOS || '',
    SALT_ROUNDS: Number(process.env.AUTH_SALT_ROUNDS) || 10,
  },
  UPLOADS: {
    PUBLIC_PATH: process.env.UPLOADS_PUBLIC_PATH || '',
    LOCAL_PATH: process.env.UPLOADS_LOCAL_PATH || '',
    MAX_UPLOAD: Number(process.env.UPLOADS_MAX_UPLOAD) || 20000,
    MAX_GALLERY: Number(process.env.UPLOADS_MAX_GALLERY) || 1024,
  },
  ENCRYPT: {
    KEY: process.env.ENCRYPT_KEY || '',
    IV: process.env.ENCRYPT_IV || '',
  },
  CRYPT_FILES: {
    CRYPT_ALGORITHM: process.env.CRYPT_FILES_CRYPT_ALGORITHM || 'H256',
    IV: process.env.CRYPT_FILES_IV || '',
    KEY: process.env.CRYPT_FILES_KEY || '',
  },
  TZ: process.env.TZ || 'Europe/Athens',
  PROJECT_NAME: process.env.PROJECT_NAME || 'Starter_api',
  LOGIN_STRATEGY: 'emailLoginStrategy',
  MAX_LOGGEN_IN_DEVICES: Number(process.env.MAX_LOGGEN_IN_DEVICES) || 2,
  MONGO_ENCRYPT_SECRET: process.env.MONGO_ENCRYPT_SECRET || 'hhj4h54575485hj45h5j44HGf',
  FILE_LOCAL_UPLOAD_PATH: process.env.FILE_LOCAL_UPLOAD_PATH || '/c/123',
  FILE_PUBLIC_UPLOAD_PATH: process.env.FILE_PUBLIC_UPLOAD_PATH || 'http://localhost:8887/starter-api',
  MAX_FILE_UPLOAD: Number(process.env.MAX_FILE_UPLOAD) || 1000000,
  REQUEST_BODY_ENCRYPT_KEY: process.env.REQUEST_BODY_ENCRYPT_KEY || 'tokatsikipoutrexeikaidenkserwpou',
  REQUEST_BODY_IV_KEY: process.env.REQUEST_BODY_IV_KEY || 'zavarakatranemia',
  CRYPTO_ALGORITHM: process.env.CRYPTO_ALGORITHM || 'ASDASD',
  FILE_CRYPT_KEY: process.env.FILE_CRYPT_KEY || 'ASDASD',
  FILE_CRYPT_IV: process.env.FILE_CRYPT_IV || 'ASDASD',
  JWT_COOKIE_EXPIRE: Number(process.env.JWT_COOKIE_EXPIRE) || 30,
  JWT_CHECK_EMAIL_VERIFICATION: process.env.JWT_CHECK_EMAIL_VERIFICATION === 'true',
  JWT_REFRESH_EXPIRE: Number(process.env.JWT_REFRESH_EXPIRE) || 30,
  REFRESH_TOKEN_EXPIRE: Number(process.env.REFRESH_TOKEN_EXPIRE) || 7,
  CHECK_EMAIL_VERIFICARION: process.env.CHECK_EMAIL_VERIFICARION === 'true',
  ROUTEE_AUTH_TOKEN: process.env.ROUTEE_AUTH_TOKEN || 'routeePass',
  SMS_ACTIVE: 'true',
  SMS_KEY: process.env.SMS_KEY || 'routeePass',
  GOOGLE_LOGGIN: process.env.GOOGLE_LOGGIN === 'true',
  FACEBOOK_LOGGIN: process.env.FACEBOOK_LOGGIN === 'true',
  APPLE_LOGGIN: process.env.APPLE_LOGGIN === 'true',
  AZURE_LOGGIN: process.env.AZURE_LOGGIN === 'true',
  APPLE_REDIRECT_URI: process.env.APPLE_REDIRECT_URI || 'https://starterapi.gr',
  CREDENTIALS_TENANT_ID: process.env.CREDENTIALS_TENANT_ID || 'c7155c54-X-X',
  CREDENTIALS_CLIENT_ID: process.env.CREDENTIALS_CLIENT_ID || 'c438b765-X-X',
  CREDENTIALS_AUDIENCE_ID: process.env.CREDENTIALS_AUDIENCE_ID || 'c438b765-X-X',
  RESOURCE_SCOPE_AS_USER: process.env.RESOURCE_SCOPE_AS_USER || 'access_as_user',
  METADATA_AUTHORITY: process.env.METADATA_AUTHORITY || 'login.microsoftonline.com',
  METADATA_DISCOVERY: process.env.METADATA_DISCOVERY || '.well-known/openid-configuration',
  METADATA_VERSION: process.env.METADATA_VERSION || 'v2.0',
  SETTINGS_VALIDATE_ISSUER: process.env.SETTINGS_VALIDATE_ISSUER === 'true',
  SETTINGS_PASS_REQ_TO_CALLBACK: process.env.SETTINGS_PASS_REQ_TO_CALLBACK === 'true',
  SETTINGS_LOGGING_LEVEL: process.env.SETTINGS_LOGGING_LEVEL || 'error',
  GOOGLE_CHAT_WEBHOOK_URL: process.env.GOOGLE_CHAT_WEBHOOK_URL || '',
  ADMIN_USER: {
    PHONE: process.env.ADMIN_USER_PHONE || '6985593940',
    EMAIL: process.env.ADMIN_USER_EMAIL || 'info@softweb.gr',
    PASSWORD: process.env.ADMIN_USER_PASSWORD || 'password',
  },
};
