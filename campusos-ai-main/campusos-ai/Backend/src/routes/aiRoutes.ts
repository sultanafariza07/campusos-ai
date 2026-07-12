import { Router } from 'express';
import { handleChat } from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// @route   POST /api/ai/chat
// @desc    Send a message to the AI assistant
// @access  Private
router.post('/chat', protect, handleChat);

export default router;