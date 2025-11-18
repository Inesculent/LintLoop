import express from 'express';
import request from 'supertest';

// Mock docker utilities before importing routes
jest.mock('../../utils/docker', () => ({
  testDockerConnection: jest.fn().mockResolvedValue(false), // Disable Docker for tests
  executeCode: jest.fn().mockResolvedValue({
    output: 'Hello, World!\n',
    stderr: '',
    exitCode: 0,
    executionTime: 50,
    success: true
  })
}));

import executeRoutes = require('../../routes/execute');

const app = express();
app.use(express.json());
app.use('/api/execute', executeRoutes);

describe('Execution Routes', () => {
    describe('POST /api/execute', () => {
        it('should return 400 if code is missing', async () => {
            const response = await request(app).post('/api/execute').send({
                language: 'python'
            });
            expect(response.status).toBe(400);
        });
        it('should return 400 if language is missing', async () => {
            const response = await request(app).post('/api/execute').send({
                code: 'print("Hello, World!")'
            });
            expect(response.status).toBe(400);
        });
        it('should return 400 if language is not supported', async () => {
            const response = await request(app).post('/api/execute').send({
                code: 'print("Hello, World!")',
                language: 'lua'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Unsupported language');
        });
        
        it('should accept valid Python code', async () => {
            const response = await request(app).post('/api/execute').send({
                code: 'print("Hello, World!")',
                language: 'python'
            });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('output');
        });
        
        it('should accept valid Java code', async () => {
            const response = await request(app).post('/api/execute').send({
                code: 'public class Main { public static void main(String[] args) { System.out.println("Hello"); } }',
                language: 'java'
            });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
        });
    });
});