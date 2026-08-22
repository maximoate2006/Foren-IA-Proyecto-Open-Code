/**
 * ============================================================
 * ForanIA — Subida de fotos por TÍTULO de alojamiento
 * ============================================================
 * Igual que subir-fotos.js pero para carpetas planas donde el
 * nombre de cada archivo es el TÍTULO del alojamiento:
 *
 *   fotos alojamiento/
 *     Departamento económico Centro.jpeg        -> alojamiento con ese titulo (orden 0/primero)
 *     Departamento económico Centro (2).jpeg    -> mismo alojamiento (orden siguiente)
 *
 * USO:
 *   node scripts/subir-fotos-por-titulo.js "<carpeta>" --dry-run
 *   node scripts/subir-fotos-por-titulo.js "<carpeta>"
 *
 * Requiere SUPABASE_URL y SUPABASE_KEY en server/.env
 * ============================================================
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

const BUCKET = "alojamiento-imagenes";
const EXT_PERMITIDAS = [".jpg", ".jpeg", ".png", ".webp"];
const MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const MAX_SIZE = 5 * 1024 * 1024;

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// "Casa X (3).jpeg" -> { tituloBase: "Casa X", secuencia: 3 }
// El archivo sin sufijo tiene secuencia 1 (va primero en la galeria).
function parsearNombre(nombreArchivo) {
  const ext = path.extname(nombreArchivo);
  const base = nombreArchivo.slice(0, nombreArchivo.length - ext.length);
  const m = base.match(/\s*\((\d+)\)$/);
  if (m) {
    return { tituloBase: base.slice(0, m.index), secuencia: Number(m[1]) };
  }
  return { tituloBase: base, secuencia: 1 };
}

async function main() {
  const args = process.argv.slice(2);
  const carpeta = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");

  // --ids 12 | --ids=6,12 : procesa solo esos alojamientos
  let soloIds = null;
  const idxIds = args.findIndex((a) => a === "--ids" || a.startsWith("--ids="));
  if (idxIds !== -1) {
    const valor = args[idxIds].includes("=")
      ? args[idxIds].split("=")[1]
      : args[idxIds + 1];
    if (!valor || valor.startsWith("--")) {
      console.error("--ids requiere una lista, ej: --ids 6,12");
      process.exit(1);
    }
    soloIds = new Set(valor.split(",").map((x) => Number(x.trim())).filter(Boolean));
  }

  if (!carpeta || !fs.existsSync(carpeta)) {
    console.error(`Carpeta invalida o inexistente: ${carpeta}`);
    process.exit(1);
  }

  // 1) Archivos de la carpeta
  const archivos = fs
    .readdirSync(carpeta)
    .filter((f) => fs.statSync(path.join(carpeta, f)).isFile())
    .filter((f) => EXT_PERMITIDAS.includes(path.extname(f).toLowerCase()));

  if (!archivos.length) {
    console.error("No hay imagenes validas en la carpeta.");
    process.exit(1);
  }

  // 2) Alojamientos existentes y mapa por titulo normalizado
  const { data: alojamientos, error } = await supabase
    .from("alojamientos")
    .select("id, titulo")
    .order("id");
  if (error) {
    console.error("Error consultando alojamientos:", error.message);
    process.exit(1);
  }

  const porTitulo = new Map();
  for (const a of alojamientos) porTitulo.set(normalizar(a.titulo), a);

  // 3) Agrupar archivos por titulo y matchear
  const grupos = new Map(); // tituloNormalizado -> [{archivo, secuencia}]
  const sinMatch = [];
  for (const archivo of archivos) {
    const { tituloBase, secuencia } = parsearNombre(archivo);
    const clave = normalizar(tituloBase);
    if (!porTitulo.has(clave)) {
      sinMatch.push(archivo);
      continue;
    }
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push({ archivo, secuencia });
  }

  console.log(`\nArchivos encontrados: ${archivos.length}`);
  if (sinMatch.length) {
    console.log("\nSIN MATCH (se omiten):");
    sinMatch.forEach((f) => console.log(`  ? ${f}`));
  }

  // 4) Cargar orden actual de cada alojamiento y procesar
  let totalOk = 0;
  let totalError = 0;

  const claves = [...grupos.keys()].sort();
  let omitidasPorFiltro = 0;
  for (const clave of claves) {
    const aloj = porTitulo.get(clave);
    if (soloIds && !soloIds.has(aloj.id)) {
      omitidasPorFiltro += grupos.get(clave).length;
      continue;
    }
    const items = grupos.get(clave).sort((a, b) => a.secuencia - b.secuencia);

    console.log(`\n=== [${aloj.id}] ${aloj.titulo} (${items.length} foto/s) ===`);

    // Continuar el orden a partir de la ultima imagen existente
    const { data: existing } = await supabase
      .from("imagenes_alojamiento")
      .select("orden")
      .eq("alojamiento_id", aloj.id)
      .order("orden", { ascending: false })
      .limit(1);
    let orden = existing && existing.length ? existing[0].orden + 1 : 0;

    for (const item of items) {
      const ruta = path.join(carpeta, item.archivo);
      const stat = fs.statSync(ruta);
      if (stat.size > MAX_SIZE) {
        console.error(`  X ${item.archivo} supera 5MB. Se omite.`);
        totalError++;
        continue;
      }

      const ext = path.extname(item.archivo).slice(1).toLowerCase();
      const storagePath = `aloj-${aloj.id}/${Date.now()}_${orden}.${ext}`;

      if (dryRun) {
        console.log(`  [dry-run] ${item.archivo} -> ${storagePath} (orden ${orden})`);
        orden++;
        totalOk++;
        continue;
      }

      const buffer = fs.readFileSync(ruta);
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: MIME[ext] });

      if (upErr) {
        console.error(`  X Error subiendo ${item.archivo}: ${upErr.message}`);
        totalError++;
        continue;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      const { error: dbErr } = await supabase.from("imagenes_alojamiento").insert({
        alojamiento_id: Number(aloj.id),
        url: urlData.publicUrl,
        orden,
      });

      if (dbErr) {
        console.error(`  X Error insertando en DB ${item.archivo}: ${dbErr.message}`);
        totalError++;
        continue;
      }

      console.log(`  OK ${item.archivo} (orden ${orden})`);
      orden++;
      totalOk++;
    }
  }

  console.log(
    `\nListo. Imagenes ${dryRun ? "simuladas" : "subidas"}: ${totalOk}. Errores/omitidas: ${totalError}.` +
      (omitidasPorFiltro ? ` (filtradas por --ids: ${omitidasPorFiltro})` : "")
  );
  if (dryRun) console.log("(dry-run: no se escribio nada)");
}

main().catch((err) => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
