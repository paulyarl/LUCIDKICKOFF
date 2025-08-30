# Supabase Setup for LucidCraft

This directory contains the database schema, migrations, and seed data for the LucidCraft application.

## Getting Started

### Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase --save-dev
   ```

2. Login to your Supabase account:
   ```bash
   supabase login
   ```

### Local Development

1. Start the local Supabase stack:
   ```bash
   supabase start
   ```

2. Apply migrations:
   ```bash
   supabase migration up
   ```

3. Seed the database with test data:
   ```bash
   supabase db reset --seed
   ```

4. Generate TypeScript types:
   ```bash
   supabase gen types typescript --linked > src/types/database.types.ts
   ```

### Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For local development (from `supabase start` output)
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

## Database Schema

### Tables

1. `user_profiles` - User information and roles
2. `packs` - Drawing packs containing multiple pages
3. `pages` - Individual pages within a pack
4. `user_packs` - Many-to-many relationship between users and packs
5. `artworks` - User-created artwork
6. `favorites` - User favorites
7. `parent_child_links` - Parent-child relationships
8. `approvals` - Parental approval system
9. `events` - System events and audit trail

## RLS Policies

- Users can only view and modify their own data
- Parents can view and manage their children's data
- Public content is readable by all authenticated users
- Sensitive operations require proper authorization

## Seed Data

The seed script includes:
- 1 parent user (parent@example.com / password123)
- 1 child user (child@example.com / password123)
- Sample packs and pages
- Example artworks and favorites
- Parent-child relationship
- Sample approval requests
