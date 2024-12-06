# Cursor Development Rules

## 1. Change Management
- **Isolate Changes**: Work on one issue at a time. Don't modify unrelated components.
- **Incremental Changes**: Make small, testable changes rather than large rewrites.
- **Version Control**: Create restore points before making significant changes.
- **Component Boundaries**: Respect component boundaries - don't modify shared components for specific issues.

## 2. Authentication & State Management
- **Auth Flow**: Never modify core auth providers unless absolutely necessary.
- **State Changes**: Test state changes thoroughly before modifying state management.
- **Context Providers**: Keep context providers simple and focused.
- **Type Safety**: Maintain proper TypeScript types, especially for auth state.

## 3. Database Changes
- **Migrations**: Keep migrations isolated and reversible.
- **Test Data**: Always test with fresh database state.
- **Triggers**: Test database triggers with multiple scenarios.
- **Rollback Plan**: Have a clear rollback plan for database changes.

## 4. Error Handling
- **Error Boundaries**: Implement proper error boundaries.
- **Logging**: Add detailed logging for debugging.
- **User Feedback**: Always provide clear user feedback.
- **Type Checking**: Use TypeScript to catch errors early.

## 5. Testing & Verification
- **Component Testing**: Test components in isolation.
- **Integration Testing**: Test full user flows.
- **Database Testing**: Verify database state after operations.
- **Error Cases**: Test both success and error cases.

## 6. Code Organization
- **File Structure**: Keep related code together.
- **Type Definitions**: Maintain clear type definitions.
- **Component Hierarchy**: Respect component hierarchy.
- **Service Layer**: Keep service layer clean and focused.

## 7. React Router and Auth Hierarchy
- **Core Structure**: Maintain the established hierarchy:
  - `App.tsx`: Provides core providers (ChakraUI, Auth)
  - `routes.tsx`: Defines route structure
  - `Layout.tsx`: Route element, not route container
- **Auth Context**: Keep at root level for global availability
- **Route Changes**: Never move routes from `App.tsx` to `Layout.tsx`
- **Working Nav**: If navigation works, be extremely cautious about restructuring
- **Safe Changes**: Create new branch for routing changes to avoid breaking navigation

## 8. Common Pitfalls to Avoid
- Don't modify working code to fix unrelated issues
- Don't rewrite entire components for small fixes
- Don't change core providers without thorough testing
- Don't ignore TypeScript errors - fix them properly
- Don't mix database and UI changes in the same fix

## 9. Best Practices
- Start with the smallest possible fix
- Add logging for debugging
- Test with fresh database state
- Keep type definitions up to date
- Document significant changes

## 10. Emergency Procedures
1. **When Things Break**:
   - Stop making changes
   - Review recent modifications
   - Revert to last working state
   - Start with minimal fix

2. **Recovery Steps**:
   - Identify core issue
   - Create isolated fix
   - Test thoroughly
   - Document solution

## 11. Development Workflow

### Git Workflow

1. **Feature Development**
   ```bash
   # Create new feature branch
   git checkout -b feature/your-feature-name
   ```

2. **Making Changes**
   ```bash
   # Stage and commit with descriptive message
   git add .
   git commit -m "feat: description of changes"
   ```

3. **Before Deploying**
   ```bash
   # Sync with main
   git checkout main
   git pull
   git checkout feature/your-feature-name
   git merge main

   # Test and deploy
   git checkout main
   git merge feature/your-feature-name
   git push
   ```

### Branch Naming
- Features: `feature/feature-name`
- Fixes: `fix/bug-description`
- Docs: `docs/what-changed`

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code restructuring
- `test`: Testing
- `chore`: Maintenance

### Real-time Development
1. **Database**
   - Test triggers locally
   - Verify publications
   - Monitor real-time logs

2. **Client**
   - Handle connection states
   - Implement proper cleanup
   - Add detailed logging

### Deployment Checklist
1. **Pre-deployment**
   - Tests passing
   - No linting errors
   - Real-time working
   - Migrations ready

2. **Post-deployment**
   - Verify in Vercel
   - Check logs
   - Test features
   - Monitor errors

Remember: The smallest working change is often the best change.

