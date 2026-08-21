-- ============================================================
-- Migración 004: Usuarios (Supabase Auth), Favoritos y vínculo
-- con proveedores + reparación del registro roto.
--
-- Ejecutar en: Supabase SQL Editor
-- Fecha: 08/2026
--
-- Qué hace:
--   0) Diagnostica y ELIMINA triggers rotos sobre auth.users que
--      provocan "Database error saving new user" al registrarse.
--   1) Recrea la tabla public.usuarios vinculada a auth.users
--      (la anterior estaba vacía y sin columnas de email).
--   2) Crea la tabla public.favoritos (usuario x alojamiento).
--   3) Agrega proveedores.usuario_id para vincular cada cuenta
--      con su perfil de proveedor (sus publicaciones).
--   4) Crea las 12 cuentas demo de los proveedores sembrados y
--      las vincula, para poder gestionar los alojamientos demo.
--
-- Contraseña de TODAS las cuentas demo: Forania2026*
-- ============================================================

-- ------------------------------------------------------------
-- 0) REPARACIÓN DEL REGISTRO (trigger roto sobre auth.users)
-- ------------------------------------------------------------
-- Diagnóstico: primero mirá qué triggers existen (el resultado
-- aparece en el panel Results).
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

-- Funciones huérfanas típicas de esos triggers (si existían)
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.crear_perfil_usuario();

-- ------------------------------------------------------------
-- 1) TABLA USUARIOS (perfil público vinculado a Supabase Auth)
-- ------------------------------------------------------------
-- La tabla anterior (id/nombre/telefono) estaba vacía: se recrea.
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
-- El backend inserta perfiles al registrarse (usa la key del server)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usuarios_insert_backend') THEN
    CREATE POLICY usuarios_insert_backend ON public.usuarios FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) TABLA FAVORITOS
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

-- Nota: el acceso a favoritos pasa SIEMPRE por el backend Express,
-- que valida el JWT del usuario antes de operar (requireAuth).
-- Las políticas quedan permisivas para no bloquear esa vía única.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'favoritos_all_api') THEN
    CREATE POLICY favoritos_all_api ON public.favoritos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3) VÍNCULO PROVEEDOR <-> USUARIO
-- ------------------------------------------------------------
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_proveedores_usuario ON public.proveedores(usuario_id) WHERE usuario_id IS NOT NULL;

-- ------------------------------------------------------------
-- 4) CUENTAS DEMO para los proveedores sembrados (ids 1..12)
--    Contraseña única: Forania2026*
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
    -- Omitir si ya existe un usuario de auth con ese email
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
-- Verificación final
-- ------------------------------------------------------------
SELECT p.id, p.nombre_comercial, p.email, u.id IS NOT NULL AS tiene_usuario
FROM public.proveedores p LEFT JOIN public.usuarios u ON u.id = p.usuario_id
ORDER BY p.id;
