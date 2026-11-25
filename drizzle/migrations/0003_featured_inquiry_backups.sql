CREATE TABLE public.featured_inquiries (
  id uuid PRIMARY KEY,
  facility_name text NOT NULL CHECK (char_length(facility_name) BETWEEN 1 AND 300),
  contact_name text NOT NULL CHECK (char_length(contact_name) BETWEEN 1 AND 200),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 50),
  city text NOT NULL DEFAULT '' CHECK (char_length(city) <= 200),
  listing_type text NOT NULL DEFAULT '' CHECK (listing_type IN ('', 'Inpatient', 'Outpatient', 'Sober living')),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 3000),
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'queued')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.featured_inquiries TO service_role;
ALTER TABLE public.featured_inquiries ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.featured_inquiries IS 'Private Get Featured inquiry backups. Public submissions are validated by the inquiry function; no direct client access.';