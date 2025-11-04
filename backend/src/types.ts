import { IUser } from '@components/users/user.interface';
import { Model } from 'mongoose';
import { Document } from 'mongoose';

declare module 'mongoose' {
  // eslint-disable-next-line
  interface Query<ResultType, DocType extends Document> {
    bypassDistributorFilter(): this;
    withCurrentUser(user: IUser): this;
  }

  interface Schema {
    currentUser?: string;
  }
}

export interface IResponse<T> {
  status?: number;
  error?: string;
  data?: T;
  message?: string;
  success: boolean;
  count?: number;
}

export const APIResponses = {
  CUSTOMER: {
    CUSTOMER_NOT_FOUND: 'customer_not_found',
    CUSTOMER_EXISTS: 'customer_exists',
    CUSTOMER_CREATED: 'customer_created',
    CUSTOMER_ARCHIVED: 'customer_archived',
    CUSTOMER_UPDATED: 'customer_updated',
    CUSTOMER_UPDATED_ONLY_PRIMARY_SUBSTOR: 'customer_updated_only_primary_substore',
    CUSTOMER_UNARCHIVED: 'customer_unarchived',
    SUBSTORE_NOT_FOUND: 'substore_not_found',
  },
  USER: {
    USER_REGISTERED_SUCCESS: 'user_registered_success',
    USER_EXISTS: 'user_already_exists',
    USER_ARCHIVED: 'user_archived',
    USER_UNARCHIVED: 'user_unarchived',
    USER_PRIMARY_CONTACT_SUCCESS: 'user_primary_contact_success',
    PASSWORD_EMAIL_RESENT: 'user_password_email_resent',
  },
  DISTRIBUTOR: {
    DISTRIBUTOR_NOT_FOUND: 'distributor_not_found',
    DISTRIBUTOR_EXISTS: 'distributor_exists',
    DISTRIBUTOR_CREATED: 'distributor_created',
    DISTRIBUTOR_ARCHIVED: 'distributor_archived',
    DISTRIBUTOR_UNARCHIVED: 'distributor_unarchived',
  },
  PRODUCTS: {
    PRODUCTS_UPDATED_SUCCESS: 'products_updated_success',
    PRODUCT_DELETED_SUCCESS: 'product_deleted_success',
    ONLY_ADMIN_CAN_EDIT: 'only_admin_can_edit',
    EDIT_PRODUCT_DENY: 'Forbidden to edit product',
    PRODUCT_NOT_FOUND: 'product_not_found',
    PRODUCT_ARCHIVED: 'product_archived',
    PRODUCT_UNARCHIVED: 'product_unarchived',
  },
  PRODUCT_ASSETS: {
    PRODUCT_ASSET_NOT_FOUND: 'product_asset_not_found',
  },
  AUTH: {
    AUTHENTICATION_SUCCESS: 'authentication_success',
    AUTHENTICATE_AS_LIST: 'authenticate_as_list',
    AUTHENTICATE_AS_CREDENTIAL_SUCCESS: 'authenticate_as_credential_success',
    TOKEN_REFRESHED_SUCCESS: 'token_refreshed_success',
    EMAIL_VERIFICATION_SUCCESS: 'email_verification_success',
    RESET_TOKEN_SENT: 'reset_token_sent',
    PASSWORD_RESET_SUCCESS: 'password_reset_success',
    LOGOUT_SUCCESS: 'logout_success',
    ACCOUNT_INACTIVE: 'account_inactive',
  },
  NOTES: {
    NOTE_CREATED_SUCCESS: 'note_created_success',
    NOTE_NOT_FOUND: 'note_not_found',
    NOTE_UPDATED_SUCCESS: 'note_updated_success',
    NOTE_DELETED_SUCCESS: 'note_deleted_success',
  },
  FILES: {
    UPLOAD_FAILD: 'file_upload_failed',
    UPLOAD_SUCCESS: 'file_upload_success',
    FILE_NOT_FOUND: 'file_not_found',
    FILE_DELETED: 'file_deleted',
  },
  MEDIA: {
    MEDIA_UPLOADED_SUCCESS: 'media_uploaded_success',
    MEDIA_UPLOADED_FAILED: 'media_uploaded_failed',
  },
  RESOURCE_NOT_FOUND: 'resource_not_found',
  INVALID_TOKEN: 'invalid_token',
  RESOURCE_EXISTS: 'resource_exists',
  INVALID_CREDENTIALS: 'invalid_credentials',
  VALIDATION_ERROR: 'validation_error',
};

export interface IModelCurrentUserContenxt<T extends Document> extends Model<T> {
  setCurrentUser(id: string): void;
  getCurrentUser(): string;
  canEdit(): Promise<boolean>;
}
