const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const FLETES_PATH = path.join(__dirname, "data", "fletes.json");
const CONTACTOS_PATH = path.join(__dirname, "data", "contactos.json");

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

app.listen(PORT, () => {
  console.log(`ForanIA backend corriendo en http://localhost:${PORT}`);
});
