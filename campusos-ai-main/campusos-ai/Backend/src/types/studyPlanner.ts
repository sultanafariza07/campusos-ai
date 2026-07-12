export interface StudySession {
  id: number;
  userId: number;
  subject: string;
  topic: string;
  studyDate: string; // Stored as YYYY-MM-DD
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}