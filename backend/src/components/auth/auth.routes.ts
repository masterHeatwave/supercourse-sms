import express from 'express';
import auth from './auth.controller';
import { authorize } from '@middleware/authorize';

export const authRouter = express.Router();

authRouter.route('/login').post(auth.authenticate);
authRouter.route('/register').post(auth.register);
authRouter.route('/refresh').post(auth.refresh);
authRouter.route('/verify-email').get(auth.verifyEmail);
authRouter.route('/forgot-password').post(auth.forgotPassword);
authRouter.route('/reset-password').post(auth.resetPassword);
authRouter.route('/logout').post(auth.logout);
// Parent/student impersonation
authRouter.route('/impersonate/student/:id').post(authorize(['ADMIN', 'MANAGER', 'PARENT']), auth.impersonateStudent);
