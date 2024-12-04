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

## 7. Common Pitfalls to Avoid
- Don't modify working code to fix unrelated issues
- Don't rewrite entire components for small fixes
- Don't change core providers without thorough testing
- Don't ignore TypeScript errors - fix them properly
- Don't mix database and UI changes in the same fix

## 8. Best Practices
- Start with the smallest possible fix
- Add logging for debugging
- Test with fresh database state
- Keep type definitions up to date
- Document significant changes

## 9. Emergency Procedures
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

Remember: The smallest working change is often the best change.

