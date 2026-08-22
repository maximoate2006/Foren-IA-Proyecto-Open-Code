-- ============================================================
-- 005_cuentas_demo.sql — Cuentas demo de ForanIA (2026-08)
--
-- Ejecutar en: Supabase SQL Editor, POR BLOQUES y en este orden:
--
--   BLOQUE 1 (LIMPIEZA)     -> ANTES de correr scripts/crear-usuarios-demo.js
--   BLOQUE 2 (CONFIRMACIÓN) -> normalmente NO hace falta si se desactivó
--                              "Confirm email" en Authentication > Providers.
--                              Solo si el login devuelve "Email not confirmed".
--
-- Contraseña de TODAS las cuentas demo: Forania2026*
--
-- NOTA: los emails de los transportistas 13/14/15 se cambiaron porque
-- sus dominios originales no existen y Supabase los rechazaría:
--   13: contacto@riojaexpress.com        -> contacto.riojaexpress@email.com
--   14: info@fleteveloz.com              -> info.fleteveloz@email.com
--   15: reservas@transportescatamarca.com -> reservas.catamarca@email.com
-- ============================================================


-- ############################################################
-- BLOQUE 1: LIMPIEZA
-- Borra las cuentas demo viejas insertadas a mano (las que
-- rompen el login con error 500). El ON DELETE CASCADE arrastra:
--   - auth.identities
--   - public.usuarios (perfiles)
--   - favoritos asociados
-- y proveedores.usuario_id queda en NULL.
-- NO toca alojamientos, imágenes ni ningún otro dato.
-- ############################################################

DELETE FROM auth.users
WHERE id IN (SELECT usuario_id FROM public.proveedores WHERE usuario_id IS NOT NULL)
   OR lower(email) IN (
        'raul.castro@email.com',
        'jorge.medina@email.com',
        'silvia.torres@email.com',
        'pedro.villafane@email.com',
        'hugo.aguirre@email.com',
        'ana.rios@email.com',
        'nora.campos@email.com',
        'carlos.sosa@email.com',
        'maria.gonzalez@email.com',
        'diego.luna@email.com',
        'laura.fernandez@email.com',
        'marta.lopez@email.com',
        'contacto.riojaexpress@email.com',
        'info.fleteveloz@email.com',
        'reservas.catamarca@email.com',
        'mudanzaexpress24hs@gmail.com',
        'pedroxxantonio991@gmail.com',
        'test.discriminador.forania@ejemplo.com'
   );

-- Verificación: debería devolver las filas de auth.users restantes
-- (si devuelve vacío o solo usuarios tuyos reales, está bien).
SELECT id, email, email_confirmed_at IS NOT NULL AS confirmado, created_at
FROM auth.users
ORDER BY created_at;

-- Y esto debería devolver 0 filas vinculadas:
SELECT id, nombre_comercial FROM public.proveedores WHERE usuario_id IS NOT NULL;


-- ############################################################
-- BLOQUE 2: CONFIRMACIÓN DE EMAILS
-- El proyecto tiene activada la confirmación por email y estas
-- son direcciones ficticias/demo: se confirman directo acá para
-- poder iniciar sesión sin depender del correo.
-- Correr SOLO si al loguear dice "Email not confirmed".
-- ############################################################

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at         = now(),
    confirmation_token = NULL,
    recovery_token     = NULL
WHERE lower(email) IN (
    'raul.castro@email.com',
    'jorge.medina@email.com',
    'silvia.torres@email.com',
    'pedro.villafane@email.com',
    'hugo.aguirre@email.com',
    'ana.rios@email.com',
    'nora.campos@email.com',
    'carlos.sosa@email.com',
    'maria.gonzalez@email.com',
    'diego.luna@email.com',
    'laura.fernandez@email.com',
    'marta.lopez@email.com',
    'contacto.riojaexpress@email.com',
    'info.fleteveloz@email.com',
    'reservas.catamarca@email.com',
    'mudanzaexpress24hs@gmail.com',
    'pedroxxantonio991@gmail.com'
);

-- Verificación: 17 filas, todas confirmado = t
SELECT email, email_confirmed_at
FROM auth.users
WHERE lower(email) LIKE '%@email.com'
   OR lower(email) IN ('contacto.riojaexpress@email.com','info.fleteveloz@email.com','reservas.catamarca@email.com','mudanzaexpress24hs@gmail.com','pedroxxantonio991@gmail.com')
ORDER BY email;
