-- ============================================================
-- Migración: Integración ForanIA con Supabase
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- 1. Agregar columnas a tabla proveedores
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS rating numeric(2,1);
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS cobertura text;

-- 2. Poblar whatsapp desde el campo descripcion
UPDATE proveedores
SET whatsapp = trim(regexp_replace(descripcion, '.*WhatsApp:\s*', ''));

-- 3. Limpiar descripcion (quitar datos embebidos)
UPDATE proveedores
SET descripcion = CASE
  WHEN tipo_proveedor_id = 1 THEN 'Propietario verificado en ForanIA'
  WHEN tipo_proveedor_id = 3 THEN 'Transportista verificado en ForanIA'
  ELSE descripcion
END;

-- 4. Poblar coordenadas de universidades
UPDATE universidades SET latitud = -29.4135, longitud = -66.8555 WHERE nombre = 'UNLaR';
UPDATE universidades SET latitud = -29.4050, longitud = -66.8450 WHERE nombre = 'UTN';

-- 5. Poblar coordenadas de alojamientos (aproximadas por barrio)
UPDATE alojamientos SET latitud = -29.4130, longitud = -66.8520 WHERE barrio_id = 1; -- Centro
UPDATE alojamientos SET latitud = -29.4155, longitud = -66.8540 WHERE barrio_id = 2; -- Zona UNLaR
UPDATE alojamientos SET latitud = -29.4200, longitud = -66.8600 WHERE barrio_id = 3; -- San Vicente
UPDATE alojamientos SET latitud = -29.4100, longitud = -66.8400 WHERE barrio_id = 4; -- Coquimbito
UPDATE alojamientos SET latitud = -29.4050, longitud = -66.8300 WHERE barrio_id = 5; -- Santa Justina

-- 6. Rating y cobertura para transportistas
UPDATE proveedores SET rating = 4.8, cobertura = 'Toda La Rioja' WHERE id = 13;
UPDATE proveedores SET rating = 4.6, cobertura = 'Centro y Zona UNLaR' WHERE id = 14;
UPDATE proveedores SET rating = 4.9, cobertura = 'Provincia completa' WHERE id = 15;
UPDATE proveedores SET rating = 4.5, cobertura = 'Toda La Rioja' WHERE id = 16;

-- 7. Verificar datos
SELECT p.id, p.nombre_comercial, p.whatsapp, p.rating, p.cobertura, p.descripcion
FROM proveedores p
ORDER BY p.id;
