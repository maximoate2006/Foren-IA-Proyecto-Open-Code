/**
 * ============================================================
 * ForanIA — Seed de imágenes para alojamientos existentes
 * ============================================================
 * Sube imágenes locales a Supabase Storage (bucket
 * "alojamiento-imagenes") y crea los registros correspondientes
 * en la tabla imagenes_alojamiento.
 *
 * Pensado para alojamientos cargados manualmente que no tienen
 * un proveedor real asociado (no hace falta loguearse: usa la
 * misma configuración del backend en server/.env).
 *
 * USO:
 *   node scripts/seed-images.js            -> usa scripts/seed-images.json
 *   node scripts/seed-images.js <otro.json>
 *   node scripts/seed-images.js --dry-run  -> simula sin escribir
 *
 * MAPPING (scripts/seed-images.json):
 *   {
 *     "1": ["seed-images/alojamiento-1-1.jpg", "seed-images/alojamiento-1-2.jpg"],
 *     "4": ["seed-images/alojamiento-4-1.jpg"]
 *   }
 *   - La clave es el ID del alojamiento en la tabla alojamientos.
 *   - Las rutas de imágenes son relativas a la carpeta server/
 *     (o absolutas).
 *   - Solo se procesan los alojamientos listados: si solo tenés
 *     fotos para 3 propiedades, el resto sigue funcionando con
 *     el fallback/gradiente actual.
 *
 * IDEMPOTENTE:
 *   Cada imagen se guarda en Storage con ruta determinística:
 *     aloj-{id}/{nombre-de-archivo}
 *   Si imagenes_alojamiento ya tiene una URL que apunta a esa
 *   ruta, se salta. Podés correr el script las veces que quieras
 *   sin duplicar imágenes.
 *
 * CREDENCIALES:
 *   No hay claves en este archivo: reutiliza server/config/supabase.js,
 *   que lee SUPABASE_URL y SUPABASE_KEY de server/.env (ignorado por git).
 * ============================================================
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

const BUCKET = "alojamiento-imagenes";
const MARCADOR_URL = `/${BUCKET}/`;
const EXT_PERMITIDAS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif"
};

// Sanitiza el nombre de archivo para usarlo como clave de Storage
function nombreSeguro(archivo) {
  return path.basename(archivo).trim().replace(/\s+/g, "-");
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const rutaJson = args.find(a => !a.startsWith("--")) || path.join(__dirname, "seed-images.json");

  if (!fs.existsSync(rutaJson)) {
    console.error(`No existe el archivo de mapping: ${rutaJson}`);
    process.exit(1);
  }

  let mapping;
  try {
    mapping = JSON.parse(fs.readFileSync(rutaJson, "utf8"));
  } catch (err) {
    console.error(`JSON inválido: ${err.message}`);
    process.exit(1);
  }

  const entradas = Object.entries(mapping);
  if (!entradas.length) {
    console.log("El mapping está vacío. Nada para hacer.");
    return;
  }

  let totalOk = 0;
  let totalSkip = 0;
  let totalError = 0;

  for (const [alojId, archivos] of entradas) {
    console.log(`\n=== Alojamiento ${alojId} ===`);

    // Verificar que el alojamiento existe (no se modifica nada suyo)
    const { data: aloj, error: errAloj } = await supabase
      .from("alojamientos")
      .select("id, titulo")
      .eq("id", alojId)
      .single();

    if (errAloj || !aloj) {
      console.error(`  X No existe un alojamiento con id ${alojId}. Se omite.`);
      totalError++;
      continue;
    }
    console.log(`  "${aloj.titulo}"`);

    // URLs ya registradas para este alojamiento (normalizadas)
    const { data: existentes } = await supabase
      .from("imagenes_alojamiento")
      .select("url")
      .eq("alojamiento_id", alojId);

    const rutasExistentes = new Set(
      (existentes || []).map(i => {
        const parte = i.url.split(MARCADOR_URL).pop() || "";
        try {
          return decodeURIComponent(parte);
        } catch {
          return parte;
        }
      })
    );

    // Continuar el orden a partir del máximo existente
    const { data: maxOrden } = await supabase
      .from("imagenes_alojamiento")
      .select("orden")
      .eq("alojamiento_id", alojId)
      .order("orden", { ascending: false })
      .limit(1);
    let orden = maxOrden && maxOrden.length ? maxOrden[0].orden + 1 : 0;

    for (const archivo of archivos) {
      const nombre = nombreSeguro(archivo);
      const ext = path.extname(nombre).toLowerCase();

      if (!EXT_PERMITIDAS.includes(ext)) {
        console.error(`  X ${archivo}: extensión no permitida (${ext}). Se omite.`);
        totalError++;
        continue;
      }

      const storagePath = `aloj-${alojId}/${nombre}`;

      // Idempotencia: si ya hay un registro apuntando a esta ruta, saltar
      if (rutasExistentes.has(storagePath)) {
        console.log(`  = ${nombre} ya está cargada. Se salta.`);
        totalSkip++;
        continue;
      }

      // Resolver ruta local: absoluta o relativa a server/
      const rutaLocal = path.isAbsolute(archivo) ? archivo : path.resolve(__dirname, "..", archivo);
      if (!fs.existsSync(rutaLocal)) {
        console.error(`  X No se encuentra el archivo local: ${rutaLocal}. Se omite.`);
        totalError++;
        continue;
      }

      if (dryRun) {
        console.log(`  [dry-run] ${archivo} -> ${storagePath} (orden ${orden})`);
        orden++;
        continue;
      }

      // Subir a Storage
      const buffer = fs.readFileSync(rutaLocal);
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: MIME[ext.slice(1)], upsert: false });

      if (upErr) {
        console.error(`  X Error subiendo ${nombre}: ${upErr.message}`);
        totalError++;
        continue;
      }

      // URL pública + registro en DB
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      const { error: dbErr } = await supabase
        .from("imagenes_alojamiento")
        .insert({
          alojamiento_id: Number(alojId),
          url: urlData.publicUrl,
          orden
        });

      if (dbErr) {
        console.error(`  X Error insertando en DB ${nombre}: ${dbErr.message}`);
        totalError++;
        continue;
      }

      console.log(`  OK ${nombre} (orden ${orden})`);
      rutasExistentes.add(storagePath);
      orden++;
      totalOk++;
    }
  }

  console.log(`\nListo. Subidas: ${totalOk} · Ya existían (saltadas): ${totalSkip} · Errores: ${totalError}`);
  if (dryRun) console.log("(era una simulación --dry-run, no se escribió nada)");
}

main().catch(err => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
