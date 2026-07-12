import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/').all(protect).get(getSettings).put(updateSettings);

export default router;