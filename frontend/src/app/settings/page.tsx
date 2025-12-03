'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Navigation } from '../components/Navigation';
import { LoadingPage } from '../components/LoadingSpinner';

interface UserSettings {
  profile: {
    uid?: number;
    username: string;
    email: string;
    name: string;
    bio: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    defaultLanguage: string;
  };
  account: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'account'>('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Fetch current user profile and use it to populate settings.profile
        const profileRes = await fetch(`${apiBase}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!profileRes.ok) {
          switch (profileRes.status) {
            case 401:
              throw new Error('Your session has expired. Please log in again.');
            case 403:
              throw new Error('You do not have permission to access these settings.');
            case 404:
              throw new Error('Profile not found.');
            default:
              throw new Error(`Failed to fetch profile: ${profileRes.statusText}`);
          }
        }

        const profileData = await profileRes.json();

        // Build initial settings object with sensible defaults for preferences/account
        const initial: UserSettings = {
          profile: {
            uid: profileData.uid,
            username: profileData.username || profileData.email || '',
            email: profileData.email || '',
            name: profileData.name || '',
            bio: profileData.bio || ''
          },
          preferences: {
            theme: 'system',
            emailNotifications: true,
            defaultLanguage: 'python'
          },
          account: {
            twoFactorEnabled: profileData.twoFactorEnabled || false,
            lastPasswordChange: profileData.updatedAt || new Date().toISOString()
          }
        };

        setSettings(initial);
      } catch (error) {
        console.error('Settings fetch error:', error);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (section: 'profile' | 'preferences' | 'account') => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      if (!token) throw new Error('Authentication token not found');

      if (section === 'profile') {
        // PATCH user profile
        const uid = settings?.profile.uid;
        if (!uid) throw new Error('User id not available');

        const payload = {
          username: settings?.profile.username,
          name: settings?.profile.name,
          bio: settings?.profile.bio
        };

        const response = await fetch(`${apiBase}/api/users/${uid}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || 'Failed to save profile');
        }

        const data = await response.json();
        // Update local state with returned user
        setSettings((prev) => prev ? ({ ...prev, profile: { ...prev.profile, username: data.user.username, name: data.user.name, bio: data.user.bio } }) : prev);
        setMessage({ type: 'success', text: 'Profile saved successfully' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      // For preferences/account we still send to the settings endpoints (if any)
      const response = await fetch(`${apiBase}/api/settings/${section}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings?.[section])
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Settings save error:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    section: keyof UserSettings,
    field: string,
    value: string | boolean
  ) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (!settings?.profile.uid) {
      setMessage({ type: 'error', text: 'Unable to determine user id' });
      return;
    }

    const confirmed = confirm('Are you sure you want to delete your account? This action is irreversible.');
    if (!confirmed) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const response = await fetch(`${apiBase}/api/users/${settings.profile.uid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to delete account');
      }

      // On success, clear local token and redirect to signin
      localStorage.removeItem('token');
      setMessage({ type: 'success', text: 'Account deleted. Redirecting...' });
      setTimeout(() => router.push('/signin'), 800);
    } catch (err) {
      console.error('Delete account error', err);
      setMessage({ type: 'error', text: 'Failed to delete account' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <LoadingPage />
          ) : settings && (
            <div className="max-w-4xl mx-auto">
              {message && (
                <div className={`mb-4 p-4 rounded-lg ${
                  message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="bg-white rounded-lg shadow">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    {(['profile', 'preferences', 'account'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-4 px-6 text-sm font-medium ${
                          activeTab === tab
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <input
                          type="text"
                          value={settings.profile.username}
                          onChange={(e) => handleInputChange('profile', 'username', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.profile.email}
                          onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <input
                          type="text"
                          value={settings.profile.name}
                          onChange={(e) => handleInputChange('profile', 'name', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bio
                        </label>
                        <textarea
                          value={settings.profile.bio}
                          onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                          rows={4}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Theme
                        </label>
                        <select
                          value={settings.preferences.theme}
                          onChange={(e) => handleInputChange('preferences', 'theme', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.preferences.emailNotifications}
                            onChange={(e) => handleInputChange('preferences', 'emailNotifications', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Enable email notifications
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Default Programming Language
                        </label>
                        <select
                          value={settings.preferences.defaultLanguage}
                          onChange={(e) => handleInputChange('preferences', 'defaultLanguage', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="python">Python</option>
                          <option value="javascript">JavaScript</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'account' && (
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.account.twoFactorEnabled}
                            onChange={(e) => handleInputChange('account', 'twoFactorEnabled', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Enable Two-Factor Authentication
                          </span>
                        </label>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Last password change: {new Date(settings.account.lastPasswordChange).toLocaleDateString()}
                        </p>
                        <button
                          className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Change Password
                        </button>
                      </div>
                      <div className="border-t border-gray-200 pt-6">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={saving}
                          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {saving ? 'Processing...' : 'Delete Account'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handleSave(activeTab)}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}