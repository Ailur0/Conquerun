import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { X, User as UserIcon, Lock } from 'lucide-react';
import { isValidPassword, isValidUsername, USERNAME_HINT } from '../utils/validation';
import { PasswordChecklist } from '../components/Auth/PasswordChecklist';

interface SettingsPageProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (username: string) => Promise<{ success: boolean; error?: string }>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

type SettingsTab = 'profile' | 'security';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'security', label: 'Security', icon: Lock },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onClose, onUpdateUser, onChangePassword }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [username, setUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const switchTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setMessage(null);
  };

  const usernameChanged = username.trim() !== user.username;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!isValidUsername(username)) {
      setMessage({ type: 'error', text: `Username must be ${USERNAME_HINT.toLowerCase()}.` });
      return;
    }
    setIsSaving(true);
    const result = await onUpdateUser(username.trim());
    setIsSaving(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!isValidPassword(newPassword)) {
      setMessage({ type: 'error', text: "Your new password doesn't meet all the requirements yet." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setIsSaving(true);
    const result = await onChangePassword(currentPassword, newPassword);
    setIsSaving(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to change password.' });
    }
  };

  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex sm:items-center justify-center sm:p-4 fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-100 safe-top">
          <h2 id="settings-title" className="text-xl font-bold text-gray-900">Settings</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100" aria-label="Close settings">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Tabs: a row on phones, a sidebar on larger screens */}
          <nav className="flex sm:flex-col gap-1 p-2 sm:p-4 sm:w-48 border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50" aria-label="Settings sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                {label}
              </button>
            ))}
          </nav>

          <main className="flex-1 p-4 sm:p-6 overflow-y-auto safe-bottom">
            {message && (
              <div
                role={message.type === 'error' ? 'alert' : 'status'}
                className={`p-3 mb-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
              >
                {message.text}
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} noValidate>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="settings-username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      id="settings-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      aria-describedby="settings-username-hint"
                      className="input-field"
                    />
                    <p id="settings-username-hint" className="mt-1.5 text-xs text-gray-500">{USERNAME_HINT}</p>
                  </div>
                  <div>
                    <label htmlFor="settings-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="settings-email" value={user.email} readOnly className="input-field bg-gray-100 text-gray-600 cursor-not-allowed" />
                    <p className="mt-1.5 text-xs text-gray-500">Email address cannot be changed.</p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!usernameChanged || isSaving}
                  className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} noValidate>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change password</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">Current password</label>
                    <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                    <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className="input-field" />
                    <PasswordChecklist password={newPassword} className="mt-2" />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-invalid={passwordsMismatch}
                      className={`input-field ${passwordsMismatch ? 'border-red-400' : ''}`}
                    />
                    {passwordsMismatch && <p className="mt-1.5 text-xs text-red-600">Passwords don't match yet.</p>}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!currentPassword || !newPassword || isSaving}
                  className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving ? 'Saving...' : 'Change password'}
                </button>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
