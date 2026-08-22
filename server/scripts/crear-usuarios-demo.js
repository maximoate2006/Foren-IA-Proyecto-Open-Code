// ============================================================
// crea-usuarios-demo.js — Registra las cuentas demo de ForanIA
// por la vía normal de Supabase Auth (signUp) y las deja
// vinculadas a su proveedor.
//
// Uso:  node scripts/crear-usuarios-demo.js
//
// Requiere SUPABASE_URL y SUPABASE_KEY en server/.env
// Contraseña de todas las cuentas: Forania2026*
//
// IMPORTANTE: antes de correr este script hay que ejecutar el
// BLOQUE 1 (LIMPIEZA) de migrations/005_cuentas_demo.sql en el
// SQL Editor de Supabase, para que los emails no aparezcan como
// "ya registrados".
// ============================================================

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error("Faltan SUPABASE_URL o SUPABASE_KEY en .env");
  process.exit(1);
}

const CLAVE = "Forania2026*";
const PAUSA_MS = 1500;

// Los mismos datos que muestra el frontend para cada publicación/flete
const CUENTAS = [
  { proveedor_id: 1,  nombre: "Raúl Castro",             email: "raul.castro@email.com",              telefono: "+54 9 3804 789012" },
  { proveedor_id: 2,  nombre: "Jorge Medina",            email: "jorge.medina@email.com",             telefono: "+54 9 3804 456789" },
  { proveedor_id: 3,  nombre: "Silvia Torres",           email: "silvia.torres@email.com",            telefono: "+54 9 3804 890123" },
  { proveedor_id: 4,  nombre: "Pedro Villafañe",         email: "pedro.villafane@email.com",          telefono: "+54 9 3804 112233" },
  { proveedor_id: 5,  nombre: "Hugo Aguirre",            email: "hugo.aguirre@email.com",             telefono: "+54 9 3804 901234" },
  { proveedor_id: 6,  nombre: "Ana Ríos",                email: "ana.rios@email.com",                 telefono: "+54 9 3804 567890" },
  { proveedor_id: 7,  nombre: "Nora Campos",             email: "nora.campos@email.com",              telefono: "+54 9 3804 445566" },
  { proveedor_id: 8,  nombre: "Carlos Sosa",             email: "carlos.sosa@email.com",              telefono: "+54 9 3804 234567" },
  { proveedor_id: 9,  nombre: "María González",          email: "maria.gonzalez@email.com",           telefono: "+54 9 3804 123456" },
  { proveedor_id: 10, nombre: "Diego Luna",              email: "diego.luna@email.com",               telefono: "+54 9 3804 678901" },
  { proveedor_id: 11, nombre: "Laura Fernández",         email: "laura.fernandez@email.com",          telefono: "+54 9 3804 345678" },
  { proveedor_id: 12, nombre: "Marta López",             email: "marta.lopez@email.com",              telefono: "+54 9 3804 012345" },
  { proveedor_id: 13, nombre: "Mudanzas Rioja Express",  email: "contacto.riojaexpress@email.com",    telefono: "+5493804555001" },
  { proveedor_id: 14, nombre: "Flete Veloz UNLaR",       email: "info.fleteveloz@email.com",          telefono: "+5493804555002" },
  { proveedor_id: 15, nombre: "Transportes Catamarca",   email: "reservas.catamarca@email.com",       telefono: "+5493804555003" },
  { proveedor_id: 16, nombre: "Mudanza Express 24hs",    email: "mudanzaexpress24hs@gmail.com",       telefono: "+5493804555004" },
  { proveedor_id: 25, nombre: "Pedro Antonio Tempestilli", email: "pedroxxantonio991@gmail.com",      telefono: "+54 9 11 70219350" },
];

const supabase = createClient(url, key);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function registrar(cuenta, reintento = 0) {
  const { data, error } = await supabase.auth.signUp({
    email: cuenta.email,
    password: CLAVE,
    options: { data: { nombre: cuenta.nombre } },
  });
  if (
    error &&
    reintento < 3 &&
    (error.status === 429 || /rate|429/i.test(error.message || "") ||
      error.code === "over_request_rate_limit")
  ) {
    const esperaMs = 65000;
    console.log(`     rate-limit, reintento ${reintento + 1} en ${esperaMs / 1000}s ...`);
    await espera(esperaMs);
    return registrar(cuenta, reintento + 1);
  }
  return { data, error };
}

async function procesar(cuenta, i) {
  const tag = `[${String(i + 1).padStart(2, "0")}/${CUENTAS.length}] ${cuenta.email}`;

  // 1) Registro normal (la misma vía que usa la app)
  const { data, error } = await registrar(cuenta);

  let uid = data?.user?.id || null;

  if (error) {
    if (/already|registrad/i.test(error.message)) {
      // Ya existe (re-ejecución): buscamos su id en el perfil público
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("id")
        .ilike("email", cuenta.email)
        .maybeSingle();
      if (!perfil) {
        console.log(`${tag}  YA EXISTE y sin perfil -> se omite (correr BLOQUE 1 y reintentar)`);
        return { ok: false, email: cuenta.email, motivo: "duplicada-sin-perfil" };
      }
      uid = perfil.id;
      console.log(`${tag}  YA EXISTE -> se completa vínculo`);
    } else {
      console.log(`${tag}  ERROR: ${error.message}`);
      return { ok: false, email: cuenta.email, motivo: error.message };
    }
  }

  // 2) Perfil público (INSERT ... ON CONFLICT DO NOTHING)
  const { error: errPerfil } = await supabase
    .from("usuarios")
    .upsert(
      { id: uid, nombre: cuenta.nombre, email: cuenta.email, telefono: cuenta.telefono },
      { onConflict: "id", ignoreDuplicates: true }
    );
  if (errPerfil) {
    console.log(`${tag}  aviso perfil: ${errPerfil.message}`);
  }

  // 3) Vínculo con el proveedor
  const { error: errVinc } = await supabase
    .from("proveedores")
    .update({ usuario_id: uid })
    .eq("id", cuenta.proveedor_id);
  if (errVinc) {
    console.log(`${tag}  aviso vínculo proveedor ${cuenta.proveedor_id}: ${errVinc.message}`);
  }

  console.log(`${tag}  OK (uid ${uid})`);
  return { ok: true, email: cuenta.email };
}

async function main() {
  console.log(`Creando ${CUENTAS.length} cuentas demo en ${url} ...\n`);
  const resultados = [];
  for (let i = 0; i < CUENTAS.length; i++) {
    resultados.push(await procesar(CUENTAS[i], i));
    if (i < CUENTAS.length - 1) await espera(PAUSA_MS);
  }

  const ok = resultados.filter((r) => r.ok);
  const fallo = resultados.filter((r) => !r.ok);
  console.log("\n========== RESUMEN ==========");
  console.log(`OK     : ${ok.length}`);
  console.log(`FALLARON: ${fallo.length}`);
  fallo.forEach((f) => console.log(`  - ${f.email}: ${f.motivo}`));

  if (ok.length > 0) {
    console.log("\nSiguiente paso:");
    console.log("  1. Si el login devuelve 'Email not confirmed', ejecutar el");
    console.log("     BLOQUE 2 (CONFIRMACIÓN) de migrations/005_cuentas_demo.sql.");
    console.log("  2. Probar login con cualquier cuenta, clave: " + CLAVE);
  }
  process.exit(fallo.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Error fatal:", e.message);
  process.exit(1);
});
