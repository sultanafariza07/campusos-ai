export interface WeeklyActivity {
  day: string;
  tasks: number;
  notes: number;
  study: number;
}

export interface AnalyticsData {
  tasksCompleted: number;
  tasksPending: number;
  notesCreated: number;
  aiChats: number;
  studySessionsCompleted: number;
  studySessionsPending: number;
  productivityScore: number;
  weeklyActivity: WeeklyActivity[];
}