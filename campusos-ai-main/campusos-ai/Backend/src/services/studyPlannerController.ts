import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import * as studyPlannerService from '../services/studyPlannerService';

export const getSessions = async (req: AuthedRequest, res: Response) => {
  try {
    const sessions = await studyPlannerService.getSessionsForUser(req.user!.id);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve study sessions.' });
  }
};

export const createSession = async (req: AuthedRequest, res: Response) => {
  const { subject, topic, studyDate, study_date } = req.body;
  const date = studyDate || study_date;

  if (!subject?.trim() || !topic?.trim() || !date) {
    return res.status(400).json({ error: 'Subject, topic, and studyDate are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  try {
    const session = await studyPlannerService.createSessionForUser(req.user!.id, {
      subject: subject.trim(),
      topic: topic.trim(),
      studyDate: date,
    });
    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create study session.' });
  }
};

export const updateSession = async (req: AuthedRequest, res: Response) => {
  const sessionId = parseInt(req.params.id, 10);
  if (isNaN(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  const { subject, topic, studyDate, study_date, completed } = req.body;
  const updateData: Parameters<typeof studyPlannerService.updateSessionForUser>[2] = {};

  if (subject !== undefined) updateData.subject = subject.trim();
  if (topic !== undefined) updateData.topic = topic.trim();
  if (studyDate !== undefined || study_date !== undefined) {
    updateData.studyDate = studyDate || study_date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(updateData.studyDate!)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
  }
  if (completed !== undefined) updateData.completed = !!completed;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No update data provided.' });
  }

  try {
    const session = await studyPlannerService.updateSessionForUser(req.user!.id, sessionId, updateData);
    if (!session) {
      return res.status(404).json({ error: 'Study session not found.' });
    }
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update study session.' });
  }
};

export const deleteSession = async (req: AuthedRequest, res: Response) => {
  const sessionId = parseInt(req.params.id, 10);
  if (isNaN(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  try {
    const deleted = await studyPlannerService.deleteSessionForUser(req.user!.id, sessionId);
    if (!deleted) {
      return res.status(404).json({ error: 'Study session not found.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete study session.' });
  }
};