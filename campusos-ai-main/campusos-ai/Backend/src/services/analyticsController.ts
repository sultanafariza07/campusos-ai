import { Response } from 'express';
import { AuthedRequest } from '../middleware/authMiddleware';
import { getAnalyticsForUser } from '../services/analyticsService';

export const getAnalytics = async (req: AuthedRequest, res: Response) => {
  try {
    const analyticsData = await getAnalyticsForUser(req.user!.id);
    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics data.' });
  }
};