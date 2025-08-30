-- Enable pgTAP extension
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Begin test plan
SELECT plan(1);

-- Create test roles
SELECT lives_ok(
  $setup$
  DO $$
  BEGIN
    -- Create test roles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOLOGIN;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOLOGIN;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
    
    -- Create test users
    CREATE ROLE test_parent1 LOGIN PASSWORD 'testpass';
    CREATE ROLE test_child1 LOGIN PASSWORD 'testpass';
    CREATE ROLE test_parent2 LOGIN PASSWORD 'testpass';
    
    -- Add users to authenticated role
    GRANT authenticated TO test_parent1, test_child1, test_parent2;
    
    -- Set up auth.uid() function for testing
    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN current_setting('app.current_user_id', true)::uuid;
    END;
    $$;
    
    -- Set up auth.jwt() function for testing
    CREATE OR REPLACE FUNCTION auth.jwt()
    RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN jsonb_build_object(
        'sub', auth.uid(),
        'role', current_setting('app.current_user_role', true)
      );
    END;
    $$;
    
    -- Set up auth.role() function for testing
    CREATE OR REPLACE FUNCTION auth.role()
    RETURNS text
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN current_setting('app.current_user_role', true);
    END;
    $$;
    
    -- Create test schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS test;
    
    -- Create test tables with same structure as real tables
    CREATE TABLE IF NOT EXISTS test.artworks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      title text NOT NULL,
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    
    CREATE TABLE IF NOT EXISTS test.favorites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      item_id text NOT NULL,
      item_type text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(user_id, item_id, item_type)
    );
    
    CREATE TABLE IF NOT EXISTS test.user_packs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      name text NOT NULL,
      items jsonb NOT NULL DEFAULT '[]'::jsonb,
      is_public boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    
    CREATE TABLE IF NOT EXISTS test.approvals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id uuid NOT NULL,
      parent_id uuid NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      request_type text NOT NULL,
      details jsonb,
      expires_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_child FOREIGN KEY (child_id) REFERENCES auth.users(id) ON DELETE CASCADE,
      CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS test.parent_child_links (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id uuid NOT NULL,
      child_id uuid NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(parent_id, child_id),
      CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE,
      CONSTRAINT fk_child FOREIGN KEY (child_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );
    
    -- Enable RLS
    ALTER TABLE test.artworks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE test.favorites ENABLE ROW LEVEL SECURITY;
    ALTER TABLE test.user_packs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE test.approvals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE test.parent_child_links ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies (same as your production policies)
    -- Artworks policies
    CREATE POLICY "Users can view their own artworks" 
    ON test.artworks FOR SELECT 
    USING (user_id = auth.uid());
    
    CREATE POLICY "Users can insert their own artworks"
    ON test.artworks FOR INSERT
    WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can update their own artworks"
    ON test.artworks FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can delete their own artworks"
    ON test.artworks FOR DELETE
    USING (user_id = auth.uid());
    
    -- Favorites policies
    CREATE POLICY "Users can view their own favorites"
    ON test.favorites FOR SELECT
    USING (user_id = auth.uid());
    
    CREATE POLICY "Users can insert their own favorites"
    ON test.favorites FOR INSERT
    WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can delete their own favorites"
    ON test.favorites FOR DELETE
    USING (user_id = auth.uid());
    
    -- User Packs policies
    CREATE POLICY "Users can view their own packs"
    ON test.user_packs FOR SELECT
    USING (user_id = auth.uid() OR is_public = true);
    
    CREATE POLICY "Users can insert their own packs"
    ON test.user_packs FOR INSERT
    WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can update their own packs"
    ON test.user_packs FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
    
    CREATE POLICY "Users can delete their own packs"
    ON test.user_packs FOR DELETE
    USING (user_id = auth.uid());
    
    -- Approvals policies
    CREATE POLICY "Children can view their own approval requests"
    ON test.approvals FOR SELECT
    USING (child_id = auth.uid() OR parent_id = auth.uid());
    
    CREATE POLICY "Children can create approval requests"
    ON test.approvals FOR INSERT
    WITH CHECK (child_id = auth.uid());
    
    CREATE POLICY "Parents can update approval requests for their children"
    ON test.approvals FOR UPDATE
    USING (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());
    
    -- Parent-Child Links policies
    CREATE POLICY "Parents can view their own links"
    ON test.parent_child_links FOR SELECT
    USING (parent_id = auth.uid() OR child_id = auth.uid());
    
    CREATE POLICY "Parents can create links"
    ON test.parent_child_links FOR INSERT
    WITH CHECK (parent_id = auth.uid());
    
    CREATE POLICY "Parents can update their own links"
    ON test.parent_child_links FOR UPDATE
    USING (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());
    
    -- Grant permissions
    GRANT USAGE ON SCHEMA test TO authenticated, anon, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA test TO authenticated;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA test TO authenticated;
    
    -- Insert test data
    INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
      ('11111111-1111-1111-1111-111111111111', 'parent1@example.com', '{"role":"parent"}'),
      ('22222222-2222-2222-2222-222222222222', 'child1@example.com', '{"role":"child"}'),
      ('33333333-3333-3333-3333-333333333333', 'parent2@example.com', '{"role":"parent"}');
    
    -- Insert parent-child link
    INSERT INTO test.parent_child_links (parent_id, child_id, status) VALUES
      ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'approved');
    
    -- Insert test artworks
    INSERT INTO test.artworks (id, user_id, title) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Parent 1 Artwork'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Child 1 Artwork');
    
    -- Insert test favorites
    INSERT INTO test.favorites (user_id, item_id, item_type) VALUES
      ('11111111-1111-1111-1111-111111111111', 'item1', 'template'),
      ('22222222-2222-2222-2222-222222222222', 'item2', 'brush');
    
    -- Insert test user packs
    INSERT INTO test.user_packs (user_id, name, is_public) VALUES
      ('11111111-1111-1111-1111-111111111111', 'Parent 1 Pack', false),
      ('22222222-2222-2222-2222-222222222222', 'Child 1 Pack', false);
    
    -- Insert test approvals
    INSERT INTO test.approvals (child_id, parent_id, status, request_type) VALUES
      ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'pending', 'feature_access');
  END;
  $$;
  $setup$,
  'Setup test environment'
);

-- Test case: Verify RLS policies exist
SELECT has_policy('test', 'artworks', 'Users can view their own artworks', 'Policy for viewing own artworks should exist');
SELECT has_policy('test', 'artworks', 'Users can insert their own artworks', 'Policy for inserting own artworks should exist');
SELECT has_policy('test', 'artworks', 'Users can update their own artworks', 'Policy for updating own artworks should exist');
SELECT has_policy('test', 'artworks', 'Users can delete their own artworks', 'Policy for deleting own artworks should exist');

-- Test case: Verify users can only see their own artworks
SELECT lives_ok(
  $test$
  DO $$
  DECLARE
    result_count integer;
  BEGIN
    -- Test as parent1
    PERFORM set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    SELECT COUNT(*) INTO result_count FROM test.artworks;
    IF result_count != 1 THEN
      RAISE EXCEPTION 'Parent1 should see 1 artwork, saw %', result_count;
    END IF;
    
    -- Test as child1
    PERFORM set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    SELECT COUNT(*) INTO result_count FROM test.artworks;
    IF result_count != 1 THEN
      RAISE EXCEPTION 'Child1 should see 1 artwork, saw %', result_count;
    END IF;
    
    -- Test as unauthenticated
    PERFORM set_config('app.current_user_id', '00000000-0000-0000-0000-000000000000', true);
    PERFORM set_config('app.current_user_role', 'anon', true);
    
    BEGIN
      SELECT COUNT(*) INTO result_count FROM test.artworks;
      IF result_count > 0 THEN
        RAISE EXCEPTION 'Unauthenticated user should see 0 artworks, saw %', result_count;
      END IF;
    EXCEPTION WHEN insufficient_privilege THEN
      -- Expected for unauthenticated users
      NULL;
    END;
  END;
  $$;
  $test$,
  'Users can only see their own artworks'
);

-- Test case: Verify parent-child link access
SELECT lives_ok(
  $test$
  DO $$
  DECLARE
    link_count integer;
  BEGIN
    -- Parent1 should see their link to child1
    PERFORM set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    SELECT COUNT(*) INTO link_count FROM test.parent_child_links;
    IF link_count != 1 THEN
      RAISE EXCEPTION 'Parent1 should see 1 link, saw %', link_count;
    END IF;
    
    -- Parent2 should not see any links
    PERFORM set_config('app.current_user_id', '33333333-3333-3333-3333-333333333333', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    SELECT COUNT(*) INTO link_count FROM test.parent_child_links;
    IF link_count != 0 THEN
      RAISE EXCEPTION 'Parent2 should see 0 links, saw %', link_count;
    END IF;
  END;
  $$;
  $test$,
  'Parents can only see their own links'
);

-- Test case: Verify approval access
SELECT lives_ok(
  $test$
  DO $$
  DECLARE
    approval_count integer;
  BEGIN
    -- Child1 should see their approval request
    PERFORM set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    SELECT COUNT(*) INTO approval_count FROM test.approvals;
    IF approval_count != 1 THEN
      RAISE EXCEPTION 'Child1 should see 1 approval, saw %', approval_count;
    END IF;
    
    -- Parent1 should see the approval for their child
    PERFORM set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    SELECT COUNT(*) INTO approval_count FROM test.approvals;
    IF approval_count != 1 THEN
      RAISE EXCEPTION 'Parent1 should see 1 approval, saw %', approval_count;
    END IF;
    
    -- Parent2 should not see any approvals
    PERFORM set_config('app.current_user_id', '33333333-3333-3333-3333-333333333333', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    SELECT COUNT(*) INTO approval_count FROM test.approvals;
    IF approval_count != 0 THEN
      RAISE EXCEPTION 'Parent2 should see 0 approvals, saw %', approval_count;
    END IF;
  END;
  $$;
  $test$,
  'Approval access control works correctly'
);

-- Test case: Verify row count leakage prevention
SELECT lives_ok(
  $test$
  DO $$
  DECLARE
    total_count integer;
  BEGIN
    -- As parent1, count should be 1 (their own artwork)
    PERFORM set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    -- This should not leak row counts from other users
    EXECUTE 'SELECT COUNT(*) FROM test.artworks' INTO total_count;
    IF total_count != 1 THEN
      RAISE EXCEPTION 'Parent1 should see 1 artwork, saw %', total_count;
    END IF;
    
    -- Test with a more complex query that includes COUNT(*)
    EXECUTE 'SELECT COUNT(*) FROM test.artworks WHERE user_id = ANY($1)' 
    USING ARRAY['11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid]
    INTO total_count;
    
    IF total_count != 1 THEN
      RAISE EXCEPTION 'Parent1 should still see only 1 artwork with array filter, saw %', total_count;
    END IF;
  END;
  $$;
  $test$,
  'Row count leakage is prevented'
);

-- Test case: Verify RLS policy regression guard
SELECT lives_ok(
  $test$
  DO $$
  DECLARE
    policy_count integer;
  BEGIN
    -- Count the number of RLS policies on our test tables
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'test'
    AND tablename IN ('artworks', 'favorites', 'user_packs', 'approvals', 'parent_child_links');
    
    -- We expect at least 10 policies (adjust based on your actual policy count)
    IF policy_count < 10 THEN
      RAISE EXCEPTION 'Expected at least 10 RLS policies, found %', policy_count;
    END IF;
    
    -- Verify that RLS is enabled on all tables
    IF EXISTS (
      SELECT 1 
      FROM pg_tables 
      WHERE schemaname = 'test' 
      AND tablename IN ('artworks', 'favorites', 'user_packs', 'approvals', 'parent_child_links')
      AND NOT rowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on all test tables';
    END IF;
  END;
  $$;
  $test$,
  'RLS policy regression guard'
);

-- Test case: Verify server role enforcement for events table
SELECT lives_ok(
  $test$
  DO $$
  BEGIN
    -- First, create events table if it doesn't exist
    CREATE TABLE IF NOT EXISTS test.events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type text NOT NULL,
      user_id uuid REFERENCES auth.users(id),
      data jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE test.events ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to only allow server role to insert
    DROP POLICY IF EXISTS "Server role can insert events" ON test.events;
    CREATE POLICY "Server role can insert events"
    ON test.events FOR INSERT
    TO service_role
    WITH CHECK (true);
    
    -- Revoke insert from authenticated users
    REVOKE INSERT ON test.events FROM authenticated;
    
    -- Test as authenticated user - should fail
    PERFORM set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    BEGIN
      INSERT INTO test.events (event_type, user_id) VALUES ('test_event', '11111111-1111-1111-1111-111111111111');
      RAISE EXCEPTION 'Authenticated user should not be able to insert events';
    EXCEPTION WHEN insufficient_privilege THEN
      -- Expected
      NULL;
    END;
    
    -- Test as service role - should succeed
    SET LOCAL ROLE service_role;
    
    BEGIN
      INSERT INTO test.events (event_type, user_id) VALUES ('test_event', '11111111-1111-1111-1111-111111111111');
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Service role should be able to insert events: %', SQLERRM;
    END;
    
    -- Clean up
    RESET ROLE;
    DROP TABLE IF EXISTS test.events;
  END;
  $$;
  $test$,
  'Server role enforcement for events table'
);

-- Test case: Verify deny cases for parent/child linking
SELECT lives_ok(
  $test$
  DO $$
  DECLARE
    link_id uuid;
  BEGIN
    -- Parent1 should be able to create a link to a child
    PERFORM set_config('app.current_user_id', '11111111-1111-1111-1111-111111111111', true);
    PERFORM set_config('app.current_user_role', 'authenticated', true);
    
    -- This should succeed
    INSERT INTO test.parent_child_links (parent_id, child_id, status)
    VALUES ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'pending')
    RETURNING id INTO link_id;
    
    -- Clean up
    DELETE FROM test.parent_child_links WHERE id = link_id;
    
    -- Child should not be able to create a link
    PERFORM set_config('app.current_user_id', '22222222-2222-2222-2222-222222222222', true);
    
    BEGIN
      INSERT INTO test.parent_child_links (parent_id, child_id, status)
      VALUES ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'pending');
      RAISE EXCEPTION 'Child should not be able to create parent-child links';
    EXCEPTION WHEN insufficient_privilege THEN
      -- Expected
      NULL;
    END;
    
    -- Parent should not be able to create a link for another parent
    PERFORM set_config('app.current_user_id', '33333333-3333-3333-3333-333333333333', true);
    
    BEGIN
      INSERT INTO test.parent_child_links (parent_id, child_id, status)
      VALUES ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'pending');
      RAISE EXCEPTION 'Parent should not be able to create links for other parents';
    EXCEPTION WHEN insufficient_privilege THEN
      -- Expected
      NULL;
    END;
  END;
  $$;
  $test$,
  'Deny cases for parent/child linking'
);

-- Finish the test and clean up
SELECT * FROM finish();
ROLLBACK;  -- This will roll back all test data

-- Create a function to run the RLS policy tests
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS SETOF TEXT AS $$
BEGIN
  -- Run all the test functions
  RETURN QUERY SELECT * FROM runtests('test'::name);
  
  -- Verify that RLS is enabled on all tables
  RETURN QUERY SELECT is(
    (SELECT COUNT(*) = 0 FROM pg_tables 
     WHERE schemaname = 'test' 
     AND tablename IN ('artworks', 'favorites', 'user_packs', 'approvals', 'parent_child_links')
     AND NOT rowsecurity),
    false,
    'RLS should be enabled on all test tables'
  );
  
  -- Verify that the policy count hasn't decreased
  RETURN QUERY SELECT cmp_ok(
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'test'),
    '>=',
    10,
    'Should have at least 10 RLS policies'
  );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Create a function to check if RLS is enabled on all tables
CREATE OR REPLACE FUNCTION check_rls_enabled()
RETURNS boolean AS $$
DECLARE
  rls_disabled_count integer;
BEGIN
  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_tables 
  WHERE schemaname = 'public'  -- Change to your schema name
  AND tablename IN ('artworks', 'favorites', 'user_packs', 'approvals', 'parent_child_links')
  AND NOT rowsecurity;
  
  RETURN rls_disabled_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;
