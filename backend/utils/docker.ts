import Docker from 'dockerode';
import { ExecutionResult } from '../types';
import * as tar from 'tar-stream';

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
  let container: Docker.Container | null = null;

  try {
    let command: string[];
    let image: string;

    if (language === 'python') {
      image = 'python:3.9-slim';
      command = ['python', '-c', code];
      
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
          ReadonlyRootfs: true,
          PidsLimit: 50,
          AutoRemove: false
        }
      });

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

    } else if (language === 'java') {
      image = 'eclipse-temurin:11-jdk';
      command = ['sh', '-c', 'javac Main.java && java -Xmx128m Main'];
      
      // Create container
      container = await docker.createContainer({
        Image: image,
        Cmd: command,
        WorkingDir: '/app',
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
          Memory: 256 * 1024 * 1024, // 256MB
          NanoCpus: 1000000000, // 1 CPU
          NetworkMode: 'none',
          ReadonlyRootfs: false, // Java needs to write .class files
          PidsLimit: 50,
          AutoRemove: false
        }
      });

      // Create tar archive with Main.java
      const pack = tar.pack();
      pack.entry({ name: 'Main.java' }, code);
      pack.finalize();

      // Put files into container
      await container.putArchive(pack, { path: '/app' });
      await container.start();

    } else {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Set timeout to kill container
    const timeoutHandle = setTimeout(async () => {
      try {
        if (container) await container.kill();
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

    // Properly demux Docker logs
    let stdout = '';
    let stderr = '';
    
    // Docker logs have an 8-byte header for each frame
    let offset = 0;
    while (offset < logs.length) {
      if (offset + 8 > logs.length) break;
      
      const header = logs.slice(offset, offset + 8);
      const streamType = header[0];
      const size = header.readUInt32BE(4);
      
      offset += 8;
      if (offset + size > logs.length) break;
      
      const content = logs.slice(offset, offset + size).toString('utf8');
      
      if (streamType === 1) {
        stdout += content;
      } else if (streamType === 2) {
        stderr += content;
      }
      
      offset += size;
    }

    // Clean up
    if (container) await container.remove();

    const executionTime = Date.now() - startTime;

    return {
      output: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: result.StatusCode,
      executionTime,
      success: result.StatusCode === 0
    };

  } catch (error) {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {}
    }
    
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
    'eclipse-temurin:11-jdk'
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

// Execute a Java Solution + Main pair using tar-stream
async function executeJavaSolution({
  solutionCode,
  mainCode,
  timeout = 5000,
  memoryLimit = 512
}: { solutionCode: string; mainCode: string; timeout?: number; memoryLimit?: number; }): Promise<ExecutionResult> {
  const startTime = Date.now();
  let container: Docker.Container | null = null;
  
  try {
    const image = 'eclipse-temurin:11-jdk';
    
    // Create container
    container = await docker.createContainer({
      Image: image,
      Cmd: ['sh', '-c', 'javac Solution.java Main.java && java -Xmx128m Main'],
      WorkingDir: '/app',
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      HostConfig: {
        Memory: memoryLimit * 1024 * 1024,
        NanoCpus: 1000000000,
        NetworkMode: 'none',
        ReadonlyRootfs: false,
        PidsLimit: 50,
        AutoRemove: false
      }
    });

    // Create tar archive with files
    const pack = tar.pack();
    pack.entry({ name: 'Solution.java' }, solutionCode);
    pack.entry({ name: 'Main.java' }, mainCode);
    pack.finalize();

    // Put files into container
    await container.putArchive(pack, { path: '/app' });

    // Start container
    await container.start();

    // Set timeout
    const timeoutHandle = setTimeout(async () => {
      try {
        if (container) await container.kill();
      } catch {}
    }, timeout);

    // Wait for completion
    const result = await container.wait();
    clearTimeout(timeoutHandle);

    // Get logs
    const logs = await container.logs({ stdout: true, stderr: true });
    
    // Properly demux Docker logs
    let stdout = '';
    let stderr = '';
    
    // Docker logs have an 8-byte header for each frame
    // We need to parse this properly
    let offset = 0;
    while (offset < logs.length) {
      // Read 8-byte header
      if (offset + 8 > logs.length) break;
      
      const header = logs.slice(offset, offset + 8);
      const streamType = header[0]; // 0=stdin, 1=stdout, 2=stderr
      const size = header.readUInt32BE(4);
      
      offset += 8;
      
      if (offset + size > logs.length) break;
      
      const content = logs.slice(offset, offset + size).toString('utf8');
      
      if (streamType === 1) {
        stdout += content;
      } else if (streamType === 2) {
        stderr += content;
      }
      
      offset += size;
    }

    // Clean up
    if (container) await container.remove();

    const executionTime = Date.now() - startTime;
    return {
      output: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: result.StatusCode,
      executionTime,
      success: result.StatusCode === 0
    };

  } catch (error) {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {}
    }
    
    const executionTime = Date.now() - startTime;
    if (error instanceof Error) {
      return { output: '', stderr: error.message, exitCode: -1, executionTime, success: false };
    }
    return { output: '', stderr: 'Unknown error occurred', exitCode: -1, executionTime, success: false };
  }
}

// Execute a Python Solution + test harness using tar-stream
async function executePythonSolution({
  solutionCode,
  testHarness,
  timeout = 5000,
  memoryLimit = 256
}: { solutionCode: string; testHarness: string; timeout?: number; memoryLimit?: number; }): Promise<ExecutionResult> {
  const startTime = Date.now();
  let container: Docker.Container | null = null;
  
  try {
    const image = 'python:3.9-slim';
    
    // Combine solution code with test harness
    const fullCode = `${solutionCode}\n\n${testHarness}`;
    
    // Create container
    container = await docker.createContainer({
      Image: image,
      Cmd: ['python', '-c', fullCode],
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      HostConfig: {
        Memory: memoryLimit * 1024 * 1024,
        NanoCpus: 1000000000,
        NetworkMode: 'none',
        ReadonlyRootfs: true,
        PidsLimit: 50,
        AutoRemove: false
      }
    });

    // Start container
    await container.start();

    // Set timeout
    const timeoutHandle = setTimeout(async () => {
      try {
        if (container) await container.kill();
      } catch {}
    }, timeout);

    // Wait for completion
    const result = await container.wait();
    clearTimeout(timeoutHandle);

    // Get logs
    const logs = await container.logs({ stdout: true, stderr: true });
    
    // Properly demux Docker logs
    let stdout = '';
    let stderr = '';
    
    // Docker logs have an 8-byte header for each frame
    let offset = 0;
    while (offset < logs.length) {
      if (offset + 8 > logs.length) break;
      
      const header = logs.slice(offset, offset + 8);
      const streamType = header[0];
      const size = header.readUInt32BE(4);
      
      offset += 8;
      if (offset + size > logs.length) break;
      
      const content = logs.slice(offset, offset + size).toString('utf8');
      
      if (streamType === 1) {
        stdout += content;
      } else if (streamType === 2) {
        stderr += content;
      }
      
      offset += size;
    }

    // Clean up
    if (container) await container.remove();

    const executionTime = Date.now() - startTime;
    return {
      output: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: result.StatusCode,
      executionTime,
      success: result.StatusCode === 0
    };

  } catch (error) {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {}
    }
    
    const executionTime = Date.now() - startTime;
    if (error instanceof Error) {
      return { output: '', stderr: error.message, exitCode: -1, executionTime, success: false };
    }
    return { output: '', stderr: 'Unknown error occurred', exitCode: -1, executionTime, success: false };
  }
}

module.exports = {
  executeCode,
  executeJavaSolution,
  executePythonSolution,
  testDockerConnection,
  pullImages
};