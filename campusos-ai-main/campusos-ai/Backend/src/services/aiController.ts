import { Request, Response } from 'express';
import { getChatCompletion } from '../services/aiService';
import { query } from '../db/index.js';
import { AuthedRequest } from '../middleware/authMiddleware';

export const handleChat = async (req: AuthedRequest, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // In a real app, you might want to record the user's interaction
    // For example: await prisma.aiChat.create({ data: { userId: req.user.id, message }});
    await query('INSERT INTO ai_chats (user_id) VALUES ($1)', [req.user!.id]);
    const reply = await getChatCompletion(message.trim());

    res.status(200).json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    res
      .status(500)
      .json({
        error: 'An error occurred while processing your request. Please try again later.',
      });
  }
};