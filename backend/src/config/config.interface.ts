export interface ENV {
  GOOGLE_CHAT_WEBHOOK_URL: string;
  ADMIN_USER: {
    EMAIL: string;
    PASSWORD: string;
    PHONE: string;
  };
  REDIS: {
    HOST: string;
    PORT: number;
  };
  UPLOADS: {
    PUBLIC_PATH: string;
    LOCAL_PATH: string;
    MAX_UPLOAD: number;
    MAX_GALLERY: number;
  };
  ENCRYPT: {
    KEY: string;
    IV: string;
  };
  AUTH: {
    LOGIN_STRATEGY: string;
    MAX_LOGGEN_IN_DEVICES: 2 | number;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_ID_IOS: string;
    SALT_ROUNDS: number;
  };
  CRYPT_FILES: {
    CRYPT_ALGORITHM: string;
    IV: string;
    KEY: string;
  };
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  TZ: 'Europe/Athens' | string;
  PROJECT_NAME: string;
  LOGIN_STRATEGY: 'emailLoginStrategy' | 'usernameLoginStrategy' | 'smsLoginStrategy';
  MAX_LOGGEN_IN_DEVICES: 2 | number;

  MONGO_URI: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_ENCRYPT_SECRET: string;

  FILE_LOCAL_UPLOAD_PATH: string;
  FILE_PUBLIC_UPLOAD_PATH: string;
  MAX_FILE_UPLOAD: number;

  API_KEY: string;
  SCAP_API_KEY: string;

  REQUEST_BODY_ENCRYPT_KEY: string;
  REQUEST_BODY_IV_KEY: string;

  CRYPTO_ALGORITHM: string;
  FILE_CRYPT_KEY: string;
  FILE_CRYPT_IV: string;

  JWT_SECRET: string;
  JWT_EXPIRE: '30d' | string;
  JWT_COOKIE_EXPIRE: number;
  REFRESH_TOKEN_EXPIRE: number;
  JWT_CHECK_EMAIL_VERIFICATION: boolean;
  JWT_REFRESH_EXPIRE: number;

  OS_JWT_SECRET: string;
  OS_JWT_SUB: string;
  OS_JWT_EXPIRE_AT: number;

  CHECK_EMAIL_VERIFICARION: boolean;

  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_EMAIL: string;
  SMTP_PASSWORD: string;
  FROM_EMAIL: string;
  FROM_NAME: string;

  ROUTEE_AUTH_TOKEN: string;
  SMS_ACTIVE: string;
  SMS_KEY: string;

  WEB_HOST: string;
  ADMIN_HOST: string;
  API_HOST: string;
  SUPERCOURSE_API_URL: string;

  GOOGLE_LOGGIN: boolean;
  FACEBOOK_LOGGIN: boolean;
  APPLE_LOGGIN: boolean;
  AZURE_LOGGIN: boolean;

  APPLE_REDIRECT_URI: string;

  // # AZURE CREDENTIALS
  CREDENTIALS_TENANT_ID: string;
  CREDENTIALS_CLIENT_ID: string;
  CREDENTIALS_AUDIENCE_ID: string;

  RESOURCE_SCOPE_AS_USER: string;

  METADATA_AUTHORITY: string;
  METADATA_DISCOVERY: string;
  METADATA_VERSION: string;

  SETTINGS_VALIDATE_ISSUER: boolean;
  SETTINGS_PASS_REQ_TO_CALLBACK: boolean;
  SETTINGS_LOGGING_LEVEL: string;
}
