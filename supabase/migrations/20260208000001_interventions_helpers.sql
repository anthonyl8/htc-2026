-- Helper view and RPC for interventions (PostGIS geography ↔ frontend lat/lon)
-- Note: Enable Realtime for `interventions` in Supabase Dashboard > Database > Replication
-- if you want multiplayer sync (optional).

-- 1. View with lon/lat extracted from geography (for SELECT)
CREATE OR REPLACE VIEW interventions_with_coords AS
SELECT
  id,
  project_id,
  type,
  metadata,
  created_at,
  ST_X(location::geometry)::double precision AS lon,
  ST_Y(location::geometry)::double precision AS lat
FROM interventions;

-- Grant to authenticated (RLS on interventions applies via view)
GRANT SELECT ON interventions_with_coords TO authenticated;

-- 2. RPC to insert intervention (geography from lon/lat)
CREATE OR REPLACE FUNCTION insert_intervention(
  p_project_id UUID,
  p_type TEXT,
  p_lon DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  INSERT INTO interventions (project_id, type, metadata, location)
  VALUES (
    p_project_id,
    p_type,
    COALESCE(p_metadata, '{}'),
    ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
