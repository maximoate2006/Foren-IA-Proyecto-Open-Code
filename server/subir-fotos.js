/**
 * ============================================================
 * ForanIA — Carga masiva de imágenes para alojamientos
 * ============================================================
 * Sube fotos directamente a Supabase Storage + tabla
 * imagenes_alojamiento, para alojamientos que ya existen en la
 * base de datos (incluso si no tienen proveedor asociado).
 *
 * MODOS DE USO:
 *
 *   1) Ver qué alojamientos hay y cuántas fotos tiene cada uno:
 *        node subir-fotos.js --listar
 *
 *   2) Simular la subida (no escribe nada):
 *        node subir-fotos.js <carpeta> --dry-run
 *
 *   3) Subir de verdad:
 *        node subir-fotos.js <carpeta>
 *
 * ESTRUCTURA ESPERADA DE LA CARPETA:
 *   Una subcarpeta por alojamiento, nombrada con su ID:
 *
 *   fotos/
 *     1/
 *       frente.jpg
 *       living.png
 *     5/
 *       habitacion.webp
 *
 * Los IDs se consultan con: node subir-fotos.js --listar
 * Requiere SUPABASE_URL y SUPABASE_KEY en server/.env
 * ============================================================
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const fs = require("fs");
const path = require("path");
const supabase = require("./config/supabase");

const BUCKET = "alojamiento-imagenes";
const EXT_PERMITIDAS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif"
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB, igual que el backend

// ------------------------------------------------------------
// Modo --listar: muestra alojamientos y cantidad de fotos
// ------------------------------------------------------------
async function listar() {
  const { data, error } = await supabase
    .from("alojamientos")
    .select("id, titulo, estado, proveedor_id, imagenes_alojamiento (id)")
    .order("id");

  if (error) {
    console.error("Error consultando alojamientos:", error.message);
    process.exit(1);
  }

  console.log("\nID   FOTOS  ESTADO       PROV  TITULO");
  console.log("-".repeat(70));
  for (const a of data) {
    const fotos = (a.imagenes_alojamiento || []).length;
    const marca = fotos === 0 ? " <<" : "";
    console.log(
      String(a.id).padEnd(4) +
      String(fotos).padEnd(6) +
      String(a.estado || "").padEnd(12) +
      String(a.proveedor_id ?? "-").padEnd(5) +
      (a.titulo || "") + marca
    );
  }
  const sinFotos = data.filter(a => !(a.imagenes_alojamiento || []).length).length;
  console.log("-".repeat(70));
  console.log(`Total: ${data.length} alojamientos · ${sinFotos} sin fotos\n`);
}

// ------------------------------------------------------------
// Modo carga: sube las fotos de una carpeta local
// ------------------------------------------------------------
async function cargar(rutaBase, dryRun) {
  if (!fs.existsSync(rutaBase)) {
    console.error(`No existe la carpeta: ${rutaBase}`);
    process.exit(1);
  }

  // Subcarpetas nombradas con el ID del alojamiento
  const entradas = fs
    .readdirSync(rutaBase, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d+$/.test(e.name))
    .sort((a, b) => Number(a.name) - Number(b.name));

  if (!entradas.length) {
    console.error("No se encontraron subcarpetas con ID numérico.");
    console.error(`Estructura esperada:\n  ${rutaBase}\n    1\\foto1.jpg\n    5\\foto2.png`);
    process.exit(1);
  }

  let totalOk = 0;
  let totalError = 0;

  for (const entrada of entradas) {
    const alojId = entrada.name;
    console.log(`\n=== Alojamiento ${alojId} ===`);

    // Verificar que el alojamiento existe
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

    // Imágenes válidas dentro de la subcarpeta
    const dirAloj = path.join(rutaBase, alojId);
    const archivos = fs
      .readdirSync(dirAloj)
      .filter(f => {
        const esArchivo = fs.statSync(path.join(dirAloj, f)).isFile();
        return esArchivo && EXT_PERMITIDAS.includes(path.extname(f).toLowerCase());
      })
      .sort();

    if (!archivos.length) {
      console.log("  (sin imágenes válidas en la subcarpeta)");
      continue;
    }

    // Continuar el orden a partir de las fotos existentes
    const { data: existing } = await supabase
      .from("imagenes_alojamiento")
      .select("orden")
      .eq("alojamiento_id", alojId)
      .order("orden", { ascending: false })
      .limit(1);
    let orden = existing && existing.length ? existing[0].orden + 1 : 0;

    for (const archivo of archivos) {
      const ruta = path.join(dirAloj, archivo);
      const stat = fs.statSync(ruta);

      if (stat.size > MAX_SIZE) {
        console.error(`  X ${archivo} supera 5MB. Se omite.`);
        totalError++;
        continue;
      }

      const ext = path.extname(archivo).slice(1).toLowerCase() || "jpg";
      const storagePath = `aloj-${alojId}/${Date.now()}_${orden}.${ext}`;

      if (dryRun) {
        console.log(`  [dry-run] ${archivo} -> ${storagePath}`);
        orden++;
        continue;
      }

      // Subir a Storage
      const buffer = fs.readFileSync(ruta);
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: MIME[ext] });

      if (upErr) {
        console.error(`  X Error subiendo ${archivo}: ${upErr.message}`);
        totalError++;
        continue;
      }

      // URL pública
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      // Referencia en DB
      const { error: dbErr } = await supabase
        .from("imagenes_alojamiento")
        .insert({
          alojamiento_id: Number(alojId),
          url: urlData.publicUrl,
          orden
        });

      if (dbErr) {
        console.error(`  X Error insertando en DB ${archivo}: ${dbErr.message}`);
        totalError++;
        continue;
      }

      console.log(`  OK ${archivo} (orden ${orden})`);
      orden++;
      totalOk++;
    }
  }

  console.log(`\nListo. Imágenes subidas: ${totalOk}. Errores/omitidas: ${totalError}.`);
  if (dryRun) console.log("(era una simulación --dry-run, no se escribió nada)");
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--listar")) {
    await listar();
    return;
  }

  const carpeta = args.find(a => !a.startsWith("--"));
  if (!carpeta) {
    console.log(`
Uso:
  node subir-fotos.js --listar          -> ver alojamientos y sus fotos
  node subir-fotos.js <carpeta>         -> subir fotos
  node subir-fotos.js <carpeta> --dry-run -> simular sin escribir
`);
    process.exit(1);
  }

  await cargar(path.resolve(carpeta), args.includes("--dry-run"));
}

main().catch(err => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
