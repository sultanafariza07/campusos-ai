import { Response } from 'express';
import { AuthedRequest } from '../middleware/authMiddleware';
import * as settingsService from '../services/settingsService';

export const getSettings = async (req: AuthedRequest, res: Response) => {
  try {
    const settings = await settingsService.getSettingsForUser(req.user!.id);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
};

export const updateSettings = async (req: AuthedRequest, res: Response) => {
  const { notifications, emailNotifications, aiSuggestions } = req.body;

  const updateData: Parameters<typeof settingsService.updateSettingsForUser>[1] = {};

  if (typeof notifications === 'boolean') updateData.notifications = notifications;
  if (typeof emailNotifications === 'boolean') updateData.emailNotifications = emailNotifications;
  if (typeof aiSuggestions === 'boolean') updateData.aiSuggestions = aiSuggestions;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No valid settings provided for update.' });
  }

  try {
    const settings = await settingsService.updateSettingsForUser(req.user!.id, updateData);
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found for user.' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};