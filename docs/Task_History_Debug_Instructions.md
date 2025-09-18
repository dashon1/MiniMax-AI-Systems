# Task History Debug Instructions

## Quick Debug Guide

### Access Debug Version
**URL:** https://vwcjx4hser26.space.minimax.io

### Debug Steps

1. **Open Browser Console** (F12 → Console tab)

2. **Sign In to the Application**
   - Use existing credentials
   - Monitor console for auth-related logs starting with 🔍

3. **Navigate to History Tab**
   - Go to Dashboard → History tab
   - Look for logs starting with 📋

4. **Use Debug Panel**
   - Click "Debug" button in History tab
   - Click "Show" in Frontend Debug Info panel
   - Review user state, query state, and task data

5. **Test Manual Queries**
   - Click "Manual Query" button
   - Compare results with React Query data
   - Check console for detailed query results

### Key Console Logs to Monitor

- `🔍 useTasks: useEffect triggered` - Hook initialization
- `🔍 Auth Debug: User found in context` - Authentication status
- `📋 useTasks: Query enabled status changed` - Query enablement
- `📋 Tasks Query: Starting for user` - Query execution
- `📋 Tasks Query: Success! Found X tasks` - Successful data fetch
- `🔧 Manual Query: Testing direct database access` - Manual query execution

### Expected Debug Output

**Healthy Flow:**
```
🔍 useTasks: useEffect triggered, user: abc12345
🔍 Auth Debug: User found in context: user-abc12345-def67890
📋 useTasks: Query enabled status changed: true for user: abc12345
📋 Tasks Query: Starting for user: user-abc12345-def67890
📋 Tasks Query: Success! Found 3 tasks
```

**Problem Indicators:**
- User context shows 'none' or undefined
- Query never starts or gets stuck in loading
- Database errors with specific codes
- Manual query succeeds but React Query fails

### Debug Panel Information

**Frontend Debug Info shows:**
- User existence and ID
- Query loading/error states
- Task count and sample data

**Manual Query Results show:**
- Direct database query success/failure
- Task count from different query types
- Specific error messages
- Sample task data structure

### Common Issues and Solutions

**Issue:** User shows as 'none'
**Solution:** Authentication not complete - check sign-in process

**Issue:** Query enabled: false
**Solution:** User context timing issue - refresh page

**Issue:** Manual query succeeds, React Query fails
**Solution:** Frontend state management problem - check console for detailed errors

**Issue:** Manual query fails with permission error
**Solution:** Database RLS policy issue - requires backend investigation