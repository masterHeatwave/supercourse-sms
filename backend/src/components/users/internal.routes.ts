import express from 'express';
import { InternalController } from './internal.controller';
import { verifyApiKey } from '@middleware/verifyApiKey';

const router = express.Router();
const internalController = new InternalController();

router.use(verifyApiKey);

router.post('/schools', internalController.createSchool);
router.post('/branches', internalController.createBranch);

export default router;
