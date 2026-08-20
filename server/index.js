const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const supabase = require("./config/supabase");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Servir archivos est├íticos del frontend
app.use(express.static(path.join(__dirname, "..")));

// Multer: recibir archivos en bufferÕåàÕ¡ÿ (no disco local)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ============================================================
// Helpers
// ============================================================

// F├│rmula Haversine: distancia en km entre dos coordenadas
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Iniciales a partir del nombre completo
function iniciales(nombre) {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  return partes[0][0].toUpperCase();
}

// Mapping de gradientes para propiedades (mismos que el frontend)
const IMGS = {
  1: "linear-gradient(135deg,#8b5cf6,#4c1d95)",
  2: "linear-gradient(135deg,#3b82f6,#1e40af)",
  3: "linear-gradient(135deg,#f59e0b,#b45309)",
  4: "linear-gradient(135deg,#10b981,#047857)",
  5: "linear-gradient(135deg,#ec4899,#831843)",
  6: "linear-gradient(135deg,#06b6d4,#155e75)",
  7: "linear-gradient(135deg,#f97316,#7c2d12)",
  8: "linear-gradient(135deg,#6366f1,#312e81)",
  9: "linear-gradient(135deg,#14b8a6,#115e59)",
  10: "linear-gradient(135deg,#a855f7,#581c87)",
  11: "linear-gradient(135deg,#f43f5e,#9f1239)",
  12: "linear-gradient(135deg,#64748b,#1e293b)"
};

// Mapping de emojis por tipo de veh├¡culo
const EMOJIS_VEHICULO = {
  "Camioneta": "\u{1F6FB}",
  "Cami├│n peque├▒o": "\u{1F4E6}",
  "Cami├│n mediano": "\u{1F69B}",
  "Cami├│n grande": "\u{1F69A}"
};

// Mapping de gradientes para fletes
const IMGS_FLETES = {
  "Camioneta": "linear-gradient(135deg,#06b6d4,#155e75)",
  "Cami├│n peque├▒o": "linear-gradient(135deg,#6366f1,#312e81)",
  "Cami├│n mediano": "linear-gradient(135deg,#f97316,#7c2d12)",
  "Cami├│n grande": "linear-gradient(135deg,#10b981,#047857)"
};

// ============================================================
// Transformar datos de Supabase al formato del frontend
// ============================================================

function transformAlojamiento(row) {
  const caracteristicas = (row.alojamiento_caracteristicas || [])
    .map(ac => ac.caracteristicas?.nombre)
    .filter(Boolean);

  const wifi = caracteristicas.includes("WiFi");
  const amoblado = caracteristicas.includes("Amoblado");
  const cochera = caracteristicas.includes("Cochera");

  // Obtener universidad asociada (del JOIN)
  const uniRel = (row.alojamiento_universidades || [])[0];
  const uniNombre = uniRel?.universidades?.nombre || "";

  // Calcular distancia usando coordenadas del JOIN directamente
  let dist = 0;
  const uniLat = uniRel?.universidades?.latitud;
  const uniLon = uniRel?.universidades?.longitud;
  if (row.latitud && row.longitud && uniLat && uniLon) {
    dist = haversine(row.latitud, row.longitud, uniLat, uniLon);
    dist = Math.round(dist * 10) / 10;
  }

  const prop = row.proveedores || {};

  return {
    id: row.id,
    proveedor_id: row.proveedor_id,
    nombre: row.titulo,
    tipo: (row.tipos_alojamiento?.nombre || "").toLowerCase(),
    precio: Number(row.precio_mensual),
    barrio: row.barrios?.nombre || "",
    dist,
    uni: uniNombre,
    habs: row.habitaciones,
    banos: row.banos,
    wifi,
    amoblado,
    cochera,
    servicios: caracteristicas,
    img: IMGS[row.id] || "linear-gradient(135deg,#8b5cf6,#4c1d95)",
    imgs: (row.imagenes_alojamiento || [])
      .sort((a, b) => a.orden - b.orden)
      .map(img => img.url),
    lat: row.latitud || null,
    lng: row.longitud || null,
    propietario: prop.nombre_comercial || "",
    propAv: iniciales(prop.nombre_comercial),
    tel: prop.telefono || "",
    email: prop.email || "",
    whatsapp: prop.whatsapp || "",
    desc: row.descripcion || ""
  };
}

function transformFlete(row) {
  const tipoVehiculo = row.proveedor_vehiculos?.[0]?.tipos_vehiculo?.nombre || "";
  return {
    id: row.id,
    nombre: row.nombre_comercial,
    tipo: tipoVehiculo,
    rating: row.rating || 0,
    cobertura: row.cobertura || "",
    img: IMGS_FLETES[tipoVehiculo] || "linear-gradient(135deg,#f97316,#7c2d12)",
    emoji: EMOJIS_VEHICULO[tipoVehiculo] || "\u{1F69B}",
    telefono: row.telefono || "",
    email: row.email || "",
    whatsapp: row.whatsapp || ""
  };
}

// ============================================================
// Endpoints
// ============================================================

// GET /api/alojamientos ÔÇö lista completa con JOINs
app.get("/api/alojamientos", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alojamientos")
      .select(`
        *,
        barrios (nombre),
        tipos_alojamiento (nombre),
        proveedores (nombre_comercial, telefono, email, whatsapp, descripcion),
        alojamiento_caracteristicas (caracteristicas (nombre)),
        alojamiento_universidades (universidades (nombre, latitud, longitud)),
        imagenes_alojamiento (id, url, orden)
      `)
      .eq("estado", "disponible")
      .order("id");

    if (error) throw error;

    const result = data.map(row => transformAlojamiento(row));
    res.json(result);
  } catch (err) {
    console.error("Error GET /api/alojamientos:", err.message);
    res.status(500).json({ error: "Error al obtener alojamientos" });
  }
});

// GET /api/alojamientos/:id ÔÇö detalle individual
app.get("/api/alojamientos/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alojamientos")
      .select(`
        *,
        barrios (nombre),
        tipos_alojamiento (nombre),
        proveedores (nombre_comercial, telefono, email, whatsapp, descripcion),
        alojamiento_caracteristicas (caracteristicas (nombre)),
        alojamiento_universidades (universidades (nombre, latitud, longitud)),
        imagenes_alojamiento (id, url, orden)
      `)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Alojamiento no encontrado" });

    res.json(transformAlojamiento(data));
  } catch (err) {
    console.error("Error GET /api/alojamientos/:id:", err.message);
    res.status(500).json({ error: "Error al obtener alojamiento" });
  }
});

// GET /api/fletes ÔÇö transportistas con info de veh├¡culo
app.get("/api/fletes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("proveedores")
      .select(`
        id, nombre_comercial, telefono, email, whatsapp, descripcion, rating, cobertura,
        proveedor_vehiculos (tipos_vehiculo (nombre))
      `)
      .eq("tipo_proveedor_id", 3)
      .order("id");

    if (error) throw error;

    const result = data.map(transformFlete);
    res.json(result);
  } catch (err) {
    console.error("Error GET /api/fletes:", err.message);
    res.status(500).json({ error: "Error al obtener fletes" });
  }
});

// GET /api/fletes/:id ÔÇö detalle de un flete
app.get("/api/fletes/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("proveedores")
      .select(`
        id, nombre_comercial, telefono, email, whatsapp, descripcion, rating, cobertura,
        proveedor_vehiculos (tipos_vehiculo (nombre))
      `)
      .eq("id", req.params.id)
      .eq("tipo_proveedor_id", 3)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Flete no encontrado" });

    res.json(transformFlete(data));
  } catch (err) {
    console.error("Error GET /api/fletes/:id:", err.message);
    res.status(500).json({ error: "Error al obtener flete" });
  }
});

// GET /api/referencias ÔÇö datos de tablas de referencia
app.get("/api/referencias", async (req, res) => {
  try {
    const [barrios, universidades, tiposAlojamiento, caracteristicas, tiposProveedor, tiposVehiculo] = await Promise.all([
      supabase.from("barrios").select("id, nombre").order("id"),
      supabase.from("universidades").select("id, nombre, latitud, longitud").order("id"),
      supabase.from("tipos_alojamiento").select("id, nombre").order("id"),
      supabase.from("caracteristicas").select("id, nombre").order("id"),
      supabase.from("tipos_proveedor").select("id, nombre").order("id"),
      supabase.from("tipos_vehiculo").select("id, nombre").order("id")
    ]);

    res.json({
      barrios: barrios.data || [],
      universidades: universidades.data || [],
      tipos_alojamiento: tiposAlojamiento.data || [],
      caracteristicas: caracteristicas.data || [],
      tipos_proveedor: tiposProveedor.data || [],
      tipos_vehiculo: tiposVehiculo.data || []
    });
  } catch (err) {
    console.error("Error GET /api/referencias:", err.message);
    res.status(500).json({ error: "Error al obtener referencias" });
  }
});

// GET /api/tipos-vehiculo ÔÇö tipos de veh├¡culo para select
app.get("/api/tipos-vehiculo", async (req, res) => {
  try {
    const { data, error } = await supabase.from("tipos_vehiculo").select("id, nombre").order("id");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error GET /api/tipos-vehiculo:", err.message);
    res.status(500).json({ error: "Error al obtener tipos de veh├¡culo" });
  }
});

// POST /api/contacto ÔÇö guardar solicitud de mudanza
app.post("/api/contacto", async (req, res) => {
  const { nombre, telefono, email, origen, destino, tamano, fecha, observaciones, flete_id } = req.body;

  if (!nombre || !telefono || !origen || !destino) {
    return res.status(400).json({ error: "Faltan campos obligatorios: nombre, telefono, origen, destino" });
  }

  try {
    const { data, error } = await supabase
      .from("solicitudes_mudanza")
      .insert({
        nombre_contacto: nombre,
        telefono,
        email: email || null,
        origen,
        destino,
        tamano: tamano || null,
        fecha_mudanza: fecha || null,
        observaciones: observaciones || null,
        proveedor_id: flete_id || null,
        estado: "pendiente"
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ok: true, contacto: data });
  } catch (err) {
    console.error("Error POST /api/contacto:", err.message);
    res.status(500).json({ error: "Error al guardar contacto" });
  }
});

// ============================================================
// Proveedores ÔÇö login y CRUD
// ============================================================

// POST /api/proveedores/login ÔÇö buscar o crear proveedor por email
app.post("/api/proveedores/login", async (req, res) => {
  const { nombre, tipo, email, telefono } = req.body;

  if (!nombre || !tipo || !email || !telefono) {
    return res.status(400).json({ error: "Faltan campos obligatorios: nombre, tipo, email, telefono" });
  }

  try {
    // Buscar si ya existe un proveedor con ese email
    let { data: proveedor, error } = await supabase
      .from("proveedores")
      .select("id, nombre_comercial, email, telefono, whatsapp, tipo_proveedor_id")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (proveedor) {
      // Actualizar datos por si cambiaron
      await supabase
        .from("proveedores")
        .update({ nombre_comercial: nombre, telefono, whatsapp: telefono })
        .eq("id", proveedor.id);
      proveedor.nombre_comercial = nombre;
      proveedor.telefono = telefono;
      proveedor.whatsapp = telefono;
      return res.json({ ...proveedor, tipo });
    }

    // Buscar tipo_proveedor_id
    const { data: tipos } = await supabase
      .from("tipos_proveedor")
      .select("id")
      .eq("nombre", tipo)
      .single();

    const tipoProveedorId = tipos?.id || 1;

    // Crear nuevo proveedor
    const { data: nuevo, error: insertError } = await supabase
      .from("proveedores")
      .insert({
        nombre_comercial: nombre,
        email,
        telefono,
        whatsapp: telefono,
        tipo_proveedor_id: tipoProveedorId,
        rating: 0,
        cobertura: "",
        descripcion: ""
      })
      .select("id, nombre_comercial, email, telefono, whatsapp, tipo_proveedor_id")
      .single();

    if (insertError) throw insertError;
    res.status(201).json({ ...nuevo, tipo });
  } catch (err) {
    console.error("Error POST /api/proveedores/login:", err.message);
    res.status(500).json({ error: "Error al iniciar sesi├│n" });
  }
});

// GET /api/proveedores/:id/alojamientos ÔÇö alojamientos de un proveedor
app.get("/api/proveedores/:id/alojamientos", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alojamientos")
      .select(`
        *,
        barrios (nombre),
        tipos_alojamiento (nombre),
        alojamiento_caracteristicas (caracteristicas (nombre)),
        alojamiento_universidades (universidades (nombre, latitud, longitud))
      `)
      .eq("proveedor_id", req.params.id)
      .order("id");

    if (error) throw error;

    const result = data.map(row => {
      const ac = (row.alojamiento_caracteristicas || []).map(x => x.caracteristicas?.nombre).filter(Boolean);
      const uniRel = (row.alojamiento_universidades || [])[0];
      const uniNombre = uniRel?.universidades?.nombre || "";
      let dist = 0;
      if (row.latitud && row.longitud && uniRel?.universidades?.latitud && uniRel?.universidades?.longitud) {
        dist = haversine(row.latitud, row.longitud, uniRel.universidades.latitud, uniRel.universidades.longitud);
        dist = Math.round(dist * 10) / 10;
      }
      return {
        id: row.id,
        nombre: row.titulo,
        tipo: (row.tipos_alojamiento?.nombre || "").toLowerCase(),
        precio: Number(row.precio_mensual),
        barrio: row.barrios?.nombre || "",
        dist,
        uni: uniNombre,
        habs: row.habitaciones,
        banos: row.banos,
        wifi: ac.includes("WiFi"),
        amoblado: ac.includes("Amoblado"),
        cochera: ac.includes("Cochera"),
        servicios: ac,
        img: IMGS[row.id] || "linear-gradient(135deg,#8b5cf6,#4c1d95)",
        desc: row.descripcion || ""
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error GET /api/proveedores/:id/alojamientos:", err.message);
    res.status(500).json({ error: "Error al obtener alojamientos del proveedor" });
  }
});

// POST /api/alojamientos ÔÇö crear alojamiento
app.post("/api/alojamientos", async (req, res) => {
  const { proveedor_id, titulo, tipo, precio_mensual, barrio, habitaciones, banos, descripcion, latitud, longitud, wifi, amoblado, cochera, balcon, calefaccion, aire, parrilla, universidad } = req.body;

  if (!proveedor_id || !titulo || !precio_mensual) {
    return res.status(400).json({ error: "Faltan campos obligatorios: proveedor_id, titulo, precio_mensual" });
  }

  try {
    // Resolver barrio_id
    let barrioId = null;
    if (barrio) {
      const { data: b } = await supabase.from("barrios").select("id").eq("nombre", barrio).single();
      barrioId = b?.id || null;
    }

    // Resolver tipos_alojamiento_id
    let tipoId = null;
    if (tipo) {
      const { data: t } = await supabase.from("tipos_alojamiento").select("id").ilike("nombre", tipo).single();
      tipoId = t?.id || null;
    }

    // Usar coordenadas reales del frontend, o placeholder si no se proveen
    const lat = latitud ? Number(latitud) : (-29.41 + (Math.random() * 0.04 - 0.02));
    const lng = longitud ? Number(longitud) : (-66.85 + (Math.random() * 0.04 - 0.02));

    // Insertar alojamiento
    const { data: aloj, error } = await supabase
      .from("alojamientos")
      .insert({
        titulo,
        precio_mensual,
        barrio_id: barrioId,
        tipo_alojamiento_id: tipoId,
        habitaciones: habitaciones || 1,
        banos: banos || 1,
        descripcion: descripcion || "",
        latitud: lat,
        longitud: lng,
        estado: "disponible",
        proveedor_id
      })
      .select("id")
      .single();

    if (error) throw error;

    // Asociar universidad
    if (universidad) {
      const { data: u } = await supabase.from("universidades").select("id").eq("nombre", universidad).single();
      if (u) {
        await supabase.from("alojamiento_universidades").insert({ alojamiento_id: aloj.id, universidad_id: u.id });
      }
    }

    // Asociar caracter├¡sticas (crear si no existen)
    const caracteristicasNuevas = [];
    if (wifi) caracteristicasNuevas.push("WiFi");
    if (amoblado) caracteristicasNuevas.push("Amoblado");
    if (cochera) caracteristicasNuevas.push("Cochera");
    if (balcon) caracteristicasNuevas.push("Balc├│n");
    if (calefaccion) caracteristicasNuevas.push("Calefacci├│n");
    if (aire) caracteristicasNuevas.push("Aire acondicionado");
    if (parrilla) caracteristicasNuevas.push("Parrilla");

    for (const nombre of caracteristicasNuevas) {
      // Buscar si ya existe
      let { data: c } = await supabase.from("caracteristicas").select("id").eq("nombre", nombre).single();
      // Si no existe, crearla
      if (!c) {
        const { data: nueva } = await supabase.from("caracteristicas").insert({ nombre }).select("id").single();
        c = nueva;
      }
      if (c) {
        await supabase.from("alojamiento_caracteristicas").insert({ alojamiento_id: aloj.id, caracteristica_id: c.id });
      }
    }

    res.status(201).json({ ok: true, id: aloj.id });
  } catch (err) {
    console.error("Error POST /api/alojamientos:", err.message);
    res.status(500).json({ error: "Error al crear alojamiento" });
  }
});

// PUT /api/alojamientos/:id ÔÇö editar alojamiento
app.put("/api/alojamientos/:id", async (req, res) => {
  const { titulo, tipo, precio_mensual, barrio, habitaciones, banos, descripcion, wifi, amoblado, cochera, universidad } = req.body;
  const id = req.params.id;

  try {
    // Resolver barrio_id
    let barrioId = null;
    if (barrio) {
      const { data: b } = await supabase.from("barrios").select("id").eq("nombre", barrio).single();
      barrioId = b?.id || null;
    }

    // Resolver tipos_alojamiento_id
    let tipoId = null;
    if (tipo) {
      const { data: t } = await supabase.from("tipos_alojamiento").select("id").ilike("nombre", tipo).single();
      tipoId = t?.id || null;
    }

    // Actualizar alojamiento
    const { error } = await supabase
      .from("alojamientos")
      .update({
        titulo,
        precio_mensual,
        barrio_id: barrioId,
        tipo_alojamiento_id: tipoId,
        habitaciones: habitaciones || 1,
        banos: banos || 1,
        descripcion: descripcion || ""
      })
      .eq("id", id);

    if (error) throw error;

    // Sincronizar universidad
    await supabase.from("alojamiento_universidades").delete().eq("alojamiento_id", id);
    if (universidad) {
      const { data: u } = await supabase.from("universidades").select("id").eq("nombre", universidad).single();
      if (u) {
        await supabase.from("alojamiento_universidades").insert({ alojamiento_id: id, universidad_id: u.id });
      }
    }

    // Sincronizar caracter├¡sticas
    await supabase.from("alojamiento_caracteristicas").delete().eq("alojamiento_id", id);
    const caracteristicas = [];
    if (wifi) caracteristicas.push("WiFi");
    if (amoblado) caracteristicas.push("Amoblado");
    if (cochera) caracteristicas.push("Cochera");

    for (const nombre of caracteristicas) {
      const { data: c } = await supabase.from("caracteristicas").select("id").eq("nombre", nombre).single();
      if (c) {
        await supabase.from("alojamiento_caracteristicas").insert({ alojamiento_id: id, caracteristica_id: c.id });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error PUT /api/alojamientos/:id:", err.message);
    res.status(500).json({ error: "Error al actualizar alojamiento" });
  }
});

// DELETE /api/alojamientos/:id ÔÇö eliminar alojamiento
app.delete("/api/alojamientos/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await supabase.from("alojamiento_caracteristicas").delete().eq("alojamiento_id", id);
    await supabase.from("alojamiento_universidades").delete().eq("alojamiento_id", id);

    // Eliminar im├ígenes de Storage antes de borrar registros
    const { data: imgs } = await supabase.from("imagenes_alojamiento").select("url").eq("alojamiento_id", id);
    if (imgs && imgs.length) {
      const paths = imgs.map(i => i.url.split("/").slice(-2).join("/"));
      await supabase.storage.from("alojamiento-imagenes").remove(paths);
    }
    await supabase.from("imagenes_alojamiento").delete().eq("alojamiento_id", id);

    const { error } = await supabase.from("alojamientos").delete().eq("id", id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /api/alojamientos/:id:", err.message);
    res.status(500).json({ error: "Error al eliminar alojamiento" });
  }
});

// ============================================================
// Im├ígenes ÔÇö Upload a Supabase Storage + referencia en DB
// ============================================================

// POST /api/alojamientos/:id/imagenes ÔÇö subir im├ígenes
app.post("/api/alojamientos/:id/imagenes", upload.array("fotos", 10), async (req, res) => {
  const alojamientoId = req.params.id;
  const files = req.files;

  if (!files || !files.length) {
    return res.status(400).json({ error: "No se enviaron archivos" });
  }

  try {
    // Verificar que el alojamiento existe
    const { data: aloj } = await supabase.from("alojamientos").select("id").eq("id", alojamientoId).single();
    if (!aloj) return res.status(404).json({ error: "Alojamiento no encontrado" });

    // Obtener el orden m├íximo actual
    const { data: existing } = await supabase
      .from("imagenes_alojamiento")
      .select("orden")
      .eq("alojamiento_id", alojamientoId)
      .order("orden", { ascending: false })
      .limit(1);
    let nextOrden = existing && existing.length ? existing[0].orden + 1 : 0;

    const uploaded = [];

    for (const file of files) {
      const ext = file.originalname.split(".").pop() || "jpg";
      const filePath = `aloj-${alojamientoId}/${Date.now()}_${nextOrden}.${ext}`;

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("alojamiento-imagenes")
        .upload(filePath, file.buffer, { contentType: file.mimetype });

      if (uploadError) {
        console.error("Error subiendo a Storage:", uploadError.message);
        continue;
      }

      // Obtener URL p├║blica
      const { data: urlData } = supabase.storage
        .from("alojamiento-imagenes")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Insertar referencia en DB
      const { data: imgRecord, error: dbError } = await supabase
        .from("imagenes_alojamiento")
        .insert({
          alojamiento_id: alojamientoId,
          url: publicUrl,
          orden: nextOrden
        })
        .select("id, url, orden")
        .single();

      if (dbError) {
        console.error("Error insertando en DB:", dbError.message);
        continue;
      }

      uploaded.push(imgRecord);
      nextOrden++;
    }

    res.status(201).json({ ok: true, imagenes: uploaded });
  } catch (err) {
    console.error("Error POST /api/alojamientos/:id/imagenes:", err.message);
    res.status(500).json({ error: "Error al subir im├ígenes" });
  }
});

// DELETE /api/imagenes/:imagenId ÔÇö eliminar una imagen
app.delete("/api/imagenes/:imagenId", async (req, res) => {
  const imagenId = req.params.imagenId;

  try {
    // Obtener la imagen para extraer el path del Storage
    const { data: img } = await supabase
      .from("imagenes_alojamiento")
      .select("url, alojamiento_id")
      .eq("id", imagenId)
      .single();

    if (!img) return res.status(404).json({ error: "Imagen no encontrada" });

    // Extraer path relativo del Storage desde la URL p├║blica
    const urlParts = img.url.split("/alojamiento-imagenes/");
    const storagePath = urlParts[1] || img.url.split("/").slice(-2).join("/");

    // Eliminar de Storage
    await supabase.storage.from("alojamiento-imagenes").remove([storagePath]);

    // Eliminar de DB
    const { error } = await supabase.from("imagenes_alojamiento").delete().eq("id", imagenId);
    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /api/imagenes/:imagenId:", err.message);
    res.status(500).json({ error: "Error al eliminar imagen" });
  }
});

// ============================================================
// Fletes (transporte) ÔÇö CRUD
// ============================================================

// GET /api/proveedores/:id/fletes ÔÇö servicios de transporte de un proveedor
app.get("/api/proveedores/:id/fletes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("proveedores")
      .select(`
        id, nombre_comercial, telefono, email, whatsapp, descripcion, rating, cobertura,
        proveedor_vehiculos (tipos_vehiculo (nombre))
      `)
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Proveedor no encontrado" });

    res.json([transformFlete(data)]);
  } catch (err) {
    console.error("Error GET /api/proveedores/:id/fletes:", err.message);
    res.status(500).json({ error: "Error al obtener fletes del proveedor" });
  }
});

// POST /api/fletes ÔÇö crear servicio de transporte
app.post("/api/fletes", async (req, res) => {
  const { proveedor_id, nombre_comercial, tipo_vehiculo, cobertura, telefono, email, whatsapp } = req.body;

  if (!proveedor_id || !nombre_comercial) {
    return res.status(400).json({ error: "Faltan campos obligatorios: proveedor_id, nombre_comercial" });
  }

  try {
    // Actualizar datos del proveedor
    await supabase
      .from("proveedores")
      .update({ nombre_comercial, cobertura: cobertura || "", telefono, email, whatsapp })
      .eq("id", proveedor_id);

    // Resolver tipo_vehiculo_id
    if (tipo_vehiculo) {
      const { data: tv } = await supabase.from("tipos_vehiculo").select("id").eq("nombre", tipo_vehiculo).single();
      if (tv) {
        // Verificar si ya tiene veh├¡culo
        const { data: existing } = await supabase
          .from("proveedor_vehiculos")
          .select("id")
          .eq("proveedor_id", proveedor_id)
          .single();

        if (existing) {
          await supabase
            .from("proveedor_vehiculos")
            .update({ tipo_vehiculo_id: tv.id })
            .eq("proveedor_id", proveedor_id);
        } else {
          await supabase
            .from("proveedor_vehiculos")
            .insert({ proveedor_id, tipo_vehiculo_id: tv.id });
        }
      }
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Error POST /api/fletes:", err.message);
    res.status(500).json({ error: "Error al crear servicio de transporte" });
  }
});

// PUT /api/fletes/:id ÔÇö editar servicio de transporte
app.put("/api/fletes/:id", async (req, res) => {
  const { nombre_comercial, tipo_vehiculo, cobertura, telefono, email, whatsapp } = req.body;
  const id = req.params.id;

  try {
    // Actualizar datos del proveedor
    const { error } = await supabase
      .from("proveedores")
      .update({ nombre_comercial, cobertura: cobertura || "", telefono, email, whatsapp })
      .eq("id", id);

    if (error) throw error;

    // Actualizar tipo de veh├¡culo
    if (tipo_vehiculo) {
      const { data: tv } = await supabase.from("tipos_vehiculo").select("id").eq("nombre", tipo_vehiculo).single();
      if (tv) {
        const { data: existing } = await supabase
          .from("proveedor_vehiculos")
          .select("id")
          .eq("proveedor_id", id)
          .single();

        if (existing) {
          await supabase
            .from("proveedor_vehiculos")
            .update({ tipo_vehiculo_id: tv.id })
            .eq("proveedor_id", id);
        } else {
          await supabase
            .from("proveedor_vehiculos")
            .insert({ proveedor_id: id, tipo_vehiculo_id: tv.id });
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error PUT /api/fletes/:id:", err.message);
    res.status(500).json({ error: "Error al actualizar servicio de transporte" });
  }
});

// DELETE /api/fletes/:id ÔÇö eliminar servicio de transporte
app.delete("/api/fletes/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await supabase.from("proveedor_vehiculos").delete().eq("proveedor_id", id);
    await supabase.from("proveedores").delete().eq("id", id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /api/fletes/:id:", err.message);
    res.status(500).json({ error: "Error al eliminar servicio de transporte" });
  }
});

// ============================================================
// Vistas y estad├¡sticas
// ============================================================

// POST /api/vistas ÔÇö registrar una vista
app.post("/api/vistas", async (req, res) => {
  const { proveedor_id, alojamiento_id, flete_id } = req.body;
  if (!proveedor_id) {
    return res.status(400).json({ error: "Falta proveedor_id" });
  }
  try {
    const { error } = await supabase
      .from("registros_vistas")
      .insert({ proveedor_id, alojamiento_id: alojamiento_id || null, flete_id: flete_id || null });
    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Error POST /api/vistas:", err.message);
    res.status(500).json({ error: "Error al registrar vista" });
  }
});

// GET /api/proveedores/:id/stats ÔÇö estad├¡sticas reales del proveedor
app.get("/api/proveedores/:id/stats", async (req, res) => {
  const id = req.params.id;
  try {
    // Contactos: contar solicitudes_mudanza donde el flete pertenece al proveedor
    const { count: contactos } = await supabase
      .from("solicitudes_mudanza")
      .select("id", { count: "exact", head: true })
      .eq("proveedor_id", id);

    // Vistas: contar registros_vistas donde el proveedor Due├▒o
    const { count: vistasPropias } = await supabase
      .from("registros_vistas")
      .select("id", { count: "exact", head: true })
      .eq("proveedor_id", id);

    // Vistas de sus alojamientos
    const { data: alojs } = await supabase
      .from("alojamientos")
      .select("id")
      .eq("proveedor_id", id);
    const alojIds = (alojs || []).map(a => a.id);

    let vistasAloj = 0;
    if (alojIds.length) {
      const { count } = await supabase
        .from("registros_vistas")
        .select("id", { count: "exact", head: true })
        .in("alojamiento_id", alojIds);
      vistasAloj = count || 0;
    }

    res.json({
      vistas: (vistasPropias || 0) + vistasAloj,
      contactos: contactos || 0
    });
  } catch (err) {
    console.error("Error GET /api/proveedores/:id/stats:", err.message);
    res.status(500).json({ error: "Error al obtener estad├¡sticas" });
  }
});

// ============================================================
// Iniciar
// ============================================================

app.listen(PORT, () => {
  console.log(`ForanIA backend corriendo en http://localhost:${PORT}`);
});
