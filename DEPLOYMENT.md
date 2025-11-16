# LintLoop Deployment Guide

## Overview
This guide covers the environment variables and GitHub secrets required for deploying LintLoop.

## GitHub Secrets Required

Navigate to your repository → Settings → Secrets and variables → Actions, and add the following secrets:

### Server Access
- **`HOST`**: Your DigitalOcean server IP address
- **`USERNAME`**: SSH username (usually `root`)
- **`DEPLOY_KEY`**: SSH private key for server access

### Backend Environment Variables
- **`MONGODB_URI`**: MongoDB connection string (e.g., `mongodb://localhost:27017/lintloop`)
- **`JWT_SECRET`**: Secret key for JWT token signing (generate a strong random string)
- **`EMAIL_USER`**: Email address for sending emails (optional)
- **`EMAIL_PASSWORD`**: Email password or app-specific password (optional)

### Frontend Environment Variables
- **`NEXT_PUBLIC_API_URL`**: Backend API URL
  - Production: `http://your-server-ip:5000` or `https://api.yourdomain.com`
  - Local development: `http://localhost:5000`

## Local Development Setup

### Backend (.env)
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lintloop
JWT_SECRET=your-local-jwt-secret-key
DOCKER_ENABLED=true
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
```

### Frontend (.env.local)
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Environment Variable Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing |
| `DOCKER_ENABLED` | No | `false` | Enable Docker for code execution |
| `EMAIL_USER` | No | - | Email for sending notifications |
| `EMAIL_PASSWORD` | No | - | Email password |

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `''` | Backend API base URL |

**Note:** Next.js requires the `NEXT_PUBLIC_` prefix for environment variables that are exposed to the browser.

## Deployment Process

The GitHub Actions workflow (`deploy.yml`) automatically:

1. **Pulls latest code** from the main branch
2. **Creates environment files** from GitHub secrets
3. **Installs dependencies** using `npm ci`
4. **Builds backend** TypeScript code
5. **Builds frontend** Next.js application
6. **Restarts services** using PM2:
   - Backend: `linterloop-backend`
   - Frontend: `linterloop-frontend`
7. **Pulls Docker images** for code execution (Python, Java)

## Troubleshooting

### "npm ci" Failures
- **Cause**: Missing or out-of-sync `package-lock.json`
- **Solution**: Run `npm install` locally and commit the lock file

### API Connection Errors
- **Cause**: Missing or incorrect `NEXT_PUBLIC_API_URL`
- **Solution**: Verify the GitHub secret is set correctly

### Authentication Errors
- **Cause**: Missing or invalid `JWT_SECRET`
- **Solution**: Generate a strong secret and add to GitHub secrets

### Email Features Not Working
- **Cause**: Missing email credentials
- **Solution**: Add `EMAIL_USER` and `EMAIL_PASSWORD` to GitHub secrets

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Use app-specific passwords** for email (not your main password)
4. **Rotate secrets regularly**
5. **Use HTTPS** in production for API URLs
6. **Restrict SSH key permissions** to deployment only

## Quick Reference Commands

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Check PM2 processes on server
ssh user@server "pm2 status"

# View backend logs
ssh user@server "pm2 logs linterloop-backend"

# View frontend logs
ssh user@server "pm2 logs linterloop-frontend"

# Restart services manually
ssh user@server "cd ~/linterloop && pm2 restart all"
```

## Post-Deployment Verification

After deployment, verify:

1. ✅ Both PM2 processes are running (`pm2 status`)
2. ✅ Backend responds: `curl http://your-server:5000/api/test`
3. ✅ Frontend loads in browser
4. ✅ Frontend can connect to backend API
5. ✅ Docker images are available for code execution

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

