# Meta Salon Profile Implementation Guide

## Overview
This guide outlines the recommended approach for implementing user profiles and authentication features in Meta Salon, based on lessons learned and best practices for future scalability.

## 1. Database Schema Design

### Core Profile Schema
```sql
create table public.profiles (
    id uuid references auth.users(id) primary key,
    display_name text,
    username text unique,
    avatar_url text,
    website text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

Key points:
- Clear separation between `auth.users` and `public.profiles`
- UUID consistency for user IDs
- Minimal but extensible schema
- Timestamps for tracking

## 2. Database Triggers and Functions

### Profile Management Triggers
```sql
-- Profile creation trigger
create function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$$ language plpgsql security definer;

-- Profile update trigger with validation
create function public.handle_profile_update()
returns trigger as $$
begin
    -- Validate username format
    if new.username !~ '^[a-zA-Z0-9_]{3,15}$' then
        raise exception 'Invalid username format';
    end if;
    
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;
```

Features:
- Atomic, single-responsibility triggers
- Proper error handling
- Built-in validation
- Automatic timestamp management

## 3. TypeScript Types and Interfaces

```typescript
// types/user.ts
export interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  display_name?: string;
  username?: string;
  avatar_url?: string;
  website?: string;
}
```

Benefits:
- Type safety throughout the application
- Clear interface contracts
- Optional fields for partial updates

## 4. Authentication Service

```typescript
// services/authService.ts
export class AuthService {
  private static RATE_LIMIT_DELAY = 1000; // 1 second
  private static MAX_RETRIES = 3;

  async signIn(email: string, password: string) {
    let attempts = 0;
    while (attempts < AuthService.MAX_RETRIES) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        if (error.status === 429) {
          await new Promise(resolve => 
            setTimeout(resolve, AuthService.RATE_LIMIT_DELAY * (attempts + 1))
          );
          attempts++;
        } else {
          return { data: null, error };
        }
      }
    }
  }
}
```

Features:
- Rate limit handling
- Retry logic
- Clear error messages
- Proper typing

## 5. Profile Management Service

```typescript
// services/profileService.ts
export class ProfileService {
  async updateProfile(userId: string, updates: ProfileUpdate) {
    // Validate updates before sending to database
    if (updates.username && !this.isValidUsername(updates.username)) {
      throw new Error('Invalid username format');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .single();

    return { data, error };
  }

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Update profile with new avatar URL
    const avatarUrl = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath).data.publicUrl;

    return this.updateProfile(userId, { avatar_url: avatarUrl });
  }
}
```

Features:
- Separation of concerns
- Proper validation
- Organized file management
- Error handling

## 6. React Components

```typescript
// components/ProfileForm.tsx
export const ProfileForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (values: ProfileUpdate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await profileService.updateProfile(userId, values);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
}
```

Features:
- Loading states
- Error handling
- Clean separation of concerns
- Type safety

## 7. Testing Strategy

### Unit Tests
- Validation logic
- Service methods
- Component rendering

### Integration Tests
- Database triggers
- Service interactions
- API endpoints

### E2E Tests
- User registration flow
- Profile updates
- Avatar uploads

## 8. Migration Strategy

```sql
-- Example migration
begin;
  -- Add new fields
  alter table profiles add column bio text;
  
  -- Update triggers
  create or replace function handle_profile_update() ...
  
  -- Add indexes
  create index profiles_username_idx on profiles(username);
commit;
```

Best practices:
- Version all changes
- Make migrations reversible
- Test thoroughly before deployment
- Document changes

## Key Improvements Over Previous Implementation

1. Clear separation of concerns between auth and profile management
2. Proper error handling and rate limiting
3. Type-safe interfaces throughout the application
4. Atomic, testable database functions
5. Scalable file storage solution
6. Proper validation at all layers
7. Clear migration path for future changes

## Future-Proofing Considerations

1. Schema designed for extension (e.g., adding social links, preferences)
2. Modular service architecture for easy feature addition
3. Proper indexing strategy for performance
4. Clear error boundaries and recovery mechanisms
5. Consistent validation patterns
6. Documentation and type safety for maintainability

## Implementation Steps

1. Start with a stable commit
2. Implement database schema and triggers
3. Create TypeScript interfaces
4. Implement core services
5. Build UI components
6. Add comprehensive tests
7. Document everything
8. Deploy with proper monitoring

## Conclusion

This implementation guide provides a solid foundation for building user profile features while avoiding common pitfalls and preparing for future extensions. The focus is on maintainability, scalability, and reliability while keeping the codebase clean and well-documented. 