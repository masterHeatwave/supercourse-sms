import express from 'express';
import { authorize } from '@middleware/authorize';
import rolesController from '@components/roles/role.controller';

export const roleRouter = express.Router();

roleRouter.route('/').get(authorize('ROLE_QUERY_ALL'), rolesController.queryAll);
roleRouter.route('/').post(authorize('ROLE_CREATE'), rolesController.create);

export default roleRouter;
