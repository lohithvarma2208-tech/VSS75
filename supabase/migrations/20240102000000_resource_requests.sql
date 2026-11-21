-- VSS75: Resource Requests PostgreSQL Schema & Row-Level Security (RLS)
-- Target Platform: Supabase PostgreSQL
-- Migration: 20240102000000_resource_requests.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. TABLE: resource_requests
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.resource_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  programme TEXT NOT NULL DEFAULT 'B.Tech',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  semester TEXT NOT NULL,
  category TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  module_number TEXT,
  topic TEXT,
  assignment_number TEXT,
  academic_year TEXT,
  preferred_format TEXT,
  tags TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_fulfilled', 'fulfilled', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  fulfilled_at TIMESTAMPTZ
);

-- Indexes for fast filtering & searching
CREATE INDEX IF NOT EXISTS idx_resource_requests_user ON public.resource_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_status ON public.resource_requests(status);
CREATE INDEX IF NOT EXISTS idx_resource_requests_course ON public.resource_requests(course_code);
CREATE INDEX IF NOT EXISTS idx_resource_requests_category ON public.resource_requests(category);
CREATE INDEX IF NOT EXISTS idx_resource_requests_semester ON public.resource_requests(semester);
CREATE INDEX IF NOT EXISTS idx_resource_requests_created_at ON public.resource_requests(created_at DESC);

-- Full-Text Search (GIN)
CREATE INDEX IF NOT EXISTS idx_resource_requests_fts ON public.resource_requests USING gin(
  to_tsvector('english', title || ' ' || description || ' ' || course_code || ' ' || course_name || ' ' || COALESCE(topic, ''))
);

-- ====================================================================
-- 2. TABLE: request_offers
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.request_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.resource_requests(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('upload', 'existing_resource', 'external_link')),
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  uploaded_file_path TEXT,
  uploaded_file_name TEXT,
  uploaded_file_type TEXT,
  uploaded_file_size BIGINT,
  external_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_request_offers_request ON public.request_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_request_offers_contributor ON public.request_offers(contributor_id);
CREATE INDEX IF NOT EXISTS idx_request_offers_status ON public.request_offers(status);

-- ====================================================================
-- 3. TABLE: request_responses (Discussion & Threaded Replies)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.request_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.resource_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_response_id UUID REFERENCES public.request_responses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_request_responses_request ON public.request_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_request_responses_parent ON public.request_responses(parent_response_id);
CREATE INDEX IF NOT EXISTS idx_request_responses_user ON public.request_responses(user_id);

-- ====================================================================
-- 4. TABLE: saved_requests (User Bookmarks for Requests)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.saved_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.resource_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_requests_user ON public.saved_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_requests_request ON public.saved_requests(request_id);

-- ====================================================================
-- 5. TABLE: request_reports (Moderation & Content Reporting)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.request_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.resource_requests(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.request_offers(id) ON DELETE CASCADE,
  response_id UUID REFERENCES public.request_responses(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('copyright', 'inappropriate', 'wrong_category', 'spam', 'personal_info', 'misconduct', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_request_reports_request ON public.request_reports(request_id);
CREATE INDEX IF NOT EXISTS idx_request_reports_status ON public.request_reports(status);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_reports ENABLE ROW LEVEL SECURITY;

-- RESOURCE REQUESTS POLICIES
-- Anyone can view requests
CREATE POLICY "Requests are viewable by all"
  ON public.resource_requests FOR SELECT
  USING (true);

-- Authenticated users can insert their own requests
CREATE POLICY "Authenticated users can create requests"
  ON public.resource_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only request owners or moderators/admins can update
CREATE POLICY "Users can update their own requests"
  ON public.resource_requests FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'admin')
    )
  );

-- Only request owners or admins can delete
CREATE POLICY "Users can delete their own requests"
  ON public.resource_requests FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- REQUEST OFFERS POLICIES
-- Anyone can view offers on a request
CREATE POLICY "Offers are viewable by all"
  ON public.request_offers FOR SELECT
  USING (true);

-- Authenticated users can create offers
CREATE POLICY "Authenticated users can create offers"
  ON public.request_offers FOR INSERT
  WITH CHECK (auth.uid() = contributor_id);

-- Offer owner or request owner can update offer (e.g. Request owner accepts/rejects, contributor edits message)
CREATE POLICY "Request owners or contributors can update offers"
  ON public.request_offers FOR UPDATE
  USING (
    auth.uid() = contributor_id
    OR EXISTS (
      SELECT 1 FROM public.resource_requests
      WHERE resource_requests.id = request_offers.request_id AND resource_requests.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'admin')
    )
  );

-- Contributor or admin can delete offer
CREATE POLICY "Contributors can delete their own offers"
  ON public.request_offers FOR DELETE
  USING (
    auth.uid() = contributor_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- REQUEST RESPONSES POLICIES
-- Anyone can view responses
CREATE POLICY "Responses are viewable by all"
  ON public.request_responses FOR SELECT
  USING (true);

-- Authenticated users can post responses
CREATE POLICY "Authenticated users can post responses"
  ON public.request_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authors can update their own responses
CREATE POLICY "Authors can update their own responses"
  ON public.request_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- Authors or admins can delete responses
CREATE POLICY "Authors or admins can delete responses"
  ON public.request_responses FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'admin')
    )
  );

-- SAVED REQUESTS POLICIES
-- Users can view their own saved requests
CREATE POLICY "Users can view their own saved requests"
  ON public.saved_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save requests
CREATE POLICY "Users can save requests"
  ON public.saved_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their saved requests
CREATE POLICY "Users can remove their saved requests"
  ON public.saved_requests FOR DELETE
  USING (auth.uid() = user_id);

-- REQUEST REPORTS POLICIES
-- Users can file reports
CREATE POLICY "Authenticated users can create reports"
  ON public.request_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Only moderators and admins can view reports
CREATE POLICY "Moderators and admins can view reports"
  ON public.request_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'admin')
    )
  );

-- Only moderators and admins can update report resolutions
CREATE POLICY "Moderators and admins can update reports"
  ON public.request_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('moderator', 'admin')
    )
  );
