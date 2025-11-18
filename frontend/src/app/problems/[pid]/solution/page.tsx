'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [customTestCases, setCustomTestCases] = useState<Array<{ input: any }>>([]);
  const [showTestCaseInput, setShowTestCaseInput] = useState(false);
  // Editor resizing state
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

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

        // Determine which language to use for this problem.
        // Priority: saved language in localStorage -> current state language -> 'python'
        const langStorageKey = `lintloop:lang:${problemData.pid}`;
        let currentLang: typeof language = language;
        try {
          const savedLang = localStorage.getItem(langStorageKey);
          if (savedLang) {
            currentLang = savedLang as typeof language;
            setLanguage(currentLang);
          }
        } catch (e) {
          // ignore storage errors
        }

        // Determine initial code for the current language.
        // Priority: persisted localStorage code -> last submission -> starter code -> empty
        const storageKey = (p: string, lang: string) => `lintloop:code:${p}:${lang}`;
        let initialCode = '';

        if (lastSubmissionResponse.ok) {
          const lastSubmission = await lastSubmissionResponse.json();
          if (lastSubmission && lastSubmission.code) {
            initialCode = lastSubmission.code;
          }
        }

        const starter = problemData.starterCode?.[currentLang] || '';

        // Check localStorage for an existing saved draft for this problem+language
        try {
          const saved = localStorage.getItem(storageKey(problemData.pid.toString(), currentLang));
          if (saved !== null) {
            initialCode = saved;
          } else if (!initialCode) {
            initialCode = starter;
          }
        } catch (e) {
          // ignore storage errors and fall back to submission/starter
          if (!initialCode) initialCode = starter;
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
  }, [pid]);

  // Load persisted last result for this problem (if any) so feedback shows after refresh
  useEffect(() => {
    if (!pid) return;
    try {
      const raw = localStorage.getItem(`lintloop:lastResult:${pid}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only set if parsed pid matches current pid (safety) and we don't already have a result
        if (parsed && parsed.pid && parsed.pid.toString() === pid.toString()) {
          setResult(parsed as ExecutionResult);
          // scroll persisted result into view so user sees it immediately
          setTimeout(() => {
            try {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
              // ignore
            }
          }, 80);
        }
      }
    } catch (e) {
      // ignore parse/storage errors
    }
  }, [pid]);

  // Initialize leftWidth from localStorage (per-problem) or default
  useEffect(() => {
    if (!pid) return;
    try {
      const saved = localStorage.getItem(`lintloop:editorWidth:${pid}`);
      if (saved) {
        setLeftWidth(parseInt(saved, 10));
      } else {
        // default width on large screens
        setLeftWidth(560);
      }
    } catch (e) {
      setLeftWidth(560);
    }
  }, [pid]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const clientX = e.clientX;
      const dx = clientX - startX.current;
      const newWidth = Math.max(320, Math.min(startWidth.current + dx, window.innerWidth - 320));
      setLeftWidth(newWidth);
    };

    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      // persist
      try {
        if (pid && leftWidth) localStorage.setItem(`lintloop:editorWidth:${pid}`, leftWidth.toString());
      } catch (e) {
        // ignore
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    if (isDragging.current) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [leftWidth, pid]);

  const storageKey = (p: string, lang: string) => `lintloop:code:${p}:${lang}`;

  const handleLanguageChange = (newLanguage: Language) => {
    if (!problem) {
      setLanguage(newLanguage);
      return;
    }

    // Save current code to storage under current language
    try {
      localStorage.setItem(storageKey(problem.pid.toString(), language), code);
    } catch (e) {
      // ignore storage errors
    }

    // Load code for the new language from storage, or fall back to starter code
    let nextCode = problem.starterCode?.[newLanguage] || '';
    try {
      const saved = localStorage.getItem(storageKey(problem.pid.toString(), newLanguage));
      if (saved !== null) nextCode = saved;
    } catch (e) {
      // ignore
    }

    // persist chosen language for this problem so refresh keeps it
    try {
      localStorage.setItem(`lintloop:lang:${problem.pid}`, newLanguage);
    } catch (e) {
      // ignore
    }

    setLanguage(newLanguage);
    setCode(nextCode);
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
          solutionCode: code,
          language
        })
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`);
      }

      const raw = await response.json();

      // Normalize the backend response to the frontend ExecutionResult shape
      const submission = raw?.submission || raw;
      const execution = raw?.execution || {};
      const grading = raw?.grading || {};

      const normalized: ExecutionResult = {
        status: submission?.status || 'Wrong Answer',
        passedTests: submission?.passedTests ?? (execution.output?.passedTests ?? 0),
        totalTests: submission?.totalTests ?? (execution.output?.totalTests ?? 0),
        executionTime: submission?.executionTime ?? Math.round(execution.executionTime || 0),
        memoryUsed: submission?.memoryUsed ?? execution.memoryUsed,
        errorMessage: submission?.errorMessage ?? execution.stderr ?? null,
        failedTestCase: submission?.failedTestCase ?? null,
        score: submission?.score ?? grading?.totalScore,
        scoreBreakdown: submission?.scoreBreakdown ?? grading?.breakdown,
        isSubmission: true,
        feedback: submission?.feedback ?? grading?.feedback
      };

      // Fill sensible defaults for score/scoreBreakdown when backend didn't provide them
      try {
        if ((!normalized.scoreBreakdown || Object.keys(normalized.scoreBreakdown).length === 0) && normalized.totalTests > 0) {
          const correctness = Math.round((normalized.passedTests / normalized.totalTests) * 100);
          const performance = normalized.executionTime ? Math.max(0, Math.round(100 - Math.max(0, (normalized.executionTime - 1000) / 100))) : 100;
          normalized.scoreBreakdown = {
            correctness,
            performance,
            style: 0,
            readability: 0
          } as any;
        }

        if (normalized.score === undefined && normalized.scoreBreakdown) {
          const parts = ['correctness', 'performance', 'style', 'readability'];
          const vals = parts.map((p) => (normalized.scoreBreakdown as any)[p] ?? 0);
          normalized.score = Math.round(vals.reduce((a, b) => a + b, 0) / parts.length);
        }
      } catch (e) {
        // ignore
      }

      setResult(normalized);
      // scroll results into view so feedback is immediately visible
      setTimeout(() => {
        try {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
          // ignore
        }
      }, 80);
      // persist last result for this problem so solution page can show it
      try {
        const stored = {
          ...normalized,
          problemTitle: problem?.title,
          language,
          submittedAt: new Date().toISOString(),
          pid
        };
        localStorage.setItem(`lintloop:lastResult:${pid}`, JSON.stringify(stored));
      } catch (e) {
        // ignore storage errors
      }
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

      const raw = await response.json();

      // Normalize execution response to ExecutionResult shape
      const exec = raw || {};
      const output = exec.output || {};

      let status: ExecutionResult['status'] = 'Wrong Answer';
      if (exec.success === false) {
        const stderr = (exec.stderr || '').toString().toLowerCase();
        if (stderr.includes('compilation')) status = 'Compilation Error';
        else if (stderr.includes('timeout')) status = 'Time Limit Exceeded';
        else if (stderr.includes('memory')) status = 'Memory Limit Exceeded';
        else status = 'Runtime Error';
      } else if (typeof output.passedTests === 'number' && typeof output.totalTests === 'number') {
        status = output.passedTests === output.totalTests ? 'Accepted' : 'Wrong Answer';
      }

      const failed = (output.results && Array.isArray(output.results))
        ? output.results.find((r: any) => !r.passed)
        : null;

      const normalized: ExecutionResult = {
        status,
        passedTests: output.passedTests ?? 0,
        totalTests: output.totalTests ?? (Array.isArray(output.results) ? output.results.length : 0),
        executionTime: Math.round(exec.executionTime || 0),
        memoryUsed: exec.memoryUsed,
        errorMessage: exec.stderr || null,
        failedTestCase: failed ? { input: failed.input, expected: failed.expected, actual: failed.actual } : undefined,
        score: output.score,
        scoreBreakdown: output.scoreBreakdown,
        isSubmission: false,
        feedback: output.feedback
      };

      // Fill sensible defaults for score/scoreBreakdown when backend didn't provide them
      try {
        if ((!normalized.scoreBreakdown || Object.keys(normalized.scoreBreakdown).length === 0) && normalized.totalTests > 0) {
          const correctness = Math.round((normalized.passedTests / normalized.totalTests) * 100);
          const performance = normalized.executionTime ? Math.max(0, Math.round(100 - Math.max(0, (normalized.executionTime - 1000) / 100))) : 100;
          normalized.scoreBreakdown = {
            correctness,
            performance,
            style: 0,
            readability: 0
          } as any;
        }

        if (normalized.score === undefined && normalized.scoreBreakdown) {
          const parts = ['correctness', 'performance', 'style', 'readability'];
          const vals = parts.map((p) => (normalized.scoreBreakdown as any)[p] ?? 0);
          normalized.score = Math.round(vals.reduce((a, b) => a + b, 0) / parts.length);
        }
      } catch (e) {
        // ignore
      }

      setResult(normalized);
      // scroll results into view
      setTimeout(() => {
        try {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
          // ignore
        }
      }, 80);
      try {
        const stored = {
          ...normalized,
          problemTitle: problem?.title,
          language,
          submittedAt: new Date().toISOString(),
          pid
        };
        localStorage.setItem(`lintloop:lastResult:${pid}`, JSON.stringify(stored));
      } catch (e) {
        // ignore
      }
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
              <div ref={containerRef} className="flex flex-col lg:flex-row gap-4">
                {/* Left Panel: Problem Description */}
                <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col" style={{ height: '65vh', minHeight: '500px', width: leftWidth ? leftWidth : '100%' }}>
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                    {/* Problem Statement */}
                    <div>
                      <h2 className="text-lg font-semibold mb-2 text-black">Problem Description</h2>
                      <div className="prose prose-sm max-w-none text-black">
                        {problem.problemStatement}
                      </div>
                    </div>

                    {/* Examples */}
                    {problem.examples && problem.examples.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2 text-black">Examples</h2>
                        {problem.examples.map((example, idx) => (
                          <div key={idx} className="mb-4 p-3 bg-gray-50 rounded">
                            <p className="font-medium text-sm text-black">Example {idx + 1}:</p>
                            <div className="mt-2 space-y-1 text-sm">
                              <div>
                                <span className="font-medium text-black">Input:</span>
                                <pre className="inline ml-2 font-mono text-black">{example.input}</pre>
                              </div>
                              <div>
                                <span className="font-medium text-black">Output:</span>
                                <pre className="inline ml-2 font-mono text-black">{example.output}</pre>
                              </div>
                              {example.explanation && (
                                <div>
                                  <span className="font-medium text-black">Explanation:</span>
                                  <span className="ml-2 text-black">{example.explanation}</span>
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
                        <ul className="list-disc list-inside space-y-1 text-sm text-black">
                          {problem.constraints.map((constraint, idx) => (
                            <li key={idx} className="text-black">{constraint}</li>
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
                        <h2 className="text-lg font-semibold text-black">Custom Test Cases</h2>
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
                            Add custom test inputs to test your code. Your code's output will be shown in the results.
                          </p>

                          {customTestCases.map((testCase, idx) => (
                            <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded border">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Test Input (JSON format)</label>
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
                                  placeholder='Example: [1, 2, 3] or "hello" or {"key": "value"}'
                                  className="w-full text-sm border-gray-300 rounded px-2 py-1 font-mono"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newCases = customTestCases.filter((_, i) => i !== idx);
                                  setCustomTestCases(newCases);
                                }}
                                className="mt-5 text-red-600 hover:text-red-800 text-sm font-bold px-2"
                              >
                                ✕
                              </button>
                            </div>
                          ))}

                          <div className="flex gap-2">
                            <button
                              onClick={() => setCustomTestCases([...customTestCases, { input: '' }])}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              + Add Test Input
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
                              ✓ Will run your code with {customTestCases.length} custom input(s)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider (only on large screens) */}
                <div
                  onMouseDown={(e) => {
                    // only enable dragging on large screens
                    if (window.innerWidth < 1024) return;
                    startX.current = e.clientX;
                    startWidth.current = leftWidth ?? 560;

                    const onMove = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX.current;
                      const newWidth = Math.max(320, Math.min(startWidth.current + dx, window.innerWidth - 320));
                      setLeftWidth(newWidth);
                    };

                    const onUp = () => {
                      try {
                        if (pid && leftWidth) localStorage.setItem(`lintloop:editorWidth:${pid}`, leftWidth.toString());
                      } catch (err) {
                        // ignore
                      }
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };

                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                    e.preventDefault();
                  }}
                  className="hidden lg:flex items-center justify-center cursor-col-resize"
                  style={{ width: 12, alignSelf: 'stretch' }}
                  title="Drag to resize"
                >
                  <div className="w-px h-full bg-gray-300 transition-colors hover:bg-gray-400" />
                </div>

                {/* Right Panel: Code Editor */}
                <div className="bg-white rounded-lg shadow overflow-hidden flex-1">
                  <div style={{ height: '65vh', minHeight: '500px' }}>
                    <Editor
                      height="100%"
                      language={language}
                      value={code}
                      onChange={(value) => {
                        const v = value || '';
                        setCode(v);
                        try {
                          if (problem) {
                            localStorage.setItem(storageKey(problem.pid.toString(), language), v);
                          }
                        } catch (e) {
                          // ignore storage errors
                        }
                      }}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: 'on',
                        bracketPairColorization: { enabled: true },
                        suggest: {
                          snippetsPreventQuickSuggestions: false
                        },
                        padding: { top: 10, bottom: 10 }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Results */}
              {result && (
                <div ref={resultsRef} className={`rounded-lg shadow p-6 ${getResultColor(result.status)}`}>
                  {/* Top row: Status and meta */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`mt-1 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getResultColor(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Problem</p>
                      <p className="mt-1 font-medium">{problem?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Language</p>
                      <p className="mt-1 font-medium">{language}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted</p>
                      <p className="mt-1 text-sm">{((result as any).submittedAt ? new Date((result as any).submittedAt).toLocaleString() : new Date().toLocaleString())}</p>
                    </div>
                  </div>

                  {/* Test Results */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-3">Test Results</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Tests Passed</p>
                        <p className="text-lg font-bold text-green-600">{result.passedTests}/{result.totalTests}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Execution Time</p>
                        <p className="text-lg font-bold">{result.executionTime} ms</p>
                      </div>
                      {result.memoryUsed !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Memory Used</p>
                          <p className="text-lg font-bold">{result.memoryUsed} MB</p>
                        </div>
                      )}
                      {result.isSubmission && (
                        <div>
                          <p className="text-sm text-gray-500">Overall Score</p>
                          <p className="text-lg font-bold text-blue-600">{result.score ?? 0}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  {result.isSubmission && result.scoreBreakdown && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold mb-3">Score Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Correctness</p>
                          <div className="flex items-center mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${result.scoreBreakdown.correctness}%` }} />
                            </div>
                            <span className="text-sm font-medium">{result.scoreBreakdown.correctness}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Performance</p>
                          <div className="flex items-center mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${result.scoreBreakdown.performance}%` }} />
                            </div>
                            <span className="text-sm font-medium">{result.scoreBreakdown.performance}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Style</p>
                          <div className="flex items-center mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${result.scoreBreakdown.style}%` }} />
                            </div>
                            <span className="text-sm font-medium">{result.scoreBreakdown.style}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Readability</p>
                          <div className="flex items-center mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${result.scoreBreakdown.readability}%` }} />
                            </div>
                            <span className="text-sm font-medium">{result.scoreBreakdown.readability}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {result.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-red-800 mb-2">Error Message</h3>
                      <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">{result.errorMessage}</pre>
                    </div>
                  )}

                  {/* Failed Test Case */}
                  {result.failedTestCase && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-yellow-800 mb-3">Failed Test Case</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Input:</p>
                          <pre className="bg-white rounded p-2 text-xs overflow-x-auto">{JSON.stringify(result.failedTestCase.input, null, 2)}</pre>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Expected:</p>
                          <pre className="bg-white rounded p-2 text-xs overflow-x-auto">{JSON.stringify(result.failedTestCase.expected, null, 2)}</pre>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Output:</p>
                          <pre className="bg-white rounded p-2 text-xs overflow-x-auto">{JSON.stringify(result.failedTestCase.actual, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {result.feedback && result.feedback.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">Feedback</h3>
                      <ul className="space-y-1">
                        {result.feedback.map((item, idx) => (
                          <li key={idx} className="text-sm text-blue-700">• {item}</li>
                        ))}
                      </ul>
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