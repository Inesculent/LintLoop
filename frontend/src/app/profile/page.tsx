'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Navigation } from '../components/Navigation';
import { LoadingPage } from '../components/LoadingSpinner';

interface UserProfile {
  username: string;
  email: string;
  joinedDate: string;
  stats: {
    totalSubmissions: number;
    problemsSolved: number;
    acceptanceRate: number;
    averageScore: number;
    streak: number;
    rank: number;
  };
  recentActivity: {
    date: string;
    action: string;
    details: string;
  }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
        
        const response = await fetch(`${apiBase}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();

        // Map backend user object to front-end profile shape
        const mapped: UserProfile = {
          username: data.username || data.email || 'User',
          email: data.email || '',
          joinedDate: data.createdAt || data.updatedAt || new Date().toISOString(),
          stats: {
            totalSubmissions: data.totalSubmissions ?? 0,
            problemsSolved: data.problems_solved ?? 0,
            acceptanceRate: Math.round((data.problems_solved && data.totalSubmissions) ? ((data.problems_solved / data.totalSubmissions) * 100) : (data.acceptanceRate ?? 0) * 10) || 0,
            averageScore: data.averageScore ?? 0,
            streak: data.streak ?? 0,
            rank: data.rank ?? 0
          },
          recentActivity: (data.recentActivity || []).map((a: any) => ({ date: a.date, action: a.action, details: a.details }))
        };

        setProfile(mapped);
      } catch (error) {
        console.error('Profile fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <LoadingPage />
          ) : profile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Overview */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center">
                    <div className="h-24 w-24 rounded-full bg-blue-500 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-3xl text-white font-bold">
                        {profile.username[0].toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {profile.username}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Member since {formatDate(profile.joinedDate)}
                    </p>
                  </div>
                  
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Problems Solved</span>
                        <span className="font-semibold text-gray-900">{profile.stats.problemsSolved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Acceptance Rate</span>
                        <span className="font-semibold text-gray-900">{profile.stats.acceptanceRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Average Score</span>
                        <span className="font-semibold text-gray-900">{profile.stats.averageScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Current Streak</span>
                        <span className="font-semibold text-gray-900">{profile.stats.streak} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Rank</span>
                        <span className="font-semibold text-gray-900">#{profile.stats.rank}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {profile.recentActivity.map((activity, index) => (
                      <div key={index} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">
                              {activity.action}
                            </span>
                            {' '}
                            <span className="text-gray-700">
                              {activity.details}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {new Date(activity.date).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
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