import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasksController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.route('/').get(getTasks).post(createTask);

router.route('/:id').put(updateTask).delete(deleteTask);

export default router;