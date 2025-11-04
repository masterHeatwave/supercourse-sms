import express from 'express';
import { authorize } from '@middleware/authorize';
import errorController from '@components/error/error.controller';

export const errorRouter = express.Router();

errorRouter.route('/').post(authorize('ERROR_CREATE'), errorController.create);
