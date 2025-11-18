import { scoreSubmission } from '../../utils/resultParsing';
import { ExecutionResult } from '../../types';

// Mock Docker
jest.mock('dockerode');

describe('scoreSubmission', () => {
  it('should return 0 score when tests fail', async () => {
    const executionResult: ExecutionResult = {
      success: true,
      output: JSON.stringify({
        results: [{ testNumber: 1, passed: false, executionTime: 10 }],
        passedTests: 0,
        totalTests: 1,
        status: 'FAILED'
      }),
      stderr: '',
      exitCode: 0,
      executionTime: 10,
    };

    const result = await scoreSubmission(executionResult, 'def solution(): return 1', 'python', 5000);

    expect(result.totalScore).toBe(0);
    expect(result.status).toBe('FAILED');
  });

  it('should give score when all tests pass', async () => {
    const executionResult: ExecutionResult = {
      success: true,
      output: JSON.stringify({
        results: [{ testNumber: 1, passed: true, input: '5', expected: '10', actual: '10', executionTime: 10 }],
        passedTests: 1,
        totalTests: 1,
        status: 'PASSED'
      }),
      stderr: '',
      exitCode: 0,
      executionTime: 10,
    };

    const result = await scoreSubmission(executionResult, 'def solution(x): return x * 2', 'python', 5000);

    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.status).toBe('PASSED');
    expect(result.breakdown.correctness).toBe(100);
  });

  it('should handle execution errors', async () => {
    const executionResult: ExecutionResult = {
      success: false,
      output: '',
      stderr: 'Error',
      exitCode: 1,
      executionTime: 0,
    };

    const result = await scoreSubmission(executionResult, 'bad code', 'python', 5000);

    expect(result.totalScore).toBe(0);
    expect(result.status).toBe('FAILED');
  });
});
