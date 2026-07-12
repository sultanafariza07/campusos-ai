import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending the auth token cookie
});

export const postChatMessage = async (
  message: string,
  token: string
): Promise<{ reply: string }> => {
  try {
    const response = await api.post(
      '/ai/chat',
      { message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error posting chat message:', error);
    throw error;
  }
};