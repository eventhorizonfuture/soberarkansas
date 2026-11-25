ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS youtube_url text NOT NULL DEFAULT '';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS facebook_url text NOT NULL DEFAULT '';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS county text NOT NULL DEFAULT '';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS zip_code text NOT NULL DEFAULT '';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS accepts_medi_cal boolean NOT NULL DEFAULT false;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS otp_available boolean NOT NULL DEFAULT false;

CREATE TABLE public.counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  access_line text NOT NULL DEFAULT '',
  access_line_label text NOT NULL DEFAULT 'Drug Medi-Cal / SUD Access Line',
  crisis_line text NOT NULL DEFAULT '988',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.counties TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.counties TO authenticated;
GRANT ALL ON public.counties TO service_role;
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Counties are public" ON public.counties FOR SELECT USING (true);
CREATE POLICY "Admins manage counties" ON public.counties FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_counties_updated_at BEFORE UPDATE ON public.counties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.county_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id uuid REFERENCES public.counties(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Assessment',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.county_resources.county_id IS 'NULL = statewide resource';
CREATE INDEX county_resources_county_idx ON public.county_resources(county_id, sort_order);
GRANT SELECT ON public.county_resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.county_resources TO authenticated;
GRANT ALL ON public.county_resources TO service_role;
ALTER TABLE public.county_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources are public" ON public.county_resources FOR SELECT USING (true);
CREATE POLICY "Admins manage resources" ON public.county_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_county_resources_updated_at BEFORE UPDATE ON public.county_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.facility_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL DEFAULT '',
  category text NOT NULL,
  city text NOT NULL,
  website text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.facility_submissions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.facility_submissions TO authenticated;
GRANT ALL ON public.facility_submissions TO service_role;
ALTER TABLE public.facility_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit" ON public.facility_submissions FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND length(facility_name) BETWEEN 1 AND 300 AND length(contact_email) BETWEEN 3 AND 320);
CREATE POLICY "Admins read submissions" ON public.facility_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update submissions" ON public.facility_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete submissions" ON public.facility_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.resource_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  county text NOT NULL DEFAULT '',
  resource_title text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.resource_suggestions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.resource_suggestions TO authenticated;
GRANT ALL ON public.resource_suggestions TO service_role;
ALTER TABLE public.resource_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can suggest" ON public.resource_suggestions FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND length(resource_title) BETWEEN 1 AND 300);
CREATE POLICY "Admins read suggestions" ON public.resource_suggestions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update suggestions" ON public.resource_suggestions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete suggestions" ON public.resource_suggestions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));