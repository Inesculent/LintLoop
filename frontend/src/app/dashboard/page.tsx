'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Navigation } from '../components/Navigation';

interface User {
  name: string;
  email: string;
  uid: number;
}

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solved?: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

        // Fetch user profile, problems, and submissions in parallel
        const [profileResponse, problemsResponse, submissionsResponse] = await Promise.all([
          fetch(`${apiBase}/api/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${apiBase}/api/problems`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${apiBase}/api/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!profileResponse.ok) throw new Error('Failed to fetch user profile');
        if (!problemsResponse.ok) throw new Error('Failed to fetch problems');

        // Parse all responses
        const [userData, problemsData] = await Promise.all([
          profileResponse.json(),
          problemsResponse.json()
        ]);

        // Handle submissions separately since they might be empty for new users
        const submissionsData = submissionsResponse.ok ? await submissionsResponse.json() : [];

        // Process submissions data
        const solvedProblemIds = new Set(
          submissionsData
            .filter((sub: any) => sub.status === 'Accepted')
            .map((sub: any) => sub.problem.pid)
        );

        // Transform problems data
        const processedProblems = problemsData.map((problem: any) => ({
          id: problem.pid,
          title: problem.title,
          difficulty: problem.difficulty,
          solved: solvedProblemIds.has(problem.pid)
        }));

        setUser(userData);
        setProblems(processedProblems);

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {/* Welcome Section */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h1 className="text-2xl font-bold mb-2 text-gray-900">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-700">
                  Continue your coding practice journey.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Problems Solved</h3>
                  <p className="text-3xl font-bold text-green-800">
                    {problems.filter(p => p.solved).length}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Problems Available</h3>
                  <p className="text-3xl font-bold text-blue-800">
                    {problems.length}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Completion Rate</h3>
                  <p className="text-3xl font-bold text-purple-800">
                    {Math.round((problems.filter(p => p.solved).length / problems.length) * 100)}%
                  </p>
                </div>
              </div>

              {/* Recent Problems */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-900">Available Problems</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Difficulty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {problems.map((problem) => (
                          <tr key={problem.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {problem.solved ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Solved
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Unsolved
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {problem.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${problem.difficulty === 'Easy'
                                    ? 'bg-green-100 text-green-800'
                                    : problem.difficulty === 'Medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {problem.difficulty}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                className="text-indigo-600 hover:text-indigo-900"
                                onClick={() => router.push(`/problems/${problem.id}/solution`)}
                              >
                                Solve
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}