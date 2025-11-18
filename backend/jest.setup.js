// Jest setup file - runs before each test suite
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/linterloop-test';
process.env.PORT = '5001';
process.env.DOCKER_ENABLED = 'false';
process.env.RESEND_API_KEY = 're_test_key';
process.env.EMAIL_FROM = 'Test <test@test.com>';
process.env.FRONTEND_URL = 'http://localhost:3000';

