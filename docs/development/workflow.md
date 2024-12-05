# Development Workflow Guide

## Git Workflow

### 1. Feature Development

Start by creating a new feature branch:
```bash
# Create and switch to a new feature branch
git checkout -b feature/your-feature-name

# Or switch to an existing feature branch
git checkout feature/your-feature-name
```

### 2. Making Changes

Make your changes and commit them frequently:
```bash
# Stage your changes
git add .

# Commit with a descriptive message following conventional commits
git commit -m "feat: description of your changes"
```

Commit message types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### 3. Deploying Changes

Before deploying, always sync with main:
```bash
# Get latest main
git checkout main
git pull

# Update your feature branch
git checkout feature/your-feature-name
git merge main

# Fix any conflicts if they occur

# Test your changes with the latest code

# Merge into main
git checkout main
git merge feature/your-feature-name
git push
```

### 4. Best Practices

1. **Branch Naming**
   - Feature branches: `feature/feature-name`
   - Bug fixes: `fix/bug-description`
   - Documentation: `docs/what-changed`

2. **Commit Messages**
   - Be descriptive but concise
   - Use conventional commit types
   - Reference issues/tickets when applicable

3. **Code Review**
   - Review your own changes before pushing
   - Use `git diff` to check changes
   - Test locally before deploying

4. **Deployment**
   - Always merge main into your feature branch first
   - Test after merging with main
   - Push to main only when ready to deploy

## Real-time Development

When working with real-time features:

1. **Database Changes**
   - Test real-time triggers locally first
   - Verify publications are set up correctly
   - Check real-time logs in the console

2. **Client-Side**
   - Add detailed logging for debugging
   - Handle connection state changes
   - Implement proper cleanup

## Environment Setup

1. **Local Development**
   ```bash
   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

2. **Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Never commit sensitive values
   - Use different values for development/production

## Testing

1. **Local Testing**
   ```bash
   # Run all tests
   npm test

   # Run specific test file
   npm test path/to/test
   ```

2. **Manual Testing**
   - Test all user flows
   - Check console for errors
   - Verify real-time updates
   - Test on different devices/browsers

## Deployment

1. **Pre-deployment Checklist**
   - All tests passing
   - No linting errors
   - Console free of errors
   - Real-time features working
   - Database migrations ready

2. **Deployment Process**
   ```bash
   # Sync with main
   git checkout main
   git pull
   git checkout your-feature
   git merge main

   # Run tests
   npm test

   # Build locally to verify
   npm run build

   # Merge and deploy
   git checkout main
   git merge your-feature
   git push
   ```

3. **Post-deployment**
   - Verify deployment in Vercel
   - Check production logs
   - Test critical features
   - Monitor error reporting

## Troubleshooting

### Common Issues

1. **Real-time Not Working**
   - Check Supabase real-time settings
   - Verify trigger functions
   - Check client subscriptions
   - Look for connection errors

2. **Build Errors**
   - Check TypeScript errors
   - Verify dependencies
   - Clear build cache if needed

3. **Database Issues**
   - Check migrations
   - Verify RLS policies
   - Test functions locally

### Getting Help

1. **Documentation**
   - Check project docs first
   - Review Supabase docs
   - Search GitHub issues

2. **Team Support**
   - Use descriptive issue titles
   - Include relevant logs
   - Share reproduction steps 