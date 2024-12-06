# Profile System Implementation Plan

## Phase 1: Profile Enhancements
- Username system (URL-safe, unique)
  - Auto-generation from email
  - Format validation (letters, numbers, _, -)
  - Length 3-30 characters
  - Case insensitive uniqueness
- Profile fields
  - Bio/Description
  - Website
  - Social links
  - Display name
  - Avatar

## Phase 2: Album System Foundation
- Default public album
  - Created automatically for new users
  - Used as public profile gallery
- Album features
  - Title and description
  - Privacy settings (public/private/unlisted)
  - Image metadata
  - Batch upload support

## Phase 3: Storage System
1. Avatar Storage
   - Bucket: `avatars`
   - Size limits
   - Image optimization
   - Access controls

2. Album Storage
   - Bucket: `album-images`
   - Folder structure: `user_id/album_id/`
   - Image processing
   - Privacy controls

## Phase 4: UI Implementation
1. Profile Management
   - Username selection
   - Profile editing
   - Avatar upload/cropping
   - Social links management

2. Album Management
   - Album creation/editing
   - Privacy controls
   - Image upload (single/batch)
   - Image organization

## Database Schema
```sql
-- Profiles
ALTER TABLE profiles
ADD COLUMN username text UNIQUE,
ADD COLUMN bio text,
ADD COLUMN website text,
ADD COLUMN social_links jsonb,
ADD COLUMN display_name text;

-- Albums
CREATE TABLE public.albums (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users,
    title text,
    description text,
    is_default boolean,
    privacy text
);

-- Images
CREATE TABLE public.images (
    id uuid PRIMARY KEY,
    album_id uuid REFERENCES albums,
    user_id uuid REFERENCES auth.users,
    title text,
    description text,
    storage_path text,
    metadata jsonb
);
```

## Security Considerations
1. Username Policy
   - URL-safe characters only
   - No impersonation
   - Reserved usernames

2. Storage Security
   - Signed URLs
   - Size limits
   - File type validation

3. RLS Policies
   - Profile visibility
   - Album privacy
   - Image access control

## Implementation Order
1. Database migrations
2. Storage configuration
3. Profile enhancement UI
4. Album system UI
5. Image upload system
6. Batch processing 