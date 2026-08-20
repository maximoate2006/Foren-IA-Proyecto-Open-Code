-- ============================================================
-- RLS policies para escritura (INSERT/UPDATE/DELETE)
-- Ejecutar en Supabase SQL Editor
-- NOTA: Estas políticas son abiertas (sin auth real).
-- Cuando se implemente auth, restringir por proveedor_id.
-- ============================================================

-- Proveedores (ya tiene SELECT)
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_insert_proveedores' AND tablename = 'proveedores') THEN
    CREATE POLICY allow_insert_proveedores ON proveedores FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_update_proveedores' AND tablename = 'proveedores') THEN
    CREATE POLICY allow_update_proveedores ON proveedores FOR UPDATE USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_delete_proveedores' AND tablename = 'proveedores') THEN
    CREATE POLICY allow_delete_proveedores ON proveedores FOR DELETE USING (true);
  END IF;
END $$;

-- Alojamientos
ALTER TABLE alojamientos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_insert_alojamientos' AND tablename = 'alojamientos') THEN
    CREATE POLICY allow_insert_alojamientos ON alojamientos FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_update_alojamientos' AND tablename = 'alojamientos') THEN
    CREATE POLICY allow_update_alojamientos ON alojamientos FOR UPDATE USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_delete_alojamientos' AND tablename = 'alojamientos') THEN
    CREATE POLICY allow_delete_alojamientos ON alojamientos FOR DELETE USING (true);
  END IF;
END $$;

-- Alojamiento-características
ALTER TABLE alojamiento_caracteristicas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_alojamiento_caract' AND tablename = 'alojamiento_caracteristicas') THEN
    CREATE POLICY allow_all_alojamiento_caract ON alojamiento_caracteristicas FOR ALL USING (true);
  END IF;
END $$;

-- Alojamiento-universidades
ALTER TABLE alojamiento_universidades ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_alojamiento_uni' AND tablename = 'alojamiento_universidades') THEN
    CREATE POLICY allow_all_alojamiento_uni ON alojamiento_universidades FOR ALL USING (true);
  END IF;
END $$;

-- Proveedor-vehículos
ALTER TABLE proveedor_vehiculos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_proveedor_vehiculos' AND tablename = 'proveedor_vehiculos') THEN
    CREATE POLICY allow_all_proveedor_vehiculos ON proveedor_vehiculos FOR ALL USING (true);
  END IF;
END $$;
