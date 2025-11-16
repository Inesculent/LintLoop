'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Navigation } from '../components/Navigation';
import { LoadingPage } from '../components/LoadingSpinner';

interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit' | 'Runtime Error';
  language: string;
  submittedAt: string;
  executionTime: number;
  memoryUsed: number;
  score: {
    total: number;
    correctness: number;
    performance: number;
    style: number;
    readability: number;
  };
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
        
        const response = await fetch(`${apiBase}/api/submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Handle no submissions case (404 or empty array)
        if (response.status === 404 || !response.ok) {
          setSubmissions([]);
          return;
        }

        const data = await response.json();
        const transformedSubmissions = (data || []).map((submission: any) => ({
          id: submission._id || submission.id,
          problemId: submission.problem?.pid || submission.problemId,
          problemTitle: submission.problem?.title || 'Unknown Problem',
          status: submission.status,
          language: submission.language,
          submittedAt: submission.timestamp || submission.submittedAt,
          executionTime: submission.executionTime || 0,
          memoryUsed: submission.memoryUsed || 0,
          score: {
            total: submission.score || 0,
            correctness: (submission.passedTests / submission.totalTests * 100) || 0,
            performance: submission.executionTime < 1000 ? 100 : Math.max(0, 100 - (submission.executionTime - 1000) / 100),
            style: submission.styleScore || 90, // Fallback until style checking is implemented
            readability: submission.readabilityScore || 90 // Fallback until readability metrics are implemented
          }
        }));
        
        setSubmissions(transformedSubmissions);
      } catch (error) {
        console.error('Submissions fetch error:', error);
        // Set empty submissions array on error
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Wrong Answer':
        return 'bg-red-100 text-red-800';
      case 'Time Limit':
        return 'bg-yellow-100 text-yellow-800';
      case 'Runtime Error':
        return 'bg-orange-100 text-orange-800';
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
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Submissions
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Problem
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Language
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Runtime
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Memory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr 
                        key={submission.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {/* TODO: Navigate to submission details */}}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.problemTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.language}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(submission.submittedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.executionTime} ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.memoryUsed} MB
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {submission.score.total}%
                            </div>
                            <div className="ml-2 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${submission.score.total}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}