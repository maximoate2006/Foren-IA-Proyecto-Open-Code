-- ============================================================
-- SCRIPT PARA EJECUTAR EN SUPABASE SQL EDITOR (2026-08)
-- Consolidado y seguro para la situacion actual del proyecto:
--
--   Estado verificado en Supabase:
--     - public.usuarios existe con esquema VIEJO (id/nombre/telefono,
--       sin email ni created_at) y esta VACIA.
--     - public.favoritos existe creada a mano, SIN created_at, vacia.
--     - public.proveedores NO tiene columna usuario_id.
--     - No existen las cuentas demo de auth.
--     - El bucket alojamiento-imagenes ya existe y funciona.
--
--   Este script hace TODO lo de la migracion 004 y ademas:
--     - Elimina la favoritos vieja si esta incompleta y vacia
--       (verificado: 0 filas). Si tuviera filas, la conserva y
--       completa su estructura al final del script.
--     - Garantiza al final que favoritos tenga created_at y su
--       FK hacia la nueva tabla usuarios (por el CASCADE del DROP).
--
-- Es seguro volver a ejecutarlo (los pasos son condicionales),
-- PERO ojo: si se re-ejecuta cuando ya hay cuentas demo vinculadas,
-- esas no se duplican (hay guardas).
-- ============================================================

-- ------------------------------------------------------------
-- A) PRE-CHEQUEO: favoritos vieja e incompleta
-- ------------------------------------------------------------
DO $$
DECLARE n int;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'favoritos')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'favoritos'
                       AND column_name = 'created_at') THEN
    EXECUTE 'SELECT COUNT(*) FROM public.favoritos' INTO n;
    IF n = 0 THEN
      EXECUTE 'DROP TABLE public.favoritos CASCADE';
      RAISE NOTICE 'favoritos (version vieja, vacia): eliminada para recrearla completa';
    ELSE
      RAISE NOTICE 'favoritos vieja tiene % filas: se conserva, se completa estructura al final', n;
    END IF;
  END IF;
END $$;

-- ------------------------------------------------------------
-- B) REPARACION DEL REGISTRO (triggers rotos sobre auth.users)
--    Causaban "Database error saving new user"
-- ------------------------------------------------------------
SELECT tgname AS trigger_name, pg_get_triggerdef(t.oid) AS definicion
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth' AND NOT t.tgisinternal;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT tg.tgname AS trigger_name, cls.relname AS table_name
    FROM pg_trigger tg
    JOIN pg_class cls ON cls.oid = tg.tgrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE ns.nspname = 'auth' AND NOT tg.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.%I;', r.trigger_name, r.table_name);
    RAISE NOTICE 'Trigger eliminado de auth.%: %', r.table_name, r.trigger_name;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.crear_perfil_usuario();

-- ------------------------------------------------------------
-- C) TABLA USUARIOS (perfil publico vinculado a Supabase Auth)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS public.usuarios CASCADE;

CREATE TABLE public.usuarios (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     text NOT NULL,
  email      text NOT NULL UNIQUE,
  telefono   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usuarios_select_propio') THEN
    CREATE POLICY usuarios_select_propio ON public.usuarios
      FOR SELECT USING ((SELECT auth.uid()) = id OR (SELECT auth.uid()) IS NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usuarios_update_propio') THEN
    CREATE POLICY usuarios_update_propio ON public.usuarios
      FOR UPDATE USING ((SELECT auth.uid()) = id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usuarios_insert_backend') THEN
    CREATE POLICY usuarios_insert_backend ON public.usuarios FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------
-- D) TABLA FAVORITOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favoritos (
  usuario_id     uuid   NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  alojamiento_id bigint NOT NULL REFERENCES public.alojamientos(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, alojamiento_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON public.favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_alojamiento ON public.favoritos(alojamiento_id);

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'favoritos_all_api') THEN
    CREATE POLICY favoritos_all_api ON public.favoritos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------
-- E) VINCULO PROVEEDOR <-> USUARIO
-- ------------------------------------------------------------
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_proveedores_usuario ON public.proveedores(usuario_id) WHERE usuario_id IS NOT NULL;

-- ------------------------------------------------------------
-- F) CUENTAS DEMO para los proveedores sembrados (ids 1..12)
--    Contrasena de TODAS: Forania2026*
-- ------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
  uid uuid;
  pass_crypt text;
BEGIN
  SELECT crypt('Forania2026*', gen_salt('bf')) INTO pass_crypt;

  FOR rec IN
    SELECT p.id, p.nombre_comercial, p.email, p.telefono
    FROM public.proveedores p
    WHERE p.id BETWEEN 1 AND 12 AND p.usuario_id IS NULL
  LOOP
    CONTINUE WHEN EXISTS (SELECT 1 FROM auth.users au WHERE lower(au.email) = lower(rec.email));

    uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, banned_until, confirmation_token, recovery_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      rec.email, pass_crypt, now(), NULL, '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nombre', rec.nombre_comercial),
      now(), now()
    );

    INSERT INTO auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', rec.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    INSERT INTO public.usuarios (id, nombre, email, telefono)
    VALUES (uid, rec.nombre_comercial, rec.email, rec.telefono)
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.proveedores SET usuario_id = uid WHERE id = rec.id;

    RAISE NOTICE 'Cuenta demo creada: % (%)', rec.nombre_comercial, rec.email;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- G) COMPLETADO DE favoritos (solo si sobrevivio una version vieja)
-- ------------------------------------------------------------
ALTER TABLE public.favoritos ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
DECLARE fk_ok boolean;
BEGIN
  SELECT COUNT(*) > 0 INTO fk_ok
  FROM pg_constraint c
  JOIN pg_class rel ON rel.oid = c.conrelid
  JOIN pg_class ref ON ref.oid = c.confrelid
  WHERE rel.relname = 'favoritos' AND ref.relname = 'usuarios' AND c.contype = 'f';
  IF NOT fk_ok THEN
    ALTER TABLE public.favoritos
      ADD CONSTRAINT favoritos_usuario_id_fkey
      FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK favoritos -> usuarios recreada';
  END IF;
END $$;

-- ------------------------------------------------------------
-- H) VERIFICACION FINAL
-- ------------------------------------------------------------
SELECT p.id, p.nombre_comercial, p.email, u.id IS NOT NULL AS tiene_usuario
FROM public.proveedores p LEFT JOIN public.usuarios u ON u.id = p.usuario_id
ORDER BY p.id;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('usuarios','favoritos')
ORDER BY table_name, ordinal_position;
