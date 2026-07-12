import { Router } from 'express';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/studyPlannerController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.route('/').get(getSessions).post(createSession);

router.route('/:id').put(updateSession).delete(deleteSession);

export default router;