import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, clearToken } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Bell, Mail, Bot, Sun, Moon, Shield, LogOut, Info, Lock, ExternalLink } from 'lucide-react';

interface UserSettings {
  notifications: boolean;
  emailNotifications: boolean;
  aiSuggestions: boolean;
  theme: 'dark' | 'light';
}

const ToggleSwitch = ({ label, enabled, onChange, loading }: { label: string, enabled: boolean, onChange: (enabled: boolean) => void, loading: boolean }) => (
    <div className="flex items-center justify-between py-3">
        <span className="text-sm text-gray-300">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                enabled ? 'bg-purple-600' : 'bg-gray-600'
            }`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
        </button>
    </div>
);

const Section = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: React.ElementType }) => (
    <div className="bg-gray-800/50 border border-white/10 rounded-2xl">
        <h3 className="px-4 py-3 border-b border-white/10 text-sm font-semibold text-gray-400 flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
        </h3>
        <div className="p-4 space-y-2">{children}</div>
    </div>
);

const SettingsPage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const { data } = await api.get('/settings', { headers: { Authorization: `Bearer ${token}` } });
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const handleSettingChange = async (key: keyof UserSettings, value: boolean) => {
    if (!settings) return;
    
    const oldSettings = { ...settings };
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);

    try {
      await api.put('/settings', { [key]: value }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error("Failed to update settings", error);
      setSettings(oldSettings); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    clearToken();
    navigate('/');
  };

  if (loading) {
    return <div className="p-6 bg-gray-900 text-white min-h-screen flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences.</p>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        <Section title="Account" icon={User}>
            <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Name</span>
                <span className="text-sm font-medium text-white">{user?.name || '...'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Email</span>
                <span className="text-sm font-medium text-white">{user?.email || '...'}</span>
            </div>
        </Section>

        <Section title="Preferences" icon={Bell}>
            {settings && (
                <>
                    <ToggleSwitch label="In-App Notifications" enabled={settings.notifications} onChange={(val) => handleSettingChange('notifications', val)} loading={saving} />
                    <ToggleSwitch label="Email Notifications" enabled={settings.emailNotifications} onChange={(val) => handleSettingChange('emailNotifications', val)} loading={saving} />
                    <ToggleSwitch label="AI Suggestions" enabled={settings.aiSuggestions} onChange={(val) => handleSettingChange('aiSuggestions', val)} loading={saving} />
                </>
            )}
            <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-300">Theme</span>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 bg-purple-600 rounded-full px-3 py-1 text-sm"><Moon className="w-4 h-4"/> Dark</button>
                    <button className="flex items-center gap-2 bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-400 cursor-not-allowed" disabled><Sun className="w-4 h-4"/> Light</button>
                </div>
            </div>
        </Section>

        <Section title="Security" icon={Shield}>
            <button className="w-full text-left text-sm text-gray-400 py-2 px-1 rounded-md hover:bg-white/5 transition-colors flex justify-between items-center" disabled>
                <span>Change Password</span>
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">Coming Soon</span>
            </button>
            <button onClick={handleLogout} className="w-full text-left text-sm text-red-400 py-2 px-1 rounded-md hover:bg-red-500/10 transition-colors flex justify-between items-center">
                <span>Logout</span>
                <LogOut className="w-4 h-4" />
            </button>
        </Section>

        <Section title="About" icon={Info}>
            <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-400">CampusOS Version</span>
                <span className="font-mono text-white">1.0.0</span>
            </div>
             <a href="https://github.com/divyanshu-budhia/campusos-ai" target="_blank" rel="noopener noreferrer" className="w-full text-left text-sm text-gray-300 py-2 px-1 rounded-md hover:bg-white/5 transition-colors flex justify-between items-center">
                <span>GitHub Repository</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <a href="#" className="w-full text-left text-sm text-gray-300 py-2 px-1 rounded-md hover:bg-white/5 transition-colors flex justify-between items-center">
                <span>Privacy Policy</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
             <a href="#" className="w-full text-left text-sm text-gray-300 py-2 px-1 rounded-md hover:bg-white/5 transition-colors flex justify-between items-center">
                <span>Terms of Service</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
        </Section>
      </div>
    </div>
  );
};

export default SettingsPage;

