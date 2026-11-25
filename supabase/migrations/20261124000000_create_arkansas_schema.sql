-- ============================================================================
-- SoberArkansas.com -- create the `arkansas` schema
-- ============================================================================
-- WHAT THIS DOES
--   Creates a complete, empty `arkansas` schema in the combined Supabase
--   project (rghzzqakptptmhsujdwd) for the SoberArkansas directory,
--   mirroring the LIVE `arkansas` schema object-for-object:
--   10 tables, 2 views, 1 enum, 3 helper functions, RLS policies, indexes,
--   triggers, and grants. It loads NO data -- listings/counties are loaded
--   separately, after this runs.
--
-- HOW IT WAS BUILT (source of truth)
--   A mechanical retarget (arkansas -> arkansas) of the applied
--   Missouri migration 20261122000000_create_arkansas_schema.sql
--   (which itself retargeted the Maryland/South Carolina original). Two deliberate
--   differences inherited from that file: (1) the data-only Ohio image
--   backfill (source migration 20260308014124) is omitted -- it is keyed to
--   other sites' listing UUIDs and affects 0 rows on a fresh schema;
--   (2) the listings.source bookkeeping column at the end names Arkansas's
--   sources (SAMHSA / DHS-OSAMH / Oxford House / recovery housing).
--
-- HOW TO RUN
--   Run this whole file ONCE through the Supabase Management API SQL route
--   (ar_sql.py). It expects a fresh `arkansas` schema; if a partial run
--   ever leaves one behind, reset first with:
--   DROP SCHEMA arkansas CASCADE;  then re-run.
--
-- AFTER IT RUNS (required, or the site/API can see nothing)
--   Add "arkansas" to the PostgREST exposed schemas (via
--   ALTER ROLE authenticator SET pgrst.db_schemas, the route the NC/SC/MD
--   builds used after the Management API config route went 404; the
--   project's list becomes: public, graphql_public, ohio, california, vr,
--   kentucky, tennessee, pennsylvania, westvirginia, northcarolina,
--   southcarolina, maryland, alabama, arkansas, arkansas). PostgREST only serves
--   exposed schemas.
-- ============================================================================

-- ==== Prelude: schema, access grants, session search_path ==================
-- Mirrors Step 1 of the 2026-11-01 combined build: schema usage for the API
-- roles plus default privileges for objects the SQL Editor (role postgres)
-- creates here, so PostgREST can reach them. Row access is still gated by
-- each table's RLS policies, exactly as in `california`.
CREATE SCHEMA IF NOT EXISTS arkansas;
GRANT USAGE ON SCHEMA arkansas TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA arkansas
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA arkansas
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA arkansas
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA arkansas
  GRANT ALL ON SEQUENCES TO service_role;
-- The migrations were written for a session whose search_path starts with
-- the site schema (several policies, functions and the final view reference
-- has_role / app_role / listings unqualified). One SET covers the whole run.
SET search_path = arkansas, public, extensions;

-- ==== source migration: 20260215033655_82ea715e-48e6-475e-8d19-593049f88ac6.sql
-- Replay rules applied: R1 x8, R2 x1. (Mirrors how schema `california` was built 2026-11-01.)


-- Create listings table
CREATE TABLE arkansas.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  features TEXT[] NOT NULL DEFAULT '{}',
  gender TEXT NOT NULL DEFAULT 'co-ed' CHECK (gender IN ('men', 'women', 'co-ed')),
  image TEXT NOT NULL DEFAULT '',
  beds INTEGER NOT NULL DEFAULT 0,
  price_range TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE arkansas.listings ENABLE ROW LEVEL SECURITY;

-- Public read access (it's a directory)
CREATE POLICY "Listings are publicly readable"
ON arkansas.listings FOR SELECT
USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert listings"
ON arkansas.listings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update listings"
ON arkansas.listings FOR UPDATE
TO authenticated
USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION arkansas.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = arkansas;

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON arkansas.listings
FOR EACH ROW
EXECUTE FUNCTION arkansas.update_updated_at_column();


-- ==== source migration: 20260215040241_bfb75350-0dae-42ef-b888-71e01986e9e7.sql
-- Replay rules applied: R1 x15, R2 x1. (Mirrors how schema `california` was built 2026-11-01.)


-- Create role enum
CREATE TYPE arkansas.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE arkansas.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE arkansas.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION arkansas.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = arkansas
AS $$
  SELECT EXISTS (
    SELECT 1 FROM arkansas.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can read their own roles
CREATE POLICY "Users can read own roles"
ON arkansas.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON arkansas.user_roles
FOR ALL
TO authenticated
USING (arkansas.has_role(auth.uid(), 'admin'))
WITH CHECK (arkansas.has_role(auth.uid(), 'admin'));

-- Update listings policies: only admins can insert/update
DROP POLICY IF EXISTS "Authenticated users can insert listings" ON arkansas.listings;
DROP POLICY IF EXISTS "Authenticated users can update listings" ON arkansas.listings;

CREATE POLICY "Admins can insert listings"
ON arkansas.listings
FOR INSERT
TO authenticated
WITH CHECK (arkansas.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update listings"
ON arkansas.listings
FOR UPDATE
TO authenticated
USING (arkansas.has_role(auth.uid(), 'admin'));


-- ==== source migration: 20260215042952_3d33e864-6902-4429-954f-3c38062a426b.sql
-- Replay rules applied: R1 x2, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)

CREATE POLICY "Admins can delete listings"
ON arkansas.listings
FOR DELETE
TO authenticated
USING (arkansas.has_role(auth.uid(), 'admin'));

-- ==== source migration: 20260215045316_80a8c28a-1cf9-45cf-9506-3e882d4751ae.sql
-- Replay rules applied: R1 x6, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Drop the existing public read policy
DROP POLICY "Listings are publicly readable" ON arkansas.listings;

-- Create a view that hides phone for anonymous users
-- Instead, use column-level security via RLS with a security definer function

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION arkansas.mask_phone(phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL THEN phone
    ELSE NULL
  END;
$$;

-- Re-create the public read policy but use a secure view approach
-- Actually, the simplest approach: allow public reads but use a view to mask phone

-- Re-add the public read policy (we still need listings visible)
CREATE POLICY "Listings are publicly readable"
ON arkansas.listings
FOR SELECT
USING (true);

-- Create a secure view that masks phone for unauthenticated users
CREATE OR REPLACE VIEW arkansas.listings_public AS
SELECT
  id, name, address, city, description, features, gender, beds,
  image, lat, lng, price_range, created_at, updated_at,
  arkansas.mask_phone(phone) as phone
FROM arkansas.listings;


-- ==== source migration: 20260215045347_fb1ffec5-9e14-4f11-a185-dcaf908156a5.sql
-- Replay rules applied: R1 x4, R2 x1. (Mirrors how schema `california` was built 2026-11-01.)


-- Fix security definer view - set to SECURITY INVOKER explicitly
CREATE OR REPLACE VIEW arkansas.listings_public
WITH (security_invoker = true) AS
SELECT
  id, name, address, city, description, features, gender, beds,
  image, lat, lng, price_range, created_at, updated_at,
  arkansas.mask_phone(phone) as phone
FROM arkansas.listings;

-- Fix function search path
CREATE OR REPLACE FUNCTION arkansas.mask_phone(phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = arkansas
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL THEN phone
    ELSE NULL
  END;
$$;


-- ==== source migration: 20260215050613_56b446dd-dfb8-46b4-afec-6a81794f1a89.sql
-- Replay rules applied: bucket insert skipped x1; storage policies deferred x4; R1 x0, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Create storage bucket for listing images
-- [skipped: shared listing-images bucket already exists project-wide]

-- Allow public read access
-- [deferred to the shared merged storage policy set] policy "Listing images are publicly accessible"

-- Allow authenticated admins to upload
-- [deferred to the shared merged storage policy set] policy "Admins can upload listing images"

-- Allow authenticated admins to update
-- [deferred to the shared merged storage policy set] policy "Admins can update listing images"

-- Allow authenticated admins to delete
-- [deferred to the shared merged storage policy set] policy "Admins can delete listing images"


-- ==== source migration: 20260215051421_7bc80d3a-534c-4afc-8a37-cc8509963fba.sql
-- Replay rules applied: R1 x1, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Step 1: Drop the view completely
DROP VIEW IF EXISTS arkansas.listings_public CASCADE;


-- ==== source migration: 20260215051445_905d5b5e-c2fb-47d9-9487-d5a75ae5c3cc.sql
-- Replay rules applied: R1 x5, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Add images column
ALTER TABLE arkansas.listings
ADD COLUMN images text[] NOT NULL DEFAULT '{}';

-- Migrate existing single image into images array
UPDATE arkansas.listings
SET images = ARRAY[image]
WHERE image IS NOT NULL AND image != '';

-- Recreate view with images column
CREATE VIEW arkansas.listings_public
WITH (security_invoker = true) AS
SELECT
  id, name, address, city, description, features, gender, beds,
  image, images, lat, lng, price_range, created_at, updated_at,
  arkansas.mask_phone(phone) as phone
FROM arkansas.listings;


-- ==== source migration: 20260215180201_f1b67aca-5e3f-48d4-a04c-0965c0dd1825.sql
-- Replay rules applied: R1 x11, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Table to track featured listing subscriptions
CREATE TABLE arkansas.featured_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES arkansas.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  city TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('top', 'middle', 'bottom')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city, tier, listing_id)
);

-- Only 3 featured slots per city (one per tier)
CREATE UNIQUE INDEX idx_featured_city_tier_active 
ON arkansas.featured_listings(city, tier) 
WHERE status = 'active';

ALTER TABLE arkansas.featured_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can read featured listings
CREATE POLICY "Featured listings are publicly readable"
ON arkansas.featured_listings FOR SELECT
USING (true);

-- Authenticated users can manage their own featured listings
CREATE POLICY "Users can insert their own featured listings"
ON arkansas.featured_listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own featured listings"
ON arkansas.featured_listings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own featured listings"
ON arkansas.featured_listings FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all featured listings"
ON arkansas.featured_listings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_featured_listings_updated_at
BEFORE UPDATE ON arkansas.featured_listings
FOR EACH ROW
EXECUTE FUNCTION arkansas.update_updated_at_column();


-- ==== source migration: 20260217220635_98548776-5272-445d-a4b2-18127779ecf0.sql
-- Replay rules applied: R1 x5, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Remove the overly permissive public SELECT policy on featured_listings
DROP POLICY IF EXISTS "Featured listings are publicly readable" ON arkansas.featured_listings;

-- Add a restricted public SELECT policy that hides sensitive columns by only allowing access to rows
-- but we need a view approach since RLS is row-level, not column-level

-- Create a public view that only exposes non-sensitive columns
CREATE OR REPLACE VIEW arkansas.featured_listings_public AS
SELECT id, listing_id, city, tier, status
FROM arkansas.featured_listings
WHERE status = 'active';

-- Re-add a SELECT policy for authenticated users to see their own records (needed for management)
CREATE POLICY "Users can read their own featured listings"
ON arkansas.featured_listings
FOR SELECT
USING (auth.uid() = user_id);

-- Admins already have ALL access policy, and it covers SELECT too
-- The public view will use the service role implicitly since it's a simple view
-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON arkansas.featured_listings_public TO anon, authenticated;


-- ==== source migration: 20260217220747_7651d5ec-d897-409d-96bd-22c3d3a9a1b8.sql
-- Replay rules applied: R1 x1, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Fix: Make the view SECURITY INVOKER so it respects the caller's permissions
ALTER VIEW arkansas.featured_listings_public SET (security_invoker = on);


-- ==== source migration: 20260217222426_f212a151-2568-465c-bbc5-fa665f43a0f6.sql
-- Replay rules applied: R1 x5, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


ALTER TABLE arkansas.listings
  ADD COLUMN category text NOT NULL DEFAULT 'sober-living',
  ADD COLUMN accepts_private_pay boolean NOT NULL DEFAULT false,
  ADD COLUMN accepts_medicaid boolean NOT NULL DEFAULT false;

-- Update the public view to include new columns
DROP VIEW IF EXISTS arkansas.listings_public;
CREATE VIEW arkansas.listings_public AS
  SELECT
    id, name, city, address,
    arkansas.mask_phone(phone) AS phone,
    description, features, gender, image, images,
    price_range, lat, lng, beds,
    created_at, updated_at,
    category, accepts_private_pay, accepts_medicaid
  FROM arkansas.listings;


-- ==== source migration: 20260217223237_8dbf1c44-7de8-44be-a0db-ee2b8017b7ca.sql
-- Replay rules applied: R1 x5, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


ALTER TABLE arkansas.listings
  ADD COLUMN length_of_stay text NOT NULL DEFAULT '';

DROP VIEW IF EXISTS arkansas.listings_public;
CREATE VIEW arkansas.listings_public AS
  SELECT
    id, name, city, address,
    arkansas.mask_phone(phone) AS phone,
    description, features, gender, image, images,
    price_range, lat, lng, beds,
    created_at, updated_at,
    category, accepts_private_pay, accepts_medicaid, length_of_stay
  FROM arkansas.listings;


-- ==== source migration: 20260217223351_bbab5b70-4bbc-4f86-96f8-aae506588732.sql
-- Replay rules applied: R1 x5, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


ALTER TABLE arkansas.listings
  ADD COLUMN mat_available boolean NOT NULL DEFAULT false,
  ADD COLUMN insurance_verification_url text NOT NULL DEFAULT '';

DROP VIEW IF EXISTS arkansas.listings_public;
CREATE VIEW arkansas.listings_public AS
  SELECT
    id, name, city, address,
    arkansas.mask_phone(phone) AS phone,
    description, features, gender, image, images,
    price_range, lat, lng, beds,
    created_at, updated_at,
    category, accepts_private_pay, accepts_medicaid, length_of_stay,
    mat_available, insurance_verification_url
  FROM arkansas.listings;


-- ==== source migration: 20260217223510_d5d8972c-f397-4a0e-a363-dfdb82263938.sql
-- Replay rules applied: R1 x5, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


ALTER TABLE arkansas.listings
  ADD COLUMN detox_available boolean NOT NULL DEFAULT false;

DROP VIEW IF EXISTS arkansas.listings_public;
CREATE VIEW arkansas.listings_public AS
  SELECT
    id, name, city, address,
    arkansas.mask_phone(phone) AS phone,
    description, features, gender, image, images,
    price_range, lat, lng, beds,
    created_at, updated_at,
    category, accepts_private_pay, accepts_medicaid, length_of_stay,
    mat_available, insurance_verification_url, detox_available
  FROM arkansas.listings;


-- ==== source migration: 20260217233519_fe901d0a-42bd-40db-b16f-5e5dd4e993da.sql
-- Replay rules applied: R1 x5, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


ALTER TABLE arkansas.listings
  ADD COLUMN level_php boolean NOT NULL DEFAULT false,
  ADD COLUMN level_iop boolean NOT NULL DEFAULT false,
  ADD COLUMN level_op boolean NOT NULL DEFAULT false,
  ADD COLUMN telehealth_available boolean NOT NULL DEFAULT false,
  ADD COLUMN evening_groups boolean NOT NULL DEFAULT false;

-- Update the public view to include new columns
DROP VIEW IF EXISTS arkansas.listings_public;
CREATE VIEW arkansas.listings_public AS
  SELECT
    id, name, city, address,
    arkansas.mask_phone(phone) AS phone,
    description, features, gender, image, images,
    price_range, lat, lng, beds, category,
    accepts_private_pay, accepts_medicaid,
    length_of_stay, mat_available,
    insurance_verification_url, detox_available,
    level_php, level_iop, level_op,
    telehealth_available, evening_groups,
    created_at, updated_at
  FROM arkansas.listings;


-- ==== source migration: 20260219025150_4878a78a-c513-4294-b7d5-5c9273cd8e46.sql
-- Replay rules applied: R1 x1, R2 x1. (Mirrors how schema `california` was built 2026-11-01.)

CREATE OR REPLACE FUNCTION arkansas.mask_phone(phone text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'arkansas'
AS $$
  SELECT phone;
$$;

-- ==== source migration: 20260219031525_013e51ea-e33a-464b-a611-e2eae1f8a60a.sql
-- Replay rules applied: R1 x194, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Service Setting
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_outpatient boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_inpatient boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_residential boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_intensive_outpatient boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_partial_hospitalization boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_telehealth boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_outpatient_detox boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_residential_detox boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_short_term_residential boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_long_term_residential boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS setting_outpatient_methadone boolean NOT NULL DEFAULT false;

-- Type of Care
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS care_substance_use boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS care_detoxification boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS care_transitional_housing boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS care_co_occurring_mental_substance boolean NOT NULL DEFAULT false;

-- Special Programs
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_veterans boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_adolescents boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_young_adults boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_adult_women boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_pregnant_women boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_adult_men boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_seniors boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_active_military boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_military_families boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_criminal_justice boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_co_occurring_disorders boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_hiv_aids boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_sexual_abuse boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_domestic_violence boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_trauma boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS group_co_occurring_pain boolean NOT NULL DEFAULT false;

-- Payment / Insurance
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_medicaid boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_medicare boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_private_insurance boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_self_pay boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_sliding_scale boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_assistance boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_tricare boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_federal_funding boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pay_no_payment boolean NOT NULL DEFAULT false;

-- Opioid Treatment
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_methadone_maintenance boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_buprenorphine_maintenance boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_naltrexone boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_certified_otp boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_methadone_detox boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_buprenorphine_detox boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_prescribes_buprenorphine boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_prescribes_naltrexone boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_relapse_naltrexone boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_accepts_mat_elsewhere boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_no_mat boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS opioid_no_treatment boolean NOT NULL DEFAULT false;

-- Treatment Approaches
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_cbt boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_dbt boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_motivational_interviewing boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_trauma_counseling boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_12_step boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_brief_intervention boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_contingency_management boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_anger_management boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_matrix_model boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_community_reinforcement boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_relapse_prevention boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_substance_use_counseling boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS approach_telemedicine boolean NOT NULL DEFAULT false;

-- Counseling
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS counseling_individual boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS counseling_group boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS counseling_family boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS counseling_couples boolean NOT NULL DEFAULT false;

-- Testing & Screening
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS test_hiv boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS test_hepatitis_b boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS test_hepatitis_c boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS test_std boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS test_tb boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS test_drug_urine boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS test_breathalyzer boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS test_metabolic boolean NOT NULL DEFAULT false;

-- Support Services
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_case_management boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_mental_health boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_employment boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_transportation boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_housing boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_peer_support boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_self_help_groups boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_child_care boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_childrens_beds boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_domestic_violence boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_social_skills boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_acupuncture boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_vocational boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_recovery_coach boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_discharge_planning boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_aftercare boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_naloxone_education boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS service_outcome_followup boolean NOT NULL DEFAULT false;

-- Medications
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_methadone boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_buprenorphine_naloxone boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_buprenorphine_only boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_buprenorphine_injectable boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_buprenorphine_implant boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_naltrexone_oral boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_naltrexone_injectable boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_acamprosate boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_disulfiram boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_nicotine_replacement boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_non_nicotine_cessation boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_hiv_medications boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_hepatitis_c_medications boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_lofexidine boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_clonidine boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_prep boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS pharma_mental_disorder_meds boolean NOT NULL DEFAULT false;

-- Education
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS edu_hiv_aids boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS edu_hepatitis boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS edu_health_other boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS edu_substance_use boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS edu_tobacco_cessation boolean NOT NULL DEFAULT false;

-- Vaccinations
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS vaccine_hepatitis_a boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS vaccine_hepatitis_b boolean NOT NULL DEFAULT false;

-- Detox Types
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS detox_alcohol boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS detox_benzodiazepines boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS detox_cocaine boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS detox_methamphetamine boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS detox_opioids boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS detox_medication_assisted boolean NOT NULL DEFAULT false;

-- Assessment
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS assess_mental_health boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS assess_substance_use boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS assess_physical_exam boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS assess_outreach boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS assess_screening_substance boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS assess_screening_mental boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS assess_screening_tobacco boolean NOT NULL DEFAULT false;

-- Age Groups
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS age_children_adolescents boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS age_young_adults boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS age_adults boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS age_seniors boolean NOT NULL DEFAULT false;

-- Sex Accepted
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS sex_female boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS sex_male boolean NOT NULL DEFAULT false;

-- DUI Programs
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS dui_program boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS dui_only boolean NOT NULL DEFAULT false;

-- Smoking Policy
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS smoking_not_permitted boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS smoking_designated_area boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS smoking_permitted boolean NOT NULL DEFAULT false;

-- Vaping Policy
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS vaping_not_permitted boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS vaping_designated_area boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS vaping_permitted boolean NOT NULL DEFAULT false;

-- Languages
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_spanish boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_asl boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_native_american boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_other boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_arabic boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_chinese boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_creole boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_farsi boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_french boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_german boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_greek boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_hebrew boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_hindi boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_hmong boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_italian boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_japanese boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_korean boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_polish boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_portuguese boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_russian boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_tagalog boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS lang_vietnamese boolean NOT NULL DEFAULT false;

-- Facility Operation
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS op_private_forprofit boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS op_private_nonprofit boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS op_state_gov boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS op_local_gov boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS op_federal_gov boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS op_va boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS op_tribal boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS op_ihs boolean NOT NULL DEFAULT false;

-- Accreditation
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_carf boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_joint_commission boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_ncqa boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_coa boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_hfap boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_state_substance_use boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_state_mental_health boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_state_health boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_hospital_license boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_otp_certified boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accred_dea boolean NOT NULL DEFAULT false;

-- Other
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS other_gambling_treatment boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS other_addiction_treatment boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS hospital_general boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS hospital_psychiatric boolean NOT NULL DEFAULT false;

-- Recreate the listings_public view to include all new columns
DROP VIEW IF EXISTS arkansas.listings_public;
CREATE VIEW arkansas.listings_public AS
SELECT
  id, name, city, address,
  mask_phone(phone) AS phone,
  description, features, gender, image, images,
  price_range, lat, lng, category,
  accepts_private_pay, accepts_medicaid,
  length_of_stay, mat_available,
  insurance_verification_url,
  detox_available, level_php, level_iop, level_op,
  telehealth_available, evening_groups, beds,
  created_at, updated_at,
  -- New columns
  setting_outpatient, setting_inpatient, setting_residential,
  setting_intensive_outpatient, setting_partial_hospitalization,
  setting_telehealth, setting_outpatient_detox, setting_residential_detox,
  setting_short_term_residential, setting_long_term_residential, setting_outpatient_methadone,
  care_substance_use, care_detoxification, care_transitional_housing, care_co_occurring_mental_substance,
  group_veterans, group_adolescents, group_young_adults, group_adult_women, group_pregnant_women,
  group_adult_men, group_seniors, group_active_military, group_military_families,
  group_criminal_justice, group_co_occurring_disorders, group_hiv_aids, group_sexual_abuse,
  group_domestic_violence, group_trauma, group_co_occurring_pain,
  pay_medicaid, pay_medicare, pay_private_insurance, pay_self_pay, pay_sliding_scale,
  pay_assistance, pay_tricare, pay_federal_funding, pay_no_payment,
  opioid_methadone_maintenance, opioid_buprenorphine_maintenance, opioid_naltrexone,
  opioid_certified_otp, opioid_methadone_detox, opioid_buprenorphine_detox,
  opioid_prescribes_buprenorphine, opioid_prescribes_naltrexone, opioid_relapse_naltrexone,
  opioid_accepts_mat_elsewhere, opioid_no_mat, opioid_no_treatment,
  approach_cbt, approach_dbt, approach_motivational_interviewing, approach_trauma_counseling,
  approach_12_step, approach_brief_intervention, approach_contingency_management,
  approach_anger_management, approach_matrix_model, approach_community_reinforcement,
  approach_relapse_prevention, approach_substance_use_counseling, approach_telemedicine,
  counseling_individual, counseling_group, counseling_family, counseling_couples,
  test_hiv, test_hepatitis_b, test_hepatitis_c, test_std, test_tb, test_drug_urine,
  test_breathalyzer, test_metabolic,
  service_case_management, service_mental_health, service_employment, service_transportation,
  service_housing, service_peer_support, service_self_help_groups, service_child_care,
  service_childrens_beds, service_domestic_violence, service_social_skills, service_acupuncture,
  service_vocational, service_recovery_coach, service_discharge_planning, service_aftercare,
  service_naloxone_education, service_outcome_followup,
  pharma_methadone, pharma_buprenorphine_naloxone, pharma_buprenorphine_only,
  pharma_buprenorphine_injectable, pharma_buprenorphine_implant, pharma_naltrexone_oral,
  pharma_naltrexone_injectable, pharma_acamprosate, pharma_disulfiram,
  pharma_nicotine_replacement, pharma_non_nicotine_cessation, pharma_hiv_medications,
  pharma_hepatitis_c_medications, pharma_lofexidine, pharma_clonidine, pharma_prep,
  pharma_mental_disorder_meds,
  edu_hiv_aids, edu_hepatitis, edu_health_other, edu_substance_use, edu_tobacco_cessation,
  vaccine_hepatitis_a, vaccine_hepatitis_b,
  detox_alcohol, detox_benzodiazepines, detox_cocaine, detox_methamphetamine,
  detox_opioids, detox_medication_assisted,
  assess_mental_health, assess_substance_use, assess_physical_exam, assess_outreach,
  assess_screening_substance, assess_screening_mental, assess_screening_tobacco,
  age_children_adolescents, age_young_adults, age_adults, age_seniors,
  sex_female, sex_male,
  dui_program, dui_only,
  smoking_not_permitted, smoking_designated_area, smoking_permitted,
  vaping_not_permitted, vaping_designated_area, vaping_permitted,
  lang_spanish, lang_asl, lang_native_american, lang_other, lang_arabic, lang_chinese,
  lang_creole, lang_farsi, lang_french, lang_german, lang_greek, lang_hebrew, lang_hindi,
  lang_hmong, lang_italian, lang_japanese, lang_korean, lang_polish, lang_portuguese,
  lang_russian, lang_tagalog, lang_vietnamese,
  op_private_forprofit, op_private_nonprofit, op_state_gov, op_local_gov, op_federal_gov,
  op_va, op_tribal, op_ihs,
  accred_carf, accred_joint_commission, accred_ncqa, accred_coa, accred_hfap,
  accred_state_substance_use, accred_state_mental_health, accred_state_health,
  accred_hospital_license, accred_otp_certified, accred_dea,
  other_gambling_treatment, other_addiction_treatment, hospital_general, hospital_psychiatric
FROM arkansas.listings;


-- ==== source migration: 20260219035724_c9ccf2e6-2ee9-44e5-b897-c1646c83ea12.sql
-- Replay rules applied: R1 x8, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Step 1: Drop dependent views first
DROP VIEW IF EXISTS arkansas.featured_listings_public;
DROP VIEW IF EXISTS arkansas.listings_public;

-- Step 2: Convert category column from text to text[]
ALTER TABLE arkansas.listings
  ALTER COLUMN category DROP DEFAULT,
  ALTER COLUMN category TYPE text[] USING ARRAY[category],
  ALTER COLUMN category SET DEFAULT '{}'::text[];

-- Step 3: Recreate listings_public view
CREATE VIEW arkansas.listings_public WITH (security_invoker=on) AS
  SELECT
    id, name, city, address, mask_phone(phone) AS phone, description,
    features, gender, image, images, price_range, lat, lng, category,
    accepts_private_pay, accepts_medicaid, length_of_stay, mat_available,
    detox_available, level_php, level_iop, level_op, telehealth_available,
    evening_groups, insurance_verification_url, beds, created_at, updated_at,
    setting_outpatient, setting_inpatient, setting_residential,
    setting_intensive_outpatient, setting_partial_hospitalization,
    setting_telehealth, setting_outpatient_detox, setting_residential_detox,
    setting_short_term_residential, setting_long_term_residential,
    setting_outpatient_methadone,
    care_substance_use, care_detoxification, care_transitional_housing,
    care_co_occurring_mental_substance,
    group_veterans, group_adolescents, group_young_adults, group_adult_women,
    group_pregnant_women, group_adult_men, group_seniors, group_active_military,
    group_military_families, group_criminal_justice, group_co_occurring_disorders,
    group_hiv_aids, group_sexual_abuse, group_domestic_violence, group_trauma,
    group_co_occurring_pain,
    pay_medicaid, pay_medicare, pay_private_insurance, pay_self_pay,
    pay_sliding_scale, pay_assistance, pay_tricare, pay_federal_funding,
    pay_no_payment,
    opioid_methadone_maintenance, opioid_buprenorphine_maintenance,
    opioid_naltrexone, opioid_certified_otp, opioid_methadone_detox,
    opioid_buprenorphine_detox, opioid_prescribes_buprenorphine,
    opioid_prescribes_naltrexone, opioid_relapse_naltrexone,
    opioid_accepts_mat_elsewhere, opioid_no_mat, opioid_no_treatment,
    approach_cbt, approach_dbt, approach_motivational_interviewing,
    approach_trauma_counseling, approach_12_step, approach_brief_intervention,
    approach_contingency_management, approach_anger_management,
    approach_matrix_model, approach_community_reinforcement,
    approach_relapse_prevention, approach_substance_use_counseling,
    approach_telemedicine,
    counseling_individual, counseling_group, counseling_family, counseling_couples,
    test_hiv, test_hepatitis_b, test_hepatitis_c, test_std, test_tb,
    test_drug_urine, test_breathalyzer, test_metabolic,
    service_case_management, service_mental_health, service_employment,
    service_transportation, service_housing, service_peer_support,
    service_self_help_groups, service_child_care, service_childrens_beds,
    service_domestic_violence, service_social_skills, service_acupuncture,
    service_vocational, service_recovery_coach, service_discharge_planning,
    service_aftercare, service_naloxone_education, service_outcome_followup,
    pharma_methadone, pharma_buprenorphine_naloxone, pharma_buprenorphine_only,
    pharma_buprenorphine_injectable, pharma_buprenorphine_implant,
    pharma_naltrexone_oral, pharma_naltrexone_injectable, pharma_acamprosate,
    pharma_disulfiram, pharma_nicotine_replacement, pharma_non_nicotine_cessation,
    pharma_hiv_medications, pharma_hepatitis_c_medications, pharma_lofexidine,
    pharma_clonidine, pharma_prep, pharma_mental_disorder_meds,
    edu_hiv_aids, edu_hepatitis, edu_health_other, edu_substance_use,
    edu_tobacco_cessation,
    vaccine_hepatitis_a, vaccine_hepatitis_b,
    detox_alcohol, detox_benzodiazepines, detox_cocaine, detox_methamphetamine,
    detox_opioids, detox_medication_assisted,
    assess_mental_health, assess_substance_use, assess_physical_exam,
    assess_outreach, assess_screening_substance, assess_screening_mental,
    assess_screening_tobacco,
    age_children_adolescents, age_young_adults, age_adults, age_seniors,
    sex_female, sex_male,
    dui_program, dui_only,
    smoking_not_permitted, smoking_designated_area, smoking_permitted,
    vaping_not_permitted, vaping_designated_area, vaping_permitted,
    lang_spanish, lang_asl, lang_native_american, lang_other, lang_arabic,
    lang_chinese, lang_creole, lang_farsi, lang_french, lang_german,
    lang_greek, lang_hebrew, lang_hindi, lang_hmong, lang_italian,
    lang_japanese, lang_korean, lang_polish, lang_portuguese, lang_russian,
    lang_tagalog, lang_vietnamese,
    op_private_forprofit, op_private_nonprofit, op_state_gov, op_local_gov,
    op_federal_gov, op_va, op_tribal, op_ihs,
    accred_carf, accred_joint_commission, accred_ncqa, accred_coa, accred_hfap,
    accred_state_substance_use, accred_state_mental_health, accred_state_health,
    accred_hospital_license, accred_otp_certified, accred_dea,
    other_gambling_treatment, other_addiction_treatment,
    hospital_general, hospital_psychiatric
  FROM arkansas.listings;

-- Step 4: Recreate featured_listings_public view
CREATE VIEW arkansas.featured_listings_public WITH (security_invoker=on) AS
  SELECT id, listing_id, city, tier, status
  FROM arkansas.featured_listings;

-- Step 5: Assign categories based on boolean fields
UPDATE arkansas.listings
SET category = (
  SELECT array_remove(ARRAY[
    CASE WHEN setting_inpatient THEN 'inpatient' END,
    CASE WHEN setting_outpatient THEN 'outpatient' END,
    CASE WHEN care_transitional_housing THEN 'sober-living' END
  ], NULL)
);


-- ==== source migration: 20260222191143_313821dd-7b0d-487a-9dec-de0e2cc21ecf.sql
-- Replay rules applied: R1 x6, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


CREATE TABLE arkansas.recovery_houses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT 'co-ed',
  image text NOT NULL DEFAULT '',
  price_range text NOT NULL DEFAULT '',
  lat double precision NOT NULL DEFAULT 0,
  lng double precision NOT NULL DEFAULT 0,
  category text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE arkansas.recovery_houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recovery houses are publicly readable"
ON arkansas.recovery_houses FOR SELECT USING (true);

CREATE POLICY "Admins can insert recovery houses"
ON arkansas.recovery_houses FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update recovery houses"
ON arkansas.recovery_houses FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete recovery houses"
ON arkansas.recovery_houses FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));


-- ==== source migration: 20260222193956_ca6c4591-7bc0-4269-999d-1211a85c0d74.sql
-- Replay rules applied: R1 x2, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


-- Remove old columns
ALTER TABLE arkansas.recovery_houses
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS gender,
  DROP COLUMN IF EXISTS price_range,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS image,
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lng;

-- Add new columns
ALTER TABLE arkansas.recovery_houses
  ADD COLUMN doing_business_as text NOT NULL DEFAULT '',
  ADD COLUMN county text NOT NULL DEFAULT '',
  ADD COLUMN zip_code text NOT NULL DEFAULT '',
  ADD COLUMN website text NOT NULL DEFAULT '',
  ADD COLUMN bed_count integer NOT NULL DEFAULT 0,
  ADD COLUMN narr_level text NOT NULL DEFAULT '',
  ADD COLUMN target_population text NOT NULL DEFAULT '',
  ADD COLUMN special_population text NOT NULL DEFAULT '',
  ADD COLUMN handicap_accessible text NOT NULL DEFAULT '';


-- ==== source migration: 20260223021644_1729e461-d1d3-4b32-a2b2-2992bfeecce0.sql
-- Replay rules applied: R1 x1, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)

ALTER TABLE arkansas.listings ADD COLUMN website text NOT NULL DEFAULT '';

-- ==== source migration: 20260223022454_f0293430-ad39-4ea7-9ddb-ab35af01ea5c.sql
-- Replay rules applied: R1 x2, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)

DROP VIEW IF EXISTS arkansas.listings_public;

CREATE VIEW arkansas.listings_public
WITH (security_invoker=on) AS
SELECT id, name, city, address, mask_phone(phone) AS phone, description, features, gender, image, images, price_range, lat, lng, category, accepts_private_pay, accepts_medicaid, length_of_stay, mat_available, detox_available, level_php, level_iop, level_op, telehealth_available, evening_groups, insurance_verification_url, website, beds, created_at, updated_at, setting_outpatient, setting_inpatient, setting_residential, setting_intensive_outpatient, setting_partial_hospitalization, setting_telehealth, setting_outpatient_detox, setting_residential_detox, setting_short_term_residential, setting_long_term_residential, setting_outpatient_methadone, care_substance_use, care_detoxification, care_transitional_housing, care_co_occurring_mental_substance, group_veterans, group_adolescents, group_young_adults, group_adult_women, group_pregnant_women, group_adult_men, group_seniors, group_active_military, group_military_families, group_criminal_justice, group_co_occurring_disorders, group_hiv_aids, group_sexual_abuse, group_domestic_violence, group_trauma, group_co_occurring_pain, pay_medicaid, pay_medicare, pay_private_insurance, pay_self_pay, pay_sliding_scale, pay_assistance, pay_tricare, pay_federal_funding, pay_no_payment, opioid_methadone_maintenance, opioid_buprenorphine_maintenance, opioid_naltrexone, opioid_certified_otp, opioid_methadone_detox, opioid_buprenorphine_detox, opioid_prescribes_buprenorphine, opioid_prescribes_naltrexone, opioid_relapse_naltrexone, opioid_accepts_mat_elsewhere, opioid_no_mat, opioid_no_treatment, approach_cbt, approach_dbt, approach_motivational_interviewing, approach_trauma_counseling, approach_12_step, approach_brief_intervention, approach_contingency_management, approach_anger_management, approach_matrix_model, approach_community_reinforcement, approach_relapse_prevention, approach_substance_use_counseling, approach_telemedicine, counseling_individual, counseling_group, counseling_family, counseling_couples, test_hiv, test_hepatitis_b, test_hepatitis_c, test_std, test_tb, test_drug_urine, test_breathalyzer, test_metabolic, service_case_management, service_mental_health, service_employment, service_transportation, service_housing, service_peer_support, service_self_help_groups, service_child_care, service_childrens_beds, service_domestic_violence, service_social_skills, service_acupuncture, service_vocational, service_recovery_coach, service_discharge_planning, service_aftercare, service_naloxone_education, service_outcome_followup, pharma_methadone, pharma_buprenorphine_naloxone, pharma_buprenorphine_only, pharma_buprenorphine_injectable, pharma_buprenorphine_implant, pharma_naltrexone_oral, pharma_naltrexone_injectable, pharma_acamprosate, pharma_disulfiram, pharma_nicotine_replacement, pharma_non_nicotine_cessation, pharma_hiv_medications, pharma_hepatitis_c_medications, pharma_lofexidine, pharma_clonidine, pharma_prep, pharma_mental_disorder_meds, edu_hiv_aids, edu_hepatitis, edu_health_other, edu_substance_use, edu_tobacco_cessation, vaccine_hepatitis_a, vaccine_hepatitis_b, detox_alcohol, detox_benzodiazepines, detox_cocaine, detox_methamphetamine, detox_opioids, detox_medication_assisted, assess_mental_health, assess_substance_use, assess_physical_exam, assess_outreach, assess_screening_substance, assess_screening_mental, assess_screening_tobacco, age_children_adolescents, age_young_adults, age_adults, age_seniors, sex_female, sex_male, dui_program, dui_only, smoking_not_permitted, smoking_designated_area, smoking_permitted, vaping_not_permitted, vaping_designated_area, vaping_permitted, lang_spanish, lang_asl, lang_native_american, lang_other, lang_arabic, lang_chinese, lang_creole, lang_farsi, lang_french, lang_german, lang_greek, lang_hebrew, lang_hindi, lang_hmong, lang_italian, lang_japanese, lang_korean, lang_polish, lang_portuguese, lang_russian, lang_tagalog, lang_vietnamese, op_private_forprofit, op_private_nonprofit, op_state_gov, op_local_gov, op_federal_gov, op_va, op_tribal, op_ihs, accred_carf, accred_joint_commission, accred_ncqa, accred_coa, accred_hfap, accred_state_substance_use, accred_state_mental_health, accred_state_health, accred_hospital_license, accred_otp_certified, accred_dea, other_gambling_treatment, other_addiction_treatment, hospital_general, hospital_psychiatric
FROM listings;

-- ==== source migration: 20260228024522_3192ae3b-d492-4d76-b95e-95931d2f7806.sql
-- Replay rules applied: R1 x0, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- ==== source migration: 20260308014124_6f7cfe77-a088-4915-9644-358217f18d6a.sql
-- OMITTED in the Arkansas build (as in Missouri): data-only image backfill keyed to other
-- sites' listing UUIDs; affects 0 rows on a fresh schema (the Missouri
-- schema notes record it can be dropped harmlessly).


-- ==== source migration: 20260308224534_e4c38b79-da86-43ef-8382-a870179124f7.sql
-- Replay rules applied: R1 x6, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)


CREATE TABLE arkansas.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES arkansas.listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE arkansas.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON arkansas.favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own favorites"
  ON arkansas.favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
  ON arkansas.favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ==== source migration: 20260309024837_6ef3367a-54fb-4b2a-912e-91ac86bb56b0.sql
-- Replay rules applied: R1 x2, R2 x0. (Mirrors how schema `california` was built 2026-11-01.)

ALTER TABLE arkansas.featured_listings DROP CONSTRAINT featured_listings_tier_check;
ALTER TABLE arkansas.featured_listings ADD CONSTRAINT featured_listings_tier_check CHECK (tier = ANY (ARRAY['top', 'middle', 'bottom', 'featured']));

-- ==== R8 patch: live-only listings columns + 5 live-only tables (mirrors replay/california_patch.sql)

-- Arkansas R8 patch (mirrors the Missouri/California R8 patch) (plan S1.2/S1.5): live-only listings columns + 5 live-only tables
-- reconstructed from the California schema's types.ts, calibrated against the
-- 2026-11-01 live-data capture in ~/workspace/backups/directories-2026-11-01/.

-- 1) listings +7 live-only columns (backup rows: strings/bools never null)
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS accepts_medi_cal boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS county text NOT NULL DEFAULT '';
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS facebook_url text NOT NULL DEFAULT '';
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS otp_available boolean NOT NULL DEFAULT false;
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS youtube_url text NOT NULL DEFAULT '';
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS zip_code text NOT NULL DEFAULT '';

-- 2) counties (public-read on the live site)
CREATE TABLE arkansas.counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  access_line text NOT NULL DEFAULT '',
  access_line_label text NOT NULL DEFAULT '',
  crisis_line text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE arkansas.counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Counties are publicly readable" ON arkansas.counties FOR SELECT TO public USING (true);
CREATE TRIGGER set_counties_updated_at BEFORE UPDATE ON arkansas.counties
  FOR EACH ROW EXECUTE FUNCTION arkansas.update_updated_at_column();

-- 3) county_resources (public-read on the live site; county_id nullable, FK per types.ts)
CREATE TABLE arkansas.county_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id uuid REFERENCES arkansas.counties(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE arkansas.county_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "County resources are publicly readable" ON arkansas.county_resources FOR SELECT TO public USING (true);
CREATE TRIGGER set_county_resources_updated_at BEFORE UPDATE ON arkansas.county_resources
  FOR EACH ROW EXECUTE FUNCTION arkansas.update_updated_at_column();

-- 4) facility_submissions (no public access; RLS on, service role only)
CREATE TABLE arkansas.facility_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL DEFAULT '',
  city text NOT NULL,
  category text NOT NULL,
  website text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE arkansas.facility_submissions ENABLE ROW LEVEL SECURITY;

-- 5) featured_inquiries (no public access; RLS on, service role only)
-- types.ts marks id as required on Insert (no live default observed); a
-- gen_random_uuid() default is added anyway - supplying functions pass ids explicitly.
CREATE TABLE arkansas.featured_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  listing_type text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  delivery_status text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE arkansas.featured_inquiries ENABLE ROW LEVEL SECURITY;

-- 6) resource_suggestions (no public access; RLS on, service role only)
CREATE TABLE arkansas.resource_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county text NOT NULL DEFAULT '',
  resource_title text NOT NULL,
  details text NOT NULL DEFAULT '',
  name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE arkansas.resource_suggestions ENABLE ROW LEVEL SECURITY;

-- Grants (RLS remains the gate; service_role bypasses RLS)
GRANT SELECT ON arkansas.counties, arkansas.county_resources TO anon, authenticated;
GRANT ALL ON arkansas.counties, arkansas.county_resources, arkansas.facility_submissions,
  arkansas.featured_inquiries, arkansas.resource_suggestions TO service_role;


-- ==== Step-4 parity fix: rebuild listings_public with all 227 columns
-- The migration-era view (220 columns) predates the 7 live-only columns added by the
-- R8 patch above. Live california got exactly this rebuild on 2026-11-01 (migration/bin/
-- step4_fix_view.py): existing view columns kept in order, the 7 appended. NOTE: like
-- the live california view, this selects the raw `phone` column; the older migration
-- view wrapped it in mask_phone(...) (NULL for anonymous readers). See SCHEMA-NOTES.md.

CREATE OR REPLACE VIEW arkansas.listings_public WITH (security_invoker = on) AS
SELECT id, name, city, address, phone, description, features, gender, image, images, price_range, lat, lng, category, accepts_private_pay, accepts_medicaid, length_of_stay, mat_available, detox_available, level_php, level_iop, level_op, telehealth_available, evening_groups, insurance_verification_url, website, beds, created_at, updated_at, setting_outpatient, setting_inpatient, setting_residential, setting_intensive_outpatient, setting_partial_hospitalization, setting_telehealth, setting_outpatient_detox, setting_residential_detox, setting_short_term_residential, setting_long_term_residential, setting_outpatient_methadone, care_substance_use, care_detoxification, care_transitional_housing, care_co_occurring_mental_substance, group_veterans, group_adolescents, group_young_adults, group_adult_women, group_pregnant_women, group_adult_men, group_seniors, group_active_military, group_military_families, group_criminal_justice, group_co_occurring_disorders, group_hiv_aids, group_sexual_abuse, group_domestic_violence, group_trauma, group_co_occurring_pain, pay_medicaid, pay_medicare, pay_private_insurance, pay_self_pay, pay_sliding_scale, pay_assistance, pay_tricare, pay_federal_funding, pay_no_payment, opioid_methadone_maintenance, opioid_buprenorphine_maintenance, opioid_naltrexone, opioid_certified_otp, opioid_methadone_detox, opioid_buprenorphine_detox, opioid_prescribes_buprenorphine, opioid_prescribes_naltrexone, opioid_relapse_naltrexone, opioid_accepts_mat_elsewhere, opioid_no_mat, opioid_no_treatment, approach_cbt, approach_dbt, approach_motivational_interviewing, approach_trauma_counseling, approach_12_step, approach_brief_intervention, approach_contingency_management, approach_anger_management, approach_matrix_model, approach_community_reinforcement, approach_relapse_prevention, approach_substance_use_counseling, approach_telemedicine, counseling_individual, counseling_group, counseling_family, counseling_couples, test_hiv, test_hepatitis_b, test_hepatitis_c, test_std, test_tb, test_drug_urine, test_breathalyzer, test_metabolic, service_case_management, service_mental_health, service_employment, service_transportation, service_housing, service_peer_support, service_self_help_groups, service_child_care, service_childrens_beds, service_domestic_violence, service_social_skills, service_acupuncture, service_vocational, service_recovery_coach, service_discharge_planning, service_aftercare, service_naloxone_education, service_outcome_followup, pharma_methadone, pharma_buprenorphine_naloxone, pharma_buprenorphine_only, pharma_buprenorphine_injectable, pharma_buprenorphine_implant, pharma_naltrexone_oral, pharma_naltrexone_injectable, pharma_acamprosate, pharma_disulfiram, pharma_nicotine_replacement, pharma_non_nicotine_cessation, pharma_hiv_medications, pharma_hepatitis_c_medications, pharma_lofexidine, pharma_clonidine, pharma_prep, pharma_mental_disorder_meds, edu_hiv_aids, edu_hepatitis, edu_health_other, edu_substance_use, edu_tobacco_cessation, vaccine_hepatitis_a, vaccine_hepatitis_b, detox_alcohol, detox_benzodiazepines, detox_cocaine, detox_methamphetamine, detox_opioids, detox_medication_assisted, assess_mental_health, assess_substance_use, assess_physical_exam, assess_outreach, assess_screening_substance, assess_screening_mental, assess_screening_tobacco, age_children_adolescents, age_young_adults, age_adults, age_seniors, sex_female, sex_male, dui_program, dui_only, smoking_not_permitted, smoking_designated_area, smoking_permitted, vaping_not_permitted, vaping_designated_area, vaping_permitted, lang_spanish, lang_asl, lang_native_american, lang_other, lang_arabic, lang_chinese, lang_creole, lang_farsi, lang_french, lang_german, lang_greek, lang_hebrew, lang_hindi, lang_hmong, lang_italian, lang_japanese, lang_korean, lang_polish, lang_portuguese, lang_russian, lang_tagalog, lang_vietnamese, op_private_forprofit, op_private_nonprofit, op_state_gov, op_local_gov, op_federal_gov, op_va, op_tribal, op_ihs, accred_carf, accred_joint_commission, accred_ncqa, accred_coa, accred_hfap, accred_state_substance_use, accred_state_mental_health, accred_state_health, accred_hospital_license, accred_otp_certified, accred_dea, other_gambling_treatment, other_addiction_treatment, hospital_general, hospital_psychiatric, county, zip_code, email, facebook_url, youtube_url, accepts_medi_cal, otp_available
FROM arkansas.listings;


-- ==== End of migration ==========================================================
-- Expected census after a clean run (verify before loading data):
--   arkansas tables: 10 (listings, featured_listings, favorites,
--     recovery_houses, user_roles, counties, county_resources,
--     facility_submissions, featured_inquiries, resource_suggestions)
--   arkansas views: 2 (listings_public with 227 columns,
--     featured_listings_public)
--   arkansas.listings columns: 227
-- Then: add "arkansas" to Settings -> API -> Exposed schemas.


-- ============================================================================
-- Missouri-only addition: listings.source
-- ============================================================================
-- This column does NOT exist in the california schema (California has none).
-- It exists to satisfy Jason's data rule for the Arkansas build: every
-- loaded row must record where it came from. Expected values:
--   'SAMHSA' | 'DHS-OSAMH' | 'SAMHSA+DHS-OSAMH' | 'Oxford House' | 'Recovery Housing'
-- (SAMHSA FindTreatment / 2025 National Directory; Arkansas DHS,
--  Office of Substance Abuse and Mental Health (OSAMH) provider lists;
--  Oxford House chapters from the oxfordvacancies.com feed; Arkansas
--  recovery-housing lists if ruled in at load time; merged rows carry
--  '+'-joined values.)
-- The column is intentionally NOT added to the listings_public view above:
-- source is load bookkeeping, not public directory data.
ALTER TABLE arkansas.listings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT '';
