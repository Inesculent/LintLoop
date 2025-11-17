'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Navigation } from '../../components/Navigation';
import { LoadingPage } from '../../components/LoadingSpinner';
import { Problem } from '../../../types/api';

export default function ProblemDetailPage() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const rawParams = useParams();
  const pid = Array.isArray(rawParams?.pid) ? rawParams.pid[0] : rawParams?.pid; // useParams is safe in client components

  useEffect(() => {
    const fetchProblem = async () => {
      if (!pid) return; // Guard against undefined pid

      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

        const [problemResponse, submissionsResponse] = await Promise.all([
          fetch(`${apiBase}/api/problems/${pid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${apiBase}/api/submissions?problemId=${pid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!problemResponse.ok) {
          switch (problemResponse.status) {
            case 404:
              throw new Error('Problem not found');
            case 401:
              throw new Error('Please sign in again');
            case 403:
              throw new Error('You do not have permission to view this problem');
            default:
              throw new Error(`Failed to fetch problem: ${problemResponse.statusText}`);
          }
        }

        const [problemData, submissionsData] = await Promise.all([
          problemResponse.json(),
          submissionsResponse.ok ? submissionsResponse.json() : []
        ]);

        // Enhance problem data with submission statistics
        const stats = submissionsData.reduce(
          (acc: any, sub: any) => {
            acc.total++;
            if (sub.status === 'Accepted') acc.accepted++;
            if (sub.executionTime) {
              acc.avgTime = (acc.avgTime * (acc.total - 1) + sub.executionTime) / acc.total;
            }
            return acc;
          },
          { total: 0, accepted: 0, avgTime: 0 }
        );

        const enhancedProblem = {
          ...problemData,
          successRate: stats.total ? Math.round((stats.accepted / stats.total) * 100) : undefined,
          averageTime: stats.avgTime ? Math.round(stats.avgTime) : undefined,
          totalSubmissions: stats.total
        };

        setProblem(enhancedProblem);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch problem');
      } finally {
        setLoading(false);
      }
    };

    if (pid) {
      fetchProblem();
    }
  }, [pid]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <LoadingPage />
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          ) : problem && (
            <div className="space-y-6">
              {/* Problem Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {problem.pid}. {problem.title}
                    </h1>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <div className="flex space-x-2">
                        {problem.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/problems/${problem.pid}/solution`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Solve Problem
                  </button>
                </div>
              </div>

              {/* Problem Description */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Problem Description</h2>
                <div className="prose max-w-none">
                  {problem.problemStatement.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-black">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Examples */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Examples</h2>
                <div className="space-y-6">
                  {problem.examples.map((example, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-black mb-2">Example {index + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-black">Input:</p>
                          <pre className="mt-1 bg-gray-100 rounded p-2 text-sm text-black">{example.input}</pre>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">Output:</p>
                          <pre className="mt-1 bg-gray-100 rounded p-2 text-sm text-black">{example.output}</pre>
                        </div>
                      </div>
                      {example.explanation && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-black">Explanation:</p>
                          <p className="mt-1 text-sm text-black">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Constraints */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Constraints</h2>
                <ul className="list-disc list-inside space-y-2">
                  {problem.constraints.map((constraint, index) => (
                    <li key={index} className="text-black">{constraint}</li>
                  ))}
                </ul>
              </div>

              {/* Language Requirements */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Requirements</h2>
                <div className="space-y-6">
                  {['python', 'javascript'].map(lang => {
                    const signature = problem.functionSignatures[lang as keyof typeof problem.functionSignatures];
                    if (!signature) return null;

                    return (
                      <div key={lang} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2 capitalize">{lang}</h3>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Function Signature:</p>
                          <pre className="mt-1 bg-gray-100 rounded p-2 text-sm text-gray-900 font-mono">
                            {`${signature.name}(${signature.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}) -> ${signature.returnType}`}
                          </pre>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Time Limit:</p>
                            <p className="text-sm text-gray-800">
                              {problem.timeLimit[lang as keyof typeof problem.timeLimit] ?? problem.timeLimit.default}ms
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">Memory Limit:</p>
                            <p className="text-sm text-gray-800">
                              {problem.memoryLimit[lang as keyof typeof problem.memoryLimit] ?? problem.memoryLimit.default}MB
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hints */}
              {problem.hints.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-black mb-4">Hints</h2>
                  <div className="space-y-4">
                    {problem.hints.map((hint, index) => (
                      <div
                        key={index}
                        className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <p className="text-blue-700">{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}