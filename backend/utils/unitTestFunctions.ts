import Problem from "../models/Problems";
import { runUnitTests, validateTestCases, ExecutionTestResult } from './unitTestRunner';

interface UnitTestCodeParams {
    problemId: string;
    solutionCode: string;
    language: 'python' | 'java' | 'javascript';
    testCases?: any[];
    useAllTestCases?: boolean;
}

/**
 * Runs unit tests for a problem solution
 * @deprecated Use runUnitTests from unitTestRunner instead
 */
export async function unitTestCode({
    problemId, 
    solutionCode, 
    language,
    testCases,
    useAllTestCases
}: UnitTestCodeParams): Promise<ExecutionTestResult> {
    return runUnitTests({
        problemId,
        solutionCode,
        language,
        testCases,
        useAllTestCases
    });
}

/**
 * Runs unit tests with all test cases (for submission)
 */
export async function submitSolution({
    problemId,
    solutionCode,
    language
}: Omit<UnitTestCodeParams, 'testCases' | 'useAllTestCases'>): Promise<ExecutionTestResult> {
    return runUnitTests({
        problemId,
        solutionCode,
        language,
        useAllTestCases: true
    });
}

/**
 * Runs unit tests with visible test cases only (for testing)
 */
export async function testSolution({
    problemId,
    solutionCode,
    language,
    testCases
}: UnitTestCodeParams): Promise<ExecutionTestResult> {
    return runUnitTests({
        problemId,
        solutionCode,
        language,
        testCases,
        useAllTestCases: false
    });
}

/**
 * Validates that a problem has proper test cases configured
 */
export async function validateProblemTestCases(problemId: string): Promise<{ valid: boolean; error?: string }> {
    try {
        const problem = await Problem.findOne({ pid: problemId });
        if (!problem) {
            return { valid: false, error: 'Problem not found' };
        }

        if (!problem.testCases || problem.testCases.length === 0) {
            return { valid: false, error: 'Problem has no test cases' };
        }

        return validateTestCases(problem.testCases);
    } catch (error) {
        return { 
            valid: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Gets test case statistics for a problem
 */
export async function getTestCaseStats(problemId: string): Promise<{
    total: number;
    visible: number;
    hidden: number;
    error?: string;
}> {
    try {
        const problem = await Problem.findOne({ pid: problemId });
        if (!problem) {
            return { total: 0, visible: 0, hidden: 0, error: 'Problem not found' };
        }

        const total = problem.testCases.length;
        const visible = problem.testCases.filter(tc => tc.isVisible).length;
        const hidden = total - visible;

        return { total, visible, hidden };
    } catch (error) {
        return { 
            total: 0, 
            visible: 0, 
            hidden: 0,
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}