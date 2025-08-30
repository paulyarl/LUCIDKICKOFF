#!/bin/bash

# Install Supabase CLI if not already installed
if ! command -v supabase &> /dev/null; then
  echo "Installing Supabase CLI..."
  npm install -g supabase --save-dev
fi

# Login to Supabase
supabase login

# Link to your Supabase project (replace with your project reference)
# supabase link --project-ref your-project-ref

# Start the local development server
supabase start

# Apply migrations
supabase migration up

# Apply seed data
supabase db reset --seed

# Generate TypeScript types
supabase gen types typescript --linked > src/types/database.types.ts

echo "Supabase setup complete!"
