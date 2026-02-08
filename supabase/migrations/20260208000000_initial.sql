-- ReLeaf Persistence Schema (PostGIS + Peer Review Optimizations)
-- Run in Supabase SQL Editor

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Projects table (with map state + simulation cache)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Proposal',
  description TEXT,
  center_lat FLOAT DEFAULT 49.2827,
  center_lon FLOAT DEFAULT -123.1207,
  zoom_level FLOAT DEFAULT 12,
  simulation_results JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Interventions table (PostGIS Geography)
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('tree', 'cool_roof', 'bio_swale')),
  metadata JSONB DEFAULT '{}',
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_interventions_project_id ON interventions(project_id);
CREATE INDEX idx_interventions_location ON interventions USING GIST(location);

-- 5. RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can do everything on projects"
  ON projects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Owners can do everything on interventions"
  ON interventions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = interventions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 6. updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. Duplicate project (Fork) RPC
CREATE OR REPLACE FUNCTION duplicate_project(project_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  proj RECORD;
BEGIN
  SELECT * INTO proj FROM projects WHERE id = project_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  INSERT INTO projects (user_id, name, description, center_lat, center_lon, zoom_level)
  VALUES (auth.uid(), proj.name || ' (Copy)', proj.description, proj.center_lat, proj.center_lon, proj.zoom_level)
  RETURNING id INTO new_id;

  INSERT INTO interventions (project_id, type, metadata, location)
  SELECT new_id, type, metadata, location
  FROM interventions
  WHERE interventions.project_id = project_id;

  RETURN new_id;
END;
$$;
