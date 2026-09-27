import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { requireSuperadmin } from '../middleware/superadmin.js';
import { getHealth, getMessages, sendTestSms, getErrors, deleteErrors } from '../controllers/systemController.js';
import {
  getAnalytics,
  getInsights,
  listSchools,
  createSchool,
  updateSchoolStatus,
} from '../controllers/superadminController.js';

const router = express.Router();

router.use(protectAdmin, requireSuperadmin);

router.get('/analytics', getAnalytics);
router.get('/insights', getInsights);

// Developer tools (System page)
router.get('/system/health', getHealth);
router.get('/system/messages', getMessages);
router.post('/system/messages/test', sendTestSms);
router.route('/system/errors').get(getErrors).delete(deleteErrors);
router.get('/schools', listSchools);
router.post('/schools', createSchool);
router.patch('/schools/:id/status', updateSchoolStatus);

export default router;