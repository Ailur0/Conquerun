import React, { useState } from 'react';
import { User } from '../types';
import { X, User as UserIcon, Lock, Map as MapIcon } from 'lucide-react';

interface SettingsPageProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (username: string) => Promise<{ success: boolean; error?: string }>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onClose, onUpdateUser, onChangePassword }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [username, setUsername] = useState(user.username);
  const [email] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onUpdateUser(username);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    const result = await onChangePassword(currentPassword, newPassword);
    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to change password.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-1/4 border-r bg-gray-50 p-4">
            <nav className="flex flex-col space-y-2">
              <button onClick={() => setActiveTab('profile')} className={`flex items-center space-x-3 p-2 rounded-md text-sm font-medium ${activeTab === 'profile' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}>
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button onClick={() => setActiveTab('security')} className={`flex items-center space-x-3 p-2 rounded-md text-sm font-medium ${activeTab === 'security' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}>
                <Lock className="w-5 h-5" />
                <span>Security</span>
              </button>
              <button onClick={() => setActiveTab('map')} className={`flex items-center space-x-3 p-2 rounded-md text-sm font-medium ${activeTab === 'map' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}>
                <MapIcon className="w-5 h-5" />
                <span>Map</span>
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {message && (
              <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">User Profile</h3>
                <form onSubmit={handleProfileUpdate}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                      <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" id="email" value={email} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed focus:outline-none" />
<p className="mt-1 text-xs text-gray-500">Email address cannot be changed.</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save Changes</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                      <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                      <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                      <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Change Password</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'map' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Map Settings</h3>
                <p className="text-gray-600">Map customization options will be available in a future update.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
