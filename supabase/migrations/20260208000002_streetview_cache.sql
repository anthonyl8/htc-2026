-- Street View AI Caching
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS streetview_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  item_type TEXT NOT NULL,
  species TEXT,
  before_image TEXT NOT NULL, -- Base64 string
  after_image TEXT NOT NULL,  -- Base64 string
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_streetview_lookup ON streetview_visualizations(lat, lng, item_type, species);

-- Enable RLS
ALTER TABLE streetview_visualizations ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (since it's a visualization feature)
CREATE POLICY "Anyone can read streetview visualizations"
  ON streetview_visualizations FOR SELECT
  USING (true);

-- Allow insert for authenticated users (or service role)
-- If backend uses Service Role, it bypasses this.
-- If backend uses Anon Key, we need to allow insert.
-- Let's allow insert for all for now to be safe with Anon Key usage, 
-- or restrict to authenticated if we force backend to use Service Role.
-- Assuming backend might use Anon Key:
CREATE POLICY "Anyone can insert streetview visualizations"
  ON streetview_visualizations FOR INSERT
  WITH CHECK (true);
