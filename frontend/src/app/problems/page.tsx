'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Navigation } from '../components/Navigation';
import { LoadingPage } from '../components/LoadingSpinner';
import { Problem as ApiProblem, Difficulty } from '../../types/api';

interface ProblemListItem extends Pick<ApiProblem, 'pid' | 'title' | 'difficulty' | 'tags'> {
  solved?: boolean;
  successRate?: number;
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'All' | Difficulty>('All');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
        
        // Fetch problems and submissions in parallel
        const [problemsResponse, submissionsResponse] = await Promise.all([
          fetch(`${apiBase}/api/problems`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${apiBase}/api/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!problemsResponse.ok) {
          throw new Error(`Failed to fetch problems: ${problemsResponse.statusText}`);
        }

        const [problemsData, submissionsData] = await Promise.all([
          problemsResponse.json(),
          submissionsResponse.ok ? submissionsResponse.json() : []
        ]);

        // Create a map of solved problems
        const solvedProblems = new Set(
          submissionsData
            .filter((sub: any) => sub.status === 'Accepted')
            .map((sub: any) => sub.problem.pid)
        );

        // Calculate success rate for each problem
        const problemSubmissions = submissionsData.reduce((acc: any, sub: any) => {
          const pid = sub.problem.pid;
          if (!acc[pid]) {
            acc[pid] = { total: 0, accepted: 0 };
          }
          acc[pid].total++;
          if (sub.status === 'Accepted') {
            acc[pid].accepted++;
          }
          return acc;
        }, {});

        // Transform the problems data
        const problems = problemsData.map((problem: Problem) => {
          const stats = problemSubmissions[problem.pid] || { total: 0, accepted: 0 };
          return {
            ...problem,
            solved: solvedProblems.has(problem.pid),
            successRate: stats.total > 0 
              ? Math.round((stats.accepted / stats.total) * 100) 
              : undefined
          };
        });

        setProblems(problems);
      } catch (error) {
        console.error('Problems fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase()) ||
                         problem.problemStatement.toLowerCase().includes(search.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesDifficulty = difficulty === 'All' || problem.difficulty === difficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <LoadingPage />
          ) : (
            <>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search problems..."
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div>
                    <select
                      className="w-full md:w-auto px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                    >
                      <option value="All">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Problems List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Tags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProblems.map((problem) => (
                      <tr 
                        key={problem.pid}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => window.location.href = `/problems/${problem.pid}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {problem.solved ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Solved
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Todo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {problem.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {problem.problemStatement}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              problem.difficulty === 'Easy' 
                                ? 'bg-green-100 text-green-800'
                                : problem.difficulty === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {problem.tags.map((tag, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {problem.successRate !== undefined ? `${problem.successRate}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}