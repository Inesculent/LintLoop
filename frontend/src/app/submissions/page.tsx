'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Navigation } from '../components/Navigation';
import { LoadingPage } from '../components/LoadingSpinner';
import { Submission as ApiSubmission } from '../../types/api';

interface SubmissionDisplay {
  id: string;
  problemId: number;
  problemTitle: string;
  status: ApiSubmission['status'];
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
  const [submissions, setSubmissions] = useState<SubmissionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ApiSubmission | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

        const data: ApiSubmission[] = await response.json();
        const transformedSubmissions: SubmissionDisplay[] = (data || []).map((submission) => ({
          id: submission._id,
          problemId: submission.problem.pid,
          problemTitle: submission.problem.title,
          status: submission.status,
          language: submission.language,
          submittedAt: submission.timestamp,
          executionTime: submission.executionTime,
          memoryUsed: submission.memoryUsed || 0,
          score: {
            total: submission.score,
            correctness: submission.scoreBreakdown?.correctness || (submission.passedTests / submission.totalTests * 100),
            performance: submission.scoreBreakdown?.performance || (submission.executionTime < 1000 ? 100 : Math.max(0, 100 - (submission.executionTime - 1000) / 100)),
            style: submission.scoreBreakdown?.style || 0,
            readability: submission.scoreBreakdown?.readability || 0
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

  const fetchSubmissionDetail = async (submissionId: string) => {
    try {
      setLoadingDetail(true);
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      
      const response = await fetch(`${apiBase}/api/submissions/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data: ApiSubmission = await response.json();
        setSelectedSubmission(data);
      }
    } catch (error) {
      console.error('Failed to fetch submission details:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: ApiSubmission['status']) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Wrong Answer':
        return 'bg-red-100 text-red-800';
      case 'Time Limit Exceeded':
        return 'bg-yellow-100 text-yellow-800';
      case 'Memory Limit Exceeded':
        return 'bg-yellow-100 text-yellow-800';
      case 'Runtime Error':
        return 'bg-orange-100 text-orange-800';
      case 'Compilation Error':
        return 'bg-purple-100 text-purple-800';
      case 'Output Limit Exceeded':
        return 'bg-yellow-100 text-yellow-800';
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
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => fetchSubmissionDetail(submission.id)}
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

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSubmission(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Submission Details
                </h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status and Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`mt-1 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                      {selectedSubmission.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Problem</p>
                    <p className="mt-1 font-medium">{selectedSubmission.problem.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Language</p>
                    <p className="mt-1 font-medium">{selectedSubmission.language}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p className="mt-1 text-sm">{formatDate(selectedSubmission.timestamp)}</p>
                  </div>
                </div>

                {/* Test Results */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Test Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tests Passed</p>
                      <p className="text-lg font-bold text-green-600">
                        {selectedSubmission.passedTests}/{selectedSubmission.totalTests}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Execution Time</p>
                      <p className="text-lg font-bold">{selectedSubmission.executionTime} ms</p>
                    </div>
                    {selectedSubmission.memoryUsed && (
                      <div>
                        <p className="text-sm text-gray-500">Memory Used</p>
                        <p className="text-lg font-bold">{selectedSubmission.memoryUsed} MB</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Overall Score</p>
                      <p className="text-lg font-bold text-blue-600">{selectedSubmission.score}%</p>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                {selectedSubmission.scoreBreakdown && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Score Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Correctness</p>
                        <div className="flex items-center mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${selectedSubmission.scoreBreakdown.correctness}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{selectedSubmission.scoreBreakdown.correctness}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Performance</p>
                        <div className="flex items-center mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${selectedSubmission.scoreBreakdown.performance}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{selectedSubmission.scoreBreakdown.performance}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Style</p>
                        <div className="flex items-center mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${selectedSubmission.scoreBreakdown.style}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{selectedSubmission.scoreBreakdown.style}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Readability</p>
                        <div className="flex items-center mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full" 
                              style={{ width: `${selectedSubmission.scoreBreakdown.readability}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{selectedSubmission.scoreBreakdown.readability}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {selectedSubmission.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">Error Message</h3>
                    <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                      {selectedSubmission.errorMessage}
                    </pre>
                  </div>
                )}

                {/* Failed Test Case */}
                {selectedSubmission.failedTestCase && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-3">Failed Test Case</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Input:</p>
                        <pre className="bg-white rounded p-2 text-xs overflow-x-auto">
                          {JSON.stringify(selectedSubmission.failedTestCase.input, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Expected:</p>
                        <pre className="bg-white rounded p-2 text-xs overflow-x-auto">
                          {JSON.stringify(selectedSubmission.failedTestCase.expected, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Your Output:</p>
                        <pre className="bg-white rounded p-2 text-xs overflow-x-auto">
                          {JSON.stringify(selectedSubmission.failedTestCase.actual, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {selectedSubmission.feedback && selectedSubmission.feedback.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Feedback</h3>
                    <ul className="space-y-1">
                      {selectedSubmission.feedback.map((item, idx) => (
                        <li key={idx} className="text-sm text-blue-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Submitted Code */}
                <div>
                  <h3 className="font-semibold mb-2">Submitted Code</h3>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                    <code>{selectedSubmission.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}