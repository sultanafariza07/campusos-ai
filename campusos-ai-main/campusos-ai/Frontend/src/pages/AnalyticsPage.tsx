import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertTriangle, TrendingUp, CheckCircle, BookOpen, Bot } from 'lucide-react';

interface AnalyticsData {
  tasksCompleted: number;
  tasksPending: number;
  notesCreated: number;
  aiChats: number;
  studySessionsCompleted: number;
  studySessionsPending: number;
  productivityScore: number;
  weeklyActivity: { day: string; tasks: number; notes: number; study: number }[];
}

const getProductivityFeedback = (score: number) => {
  if (score >= 80) return { text: 'Excellent', color: 'text-green-400' };
  if (score >= 60) return { text: 'Good', color: 'text-blue-400' };
  if (score >= 40) return { text: 'Average', color: 'text-yellow-400' };
  return { text: 'Needs Improvement', color: 'text-red-400' };
};

const StatCard = ({ icon: Icon, value, label, color }: { icon: React.ElementType, value: number, label: string, color: string }) => (
    <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-400">{label}</h3>
            <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
);

const ProgressCard = ({ title, completed, total }: { title: string, completed: number, total: number }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
        <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-baseline mb-2">
                <h4 className="text-sm font-semibold text-white">{title}</h4>
                <span className="text-xs text-gray-400">{completed} / {total}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <p className="text-right text-xs text-purple-400 mt-1">{percentage}% Complete</p>
        </div>
    );
};

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await api.get('/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (err) {
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong.</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (!data || data.productivityScore === 0 && data.tasksCompleted === 0 && data.notesCreated === 0) {
    return (
        <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-10 h-10 text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Analytics Available Yet</h2>
            <p className="text-gray-400 max-w-sm">Start using CampusOS by creating tasks, notes, and study sessions to see your progress here.</p>
        </div>
    );
  }

  const productivity = getProductivityFeedback(data.productivityScore);

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Analytics & Progress</h1>
        <p className="text-gray-400 mt-1">An overview of your academic productivity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={CheckCircle} value={data.tasksCompleted} label="Tasks Done" color="text-green-400" />
            <StatCard icon={BookOpen} value={data.studySessionsCompleted} label="Sessions Done" color="text-blue-400" />
            <StatCard icon={Bot} value={data.aiChats} label="AI Chats" color="text-purple-400" />
            <StatCard icon={TrendingUp} value={data.notesCreated} label="Notes Created" color="text-yellow-400" />
          </div>

          <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={data.weeklyActivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: '1px solid #4b5563',
                                borderRadius: '0.75rem',
                            }}
                            labelStyle={{ color: '#d1d5db' }}
                        />
                        <Bar dataKey="tasks" stackId="a" fill="#4ade80" name="Tasks" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="study" stackId="a" fill="#60a5fa" name="Study" />
                        <Bar dataKey="notes" stackId="a" fill="#c084fc" name="Notes" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-center">
                <h3 className="font-semibold text-white/80">Productivity Score</h3>
                <p className="text-5xl font-bold my-2">{data.productivityScore}</p>
                <p className={`font-semibold ${productivity.color}`}>{productivity.text}</p>
            </div>

            <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-4 space-y-4">
                <h3 className="text-lg font-semibold">Progress</h3>
                <ProgressCard 
                    title="Task Completion"
                    completed={data.tasksCompleted}
                    total={data.tasksCompleted + data.tasksPending}
                />
                <ProgressCard 
                    title="Study Plan"
                    completed={data.studySessionsCompleted}
                    total={data.studySessionsCompleted + data.studySessionsPending}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;