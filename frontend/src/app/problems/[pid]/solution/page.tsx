'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Navigation } from '../../../components/Navigation';
import { LoadingPage } from '../../../components/LoadingSpinner';

interface Problem {
  pid: number;
  title: string;
  starterCode: {
    python?: string;
    javascript?: string;
  };
  functionSignatures: {
    python?: {
      name: string;
      returnType: string;
      parameters: Array<{
        name: string;
        type: string;
      }>;
    };
    javascript?: {
      name: string;
      returnType: string;
      parameters: Array<{
        name: string;
        type: string;
      }>;
    };
  };
}

interface ExecutionResult {
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  passedTests: number;
  totalTests: number;
  executionTime: number;
  memoryUsed?: number;
  errorMessage?: string;
  failedTestCase?: {
    input: any;
    expected: any;
    actual: any;
  };
}

export default function ProblemSolutionPage() {
  const rawParams = useParams();
  const pid = Array.isArray(rawParams?.pid) ? rawParams.pid[0] : rawParams?.pid;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [language, setLanguage] = useState<'python' | 'javascript'>('python');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
        
        // Fetch both problem data and last submission if any
        // Fetch problem data first
        const problemResponse = await fetch(`${apiBase}/api/problems/${pid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!problemResponse.ok) {
          switch (problemResponse.status) {
            case 404:
              throw new Error('Problem not found');
            case 401:
              throw new Error('Please sign in again');
            case 403:
              throw new Error('You do not have permission to access this problem');
            default:
              throw new Error(`Failed to fetch problem: ${problemResponse.statusText}`);
          }
        }

        // Then try to fetch latest submission if any
        const lastSubmissionResponse = await fetch(`${apiBase}/api/submissions/latest/${pid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const problemData = await problemResponse.json();

        // If there's a previous submission, use that code, otherwise use starter code
        let initialCode = problemData.starterCode[language] || '';
        if (lastSubmissionResponse.ok) {
          const lastSubmission = await lastSubmissionResponse.json();
          if (lastSubmission && lastSubmission.code) {
            initialCode = lastSubmission.code;
          }
        }

        setProblem(problemData);
        setCode(initialCode);
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
  }, [pid, language]);

  const handleLanguageChange = (newLanguage: 'python' | 'javascript') => {
    setLanguage(newLanguage);
    if (problem) {
      setCode(problem.starterCode[newLanguage] || '');
    }
  };

  const handleSubmit = async () => {
    try {
      setExecuting(true);
      setResult(null);
      setError(null);

      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

      const response = await fetch(`${apiBase}/api/run-solution`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problemId: pid,
          code,
          language
        })
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit solution');
    } finally {
      setExecuting(false);
    }
  };

  const handleTest = async () => {
    try {
      setExecuting(true);
      setResult(null);
      setError(null);

      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

      const response = await fetch(`${apiBase}/api/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problemId: pid,
          code,
          language
        })
      });

      if (!response.ok) {
        throw new Error(`Test execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error('Test execution error:', error);
      setError(error instanceof Error ? error.message : 'Failed to test solution');
    } finally {
      setExecuting(false);
    }
  };

  const getResultColor = (status: ExecutionResult['status']) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Wrong Answer':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Time Limit Exceeded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Memory Limit Exceeded':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Runtime Error':
      case 'Compilation Error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
              {/* Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {problem.pid}. {problem.title}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value as 'python' | 'javascript')}
                      className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                    <button
                      onClick={handleTest}
                      disabled={executing}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {executing ? 'Running...' : 'Run Code'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={executing}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {executing ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-96 font-mono text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    spellCheck="false"
                  />
                </div>
              </div>

              {/* Results */}
              {result && (
                <div className={`rounded-lg shadow p-6 ${getResultColor(result.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                      Status: {result.status}
                    </h2>
                    <div className="text-sm">
                      Passed: {result.passedTests}/{result.totalTests} tests
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Execution Time:</span>{' '}
                      {result.executionTime}ms
                    </div>
                    {result.memoryUsed && (
                      <div>
                        <span className="font-medium">Memory Used:</span>{' '}
                        {result.memoryUsed}MB
                      </div>
                    )}
                  </div>

                  {result.errorMessage && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Error Message:</h3>
                      <pre className="bg-white bg-opacity-50 rounded p-3 overflow-x-auto">
                        {result.errorMessage}
                      </pre>
                    </div>
                  )}

                  {result.failedTestCase && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Failed Test Case:</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium">Input:</p>
                          <pre className="bg-white bg-opacity-50 rounded p-2 mt-1">
                            {JSON.stringify(result.failedTestCase.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="font-medium">Expected:</p>
                          <pre className="bg-white bg-opacity-50 rounded p-2 mt-1">
                            {JSON.stringify(result.failedTestCase.expected, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="font-medium">Your Output:</p>
                          <pre className="bg-white bg-opacity-50 rounded p-2 mt-1">
                            {JSON.stringify(result.failedTestCase.actual, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}