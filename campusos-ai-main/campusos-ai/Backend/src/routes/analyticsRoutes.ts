import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getAnalytics);

export default router;