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

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, ".."), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".js")) res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    if (filePath.endsWith(".css")) res.setHeader("Content-Type", "text/css; charset=utf-8");
  }
}));

// Multer: recibir archivos en buffer en memoria (no disco local)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ============================================================
// Helpers
// ============================================================

// Fórmula Haversine: distancia en km entre dos coordenadas
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

// Mapping de emojis por tipo de vehículo
const EMOJIS_VEHICULO = {
  "Camioneta": "\u{1F6FB}",
  "Camión pequeño": "\u{1F4E6}",
  "Camión mediano": "\u{1F69B}",
  "Camión grande": "\u{1F69A}"
};

// Mapping de gradientes para fletes
const IMGS_FLETES = {
  "Camioneta": "linear-gradient(135deg,#06b6d4,#155e75)",
  "Camión pequeño": "linear-gradient(135deg,#6366f1,#312e81)",
  "Camión mediano": "linear-gradient(135deg,#f97316,#7c2d12)",
  "Camión grande": "linear-gradient(135deg,#10b981,#047857)"
};

// Normaliza nombres de características: recorta espacios y colapsa repetidos
function normalizarCaracteristica(nombre) {
  return String(nombre || "").trim().replace(/\s+/g, " ");
}

// Resuelve una lista de nombres a registros de la tabla caracteristicas.
// Match case-insensitive para no crear "WiFi", "wifi" y "Wifi" como duplicados.
// Si no existe, la crea. Nunca elimina registros de caracteristicas.
async function resolverCaracteristicas(nombres) {
  const limpios = [...new Set((nombres || []).map(normalizarCaracteristica).filter(Boolean))];
  const { data: todas, error } = await supabase.from("caracteristicas").select("id, nombre");
  if (error) throw error;
  const mapa = new Map((todas || []).map(c => [c.nombre.trim().toLowerCase(), c]));
  const resueltas = [];
  for (const nombre of limpios) {
    let c = mapa.get(nombre.toLowerCase());
    if (!c) {
      const { data: nueva, error: errInsert } = await supabase
        .from("caracteristicas")
        .insert({ nombre })
        .select("id, nombre")
        .single();
      if (errInsert) throw errInsert;
      c = nueva;
      mapa.set(nombre.toLowerCase(), c);
    }
    resueltas.push(c);
  }
  return resueltas;
}

// ============================================================
// Transformar datos de Supabase al formato del frontend
// ============================================================

function transformAlojamiento(row) {
  const caracteristicas = (row.alojamiento_caracteristicas || [])
    .map(ac => ac.caracteristicas?.nombre)
    .filter(Boolean);

  const imagenesOrdenadas = (row.imagenes_alojamiento || [])
    .slice()
    .sort((a, b) => a.orden - b.orden);

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
    imgs: imagenesOrdenadas.map(img => img.url),
    imgIds: imagenesOrdenadas.map(img => img.id),
    lat: row.latitud || null,
    lng: row.longitud || null,
    calle: row.calle || "",
    referencia: row.referencia || "",
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
// Autenticación y autorización
// ============================================================

const MIGRACION_PENDIENTE = "Falta ejecutar las migraciones en el SQL Editor de Supabase.";

// Extrae y valida el JWT del header Authorization. Devuelve el user de auth o null.
async function usuarioDesdeToken(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

// Middleware: exige sesión válida
async function requireAuth(req, res, next) {
  const user = await usuarioDesdeToken(req);
  if (!user) return res.status(401).json({ error: "No autenticado" });
  req.authUser = user;
  next();
}

// Perfil público del usuario (tabla usuarios). null si no existe o falta la migración.
async function perfilUsuario(userId) {
  try {
    const { data, error } = await supabase.from("usuarios").select("*").eq("id", userId).maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// Proveedor vinculado a la cuenta (proveedores.usuario_id)
async function proveedorDelUsuario(userId) {
  try {
    const { data, error } = await supabase
      .from("proveedores")
      .select("id, nombre_comercial, email, telefono, whatsapp, tipo_proveedor_id")
      .eq("usuario_id", userId)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// Asegura la fila en public.usuarios para un user de auth.
// Además vincula automáticamente un proveedor legacy con el mismo email sin dueño
// (ej: cuentas creadas con el login viejo por email).
async function asegurarPerfil(authUser) {
  let perfil = await perfilUsuario(authUser.id);
  if (!perfil) {
    const nombre = authUser.user_metadata?.nombre || (authUser.email || "").split("@")[0];
    const tel = authUser.user_metadata?.telefono || null;
    try {
      const { data } = await supabase
        .from("usuarios")
        .upsert({ id: authUser.id, nombre, email: authUser.email, telefono: tel }, { onConflict: "id" })
        .select("*").single();
      perfil = data || { id: authUser.id, nombre, email: authUser.email, telefono: tel };
    } catch {
      // Sin migración 004 todavía: seguimos con datos del token
      perfil = { id: authUser.id, nombre, email: authUser.email, telefono: tel };
    }
  }
  return perfil;
}

// Verifica que el alojamiento pertenezca a un proveedor del usuario logueado
async function esDueñoDeAlojamiento(userId, alojamientoId) {
  try {
    const { data: aloj, error } = await supabase
      .from("alojamientos")
      .select("proveedor_id")
      .eq("id", alojamientoId)
      .single();
    if (error || !aloj?.proveedor_id) return false;
    const prov = await proveedorDelUsuario(userId);
    return !!prov && prov.id === aloj.proveedor_id;
  } catch {
    return false;
  }
}

// ============================================================
// Endpoints
// ============================================================

// ---------- Autenticación ----------

// POST /api/auth/registrar — crear cuenta (email + contraseña)
app.post("/api/auth/registrar", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios: nombre, email, password" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "El email no tiene un formato válido" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    });

    if (error) {
      const msg = /already registered|already exists/i.test(error.message)
        ? "Ya existe una cuenta con ese email"
        : error.message;
      return res.status(400).json({ error: msg });
    }

    // Perfil público en la tabla usuarios (best-effort; requiere migración 004)
    let perfil = null;
    if (data?.user) perfil = await asegurarPerfil(data.user);

    if (!data.session) {
      return res.status(201).json({
        requiereConfirmacion: true,
        mensaje: "Cuenta creada. Revisá tu email para confirmar el registro."
      });
    }

    res.status(201).json({
      requiereConfirmacion: false,
      usuario: { id: data.user.id, nombre: perfil?.nombre || nombre, email: data.user.email },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (err) {
    console.error("Error POST /api/auth/registrar:", err.message);
    res.status(500).json({ error: "Error al registrar la cuenta" });
  }
});

// POST /api/auth/login — iniciar sesión
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios: email, password" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = /not confirmed/i.test(error.message)
        ? "Tu email aún no está confirmado. Revisá tu casilla."
        : "Email o contraseña incorrectos";
      return res.status(401).json({ error: msg });
    }

    const perfil = await asegurarPerfil(data.user);

    res.json({
      usuario: { id: data.user.id, nombre: perfil?.nombre || data.user.user_metadata?.nombre || "", email: data.user.email },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (err) {
    console.error("Error POST /api/auth/login:", err.message);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// POST /api/auth/refrescar — renovar tokens
app.post("/api/auth/refrescar", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "Falta refresh_token" });

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error || !data?.session) return res.status(401).json({ error: "Sesión expirada, volvé a iniciar sesión" });

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (err) {
    console.error("Error POST /api/auth/refrescar:", err.message);
    res.status(500).json({ error: "Error al refrescar la sesión" });
  }
});

// GET /api/auth/perfil — datos de la cuenta + proveedor vinculado
app.get("/api/auth/perfil", requireAuth, async (req, res) => {
  try {
    const u = req.authUser;
    const perfil = await perfilUsuario(u.id);
    const proveedor = await proveedorDelUsuario(u.id);

    res.json({
      usuario: {
        id: u.id,
        nombre: perfil?.nombre || u.user_metadata?.nombre || "",
        email: u.email,
        telefono: perfil?.telefono ?? u.user_metadata?.telefono ?? null
      },
      proveedor: proveedor ? {
        id: proveedor.id,
        nombre_comercial: proveedor.nombre_comercial,
        tipo_proveedor_id: proveedor.tipo_proveedor_id
      } : null
    });
  } catch (err) {
    console.error("Error GET /api/auth/perfil:", err.message);
    res.status(500).json({ error: "Error al obtener el perfil" });
  }
});

// POST /api/proveedores/vincular — dar de alta el perfil de proveedor de la cuenta
app.post("/api/proveedores/vincular", requireAuth, async (req, res) => {
  const { nombre, tipo, telefono } = req.body;
  const TIPOS = { propietario: 1, inmobiliaria: 2, transportista: 3 };

  if (!nombre || !tipo || !TIPOS[tipo]) {
    return res.status(400).json({ error: "Faltan campos obligatorios: nombre, tipo (propietario | inmobiliaria | transportista)" });
  }

  try {
    const existente = await proveedorDelUsuario(req.authUser.id);
    if (existente) {
      return res.json({ ok: true, yaVinculado: true, proveedor: existente });
    }

    const { data: nuevo, error } = await supabase
      .from("proveedores")
      .insert({
        nombre_comercial: nombre,
        email: req.authUser.email,
        telefono: telefono || "",
        whatsapp: (telefono || "").replace(/\s/g, ""),
        tipo_proveedor_id: TIPOS[tipo],
        rating: 0,
        cobertura: "",
        descripcion: "",
        usuario_id: req.authUser.id
      })
      .select("id, nombre_comercial, email, telefono, whatsapp, tipo_proveedor_id")
      .single();

    if (error) throw error;
    res.status(201).json({ ok: true, proveedor: nuevo });
  } catch (err) {
    console.error("Error POST /api/proveedores/vincular:", err.message);
    const faltaTabla = /usuario_id|Could not find/.test(err.message || "");
    res.status(faltaTabla ? 503 : 500).json({ error: faltaTabla ? MIGRACION_PENDIENTE : "Error al vincular proveedor" });
  }
});

// ---------- Favoritos (requieren sesión) ----------

async function favoritosDeUsuario(userId) {
  const { data: favs, error } = await supabase
    .from("favoritos")
    .select("alojamiento_id")
    .eq("usuario_id", userId)
    .order("created_at");
  if (error) throw error;
  const ids = (favs || []).map(f => f.alojamiento_id);
  if (!ids.length) return { ids, alojamientos: [] };

  const { data: rows, error: errAloj } = await supabase
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
    .in("id", ids);
  if (errAloj) throw errAloj;
  return { ids, alojamientos: rows.map(transformAlojamiento) };
}

function esTablaFaltante(err) {
  const m = String(err?.message || "");
  return /does not exist|Could not find the table|relation .* does not exist/i.test(m);
}

// GET /api/favoritos — ids + alojamientos marcados como favorito
app.get("/api/favoritos", requireAuth, async (req, res) => {
  try {
    res.json(await favoritosDeUsuario(req.authUser.id));
  } catch (err) {
    console.error("Error GET /api/favoritos:", err.message);
    if (esTablaFaltante(err)) return res.status(503).json({ error: MIGRACION_PENDIENTE });
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
});

// POST /api/favoritos/:alojamientoId — marcar favorito
app.post("/api/favoritos/:alojamientoId", requireAuth, async (req, res) => {
  try {
    const { data: aloj } = await supabase.from("alojamientos").select("id").eq("id", req.params.alojamientoId).single();
    if (!aloj) return res.status(404).json({ error: "Alojamiento inexistente" });

    const { error } = await supabase
      .from("favoritos")
      .upsert(
        { usuario_id: req.authUser.id, alojamiento_id: Number(req.params.alojamientoId) },
        { onConflict: "usuario_id,alojamiento_id" }
      );
    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Error POST /api/favoritos:", err.message);
    if (esTablaFaltante(err)) return res.status(503).json({ error: MIGRACION_PENDIENTE });
    res.status(500).json({ error: "Error al guardar favorito" });
  }
});

// DELETE /api/favoritos/:alojamientoId — quitar favorito
app.delete("/api/favoritos/:alojamientoId", requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from("favoritos")
      .delete()
      .eq("usuario_id", req.authUser.id)
      .eq("alojamiento_id", Number(req.params.alojamientoId));
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /api/favoritos:", err.message);
    if (esTablaFaltante(err)) return res.status(503).json({ error: MIGRACION_PENDIENTE });
    res.status(500).json({ error: "Error al quitar favorito" });
  }
});

// POST /api/favoritos/sync — sincronizar favoritos locales al iniciar sesión
app.post("/api/favoritos/sync", requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "Se espera { ids: [] }" });

  try {
    const validos = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
    if (!validos.length) return res.json({ ok: true, agregados: 0 });

    const { data: existen } = await supabase.from("alojamientos").select("id").in("id", validos);
    const actuales = await favoritosDeUsuario(req.authUser.id);
    const yaTiene = new Set(actuales.ids);
    const aAgregar = existen.filter(a => !yaTiene.has(a.id));

    if (aAgregar.length) {
      const { error } = await supabase
        .from("favoritos")
        .insert(aAgregar.map(a => ({ usuario_id: req.authUser.id, alojamiento_id: a.id })));
      if (error && !/duplicate/i.test(error.message)) throw error;
    }
    res.json({ ok: true, agregados: aAgregar.length });
  } catch (err) {
    console.error("Error POST /api/favoritos/sync:", err.message);
    if (esTablaFaltante(err)) return res.status(503).json({ error: MIGRACION_PENDIENTE });
    res.status(500).json({ error: "Error al sincronizar favoritos" });
  }
});

// GET /api/mis-publicaciones — alojamientos del proveedor vinculado (sesión)
app.get("/api/mis-publicaciones", requireAuth, async (req, res) => {
  try {
    const prov = await proveedorDelUsuario(req.authUser.id);
    if (!prov) {
      return res.status(503).json({ error: MIGRACION_PENDIENTE, sinProveedor: true });
    }

    const { data, error } = await supabase
      .from("alojamientos")
      .select(`
        *,
        barrios (nombre),
        tipos_alojamiento (nombre),
        alojamiento_caracteristicas (caracteristicas (nombre)),
        alojamiento_universidades (universidades (nombre, latitud, longitud)),
        imagenes_alojamiento (id, url, orden)
      `)
      .eq("proveedor_id", prov.id)
      .order("id");
    if (error) throw error;

    const result = data.map(row => {
      const t = transformAlojamiento(row);
      return t;
    });
    res.json({ proveedor: prov, alojamientos: result });
  } catch (err) {
    console.error("Error GET /api/mis-publicaciones:", err.message);
    res.status(500).json({ error: "Error al obtener tus publicaciones" });
  }
});

// GET /api/alojamientos — lista completa con JOINs
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

// GET /api/alojamientos/:id — detalle individual
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

// GET /api/fletes — transportistas con info de vehículo
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

// GET /api/fletes/:id — detalle de un flete
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

// GET /api/referencias — datos de tablas de referencia
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

// GET /api/tipos-vehiculo — tipos de vehículo para select
app.get("/api/tipos-vehiculo", async (req, res) => {
  try {
    const { data, error } = await supabase.from("tipos_vehiculo").select("id, nombre").order("id");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error GET /api/tipos-vehiculo:", err.message);
    res.status(500).json({ error: "Error al obtener tipos de vehículo" });
  }
});

// POST /api/contacto — guardar solicitud de mudanza
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
// Proveedores — login y CRUD
// ============================================================

// POST /api/proveedores/login — buscar o crear proveedor por email
// DEPRECADO: el login real es POST /api/auth/login. Este endpoint se mantiene
// solo por compatibilidad: exige sesión válida y devuelve el proveedor
// vinculado a esa cuenta (nunca crea cuentas sin contraseña como antes).
app.post("/api/proveedores/login", requireAuth, async (req, res) => {
  try {
    const perfil = await asegurarPerfil(req.authUser);
    const prov = await proveedorDelUsuario(req.authUser.id);
    if (!prov) {
      return res.status(404).json({ error: "Tu cuenta todavía no tiene un perfil de proveedor vinculado", sinProveedor: true });
    }
    res.json({ ...prov, nombre_comercial: perfil?.nombre || prov.nombre_comercial });
  } catch (err) {
    console.error("Error POST /api/proveedores/login:", err.message);
    res.status(500).json({ error: "Error al obtener el proveedor" });
  }
});

// GET /api/proveedores/:id/alojamientos — alojamientos de un proveedor
app.get("/api/proveedores/:id/alojamientos", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alojamientos")
      .select(`
        *,
        barrios (nombre),
        tipos_alojamiento (nombre),
        alojamiento_caracteristicas (caracteristicas (nombre)),
        alojamiento_universidades (universidades (nombre, latitud, longitud)),
        imagenes_alojamiento (id, url, orden)
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
      const imagenesOrdenadas = (row.imagenes_alojamiento || [])
        .slice()
        .sort((a, b) => a.orden - b.orden);
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
        imgs: imagenesOrdenadas.map(img => img.url),
        imgIds: imagenesOrdenadas.map(img => img.id),
        lat: row.latitud || null,
        lng: row.longitud || null,
        calle: row.calle || "",
        referencia: row.referencia || "",
        desc: row.descripcion || ""
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error GET /api/proveedores/:id/alojamientos:", err.message);
    res.status(500).json({ error: "Error al obtener alojamientos del proveedor" });
  }
});

// POST /api/alojamientos — crear alojamiento (requiere sesión; el dueño
// siempre es el proveedor vinculado a la cuenta autenticada)
app.post("/api/alojamientos", requireAuth, async (req, res) => {
  const { titulo, tipo, precio_mensual, barrio, habitaciones, banos, descripcion, calle, referencia, latitud, longitud, wifi, amoblado, cochera, balcon, calefaccion, aire, parrilla, universidad, caracteristicas } = req.body;

  if (!titulo || !precio_mensual) {
    return res.status(400).json({ error: "Faltan campos obligatorios: titulo, precio_mensual" });
  }

  try {
    const perfil = await asegurarPerfil(req.authUser);
    let prov = await proveedorDelUsuario(req.authUser.id);

    // Si la cuenta no tiene perfil de proveedor, se crea uno como propietario
    if (!prov) {
      const { data: nuevo, error: errProv } = await supabase
        .from("proveedores")
        .insert({
          nombre_comercial: perfil?.nombre || (req.authUser.email || "").split("@")[0],
          email: req.authUser.email,
          telefono: perfil?.telefono || "",
          whatsapp: (perfil?.telefono || "").replace(/\s/g, ""),
          tipo_proveedor_id: 1,
          rating: 0,
          cobertura: "",
          descripcion: "",
          usuario_id: req.authUser.id
        })
        .select("id")
        .single();
      if (errProv) {
        if (/usuario_id|Could not find/i.test(errProv.message || "")) {
          return res.status(503).json({ error: MIGRACION_PENDIENTE });
        }
        throw errProv;
      }
      prov = nuevo;
    }
    const proveedor_id = prov.id;
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
        calle: calle || null,
        referencia: referencia || null,
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

    // Asociar características.
    // Si viene el array "caracteristicas" (nombres), es la fuente de verdad.
    // Si no, se arma la lista a partir de los flags individuales (compatibilidad).
    let nombresCaracteristicas;
    if (Array.isArray(caracteristicas)) {
      nombresCaracteristicas = caracteristicas;
    } else {
      nombresCaracteristicas = [];
      if (wifi) nombresCaracteristicas.push("WiFi");
      if (amoblado) nombresCaracteristicas.push("Amoblado");
      if (cochera) nombresCaracteristicas.push("Cochera");
      if (balcon) nombresCaracteristicas.push("Balcón");
      if (calefaccion) nombresCaracteristicas.push("Calefacción");
      if (aire) nombresCaracteristicas.push("Aire acondicionado");
      if (parrilla) nombresCaracteristicas.push("Parrilla");
    }

    const resueltas = await resolverCaracteristicas(nombresCaracteristicas);
    for (const c of resueltas) {
      await supabase.from("alojamiento_caracteristicas").insert({ alojamiento_id: aloj.id, caracteristica_id: c.id });
    }

    res.status(201).json({ ok: true, id: aloj.id });
  } catch (err) {
    console.error("Error POST /api/alojamientos:", err.message);
    res.status(500).json({ error: "Error al crear alojamiento" });
  }
});

// PUT /api/alojamientos/:id — editar alojamiento (solo el dueño)
app.put("/api/alojamientos/:id", requireAuth, async (req, res) => {
  const { titulo, tipo, precio_mensual, barrio, habitaciones, banos, descripcion, calle, referencia, latitud, longitud, wifi, amoblado, cochera, universidad, caracteristicas } = req.body;
  const id = req.params.id;

  const dueño = await esDueñoDeAlojamiento(req.authUser.id, id);
  if (!dueño) {
    return res.status(403).json({ error: "No tenés permiso para editar este alojamiento" });
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

    // Actualizar alojamiento.
    // Ubicación: solo se actualiza el campo si viene en el body,
    // para no pisar coordenadas existentes con valores vacíos.
    const update = {
      titulo,
      precio_mensual,
      barrio_id: barrioId,
      tipo_alojamiento_id: tipoId,
      habitaciones: habitaciones || 1,
      banos: banos || 1,
      descripcion: descripcion || ""
    };
    if (calle !== undefined) update.calle = calle || null;
    if (referencia !== undefined) update.referencia = referencia || null;
    const latNum = parseFloat(latitud);
    const lngNum = parseFloat(longitud);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      update.latitud = latNum;
      update.longitud = lngNum;
    }

    const { error } = await supabase
      .from("alojamientos")
      .update(update)
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

    // Sincronizar características.
    // Si viene el array "caracteristicas" (nombres), sincroniza la relación
    // completa: agrega las nuevas, quita las desmarcadas, nunca borra registros
    // de la tabla caracteristicas. Si no viene el array, se mantiene el
    // comportamiento anterior con los 3 flags individuales.
    if (Array.isArray(caracteristicas)) {
      const resueltas = await resolverCaracteristicas(caracteristicas);
      const deseadas = new Set(resueltas.map(c => c.id));

      // La tabla tiene PK compuesta (alojamiento_id, caracteristica_id),
      // no tiene columna id: se sincroniza por el par de claves.
      const { data: actuales } = await supabase
        .from("alojamiento_caracteristicas")
        .select("caracteristica_id")
        .eq("alojamiento_id", id);
      const actualesIds = new Set((actuales || []).map(r => r.caracteristica_id));

      // Quitar relaciones desmarcadas
      for (const cid of actualesIds) {
        if (!deseadas.has(cid)) {
          const { error: errDel } = await supabase
            .from("alojamiento_caracteristicas")
            .delete()
            .eq("alojamiento_id", Number(id))
            .eq("caracteristica_id", cid);
          if (errDel) console.error("Error quitando característica:", errDel.message);
        }
      }

      // Agregar relaciones nuevas
      for (const cid of deseadas) {
        if (!actualesIds.has(cid)) {
          const { error: errIns } = await supabase
            .from("alojamiento_caracteristicas")
            .insert({ alojamiento_id: Number(id), caracteristica_id: cid });
          if (errIns) console.error("Error agregando característica:", errIns.message);
        }
      }
    } else {
      await supabase.from("alojamiento_caracteristicas").delete().eq("alojamiento_id", id);
      const flags = [];
      if (wifi) flags.push("WiFi");
      if (amoblado) flags.push("Amoblado");
      if (cochera) flags.push("Cochera");

      for (const nombre of flags) {
        const { data: c } = await supabase.from("caracteristicas").select("id").eq("nombre", nombre).single();
        if (c) {
          await supabase.from("alojamiento_caracteristicas").insert({ alojamiento_id: id, caracteristica_id: c.id });
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error PUT /api/alojamientos/:id:", err.message);
    res.status(500).json({ error: "Error al actualizar alojamiento" });
  }
});

// DELETE /api/alojamientos/:id — eliminar alojamiento (solo el dueño)
app.delete("/api/alojamientos/:id", requireAuth, async (req, res) => {
  const id = req.params.id;

  const dueño = await esDueñoDeAlojamiento(req.authUser.id, id);
  if (!dueño) {
    return res.status(403).json({ error: "No tenés permiso para eliminar este alojamiento" });
  }

  try {
    await supabase.from("alojamiento_caracteristicas").delete().eq("alojamiento_id", id);
    await supabase.from("alojamiento_universidades").delete().eq("alojamiento_id", id);

    // Eliminar imágenes de Storage antes de borrar registros
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
// Imágenes — Upload a Supabase Storage + referencia en DB
// ============================================================

// POST /api/alojamientos/:id/imagenes — subir imágenes
app.post("/api/alojamientos/:id/imagenes", upload.array("fotos", 10), async (req, res) => {
  const alojamientoId = req.params.id;
  const files = req.files;

  console.log("UPLOAD DEBUG: alojamientoId=", alojamientoId, "files=", files ? files.length : 0);

  if (!files || !files.length) {
    return res.status(400).json({ error: "No se enviaron archivos" });
  }

  try {
    // Verificar que el alojamiento existe
    const { data: aloj } = await supabase.from("alojamientos").select("id").eq("id", alojamientoId).single();
    if (!aloj) return res.status(404).json({ error: "Alojamiento no encontrado" });

    // Obtener el orden máximo actual
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

      console.log("UPLOAD DEBUG: subiendo", file.originalname, file.mimetype, file.size + " bytes", "->", filePath);

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("alojamiento-imagenes")
        .upload(filePath, file.buffer, { contentType: file.mimetype });

      if (uploadError) {
        console.error("Error subiendo a Storage:", uploadError.message);
        continue;
      }

      // Obtener URL pública
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
    res.status(500).json({ error: "Error al subir imágenes" });
  }
});

// DELETE /api/imagenes/:imagenId — eliminar una imagen
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

    // Extraer path relativo del Storage desde la URL pública
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
// Fletes (transporte) — CRUD
// ============================================================

// GET /api/proveedores/:id/fletes — servicios de transporte de un proveedor
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

// GET /api/proveedores/:id/solicitudes — solicitudes de presupuesto para un transportista.
// Devuelve las dirigidas a sus fletes y las generales (proveedor_id null), más recientes primero.
app.get("/api/proveedores/:id/solicitudes", requireAuth, async (req, res) => {
  try {
    const prov = await proveedorDelUsuario(req.authUser.id);
    if (!prov || prov.id !== Number(req.params.id)) {
      return res.status(403).json({ error: "No tenés permiso para ver estas solicitudes" });
    }
  } catch (err) {
    console.error("Error verificando proveedor:", err.message);
    return res.status(500).json({ error: "Error al verificar el proveedor" });
  }

  try {
    const { data, error } = await supabase
      .from("solicitudes_mudanza")
      .select("id, nombre_contacto, telefono, email, origen, destino, tamano, fecha_mudanza, observaciones, proveedor_id, estado, creado_en")
      .or(`proveedor_id.eq.${Number(req.params.id)},proveedor_id.is.null`)
      .order("creado_en", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error GET /api/proveedores/:id/solicitudes:", err.message);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

// POST /api/fletes — crear servicio de transporte (solo el dueño)
app.post("/api/fletes", requireAuth, async (req, res) => {
  const { proveedor_id, nombre_comercial, tipo_vehiculo, cobertura, telefono, email, whatsapp } = req.body;

  if (!proveedor_id || !nombre_comercial) {
    return res.status(400).json({ error: "Faltan campos obligatorios: proveedor_id, nombre_comercial" });
  }

  try {
    const prov = await proveedorDelUsuario(req.authUser.id);
    if (!prov || prov.id !== Number(proveedor_id)) {
      return res.status(403).json({ error: "No tenés permiso para modificar este proveedor" });
    }
  } catch (err) {
    return res.status(503).json({ error: MIGRACION_PENDIENTE });
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
        // Verificar si ya tiene vehículo
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

// PUT /api/fletes/:id — editar servicio de transporte (solo el dueño)
app.put("/api/fletes/:id", requireAuth, async (req, res) => {
  const { nombre_comercial, tipo_vehiculo, cobertura, telefono, email, whatsapp } = req.body;
  const id = req.params.id;

  try {
    const prov = await proveedorDelUsuario(req.authUser.id);
    if (!prov || prov.id !== Number(id)) {
      return res.status(403).json({ error: "No tenés permiso para editar este servicio" });
    }
  } catch (err) {
    return res.status(503).json({ error: MIGRACION_PENDIENTE });
  }

  try {
    // Actualizar datos del proveedor
    const { error } = await supabase
      .from("proveedores")
      .update({ nombre_comercial, cobertura: cobertura || "", telefono, email, whatsapp })
      .eq("id", id);

    if (error) throw error;

    // Actualizar tipo de vehículo
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

// DELETE /api/fletes/:id — eliminar servicio de transporte (solo el dueño)
app.delete("/api/fletes/:id", requireAuth, async (req, res) => {
  const id = req.params.id;

  try {
    const prov = await proveedorDelUsuario(req.authUser.id);
    if (!prov || prov.id !== Number(id)) {
      return res.status(403).json({ error: "No tenés permiso para eliminar este servicio" });
    }
  } catch (err) {
    return res.status(503).json({ error: MIGRACION_PENDIENTE });
  }

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
// Vistas y estadísticas
// ============================================================

// POST /api/vistas — registrar una vista
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

// GET /api/proveedores/:id/stats — estadísticas reales del proveedor
app.get("/api/proveedores/:id/stats", async (req, res) => {
  const id = req.params.id;
  try {
    // Contactos: contar solicitudes_mudanza donde el flete pertenece al proveedor
    const { count: contactos } = await supabase
      .from("solicitudes_mudanza")
      .select("id", { count: "exact", head: true })
      .eq("proveedor_id", id);

    // Vistas: contar registros_vistas donde el proveedor Dueño
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
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// ============================================================
// Iniciar
// ============================================================

app.listen(PORT, () => {
  console.log(`ForanIA backend corriendo en http://localhost:${PORT}`);
});
