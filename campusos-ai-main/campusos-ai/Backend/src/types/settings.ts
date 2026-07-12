export interface UserSettings {
  id: number;
  userId: number;
  theme: 'dark' | 'light';
  notifications: boolean;
  emailNotifications: boolean;
  aiSuggestions: boolean;
  createdAt: string;
  updatedAt: string;
}