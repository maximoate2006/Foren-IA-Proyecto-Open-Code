/**
 * ============================================================
 * ForanIA — Asignar alojamientos a un proveedor demo
 * ============================================================
 * Las propiedades cargadas manualmente apuntan a proveedores
 * sembrados (IDs 1-12) cuyas credenciales nadie conoce, por lo
 * que no son editables desde el panel.
 *
 * Este script asocia UNICAMENTE los alojamientos que se
 * indican, uno por uno y de forma explícita, al proveedor que
 * corresponda a un email dado (lo busca; si no existe, lo crea,
 * igual que hace POST /api/proveedores/login).
 *
 * USO:
 *   1) Simular (no escribe nada):
 *        node scripts/asignar-proveedor-demo.js --email tu@email.com --ids 1,3,5
 *
 *   2) Aplicar:
 *        node scripts/asignar-proveedor-demo.js --email tu@email.com --ids 1,3,5 --confirm
 *
 * NOTAS:
 *   - Nunca borra alojamientos ni cambia otros campos.
 *   - Solo toca proveedor_id de los IDs listados.
 *   - Sin --confirm no modifica nada.
 * ============================================================
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const supabase = require("../config/supabase");

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes("--confirm");
  const email = (args.find(a => a.startsWith("--email")) || "").split("=")[1] || args[args.indexOf("--email") + 1];
  const idsArg = (args.find(a => a.startsWith("--ids")) || "").split("=")[1] || args[args.indexOf("--ids") + 1];

  if (!email || !idsArg || email.startsWith("--") || idsArg.startsWith("--")) {
    console.log("Uso: node scripts/asignar-proveedor-demo.js --email tu@email.com --ids 1,3,5 [--confirm]");
    process.exit(1);
  }

  const ids = idsArg.split(",").map(s => s.trim()).filter(Boolean);
  if (!ids.length) {
    console.error("No se indicaron IDs válidos.");
    process.exit(1);
  }

  // Buscar o crear el proveedor demo (mismo criterio que el login del frontend)
  let { data: proveedor } = await supabase
    .from("proveedores")
    .select("id, nombre_comercial")
    .eq("email", email)
    .single();

  if (!proveedor) {
    console.log(`No existe proveedor con email ${email}.`);
    if (!confirm) {
      console.log("(dry-run) Se crearía un proveedor nuevo al aplicar con --confirm.");
    } else {
      const { data: nuevo, error } = await supabase
        .from("proveedores")
        .insert({
          nombre_comercial: "Proveedor Demo",
          email,
          telefono: "",
          whatsapp: "",
          tipo_proveedor_id: 1,
          rating: 0,
          cobertura: "",
          descripcion: ""
        })
        .select("id, nombre_comercial")
        .single();
      if (error) { console.error("Error creando proveedor:", error.message); process.exit(1); }
      proveedor = nuevo;
      console.log(`Proveedor creado: id ${proveedor.id}`);
    }
  } else {
    console.log(`Proveedor existente: id ${proveedor.id} (${proveedor.nombre_comercial})`);
  }

  // Mostrar plan
  console.log("\nPlan de asignación:");
  for (const id of ids) {
    const { data: aloj } = await supabase
      .from("alojamientos")
      .select("id, titulo, proveedor_id")
      .eq("id", id)
      .single();
    if (!aloj) {
      console.log(`  X Alojamiento ${id}: NO existe. Se omite.`);
      continue;
    }
    console.log(`  ${id} "${aloj.titulo}": proveedor_id ${aloj.proveedor_id} -> ${proveedor ? proveedor.id : "(nuevo)"}`);
  }

  if (!confirm) {
    console.log("\n(dry-run) No se modificó nada. Agregá --confirm para aplicar.");
    return;
  }

  if (!proveedor) {
    console.error("No hay proveedor destino.");
    process.exit(1);
  }

  for (const id of ids) {
    const { error } = await supabase
      .from("alojamientos")
      .update({ proveedor_id: proveedor.id })
      .eq("id", id);
    if (error) console.error(`  X Error en alojamiento ${id}: ${error.message}`);
    else console.log(`  OK Alojamiento ${id} asignado a proveedor ${proveedor.id}`);
  }

  console.log("\nListo. Iniciá sesión en el panel con ese email para editarlas.");
}

main().catch(err => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
