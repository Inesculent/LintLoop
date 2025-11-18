# Backend Unit Tests

This directory contains Jest unit tests for the LintLoop backend.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

## Test Structure

```
__tests__/
├── middleware/       # Tests for Express middleware
├── routes/          # Tests for API routes
├── utils/           # Tests for utility functions
└── models/          # Tests for database models (add as needed)
```

## Writing Tests

### Example: Testing a Utility Function

```typescript
import { myFunction } from '../../utils/myUtil';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Example: Testing Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { myMiddleware } from '../../middleware/myMiddleware';

describe('myMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should call next() for valid request', () => {
    myMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
```

### Example: Testing API Routes

```typescript
import request from 'supertest';
import express from 'express';
import myRoutes from '../../routes/myRoutes';

const app = express();
app.use(express.json());
app.use('/api/my', myRoutes);

describe('My API Routes', () => {
  it('should return 200 on GET /api/my', async () => {
    const response = await request(app).get('/api/my');
    expect(response.status).toBe(200);
  });
});
```

## Test Database

For tests that require a database:
- Use a separate test database (configured in `jest.setup.js`)
- Consider using MongoDB Memory Server for isolated testing
- Clean up test data after each test

## Mocking

Use Jest's built-in mocking for external dependencies:

```typescript
jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn()
}));
```

## CI/CD Integration

Tests run automatically on:
- Pre-commit (if you set up Husky)
- Pull requests
- Before deployment

## Coverage

Aim for:
- **80%+ overall coverage**
- **100% coverage** for critical paths (auth, admin, payments)
- Test edge cases and error handling

