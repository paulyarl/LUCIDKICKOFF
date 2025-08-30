-- Enable Row Level Security
ALTER SYSTEM SET max_locks_per_transaction = 200;

-- Create custom types
CREATE TYPE user_role AS ENUM ('child', 'parent', 'admin');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE event_type AS ENUM ('artwork_created', 'artwork_updated', 'artwork_shared', 'pack_created', 'pack_shared');

-- Create tables
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'child',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pack_id, page_number)
);

CREATE TABLE public.user_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE NOT NULL,
  is_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pack_id)
);

CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, artwork_id)
);

CREATE TABLE public.parent_child_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE,
  status approval_status DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (artwork_id IS NOT NULL OR pack_id IS NOT NULL)
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_artworks_user_id ON public.artworks(user_id);
CREATE INDEX idx_artworks_pack_id ON public.artworks(pack_id);
CREATE INDEX idx_approvals_child_id ON public.approvals(child_id);
CREATE INDEX idx_approvals_parent_id ON public.approvals(parent_id);
CREATE INDEX idx_events_user_id ON public.events(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User Profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Packs
CREATE POLICY "Users can view public packs" ON public.packs
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own packs" ON public.packs
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create packs" ON public.packs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own packs" ON public.packs
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own packs" ON public.packs
  FOR DELETE USING (auth.uid() = created_by);

-- Pages
CREATE POLICY "Users can view pages in public packs" ON public.pages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.packs 
    WHERE public.packs.id = pages.pack_id 
    AND public.packs.is_public = true
  ));

CREATE POLICY "Users can view pages in their packs" ON public.pages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_packs
    WHERE user_packs.pack_id = pages.pack_id
    AND user_packs.user_id = auth.uid()
  ));

CREATE POLICY "Pack owners can manage pages" ON public.pages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.packs
    WHERE packs.id = pages.pack_id
    AND packs.created_by = auth.uid()
  ));

-- User Packs
CREATE POLICY "Users can view their user_packs" ON public.user_packs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add packs to their library" ON public.user_packs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove packs from their library" ON public.user_packs
  FOR DELETE USING (auth.uid() = user_id);

-- Artworks
CREATE POLICY "Users can view public artworks" ON public.artworks
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own artworks" ON public.artworks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create artworks" ON public.artworks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artworks" ON public.artworks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artworks" ON public.artworks
  FOR DELETE USING (auth.uid() = user_id);

-- Favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Parent-Child Links
CREATE POLICY "Parents can view their child links" ON public.parent_child_links
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create child links" ON public.parent_child_links
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their child links" ON public.parent_child_links
  FOR UPDATE USING (auth.uid() = parent_id);

-- Approvals
CREATE POLICY "Parents can view their child's approvals" ON public.approvals
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Children can view their own approvals" ON public.approvals
  FOR SELECT USING (auth.uid() = child_id);

CREATE POLICY "Parents can update approval status" ON public.approvals
  FOR UPDATE USING (auth.uid() = parent_id);

-- Events
CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Create a function to check if user is a parent
CREATE OR REPLACE FUNCTION public.is_parent()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'parent'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create a function to check if user is a child
CREATE OR REPLACE FUNCTION public.is_child()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'child'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create a function to check if user is a parent of a specific child
CREATE OR REPLACE FUNCTION public.is_parent_of(child_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_child_links 
    WHERE parent_id = auth.uid() 
    AND child_id = child_id_param
    AND is_verified = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;
