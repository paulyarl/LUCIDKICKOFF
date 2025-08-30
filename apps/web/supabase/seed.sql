-- Seed data for testing

-- Insert test users (passwords are 'password123')
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'parent@example.com',
    '$2a$10$7v9X2WxXKJhL4h3hVJ4XQO5XzJ4XZ6XZ6XZ6XZ6XZ6XZ6XZ6XZ6',
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'child@example.com',
    '$2a$10$7v9X2WxXKJhL4h3hVJ4XQO5XzJ4XZ6XZ6XZ6XZ6XZ6XZ6XZ6XZ6',
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

-- Insert user profiles
INSERT INTO public.user_profiles (id, username, display_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'parent_user', 'Parent User', 'parent'),
  ('22222222-2222-2222-2222-222222222222', 'child_user', 'Child User', 'child');

-- Create parent-child relationship
INSERT INTO public.parent_child_links (parent_id, child_id, is_verified) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', true);

-- Create test packs
INSERT INTO public.packs (id, name, description, is_public, created_by) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Starter Pack', 'Perfect for beginners', true, '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', 'Advanced Pack', 'For experienced creators', false, '22222222-2222-2222-2222-222222222222');

-- Add pages to packs
INSERT INTO public.pages (id, pack_id, title, page_number, content) VALUES
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Page 1', 1, '{"content": "Welcome to your first page!"}'),
  ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'Page 2', 2, '{"content": "This is the second page"}'),
  ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'Advanced Page 1', 1, '{"content": "Advanced content here"}');

-- Add user_packs relationships
INSERT INTO public.user_packs (user_id, pack_id, is_owner) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', true),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', true),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', false);

-- Create test artworks
INSERT INTO public.artworks (id, user_id, pack_id, page_id, title, content, is_public) VALUES
  ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'My First Artwork', '{"elements": []}', true),
  ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', 'Advanced Artwork', '{"elements": []}', false);

-- Create test favorites
INSERT INTO public.favorites (user_id, artwork_id) VALUES
  ('11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888');

-- Create test approvals
INSERT INTO public.approvals (child_id, parent_id, artwork_id, status, message) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'pending', 'Please approve my artwork!');

-- Create test events
INSERT INTO public.events (user_id, type, data) VALUES
  ('22222222-2222-2222-2222-222222222222', 'artwork_created', '{"artwork_id": "88888888-8888-8888-8888-888888888888"}'),
  ('22222222-2222-2222-2222-222222222222', 'artwork_shared', '{"artwork_id": "88888888-8888-8888-8888-888888888888"}');
