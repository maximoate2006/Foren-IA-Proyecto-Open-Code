-- ============================================================
-- Migración 003: RLS para tablas faltantes + Storage
-- Ejecutar en: Supabase SQL Editor
--
-- Tablas que esta migración cubre:
--   - imagenes_alojamiento (ya existe en DB)
--   - solicitudes_mudanza (ya existe en DB)
--   - registros_vistas (ya existe en DB)
--   - caracteristicas (ya existe en DB)
--   - Storage: bucket alojamiento-imagenes (crear en Dashboard)
--
-- Todas las policies son abiertas (sin auth real).
-- Cuando se implemente auth, restringir por proveedor_id.
-- ============================================================

-- ============================================================
-- 1. imagenes_alojamiento — RLS
-- ============================================================

ALTER TABLE imagenes_alojamiento ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_select_imagenes' AND tablename = 'imagenes_alojamiento') THEN
    CREATE POLICY allow_select_imagenes ON imagenes_alojamiento FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_insert_imagenes' AND tablename = 'imagenes_alojamiento') THEN
    CREATE POLICY allow_insert_imagenes ON imagenes_alojamiento FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_update_imagenes' AND tablename = 'imagenes_alojamiento') THEN
    CREATE POLICY allow_update_imagenes ON imagenes_alojamiento FOR UPDATE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_delete_imagenes' AND tablename = 'imagenes_alojamiento') THEN
    CREATE POLICY allow_delete_imagenes ON imagenes_alojamiento FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================================
-- 2. solicitudes_mudanza — RLS
-- ============================================================
-- Endpoint: POST /api/contacto (INSERT)
-- Endpoint: GET /api/proveedores/:id/stats (SELECT count)

ALTER TABLE solicitudes_mudanza ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_select_solicitudes' AND tablename = 'solicitudes_mudanza') THEN
    CREATE POLICY allow_select_solicitudes ON solicitudes_mudanza FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_insert_solicitudes' AND tablename = 'solicitudes_mudanza') THEN
    CREATE POLICY allow_insert_solicitudes ON solicitudes_mudanza FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 3. registros_vistas — RLS
-- ============================================================
-- Endpoint: POST /api/vistas (INSERT)
-- Endpoint: GET /api/proveedores/:id/stats (SELECT count)

ALTER TABLE registros_vistas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_select_vistas' AND tablename = 'registros_vistas') THEN
    CREATE POLICY allow_select_vistas ON registros_vistas FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_insert_vistas' AND tablename = 'registros_vistas') THEN
    CREATE POLICY allow_insert_vistas ON registros_vistas FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 4. caracteristicas — RLS
-- ============================================================
-- Endpoint: POST /api/alojamientos (SELECT + INSERT si no existe)

ALTER TABLE caracteristicas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_select_caracteristicas' AND tablename = 'caracteristicas') THEN
    CREATE POLICY allow_select_caracteristicas ON caracteristicas FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_insert_caracteristicas' AND tablename = 'caracteristicas') THEN
    CREATE POLICY allow_insert_caracteristicas ON caracteristicas FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 5. Storage — policies para bucket alojamiento-imagenes
-- ============================================================
-- IMPORTANTE: El bucket debe existir. Crear desde Supabase Dashboard:
--   Storage → New bucket → Nombre: alojamiento-imagenes → Public: ON
--
-- Una vez creado el bucket, ejecutar esta migración completa.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_upload_imagenes' AND tablename = 'objects') THEN
    CREATE POLICY allow_upload_imagenes ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'alojamiento-imagenes');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_read_imagenes' AND tablename = 'objects') THEN
    CREATE POLICY allow_read_imagenes ON storage.objects
      FOR SELECT USING (bucket_id = 'alojamiento-imagenes');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_delete_storage_imagenes' AND tablename = 'objects') THEN
    CREATE POLICY allow_delete_storage_imagenes ON storage.objects
      FOR DELETE USING (bucket_id = 'alojamiento-imagenes');
  END IF;
END $$;
