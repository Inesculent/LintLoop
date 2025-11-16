'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Navigation } from '../../../components/Navigation';
import { LoadingPage } from '../../../components/LoadingSpinner';
import { Problem as ApiProblem, ExecutionResult, Language } from '../../../../types/api';

export default function ProblemSolutionPage() {
  const rawParams = useParams();
  const pid = Array.isArray(rawParams?.pid) ? rawParams.pid[0] : rawParams?.pid;

  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customTestCases, setCustomTestCases] = useState<Array<{ input: any; output: any }>>([]);
  const [showTestCaseInput, setShowTestCaseInput] = useState(false);

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

        const problemData: ApiProblem = await problemResponse.json();

        // If there's a previous submission, use that code, otherwise use starter code
        let initialCode = problemData.starterCode?.[language] || '';
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

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    if (problem && problem.starterCode) {
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

      const response = await fetch(`${apiBase}/api/run-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problemId: pid,
          solutionCode: code,
          language,
          testCases: customTestCases.length > 0 ? customTestCases : undefined
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
            <div className="space-y-4">
              {/* Header with Actions */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {problem.pid}. {problem.title}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value as Language)}
                      className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
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

              {/* Split View: Problem Description (Left) + Code Editor (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Panel: Problem Description */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                    {/* Problem Statement */}
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Problem Description</h2>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        {problem.problemStatement}
                      </div>
                    </div>

                    {/* Examples */}
                    {problem.examples && problem.examples.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Examples</h2>
                        {problem.examples.map((example, idx) => (
                          <div key={idx} className="mb-4 p-3 bg-gray-50 rounded">
                            <p className="font-medium text-sm">Example {idx + 1}:</p>
                            <div className="mt-2 space-y-1 text-sm">
                              <div>
                                <span className="font-medium">Input:</span>
                                <pre className="inline ml-2 font-mono">{example.input}</pre>
                              </div>
                              <div>
                                <span className="font-medium">Output:</span>
                                <pre className="inline ml-2 font-mono">{example.output}</pre>
                              </div>
                              {example.explanation && (
                                <div>
                                  <span className="font-medium">Explanation:</span>
                                  <span className="ml-2">{example.explanation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Constraints */}
                    {problem.constraints && problem.constraints.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Constraints</h2>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {problem.constraints.map((constraint, idx) => (
                            <li key={idx}>{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Hints */}
                    {problem.hints && problem.hints.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Hints</h2>
                        <div className="space-y-2">
                          {problem.hints.map((hint, idx) => (
                            <details key={idx} className="text-sm">
                              <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                                Hint {idx + 1}
                              </summary>
                              <p className="mt-2 text-gray-700 pl-4">{hint}</p>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Test Cases */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold">Custom Test Cases</h2>
                        <button
                          onClick={() => setShowTestCaseInput(!showTestCaseInput)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {showTestCaseInput ? '- Hide' : '+ Add Custom Test'}
                        </button>
                      </div>
                      
                      {showTestCaseInput && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <p className="text-sm text-gray-600 mb-2">
                            Add custom test cases to test your code. Leave empty to use default visible test cases.
                          </p>
                          
                          {customTestCases.map((testCase, idx) => (
                            <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded border">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Input (JSON)</label>
                                <input
                                  type="text"
                                  value={typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input)}
                                  onChange={(e) => {
                                    const newCases = [...customTestCases];
                                    try {
                                      newCases[idx].input = JSON.parse(e.target.value);
                                    } catch {
                                      newCases[idx].input = e.target.value;
                                    }
                                    setCustomTestCases(newCases);
                                  }}
                                  placeholder='[1, 2, 3] or "hello"'
                                  className="w-full text-sm border-gray-300 rounded px-2 py-1 font-mono"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Expected Output (JSON)</label>
                                <input
                                  type="text"
                                  value={typeof testCase.output === 'string' ? testCase.output : JSON.stringify(testCase.output)}
                                  onChange={(e) => {
                                    const newCases = [...customTestCases];
                                    try {
                                      newCases[idx].output = JSON.parse(e.target.value);
                                    } catch {
                                      newCases[idx].output = e.target.value;
                                    }
                                    setCustomTestCases(newCases);
                                  }}
                                  placeholder='6 or "olleh"'
                                  className="w-full text-sm border-gray-300 rounded px-2 py-1 font-mono"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newCases = customTestCases.filter((_, i) => i !== idx);
                                  setCustomTestCases(newCases);
                                }}
                                className="mt-5 text-red-600 hover:text-red-800 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCustomTestCases([...customTestCases, { input: '', output: '' }])}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              + Add Test Case
                            </button>
                            {customTestCases.length > 0 && (
                              <button
                                onClick={() => setCustomTestCases([])}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                          
                          {customTestCases.length > 0 && (
                            <p className="text-xs text-green-600 mt-2">
                              ✓ {customTestCases.length} custom test case(s) will be used when you click "Run Code"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Code Editor */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-full">
                    <Editor
                      height="65vh"
                      language={language}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: 'on',
                        bracketPairColorization: { enabled: true },
                        suggest: {
                          snippetsPreventQuickSuggestions: false
                        }
                      }}
                    />
                  </div>
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