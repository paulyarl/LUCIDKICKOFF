-- Test RLS policies for the approvals table
\set QUIET 1
\set ON_ERROR_STOP on
\set VERBOSITY terse

-- Load pgTAP
\i test_helper.sql

-- Begin test plan
SELECT plan(12);

-- Helper function to set the current user for testing
CREATE OR REPLACE FUNCTION test_setup()
RETURNS void AS $$
BEGIN
  -- Create test users if they don't exist
  PERFORM create_test_users();
  
  -- Insert test data
  INSERT INTO public.parent_child_links (parent_id, child_id, status)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'approved'),
    ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'approved')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.approvals (child_id, parent_id, status, request_type, details)
  VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'pending', 'feature_access', '{"feature": "advanced_drawing"}'),
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'approved', 'purchase', '{"item": "premium_brush"}')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Run setup
SELECT test_setup();

-- Test 1: Unauthenticated users cannot access approvals
SELECT lives_ok(
  'SET LOCAL ROLE anon',
  'Set role to anon'
);

SELECT throws_ok(
  'SELECT * FROM public.approvals',
  '42501',  -- permission denied error code
  'permission denied for table approvals',
  'Unauthenticated users cannot read approvals'
);

-- Test 2: Child can view their own approval requests
SELECT lives_ok(
  $$SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true)$$,
  'Set JWT claim for child user'
);

SELECT set_local('role', 'authenticated');

SELECT results_eq(
  'SELECT COUNT(*)::int FROM public.approvals',
  ARRAY[1],
  'Child can see their own approval request'
);

-- Test 3: Parent can view their child's approval requests
SELECT lives_ok(
  $$SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true)$$,
  'Set JWT claim for parent user'
);

SELECT results_eq(
  'SELECT COUNT(*)::int FROM public.approvals',
  ARRAY[1],
  'Parent can see their child''s approval request'
);

-- Test 4: Users cannot see other users' approvals
SELECT lives_ok(
  $$SELECT set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true)$$,
  'Set JWT claim for unrelated user'
);

SELECT is_empty(
  'SELECT * FROM public.approvals',
  'Unrelated users cannot see any approvals'
);

-- Test 5: Child can create approval requests
SELECT lives_ok(
  $$SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true)$$,
  'Set JWT claim for child user'
);

SELECT lives_ok(
  $$
  INSERT INTO public.approvals (child_id, parent_id, status, request_type, details)
  VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'pending', 'new_feature', '{"feature": "advanced_filters"}')
  $$,
  'Child can create an approval request'
);

-- Test 6: Child cannot create approval requests for other children
SELECT throws_ok(
  $$
  INSERT INTO public.approvals (child_id, parent_id, status, request_type, details)
  VALUES ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'pending', 'new_feature', '{"feature": "advanced_filters"}')
  $$,
  '42501',  -- permission denied error code
  'permission denied for table approvals',
  'Child cannot create approval requests for other children'
);

-- Test 7: Parent can update their child's approval status
SELECT lives_ok(
  $$SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true)$$,
  'Set JWT claim for parent user'
);

SELECT lives_ok(
  $$
  UPDATE public.approvals 
  SET status = 'approved', updated_at = now()
  WHERE child_id = '22222222-2222-2222-2222-222222222222'
  AND status = 'pending'
  $$,
  'Parent can update their child''s approval status'
);

-- Test 8: Parent cannot update approvals for other children
SELECT throws_ok(
  $$
  UPDATE public.approvals 
  SET status = 'approved'
  WHERE child_id = '44444444-4444-4444-4444-444444444444'
  $$,
  '42501',  -- permission denied error code
  'permission denied for table approvals',
  'Parent cannot update approvals for other children'
);

-- Test 9: Verify row count leakage prevention
SELECT lives_ok(
  'SET LOCAL ROLE service_role',
  'Set role to service_role for test setup'
);

-- Create a function to count approvals with RLS bypass for testing
CREATE OR REPLACE FUNCTION count_all_approvals()
RETURNS integer AS $$
DECLARE
  count integer;
BEGIN
  EXECUTE 'SELECT COUNT(*) FROM public.approvals' INTO count;
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test as parent
SELECT lives_ok(
  $$SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true)$$,
  'Set JWT claim for parent user'
);

SELECT set_local('role', 'authenticated');

-- Should only see 1 approval (for their child)
SELECT results_eq(
  'SELECT COUNT(*)::int FROM public.approvals',
  ARRAY[1],
  'Parent sees only their child''s approvals in count'
);

-- But the actual count is higher (proving RLS is working)
SELECT isnt(
  count_all_approvals()::text,
  '1',
  'Actual count is different from RLS-filtered count'
);

-- Clean up
SELECT * FROM finish();
ROLLBACK;
