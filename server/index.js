const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_DIR));

const FLETES_PATH = path.join(__dirname, "data", "fletes.json");
const CONTACTOS_PATH = path.join(__dirname, "data", "contactos.json");
const PROPIEDADES_PATH = path.join(__dirname, "data", "propiedades.json");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(UPLOADS_DIR, "propiedades");
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/fletes — retorna la lista de fletes
app.get("/api/fletes", (req, res) => {
  const fletes = readJSON(FLETES_PATH);
  res.json(fletes);
});

// GET /api/fletes/:id — retorna un flete específico
app.get("/api/fletes/:id", (req, res) => {
  const fletes = readJSON(FLETES_PATH);
  const flete = fletes.find(f => f.id === +req.params.id);
  if (!flete) return res.status(404).json({ error: "Flete no encontrado" });
  res.json(flete);
});

// POST /api/contacto — guarda el contacto generado por el chatbot
app.post("/api/contacto", (req, res) => {
  const { nombre, telefono, email, origen, destino, tamano, fecha, observaciones, flete_id } = req.body;
  if (!nombre || !telefono || !origen || !destino) {
    return res.status(400).json({ error: "Faltan campos obligatorios: nombre, telefono, origen, destino" });
  }
  const contactos = readJSON(CONTACTOS_PATH);
  const nuevo = {
    id: Date.now(),
    nombre,
    telefono,
    email: email || "",
    origen,
    destino,
    tamano: tamano || "",
    fecha: fecha || "",
    observaciones: observaciones || "",
    flete_id: flete_id || null,
    fecha_creacion: new Date().toISOString()
  };
  contactos.push(nuevo);
  writeJSON(CONTACTOS_PATH, contactos);
  res.status(201).json({ ok: true, contacto: nuevo });
});

// GET /api/propiedades — retorna propiedades publicadas
app.get("/api/propiedades", (req, res) => {
  const propiedades = readJSON(PROPIEDADES_PATH);
  res.json(propiedades);
});

// POST /api/propiedades — publica una nueva propiedad
app.post("/api/propiedades", upload.array("fotos", 10), (req, res) => {
  const { titulo, precio, tipo, barrio, calle, referencia, googleMapsUrl, lat, lng, dist, uni, habs, banos, desc, wifi, amoblado, cochera, servicios } = req.body;
  if (!titulo || !precio || !barrio || !lat || !lng) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  const fotos = (req.files || []).map(f => `uploads/propiedades/${f.filename}`);
  let serviciosArr = [];
  try { serviciosArr = JSON.parse(servicios || "[]"); } catch { serviciosArr = []; }
  const barrioObj = { nombre: barrio };
  if (calle) barrioObj.calle = calle;
  if (referencia) barrioObj.referencia = referencia;
  if (googleMapsUrl) barrioObj.googleMapsUrl = googleMapsUrl;
  const nueva = {
    id: Date.now(),
    nombre: titulo,
    tipo: tipo || "departamento",
    precio: +precio,
    barrio: barrioObj,
    lat: +lat,
    lng: +lng,
    dist: +dist || 0,
    uni: uni || "UNLaR",
    habs: +habs || 1,
    banos: +banos || 1,
    wifi: wifi === "true",
    amoblado: amoblado === "true",
    cochera: cochera === "true",
    servicios: serviciosArr,
    img: fotos,
    desc: desc || "",
    propietario: "Usuario",
    propAv: "U",
    tel: "",
    email: "",
    whatsapp: "",
    fecha_creacion: new Date().toISOString()
  };
  const propiedades = readJSON(PROPIEDADES_PATH);
  propiedades.push(nueva);
  writeJSON(PROPIEDADES_PATH, propiedades);
  res.status(201).json({ ok: true, propiedad: nueva });
});

app.listen(PORT, () => {
  console.log(`ForanIA backend corriendo en http://localhost:${PORT}`);
});
