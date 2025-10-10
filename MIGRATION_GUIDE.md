# Multi-User Database Migration Guide

## Overview
Your database has been restructured to support multiple users with individual progress tracking. Each user can now track their own progress independently.

## What Changed

### Database Schema
- **New `users` table**: Stores user information synced from Clerk
- **Modified `techniques` table**: Removed the `learned` field (now in `userProgress`)
- **New `userProgress` table**: Tracks user-specific progress, notes, and timestamps

### Backend Changes
- Created `convex/users.ts` for user management
- Updated `convex/techniques.ts` with user-specific queries and mutations
- All queries now require authentication via Clerk
- Progress is tracked per user with timestamps

### Frontend Changes
- `TechniqueTracker` component now syncs users automatically
- Added notes functionality (users can add personal notes per technique)
- Added "learned on" timestamps
- Updated to use new backend mutations

## Migration Steps

### 1. Clear Old Data (Optional)
If you have test data in your database, you may want to clear it since it doesn't have user associations:

```bash
# Run Convex dashboard and manually clear tables, or keep the data (it won't interfere)
```

### 2. Regenerate Convex Types
Run your Convex development server to regenerate the TypeScript types:

```bash
npx convex dev
```

This will:
- Generate new types for the `users` and `userProgress` tables
- Update the API types
- Clear the TypeScript errors you're seeing

### 3. Seed Techniques
The techniques will be seeded automatically when a user first visits the app. No manual action needed.

### 4. Test the Application
1. Start your development server: `npm run dev` (or `pnpm dev`)
2. Sign in with a Clerk account
3. Check techniques load correctly
4. Test checking off techniques (progress should save)
5. Test adding notes to techniques
6. Sign in with a different account to verify separate progress

## Database Structure

### Users Table
```typescript
{
  clerkId: string;           // From Clerk authentication
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: number;
  lastLoginAt: number;
}
```

### Techniques Table
```typescript
{
  name: string;
  category: string;
  videoUrl: string;
  createdAt: number;
}
```

### UserProgress Table
```typescript
{
  userId: string;            // Clerk user ID
  techniqueId: Id<"techniques">;
  learned: boolean;
  learnedAt?: number;        // Timestamp when marked as learned
  notes?: string;            // User's personal notes
  updatedAt: number;
}
```

## New Features

### 1. User Syncing
- Users are automatically synced to Convex when they sign in
- User info updates on each login

### 2. Timestamps
- When a user marks a technique as learned, the timestamp is recorded
- Displayed as "Learned on [date]" in the UI

### 3. Notes
- Each user can add personal notes to any technique
- Notes are expandable/collapsible
- Saved separately per user

### 4. Independent Progress
- Each user has completely separate progress
- Techniques are shared, progress is not

## Troubleshooting

### TypeScript Errors
**Issue**: Seeing TypeScript errors in Convex files  
**Solution**: Run `npx convex dev` to regenerate types

### Authentication Errors
**Issue**: "Not authenticated" errors  
**Solution**: Ensure Clerk middleware is working and user is signed in

### Progress Not Saving
**Issue**: Checkbox changes don't persist  
**Solution**: Check browser console for errors, ensure Convex is running

### Multiple Users See Same Progress
**Issue**: This shouldn't happen anymore!  
**Solution**: If it does, check that queries are using the correct userId from auth context

## Environment Setup

Make sure you have:
1. Clerk environment variables configured
2. Convex project linked (`npx convex dev`)
3. Both development servers running (Next.js + Convex)

## Next Steps

After migration:
1. Test with multiple user accounts
2. Add more techniques via the seed function
3. Consider adding user profile page
4. Consider adding progress statistics/analytics
5. Add filtering/sorting options for techniques

