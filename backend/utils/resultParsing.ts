import Docker from 'dockerode';
import { ExecutionResult, GradingResult, ScoreBreakdown } from '../types';
import * as tar from 'tar-stream';


const docker = new Docker();

// Interface for the test harness output structure
interface TestHarnessOutput {
  results: Array<{
    testNumber: number;
    passed: boolean;
    input?: string;
    actual?: string;
    expected?: string;
    executionTime: number;
    error?: string;
  }>;
  passedTests: number;
  totalTests: number;
  status: string;
}

// Interface for linter results
interface LinterResult {
  score: number;  // 0-10 scale
  issues: number;
  details: string;
}

/**
 * Main function to score a code submission
 * @param executionResult - Result from Docker code execution
 * @param code - The user's source code
 * @param language - Programming language (python, java, javascript)
 * @param problemTimeLimit - Expected time limit for the problem (ms)
 * @returns GradingResult with scores and feedback
 */
export async function scoreSubmission(
  executionResult: ExecutionResult,
  code: string,
  language: 'python' | 'java' | 'javascript',
  problemTimeLimit: number = 5000
): Promise<GradingResult> {
  const feedback: string[] = [];
  
  // Step 1: Parse test results from execution output
  const testResults = parseTestResults(executionResult);
  
  // Step 2: Calculate correctness score (must pass ALL tests)
  const correctnessScore = calculateCorrectnessScore(testResults, feedback);
  
  // Map test results to match TestResult interface
  const mappedTestResults = testResults.results.map(r => ({
    passed: r.passed,
    input: r.input || '',
    expected: r.expected || '',
    actual: r.actual || '',
    executionTime: r.executionTime
  }));
  
  // If correctness isn't 100%, DENY submission (return 0)
  if (correctnessScore < 100) {
    feedback.push('SUBMISSION DENIED: Must pass all test cases first');
    
    return {
      totalScore: 0,
      breakdown: {
        correctness: correctnessScore,
        performance: 0,
        style: 0,
        readability: 0
      },
      testResults: mappedTestResults,
      feedback,
      status: 'FAILED'
    };
  }
  
  // Code passes all tests! Now grade performance, style, and readability
  feedback.push('All test cases passed! Grading code quality...');
  
  // Step 3: Calculate performance score (20%)
  const performanceScore = calculatePerformanceScore(testResults, problemTimeLimit, feedback);
  
  // Step 4: Run linter and calculate style score (20%)
  const styleScore = await calculateStyleScore(code, language, feedback);
  
  // Step 5: Calculate readability score (20%)
  const readabilityScore = calculateReadabilityScore(code, language, feedback);
  
  // Calculate total score: 40% (correctness) + 60% (quality)
  const breakdown: ScoreBreakdown = {
    correctness: 100,  // Always 100 if all tests pass
    performance: performanceScore,
    style: styleScore,
    readability: readabilityScore
  };
  
  // Total = 40 (correctness) + 20% of performance + 20% of style + 20% of readability
  const totalScore = 40 + (performanceScore * 0.20) + (styleScore * 0.20) + (readabilityScore * 0.20);
  
  const status = 'PASSED';  // Always PASSED if we get here
  
  return {
    totalScore: Math.round(totalScore * 10) / 10,
    breakdown,
    testResults: mappedTestResults,
    feedback,
    status
  };
}

/**
 * Parse test results from execution output
 */
function parseTestResults(executionResult: ExecutionResult): TestHarnessOutput {
  if (!executionResult.success || !executionResult.output) {
    return {
      results: [],
      passedTests: 0,
      totalTests: 0,
      status: 'FAILED'
    };
  }
  
  try {
    // If output is already an object, use it directly
    if (typeof executionResult.output === 'object') {
      return executionResult.output as TestHarnessOutput;
    }
    
    // Otherwise try to parse JSON output from test harness
    const parsed = JSON.parse(executionResult.output);
    return parsed as TestHarnessOutput;
  } catch (error) {
    // If parsing fails, return empty results
    return {
      results: [],
      passedTests: 0,
      totalTests: 0,
      status: 'FAILED'
    };
  }
}

/**
 * Calculate correctness score based on passed test cases
 * Returns 100 if all tests pass, otherwise returns percentage
 */
function calculateCorrectnessScore(testResults: TestHarnessOutput, feedback: string[]): number {
  if (testResults.totalTests === 0) {
    feedback.push('No test cases were executed');
    return 0;
  }
  
  const score = (testResults.passedTests / testResults.totalTests) * 100;
  
  if (score === 100) {
    // Don't add feedback here - will be added in main function
    return 100;
  } else {
    feedback.push(`Failed ${testResults.totalTests - testResults.passedTests}/${testResults.totalTests} test cases`);
    return score;
  }
}

/**
 * Calculate performance score based on execution time
 */
function calculatePerformanceScore(
  testResults: TestHarnessOutput,
  timeLimit: number,
  feedback: string[]
): number {
  if (testResults.results.length === 0) {
    feedback.push('No performance data available');
    return 50; // Neutral score
  }
  
  // Calculate average execution time
  const totalTime = testResults.results.reduce((sum, r) => sum + (r.executionTime || 0), 0);
  const avgTime = totalTime / testResults.results.length;
  
  // Score based on how fast compared to time limit
  // < 10% of limit: 100 points
  // < 25% of limit: 90 points
  // < 50% of limit: 80 points
  // < 75% of limit: 70 points
  // < 100% of limit: 60 points
  // > limit: scale down from 60
  
  const ratio = avgTime / timeLimit;
  let score: number;
  
  if (ratio < 0.10) {
    score = 100;
    feedback.push(`Excellent performance! Avg time: ${avgTime.toFixed(2)}ms (${(ratio * 100).toFixed(1)}% of limit)`);
  } else if (ratio < 0.25) {
    score = 90;
    feedback.push(`Great performance! Avg time: ${avgTime.toFixed(2)}ms (${(ratio * 100).toFixed(1)}% of limit)`);
  } else if (ratio < 0.50) {
    score = 80;
    feedback.push(`Good performance! Avg time: ${avgTime.toFixed(2)}ms (${(ratio * 100).toFixed(1)}% of limit)`);
  } else if (ratio < 0.75) {
    score = 70;
    feedback.push(`Acceptable performance. Avg time: ${avgTime.toFixed(2)}ms (${(ratio * 100).toFixed(1)}% of limit)`);
  } else if (ratio <= 1.0) {
    score = 60;
    feedback.push(`Performance near limit. Avg time: ${avgTime.toFixed(2)}ms (${(ratio * 100).toFixed(1)}% of limit)`);
  } else {
    // Over time limit, scale down
    score = Math.max(0, 60 - (ratio - 1) * 30);
    feedback.push(`Performance exceeded limit. Avg time: ${avgTime.toFixed(2)}ms (${(ratio * 100).toFixed(1)}% of limit)`);
  }
  
  return score;
}

/**
 * Calculate style score using linters (Pylint, Checkstyle)
 */
async function calculateStyleScore(
  code: string,
  language: 'python' | 'java' | 'javascript',
  feedback: string[]
): Promise<number> {
  try {
    let linterResult: LinterResult;
    
    if (language === 'python') {
      linterResult = await runPylint(code);
    } else if (language === 'java') {
      linterResult = await runCheckstyle(code);
    } else {
      // JavaScript - use a simple heuristic for now
      linterResult = await runJavaScriptStyleCheck(code);
    }
    
    // Convert 0-10 linter score to 0-100
    const score = linterResult.score * 10;
    feedback.push(`(${linterResult.issues} issues)`);
    feedback.push(`Style details: ${linterResult.details}`)
 
    return score;
  } catch (error) {
    feedback.push(`Could not run style checker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 50; // Neutral score on error
  }
}

/**
 * Run Pylint on Python code
 */
async function runPylint(code: string): Promise<LinterResult> {
  let container: Docker.Container | null = null;
  
  try {
    const image = 'python:3.9-slim';
    
    // Pylint configuration to customize rules
    const pylintrc = `[MASTER]
disable=C0114,C0115,C0116,R0903
max-line-length=120

[MESSAGES CONTROL]
enable=all

[BASIC]
good-names=i,j,k,x,y,z,_
variable-rgx=[a-z_][a-z0-9_]{0,30}$
argument-rgx=[a-z_][a-z0-9_]{0,30}$
attr-rgx=[a-z_][a-z0-9_]{0,30}$
const-rgx=(([A-Z_][A-Z0-9_]*)|(__.*__))$
`;
    
    // Create container with pylint installed - need network to install
    const commands = [
      'sh', '-c',
      'pip install -q pylint && pylint --rcfile=/tmp/.pylintrc --output-format=json /tmp/solution.py 2>/dev/null || true'
    ];
    
    container = await docker.createContainer({
      Image: image,
      Cmd: commands,
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      HostConfig: {
        Memory: 512 * 1024 * 1024,
        NanoCpus: 1000000000,
        NetworkMode: 'bridge', // Need network to install pylint
        ReadonlyRootfs: false,
        AutoRemove: false
      }
    });
    
    // Create tar with Python file and pylintrc
    const pack = tar.pack();
    pack.entry({ name: 'solution.py' }, code);
    pack.entry({ name: '.pylintrc' }, pylintrc);
    pack.finalize();
    
    await container.putArchive(pack, { path: '/tmp' });
    await container.start();
    
    // Timeout after 30 seconds (need time to install pylint)
    const timeoutHandle = setTimeout(async () => {
      try {
        if (container) await container.kill();
      } catch {}
    }, 30000);
    
    await container.wait();
    clearTimeout(timeoutHandle);
    
    const logs = await container.logs({ stdout: true, stderr: true });
    const output = logs.toString('utf8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    
    await container.remove();
    
    // Parse Pylint JSON output
    try {
      // Pylint outputs JSON array directly
      const jsonMatch = output.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const issues = JSON.parse(jsonMatch[0]);
        const issueCount = Array.isArray(issues) ? issues.length : 0;
        
        // Pylint scoring: start at 10, subtract for issues
        // Major issues (error/fatal): -1.0 each
        // Minor issues (warning): -0.5 each
        // Conventions/refactor: -0.25 each
        let deduction = 0;
        const violations: string[] = [];
        
        if (Array.isArray(issues)) {
          issues.forEach((issue: any) => {
            const symbol = issue.symbol || issue['message-id'] || '';
            const msg = issue.message || '';
            
            if (issue.type === 'error' || issue.type === 'fatal') {
              deduction += 1.0;
              violations.push(`${symbol}: ${msg}`);
            } else if (issue.type === 'warning') {
              deduction += 0.5;
              violations.push(`${symbol}: ${msg}`);
            } else if (issue.type === 'convention' || issue.type === 'refactor') {
              deduction += 0.25;
              if (violations.length < 3) {
                violations.push(`${symbol}: ${msg}`);
              }
            }
          });
        }
        
        // Account for negative deductions
        const score = Math.max(0, Math.min(10, 10 - deduction));
        
        return {
          score,
          issues: issueCount,
          details: issueCount > 0 
            ? `${violations.slice(0, 2).join('; ')}`
            : 'No issues found'
        };
      }
    } catch (parseError) {
      console.error('Pylint JSON parse error:', parseError);
    }
    
    // Fallback: Pylint might output plain text format
    // Look for specific Pylint message patterns
    const lines = output.split('\n');
    const issueLines = lines.filter(line => 
      line.match(/:\d+:\d+:/) && (line.includes('error') || line.includes('warning') || line.includes('convention'))
    );
    
    const errorCount = issueLines.filter(line => line.toLowerCase().includes('error')).length;
    const warningCount = issueLines.filter(line => line.toLowerCase().includes('warning')).length;
    const conventionCount = issueLines.filter(line => line.toLowerCase().includes('convention')).length;
    const totalIssues = errorCount + warningCount + conventionCount;
    
    const score = Math.max(0, 10 - (errorCount * 1.0) - (warningCount * 0.5) - (conventionCount * 0.25));
    
    return {
      score: Math.min(10, score),
      issues: totalIssues,
      details: totalIssues > 0 
        ? `${errorCount} errors, ${warningCount} warnings, ${conventionCount} conventions`
        : 'Code looks clean'
    };
    
  } catch (error) {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {}
    }
    throw error;
  }
}

/**
 * Run Checkstyle on Java code
 */
async function runCheckstyle(code: string): Promise<LinterResult> {
  let container: Docker.Container | null = null;
  
  try {
    const image = 'eclipse-temurin:11-jdk';
    
    // Checkstyle XML configuration for Google Java Style
    const checkstyleConfig = `<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
  <module name="TreeWalker">
    <!-- Naming Conventions -->
    <module name="ConstantName"/>
    <module name="LocalFinalVariableName"/>
    <module name="LocalVariableName"/>
    <module name="MemberName"/>
    <module name="MethodName"/>
    <module name="PackageName"/>
    <module name="ParameterName"/>
    <module name="StaticVariableName"/>
    <module name="TypeName"/>
    
    <!-- Whitespace -->
    <module name="GenericWhitespace"/>
    <module name="EmptyForIteratorPad"/>
    <module name="MethodParamPad"/>
    <module name="NoWhitespaceAfter"/>
    <module name="NoWhitespaceBefore"/>
    <module name="OperatorWrap"/>
    <module name="ParenPad"/>
    <module name="TypecastParenPad"/>
    <module name="WhitespaceAfter"/>
    <module name="WhitespaceAround"/>
    
    <!-- Coding -->
    <module name="EmptyStatement"/>
    <module name="EqualsHashCode"/>
    <module name="IllegalInstantiation"/>
    <module name="InnerAssignment"/>
    <module name="SimplifyBooleanExpression"/>
    <module name="SimplifyBooleanReturn"/>
    
    <!-- Design -->
    <module name="FinalClass"/>
    <module name="HideUtilityClassConstructor"/>
    <module name="InterfaceIsType"/>
    <module name="VisibilityModifier"/>
  </module>
</module>`;
    
    // Create container
    container = await docker.createContainer({
      Image: image,
      Cmd: [
        'sh', '-c',
        `cd /app && \\
         wget -q https://github.com/checkstyle/checkstyle/releases/download/checkstyle-10.12.5/checkstyle-10.12.5-all.jar && \\
         java -jar checkstyle-10.12.5-all.jar -c /app/checkstyle.xml /app/Solution.java 2>&1 || true`
      ],
      WorkingDir: '/app',
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      HostConfig: {
        Memory: 512 * 1024 * 1024,
        NanoCpus: 1000000000,
        NetworkMode: 'bridge', // Need network to download checkstyle
        ReadonlyRootfs: false,
        AutoRemove: false
      }
    });
    
    // Create tar with Java file and checkstyle config
    const pack = tar.pack();
    pack.entry({ name: 'Solution.java' }, code);
    pack.entry({ name: 'checkstyle.xml' }, checkstyleConfig);
    pack.finalize();
    
    await container.putArchive(pack, { path: '/app' });
    await container.start();
    
    const timeoutHandle = setTimeout(async () => {
      try {
        if (container) await container.kill();
      } catch {}
    }, 30000); // Longer timeout for download
    
    await container.wait();
    clearTimeout(timeoutHandle);
    
    const logs = await container.logs({ stdout: true, stderr: true });
    const output = logs.toString('utf8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    
    await container.remove();
    
    // Parse Checkstyle output
    // Format: [WARN] /app/Solution.java:3:9: Variable name 'M' must match pattern...
    const violationLines = output.split('\n').filter(line => 
      line.includes('[WARN]') || line.includes('[ERROR]')
    );
    
    const errorCount = violationLines.filter(line => line.includes('[ERROR]')).length;
    const warningCount = violationLines.filter(line => line.includes('[WARN]')).length;
    const totalIssues = errorCount + warningCount;
    
    // Extract specific violation types for feedback
    const violations: string[] = [];
    violationLines.slice(0, 3).forEach(line => {
      const match = line.match(/:\s*(.+)$/);
      if (match) {
        violations.push(match[1].trim());
      }
    });
    
    // Score: 10 - (errors * 1.5) - (warnings * 0.3)
    const score = Math.max(0, Math.min(10, 10 - (errorCount * 1.5) - (warningCount * 0.3)));
    
    return {
      score,
      issues: totalIssues,
      details: totalIssues > 0 
        ? `${errorCount} errors, ${warningCount} warnings. ${violations.slice(0, 2).join('; ')}`
        : 'Code follows good practices'
    };
    
  } catch (error) {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {}
    }
    throw error;
  }
}

/**
 * Run simple JavaScript style check
 */
async function runJavaScriptStyleCheck(code: string): Promise<LinterResult> {
  // Simple heuristic-based scoring for JavaScript
  // In production, you'd want to use ESLint via Docker
  
  const issues: string[] = [];
  
  // Check for common style issues
  if (!code.includes('use strict') && !code.includes('\'use strict\'')) {
    issues.push('Missing strict mode');
  }
  
  if (code.split('\n').some(line => line.length > 120)) {
    issues.push('Lines too long (>120 chars)');
  }
  
  if (!/const|let/.test(code) && /var /.test(code)) {
    issues.push('Using var instead of const/let');
  }
  
  // Count basic style violations
  const singleLetterVars = (code.match(/\b[a-z]\s*=/gi) || []).length;
  if (singleLetterVars > 3) {
    issues.push('Too many single-letter variables');
  }
  
  const score = Math.max(0, 10 - issues.length * 1.5);
  
  return {
    score,
    issues: issues.length,
    details: issues.length > 0 ? issues.join(', ') : 'Code style looks good'
  };
}

/**
 * Calculate readability score based on code complexity
 */
function calculateReadabilityScore(
  code: string,
  language: 'python' | 'java' | 'javascript',
  feedback: string[]
): number {
  let score = 100;
  const issues: string[] = [];
  
  const lines = code.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0).length;
  
  // Check 1: Nesting depth
  const maxNesting = calculateMaxNesting(lines);
  if (maxNesting > 10) {
    score -= 20;
    issues.push(`Deep nesting (${maxNesting} levels)`);
  } else if (maxNesting > 8) {
    score -= 10;
    issues.push(`Moderate nesting (${maxNesting} levels)`);
  }
  
  // Check 2: Line length
  const longLines = lines.filter(line => line.length > 120).length;
  if (longLines > 5) {
    score -= 15;
    issues.push(`${longLines} lines exceed 120 characters`);
  } else if (longLines > 0) {
    score -= 5;
  }
  
  // Check 3: Comments (good practice)
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    if (language === 'python') {
      return trimmed.startsWith('#');
    } else {
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    }
  }).length;
  
  const commentRatio = commentLines / nonEmptyLines;
  if (commentRatio > 0.1 && commentRatio < 0.4) {
    score += 5; // Bonus for good commenting
    issues.push('Good use of comments');
  }
  
  // Check 4: Meaningful variable names
  const shortVarCount = (code.match(/\b[a-z]\s*=/gi) || []).length;
  if (shortVarCount > 5) {
    score -= 10;
    issues.push('Too many single-letter variable names');
  }
  
  score = Math.max(0, Math.min(100, score));
  
  if (score >= 80) {
    feedback.push(`Good readability. ${issues.filter(i => !i.includes('No')).slice(0, 2).join(', ') || 'Well structured'}`);
  } else if (score >= 60) {
    feedback.push(`Decent readability. ${issues.filter(i => i.includes('too') || i.includes('Deep') || i.includes('exceed')).slice(0, 2).join(', ')}`);
  } else {
    feedback.push(`Poor readability. ${issues.filter(i => i.includes('too') || i.includes('Deep') || i.includes('No')).slice(0, 2).join(', ')}`);
  }
  
  return score;
}


// Max nesting depth
function calculateMaxNesting(lines: string[]): number {
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (const line of lines) {
    // Count opening braces/colons
    const opens = (line.match(/[{(]|:\s*$/g) || []).length;
    const closes = (line.match(/[})](?!\w)/g) || []).length;
    
    currentDepth += opens;
    maxDepth = Math.max(maxDepth, currentDepth);
    currentDepth -= closes;
    currentDepth = Math.max(0, currentDepth);
  }
  
  return maxDepth;
}

