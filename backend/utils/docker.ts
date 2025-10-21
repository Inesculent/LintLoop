import Docker from 'dockerode';
import { ExecutionResult } from '../types';

const docker = new Docker();

interface ExecuteCodeParams {
  code: string;
  language: 'python' | 'java';
  input?: string;
  timeout?: number;
}

async function executeCode({
  code,
  language,
  input = '',
  timeout = 5000
}: ExecuteCodeParams): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    let container;
    let command: string[];
    let image: string;

    if (language === 'python') {
      image = 'python:3.9-slim';
      command = ['python', '-c', code];
    } else if (language === 'java') {
      image = 'openjdk:11-slim';
      // Java needs to compile first, then run
      // We'll write to a temp file, compile, then execute
      command = [
        'sh',
        '-c',
        `echo '${code.replace(/'/g, "'\\''")}' > Main.java && javac Main.java && java -cp . Main`
      ];
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Create container
    container = await docker.createContainer({
      Image: image,
      Cmd: command,
      Tty: false,
      AttachStdin: Boolean(input),
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: Boolean(input),
      StdinOnce: Boolean(input),
      HostConfig: {
        Memory: 256 * 1024 * 1024, // 256MB
        NanoCpus: 1000000000, // 1 CPU
        NetworkMode: 'none',
        ReadonlyRootfs: false, // Java needs to write .class files
        PidsLimit: 50,
        AutoRemove: false // We'll remove manually
      }
    });

    // Start container
    await container.start();

    // If there's input, send it to stdin
    if (input) {
      const stream = await container.attach({
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true
      });
      stream.write(input);
      stream.end();
    }

    // Set timeout to kill container
    const timeoutHandle = setTimeout(async () => {
      try {
        await container.kill();
      } catch (e) {
        // Container might already be stopped
      }
    }, timeout);

    // Wait for container to finish
    const result = await container.wait();
    clearTimeout(timeoutHandle);

    // Get logs
    const logs = await container.logs({
      stdout: true,
      stderr: true
    });

    // Parse Docker logs properly
    const output = logs.toString('utf8');
    
    // Clean up null bytes and all control characters (including SOH, SOW, etc.)
    const cleanOutput = output
      .replace(/\0/g, '')                    // Remove null bytes
      .replace(/\x00/g, '')                  // Remove null characters
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\u0000-\u001F/g, '')         // Remove Unicode control characters
      .replace(/null/g, '')                  // Remove literal "null" strings
      .replace(/SOH|SOW/g, '')              // Remove SOH and SOW markers
      .trim();
    
    // Split stdout and stderr
    let stdout = '';
    let stderr = '';
    
    // Simple parsing - look for actual content
    const lines = cleanOutput.split('\n');
    lines.forEach(line => {
      // Skip empty lines and null characters
      if (line.trim() && !line.includes('\0') && !line.includes('null')) {
        if (line.includes('error') || line.includes('Error') || line.includes('Exception')) {
          stderr += line + '\n';
        } else {
          stdout += line + '\n';
        }
      }
    });

    // Clean up
    await container.remove();

    const executionTime = Date.now() - startTime;

    return {
      output: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: result.StatusCode,
      executionTime,
      success: result.StatusCode === 0
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      return {
        output: '',
        stderr: error.message,
        exitCode: -1,
        executionTime,
        success: false
      };
    }

    return {
      output: '',
      stderr: 'Unknown error occurred',
      exitCode: -1,
      executionTime,
      success: false
    };
  }
}

// Helper to test if Docker is available
async function testDockerConnection(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch (error) {
    console.error('Docker connection failed:', error);
    return false;
  }
}

// Pull required images
async function pullImages(): Promise<void> {
  const images = [
    'python:3.9-slim',
    'openjdk:11-slim'
  ];

  for (const image of images) {
    try {
      console.log(`Pulling ${image}...`);
      await docker.pull(image);
      console.log(`Successfully pulled ${image}`);
    } catch (error) {
      console.error(`Failed to pull ${image}:`, error);
    }
  }
}

module.exports = {
  executeCode,
  testDockerConnection,
  pullImages
};

// Execute a Java Solution + Main pair
async function executeJavaSolution({
  solutionCode,
  mainCode,
  timeout = 5000,
  memoryLimit = 256
}: { solutionCode: string; mainCode: string; timeout?: number; memoryLimit?: number; }): Promise<ExecutionResult> {
  const startTime = Date.now();
  try {
    const image = 'openjdk:11-slim';
    const safeSolution = solutionCode.replace(/'/g, "'\\''");
    const safeMain = mainCode.replace(/'/g, "'\\''");
    const command = [
      'sh',
      '-c',
      `echo '${safeSolution}' > Solution.java && echo '${safeMain}' > Main.java && javac Main.java Solution.java && java -cp . Main`
    ];

    const container = await docker.createContainer({
      Image: image,
      Cmd: command,
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      HostConfig: {
        Memory: memoryLimit * 1024 * 1024, // Convert MB to bytes
        NanoCpus: 1000000000,
        NetworkMode: 'none',
        ReadonlyRootfs: false,
        PidsLimit: 50,
        AutoRemove: false
      }
    });

    await container.start();

    const timeoutHandle = setTimeout(async () => {
      try { await container.kill(); } catch {}
    }, timeout);

    const result = await container.wait();
    clearTimeout(timeoutHandle);

    const logs = await container.logs({ stdout: true, stderr: true });
    const output = logs.toString('utf8');
    const cleanOutput = output
      .replace(/\0/g, '')
      .replace(/\x00/g, '')
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\u0000-\u001F/g, '')
      .replace(/null/g, '')
      .replace(/SOH|SOW/g, '')
      .trim();

    let stdout = '';
    let stderr = '';
    const lines = cleanOutput.split('\n');
    lines.forEach(line => {
      if (line.trim() && !line.includes('\0') && !line.includes('null')) {
        if (line.includes('error') || line.includes('Error') || line.includes('Exception')) {
          stderr += line + '\n';
        } else {
          stdout += line + '\n';
        }
      }
    });

    await container.remove();

    const executionTime = Date.now() - startTime;
    return {
      output: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: result.StatusCode,
      executionTime,
      success: result.StatusCode === 0
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    if (error instanceof Error) {
      return { output: '', stderr: error.message, exitCode: -1, executionTime, success: false };
    }
    return { output: '', stderr: 'Unknown error occurred', exitCode: -1, executionTime, success: false };
  }
}

module.exports.executeJavaSolution = executeJavaSolution;