/* ===== FORANIA — lógica y datos desde Supabase ===== */
"use strict";

/* ---------- Datos ---------- */
const bg = (img) => img ? `background:${img}` : "background:#a78bfa";

const API_URL = "http://localhost:3001/api";
let PROPERTIES = [];
let FLETES = [];
let REFS = {};

async function loadData() {
  try {
    const [propsRes, fletesRes] = await Promise.all([
      fetch(`${API_URL}/alojamientos`),
      fetch(`${API_URL}/fletes`)
    ]);
    if (propsRes.ok) PROPERTIES = await propsRes.json();
    if (fletesRes.ok) FLETES = await fletesRes.json();
    filteredProps = [...PROPERTIES];
  } catch (err) {
    console.error("Error cargando datos desde la API:", err);
  }
}

function populateSelect(selector, data, placeholder, lowerValues) {
  const el = $(selector);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  data.forEach(d => {
    const opt = document.createElement("option");
    const val = lowerValues ? d.nombre.toLowerCase() : d.nombre;
    opt.value = val;
    opt.textContent = d.nombre;
    el.appendChild(opt);
  });
}

async function loadReferences() {
  try {
    const res = await fetch(`${API_URL}/referencias`);
    if (!res.ok) return;
    REFS = await res.json();
    populateSelect("#searchUni", REFS.universidades || [], "Cualquiera");
    populateSelect("#searchType", REFS.tipos_alojamiento || [], "Cualquiera", true);
    populateSelect("#fUni", REFS.universidades || [], "Todas");
    populateSelect("#fType", REFS.tipos_alojamiento || [], "Todos", true);
    populateSelect("#fBarrio", REFS.barrios || [], "Todos");
    populateSelect("#pubTipo", REFS.tipos_alojamiento || [], "Seleccionar...", true);
    populateSelect("#pubBarrio", REFS.barrios || [], "Seleccionar...");
  } catch (err) {
    console.error("Error cargando referencias:", err);
  }
}

async function trackView(proveedorId, alojamientoId, fleteId) {
  try {
    await fetch(`${API_URL}/vistas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proveedor_id: proveedorId, alojamiento_id: alojamientoId || null, flete_id: fleteId || null })
    });
  } catch (e) { /* no bloquea */ }
}

/* ---------- Estado ---------- */
let favorites = JSON.parse(localStorage.getItem("forania_favs") || "[]");
let compare = [];
let filteredProps = [...PROPERTIES];

/* ---------- Helpers ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const fmt = (n) => "$" + Number(n).toLocaleString("es-AR");
const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2200);
};

/* ---------- Navegación ---------- */
function goTo(page) {
  $$(".page").forEach(p => p.classList.remove("active"));
  $("#" + page).classList.add("active");
  $$(".nav-link").forEach(l => l.classList.toggle("active", l.dataset.nav === page));
  document.body.classList.remove("nav-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (page === "alquileres") renderCatalog(filteredProps);
  if (page === "favoritos") renderFavorites();
  if (page === "perfil") { $("#profFavs").textContent = favorites.length; $("#profComp").textContent = compare.length; }
}

$$("[data-nav]").forEach(el => el.addEventListener("click", (e) => {
  e.preventDefault();
  goTo(el.dataset.nav);
}));
$("#hamburger").addEventListener("click", () => document.body.classList.toggle("nav-open"));

/* ---------- Tarjetas ---------- */
function propCard(p, grid) {
  const fav = favorites.includes(p.id);
  const servs = p.servicios.slice(0, 2);
  const div = document.createElement("article");
  div.className = "card prop-card";
  div.innerHTML = `
    <div class="prop-img" style="${bg(p.img)}">
      <button class="prop-fav ${fav ? 'on' : ''}" data-fav="${p.id}">${fav ? "&#9829;" : "&#9825;"}</button>
      <span class="prop-tag">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · ${p.barrio}</span>
    </div>
    <div class="prop-body">
      <h3 class="prop-title">${p.nombre}</h3>
      <div class="prop-price">${fmt(p.precio)} <small>/ mes</small></div>
      <div class="prop-meta">
        <span>&#128205; ${p.dist.toFixed(1)} km de ${p.uni}</span>
        <span>&#9203; ${Math.round(p.dist * 12)} min caminando</span>
        <span>&#128690; ${Math.round(p.dist * 4)} min en bici</span>
        <span>&#128663; ${Math.round(p.dist * 2)} min en auto</span>
        <span>&#128716; ${p.habs} hab · ${p.banos} baño</span>
      </div>
      <div class="prop-meta">${servs.map(s => `<span class="serv-tag ${p.amoblado ? 'hot' : ''}">${s}</span>`).join("")}</div>
      <div class="prop-actions">
        <button class="btn btn-primary" data-view="${p.id}">Ver detalles</button>
        <button class="mini-btn ${compare.includes(p.id) ? 'checked' : ''}" data-cmp="${p.id}" title="Comparar">&#8693;</button>
      </div>
    </div>`;
  grid.appendChild(div);
}

function cardEvents(grid) {
  grid.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => openDetail(+b.dataset.view)));
  grid.querySelectorAll("[data-fav]").forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); toggleFav(+b.dataset.fav); }));
  grid.querySelectorAll("[data-cmp]").forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); toggleCompare(+b.dataset.cmp); }));
}

function renderFeatured() {
  const g = $("#featuredGrid");
  g.innerHTML = "";
  PROPERTIES.slice(0, 6).forEach(p => propCard(p, g));
  cardEvents(g);
}

/* ---------- Favoritos ---------- */
function toggleFav(id) {
  const i = favorites.indexOf(id);
  if (i >= 0) { favorites.splice(i, 1); toast("Quitado de favoritos"); }
  else { favorites.push(id); toast("Agregado a favoritos &#9829;"); }
  localStorage.setItem("forania_favs", JSON.stringify(favorites));
  $("#favCountTop").textContent = favorites.length;
  renderFeatured();
  $$("#catalogGrid").length && renderCatalog(filteredProps);
  if ($("#favoritos").classList.contains("active")) renderFavorites();
  updateCardStates();
}
function updateCardStates() {
  $$(".prop-fav").forEach(b => {
    const on = favorites.includes(+b.dataset.fav);
    b.classList.toggle("on", on);
    b.innerHTML = on ? "&#9829;" : "&#9825;";
  });
}
function renderFavorites() {
  const g = $("#favGrid");
  const list = PROPERTIES.filter(p => favorites.includes(p.id));
  g.innerHTML = "";
  $("#favMsg").textContent = list.length ? `${list.length} propiedades guardadas` : "Todavía no tenés favoritos. Tocá el corazón en cualquier propiedad.";
  list.forEach(p => propCard(p, g));
  cardEvents(g);
}

/* ---------- Catálogo + filtros ---------- */
function applyFilters() {
  const maxP = +$("#fPrice").value;
  const tipo = $("#fType").value;
  const uni = $("#fUni").value;
  const barrio = $("#fBarrio").value;
  const maxD = +$("#fDist").value;
  const amob = $("#fAmoblado").checked;
  const wifi = $("#fWifi").checked;
  const coch = $("#fCochera").checked;
  filteredProps = PROPERTIES.filter(p =>
    p.precio <= maxP &&
    (!tipo || p.tipo === tipo) &&
    (!uni || p.uni === uni) &&
    (!barrio || p.barrio === barrio) &&
    p.dist <= maxD &&
    (!amob || p.amoblado) &&
    (!wifi || p.wifi) &&
    (!coch || p.cochera)
  );
  renderCatalog(filteredProps);
  toast(`Filtros aplicados: ${filteredProps.length} resultados`);
}
function clearFilters() {
  $("#fPrice").value = 600000; $("#fPriceLabel").textContent = "$600.000";
  $("#fType").value = ""; $("#fUni").value = ""; $("#fBarrio").value = ""; $("#fDist").value = "99";
  $("#fAmoblado").checked = false; $("#fWifi").checked = false; $("#fCochera").checked = false;
  filteredProps = [...PROPERTIES];
  renderCatalog(filteredProps);
  toast("Filtros limpiados");
}
function renderCatalog(list) {
  const g = $("#catalogGrid");
  g.innerHTML = "";
  $("#resultsCount").textContent = `${list.length} alojamientos encontrados`;
  if (!list.length) { g.innerHTML = `<div class="card muted" style="grid-column:1/-1;text-align:center">No se encontraron propiedades con esos filtros.</div>`; return; }
  list.forEach(p => propCard(p, g));
  cardEvents(g);
  renderMap(list);
}

$("#applyFilters").addEventListener("click", applyFilters);
$("#clearFilters").addEventListener("click", clearFilters);
$("#fPrice").addEventListener("input", () => $("#fPriceLabel").textContent = fmt($("#fPrice").value));
$("#filtersToggle").addEventListener("click", () => $(".filters-body").classList.toggle("open"));

/* ---------- Mapa ---------- */
function renderMap(list) {
  const box = $("#mapPins");
  box.innerHTML = "";
  list.forEach(p => {
    const el = document.createElement("span");
    el.className = "map-pin prop";
    el.style.left = (20 + (p.id * 13) % 60) + "%";
    el.style.top = (15 + (p.id * 29) % 65) + "%";
    el.title = `${p.nombre} · ${fmt(p.precio)}`;
    el.addEventListener("click", () => openDetail(p.id));
    box.appendChild(el);
  });
  FLETES.forEach((f, i) => {
    const el = document.createElement("span");
    el.className = "map-pin flete";
    el.style.left = (35 + i * 18) + "%";
    el.style.top = (10 + (i % 2) * 45) + "%";
    el.title = f.nombre;
    box.appendChild(el);
  });
}
$("#toggleMapBtn").addEventListener("click", () => {
  const m = $("#mapSection");
  const hidden = m.style.display === "none";
  m.style.display = hidden ? "" : "none";
  $("#toggleMapBtn").textContent = hidden ? "Ocultar mapa" : "Mostrar mapa";
});

/* ---------- Detalle ---------- */
function openDetail(id) {
  const p = PROPERTIES.find(x => x.id === id);
  if (!p) return;
  if (p.proveedor_id) trackView(p.proveedor_id, p.id);
  const modal = $("#modal");
  $("#modalContent").innerHTML = `
    <div class="gallery">
      <div class="gallery-main" style="${bg(p.img)}"></div>
      <div class="gallery-side">
        <div style="${bg(p.img)};opacity:.85"></div>
        <div style="${bg(p.img)};opacity:.7"></div>
      </div>
    </div>
    <div class="detail-body">
      <div class="detail-head">
        <div>
          <span class="prop-tag" style="position:static;background:#e8f4f8;color:var(--primary);display:inline-block;margin-bottom:8px">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · ${p.barrio}</span>
          <h2>${p.nombre}</h2>
          <div class="prop-meta"><span>&#128205; ${p.dist.toFixed(1)} km de ${p.uni} · &#9203; ${Math.round(p.dist * 12)} min caminando · &#128690; ${Math.round(p.dist * 4)} min en bici · &#128663; ${Math.round(p.dist * 2)} min en auto</span></div>
        </div>
        <div class="detail-price">${fmt(p.precio)}<small style="font-size:.85rem;color:var(--muted)"> / mes</small></div>
      </div>
      <p class="detail-desc">${p.desc}</p>
      <div class="chips">${p.servicios.map(s => `<span class="serv-tag ${p.amoblado ? 'hot' : ''}">${s}</span>`).join("")}</div>
      <div class="detail-grid">
        <div class="detail-item"><span class="d-ico">&#128716;</span><div><b>${p.habs} habitaciones</b>${p.tipo}</div></div>
        <div class="detail-item"><span class="d-ico">&#128701;</span><div><b>${p.banos} baños</b>completo</div></div>
        <div class="detail-item"><span class="d-ico">&#128205;</span><div><b>${p.dist.toFixed(1)} km</b>hasta ${p.uni}</div></div>
        <div class="detail-item"><span class="d-ico">&#9203;</span><div><b>${Math.round(p.dist * 12)} min</b>caminando</div></div>
        <div class="detail-item"><span class="d-ico">&#128690;</span><div><b>${Math.round(p.dist * 4)} min</b>en bicicleta</div></div>
        <div class="detail-item"><span class="d-ico">&#128663;</span><div><b>${Math.round(p.dist * 2)} min</b>en vehículo</div></div>
      </div>
      <div class="owner-row">
        <div class="owner-av">${p.propAv}</div>
        <div><b>${p.propietario}</b><div class="muted" style="font-size:.85rem">Propietario verificado · ${p.barrio}</div></div>
      </div>
      <div class="contact-info">
        <h4 style="margin-bottom:8px;color:var(--primary)">Datos de contacto</h4>
        <div class="contact-grid">
          <a href="https://wa.me/${p.whatsapp}" target="_blank" class="contact-item contact-whatsapp">
            <span class="contact-ico">&#128172;</span>
            <div><b>WhatsApp</b><div class="muted" style="font-size:.82rem">${p.tel}</div></div>
          </a>
          <a href="mailto:${p.email}" class="contact-item contact-email">
            <span class="contact-ico">&#9993;</span>
            <div><b>Email</b><div class="muted" style="font-size:.82rem">${p.email}</div></div>
          </a>
          <a href="tel:${p.tel}" class="contact-item contact-phone">
            <span class="contact-ico">&#128222;</span>
            <div><b>Teléfono</b><div class="muted" style="font-size:.82rem">${p.tel}</div></div>
          </a>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-primary" data-contact="${p.propietario}">&#9993; Contactar</button>
        <button class="btn btn-ghost ${favorites.includes(p.id) ? 'checked' : ''}" data-fav="${p.id}">${favorites.includes(p.id) ? "&#9829; En favoritos" : "&#9825; Agregar a favoritos"}</button>
        <button class="btn btn-ghost" data-cmp="${p.id}">&#8693; Comparar</button>
      </div>
    </div>`;
  modal.classList.add("show");
  $("#overlay").classList.add("show");
  $("#modalContent").querySelector("[data-contact]").addEventListener("click", () => {
    toast(`Contacto abierto con ${p.propietario} (demo)`);
  });
  $("#modalContent").querySelector("[data-fav]").addEventListener("click", () => {
    toggleFav(p.id);
    openDetail(p.id);
  });
  $("#modalContent").querySelector("[data-cmp]").addEventListener("click", () => {
    toggleCompare(p.id);
  });
}
$("#modalClose").addEventListener("click", () => { $("#modal").classList.remove("show"); $("#overlay").classList.remove("show"); });
$("#overlay").addEventListener("click", () => { $("#modal").classList.remove("show"); $("#overlay").classList.remove("show"); });

/* ---------- Comparador ---------- */
function toggleCompare(id) {
  const i = compare.indexOf(id);
  if (i >= 0) { compare.splice(i, 1); toast("Quitado del comparador"); }
  else if (compare.length >= 3) { toast("Máximo 3 propiedades para comparar"); return; }
  else { compare.push(id); toast("Agregado al comparador"); }
  renderCompareBar();
  renderFeatured();
  $$("#catalogGrid").length && renderCatalog(filteredProps);
  if ($("#favoritos").classList.contains("active")) renderFavorites();
}
function renderCompareBar() {
  const bar = $("#compareBar");
  const list = $("#compareList");
  bar.classList.toggle("show", compare.length > 0);
  list.innerHTML = "";
  compare.forEach(id => {
    const p = PROPERTIES.find(x => x.id === id);
    const el = document.createElement("div");
    el.className = "compare-thumb";
    el.style.background = p.img;
    el.title = p.nombre;
    el.innerHTML = `<button data-rm="${id}">&times;</button>`;
    list.appendChild(el);
  });
  list.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => toggleCompare(+b.dataset.rm)));
  $("#compareCount").textContent = compare.length + "/3";
  $("#compareBtn").disabled = compare.length < 2;
}
$("#compareBtn").addEventListener("click", () => {
  const items = compare.map(id => PROPERTIES.find(x => x.id === id));
  const head = `<tr><th></th>${items.map(p => `<th>${p.nombre}</th>`).join("")}</tr>`;
  const row = (label, fn) => `<tr><td>${label}</td>${items.map(p => `<td>${fn(p)}</td>`).join("")}</tr>`;
  $("#modalContent2").innerHTML = `
    <div class="detail-body">
      <h2 style="margin-bottom:6px">Comparar propiedades</h2>
      <p class="muted" style="margin-bottom:12px">Compará hasta 3 alojamientos lado a lado.</p>
      <table class="comp-table">
        ${head}
        ${row("Precio", p => `<b style="color:var(--primary)">${fmt(p.precio)}</b>`)}
        ${row("Distancia", p => `${p.dist.toFixed(1)} km · ${Math.round(p.dist * 12)} min cam · ${Math.round(p.dist * 4)} min bici · ${Math.round(p.dist * 2)} min auto`)}
        ${row("Tipo", p => p.tipo)}
        ${row("Habitaciones", p => p.habs)}
        ${row("WiFi", p => p.wifi ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
        ${row("Amoblado", p => p.amoblado ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
        ${row("Cochera", p => p.cochera ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
      </table>
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
        ${items.map(p => `<button class="btn btn-primary" data-view="${p.id}">Ver ${p.nombre.split(" ")[0]}</button>`).join("")}
      </div>
    </div>`;
  $("#modal2").classList.add("show");
  $("#overlay2").classList.add("show");
  $("#modalContent2").querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => {
    $("#modal2").classList.remove("show"); $("#overlay2").classList.remove("show");
    openDetail(+b.dataset.view);
  }));
});
$("#modalClose2").addEventListener("click", () => { $("#modal2").classList.remove("show"); $("#overlay2").classList.remove("show"); });
$("#overlay2").addEventListener("click", () => { $("#modal2").classList.remove("show"); $("#overlay2").classList.remove("show"); });

/* ---------- Fletes ---------- */
function renderFletes(filter) {
  const g = $("#fletesGrid");
  g.innerHTML = "";
  const list = filter ? FLETES.filter(f => f.nombre.toLowerCase().includes(filter.toLowerCase()) || f.cobertura.toLowerCase().includes(filter.toLowerCase())) : FLETES;
  if (!list.length) {
    g.innerHTML = `<div class="card muted" style="grid-column:1/-1;text-align:center;padding:32px">No se encontraron servicios con ese criterio.</div>`;
    return;
  }
  list.forEach(f => {
    const div = document.createElement("article");
    div.className = "card flete-card";
    div.innerHTML = `
      <div class="flete-img" style="${bg(f.img)}">${f.emoji}</div>
      <h3>${f.nombre}</h3>
      <div class="prop-meta"><span>&#128666; ${f.tipo}</span><span class="flete-rating">&#9733; ${f.rating}</span></div>
      <div class="flete-cobertura">&#128205; Cobertura: ${f.cobertura}</div>
      <div class="flete-badges"><span class="serv-tag hot">Disponible</span><span class="serv-tag">Respuesta rápida</span></div>
      <button class="btn btn-primary" data-chat="${f.id}" style="width:100%;justify-content:center">&#128172; Chatear ahora</button>`;
    div.querySelector("[data-chat]").addEventListener("click", () => initChatbot(f.id));
    g.appendChild(div);
  });
}

$("#fletesSearchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("#fletesSearchInput").value.trim();
  renderFletes(q);
  toast(q ? `Buscando "${q}"...` : "Mostrando todos los servicios");
});

$("#clearFletesSearch").addEventListener("click", () => {
  $("#fletesSearchInput").value = "";
  renderFletes();
  toast("Filtros limpiados");
});

/* ---------- Chatbot de Fletes ---------- */
const CHATBOT_API = API_URL;
let chatbotState = { step: 0, data: {}, flete: null };

const CHATBOT_STEPS = [
  { key: "nombre", question: "¡Hola! Soy el asistente de {flete}. ¿Cómo te llamás?", validate: v => v.trim().length > 0 ? null : "Por favor ingresá tu nombre." },
  { key: "telefono", question: "¿Cuál es tu número de teléfono? (Ej: 3804123456)", validate: v => /^\+?[\d\s\-]{8,15}$/.test(v.trim()) ? null : "Ingresá un número de teléfono válido." },
  { key: "email", question: "¿Tu email? (opcional, podés escribir 'skip' para saltar)", validate: () => null, optional: true },
  { key: "origen", question: "¿De dónde te mudás? (ciudad/barrio)", validate: v => v.trim().length > 0 ? null : "Por favor indicá el lugar de origen." },
  { key: "destino", question: "¿A dónde vas?", validate: v => v.trim().length > 0 ? null : "Por favor indicá el destino." },
  { key: "tamano", question: "¿Qué tamaño es la mudanza?\n1 — 1 ambiente\n2 — 2-3 ambientes\n3 — Local/oficina\n4 — Grande (4+ ambientes)", validate: v => ["1","2","3","4","1 ambiente","2-3 ambientes","local","grande","1 amb","2 amb","local/oficina","4+"].some(o => v.toLowerCase().includes(o)) ? null : "Elegí una opción: 1, 2, 3 o 4." },
  { key: "fecha", question: "¿Para qué fecha la necesitás?", validate: v => v.trim().length > 0 ? null : "Indicá una fecha." },
  { key: "observaciones", question: "¿Alguna observación extra? (opcional, 'skip' para saltar)", validate: () => null, optional: true }
];

function chatbotAddMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `chatbot-msg ${sender}`;
  div.textContent = text;
  const messages = $("#chatbotMessages");
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function chatbotShowTyping(show) {
  $("#chatbotTyping").style.display = show ? "" : "none";
  if (show) {
    const messages = $("#chatbotMessages");
    messages.scrollTop = messages.scrollHeight;
  }
}

function chatbotProcessStep() {
  const step = CHATBOT_STEPS[chatbotState.step];
  if (!step) {
    chatbotFinish();
    return;
  }
  const question = step.question.replace("{flete}", chatbotState.flete.nombre);
  chatbotShowTyping(true);
  setTimeout(() => {
    chatbotShowTyping(false);
    chatbotAddMessage(question, "bot");
    $("#chatbotInput").focus();
  }, 600);
}

function chatbotHandleInput(value) {
  const step = CHATBOT_STEPS[chatbotState.step];
  if (!step) return;

  chatbotAddMessage(value, "user");
  $("#chatbotInput").value = "";

  const error = step.validate(value);
  if (error) {
    setTimeout(() => chatbotAddMessage(error, "bot"), 300);
    return;
  }

  if (step.key === "email" && (value.toLowerCase() === "skip" || value.trim() === "")) {
    chatbotState.data[step.key] = "";
  } else if (step.key === "observaciones" && (value.toLowerCase() === "skip" || value.trim() === "")) {
    chatbotState.data[step.key] = "";
  } else {
    chatbotState.data[step.key] = value.trim();
  }

  chatbotState.step++;
  chatbotProcessStep();
}

function chatbotBuildWhatsAppMessage() {
  const d = chatbotState.data;
  const lines = [
    `Hola ${chatbotState.flete.nombre}, me comunico desde ForanIA.`,
    ``,
    `Nombre: ${d.nombre || ""}`,
    `Tel: ${d.telefono || ""}`,
  ];
  if (d.email) lines.push(`Email: ${d.email}`);
  lines.push(
    `Origen: ${d.origen || ""}`,
    `Destino: ${d.destino || ""}`,
    `Tamaño: ${d.tamano || ""}`,
    `Fecha: ${d.fecha || ""}`
  );
  if (d.observaciones) lines.push(`Observaciones: ${d.observaciones}`);
  return lines.join("\n");
}

async function chatbotFinish() {
  const msg = "¡Perfecto! Te voy a enviar todos tus datos por WhatsApp. ¡Dale a enviar!";
  chatbotShowTyping(true);
  setTimeout(async () => {
    chatbotShowTyping(false);
    chatbotAddMessage(msg, "bot");

    setTimeout(() => {
      const summary = [
        `📋 *Resumen de tu solicitud:*`,
        `Nombre: ${chatbotState.data.nombre}`,
        `Tel: ${chatbotState.data.telefono}`,
        chatbotState.data.email ? `Email: ${chatbotState.data.email}` : null,
        `Origen: ${chatbotState.data.origen}`,
        `Destino: ${chatbotState.data.destino}`,
        `Tamaño: ${chatbotState.data.tamano}`,
        `Fecha: ${chatbotState.data.fecha}`,
        chatbotState.data.observaciones ? `Obs: ${chatbotState.data.observaciones}` : null
      ].filter(Boolean).join("\n");
      chatbotAddMessage(summary, "bot");

      setTimeout(() => {
        const btnDiv = document.createElement("div");
        btnDiv.className = "chatbot-msg bot";
        btnDiv.innerHTML = `<button class="btn btn-primary chatbot-whatsapp-btn" id="chatbotWhatsAppBtn">&#128172; Enviar por WhatsApp</button>`;
        const messages = $("#chatbotMessages");
        messages.appendChild(btnDiv);
        messages.scrollTop = messages.scrollHeight;

        document.getElementById("chatbotWhatsAppBtn").addEventListener("click", () => {
          const waMsg = chatbotBuildWhatsAppMessage();
          const waUrl = `https://wa.me/${chatbotState.flete.whatsapp}?text=${encodeURIComponent(waMsg)}`;
          window.open(waUrl, "_blank");
        });
      }, 800);
    }, 700);

    // Guardar en backend
    try {
      await fetch(`${CHATBOT_API}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...chatbotState.data, flete_id: chatbotState.flete.id })
      });
    } catch (e) {
      // Backend opcional, no bloquea el flujo
    }
  }, 600);
}

function initChatbot(fleteId) {
  const flete = FLETES.find(f => f.id === fleteId);
  if (!flete) return;
  trackView(fleteId, null, fleteId);

  chatbotState = { step: 0, data: {}, flete };
  $("#chatbotSection").style.display = "";
  $("#chatbotEmoji").textContent = flete.emoji;
  $("#chatbotFleteName").textContent = flete.nombre;
  $("#chatbotFleteCobertura").textContent = `Cobertura: ${flete.cobertura}`;
  $("#chatbotMessages").innerHTML = "";
  $("#chatbotInput").value = "";
  $("#chatbotInput").focus();

  chatbotProcessStep();
}

function closeChatbot() {
  $("#chatbotSection").style.display = "none";
  chatbotState = { step: 0, data: {}, flete: null };
}

$("#chatbotSend").addEventListener("click", () => {
  const val = $("#chatbotInput").value.trim();
  if (val) chatbotHandleInput(val);
});

$("#chatbotInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const val = $("#chatbotInput").value.trim();
    if (val) chatbotHandleInput(val);
  }
});

$("#chatbotBack").addEventListener("click", closeChatbot);

/* ---------- Presupuesto Fletes ---------- */
function openQuoteModal() {
  const overlay = document.createElement("div");
  overlay.className = "overlay show";
  overlay.id = "quoteOverlay";
  overlay.style.zIndex = "250";

  const modal = document.createElement("div");
  modal.className = "modal show";
  modal.id = "quoteModal";
  modal.style.zIndex = "251";
  modal.innerHTML = `
    <button class="modal-close" id="quoteModalClose">&times;</button>
    <div class="detail-body">
      <h2 style="margin-bottom:6px">Solicitar presupuesto de mudanza</h2>
      <p class="muted" style="margin-bottom:16px">Completá los datos y los transportistas te contactarán.</p>
      <form class="form" id="quoteForm">
        <div class="form-row">
          <label>Nombre<input type="text" placeholder="Tu nombre" required></label>
          <label>Teléfono / WhatsApp<input type="tel" placeholder="+54 9 3804 ..." required></label>
        </div>
        <div class="form-row">
          <label>Dirección de origen<input type="text" placeholder="Ej: Centro, La Rioja" required></label>
          <label>Dirección de destino<input type="text" placeholder="Ej: Zona UNLaR" required></label>
        </div>
        <div class="form-row">
          <label>Tamaño de la mudanza<select required><option value="">Seleccionar...</option><option value="pequeña">Pequena (1 ambiente)</option><option value="mediana">Mediana (2-3 ambientes)</option><option value="grande">Grande (4+ ambientes)</option></select></label>
          <label>Fecha estimada<input type="date" required></label>
        </div>
        <label>Observaciones<textarea rows="3" placeholder="Ej: Horario preferido, accesos especiales..."></textarea></label>
        <button type="submit" class="btn btn-primary btn-lg">Enviar solicitud</button>
      </form>
    </div>`;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const closeModal = () => {
    overlay.remove();
    modal.remove();
  };

  modal.querySelector("#quoteModalClose").addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  modal.querySelector("#quoteForm").addEventListener("submit", (e) => {
    e.preventDefault();
    closeModal();
    toast("Solicitud de presupuesto enviada correctamente");
  });
}

$("#openQuoteForm").addEventListener("click", openQuoteModal);

/* ---------- Búsqueda hero ---------- */
function renderQuickResults(list) {
  const g = $("#quickResultsGrid");
  g.innerHTML = "";
  $("#quickResultsCount").textContent = `${list.length} alojamientos encontrados`;
  if (!list.length) {
    g.innerHTML = `<div class="card muted" style="grid-column:1/-1;text-align:center;padding:32px">No se encontraron propiedades con esos filtros.</div>`;
    return;
  }
  list.forEach(p => propCard(p, g));
  cardEvents(g);
}

$("#heroSearch").addEventListener("submit", (e) => {
  e.preventDefault();
  const uni = $("#searchUni").value;
  const bud = +$("#searchBudget").value;
  const tipo = $("#searchType").value;
  filteredProps = PROPERTIES.filter(p =>
    (!uni || p.uni === uni) &&
    (!bud || p.precio <= bud) &&
    (!tipo || p.tipo === tipo)
  );
  renderQuickResults(filteredProps);
  const qr = $("#quickResults");
  qr.style.display = "";
  qr.scrollIntoView({ behavior: "smooth", block: "start" });
  toast(`${filteredProps.length} resultado${filteredProps.length !== 1 ? 's' : ''} encontrado${filteredProps.length !== 1 ? 's' : ''}`);
});

$("#closeQuickResults").addEventListener("click", () => {
  $("#quickResults").style.display = "none";
  $("#quickResultsGrid").innerHTML = "";
});

/* ---------- Publicar ---------- */
$("#publishForm").addEventListener("submit", (e) => {
  e.preventDefault();
  toast("Propiedad publicada correctamente.");
  e.target.reset();
});

/* ---------- Init ---------- */
async function init() {
  await Promise.all([loadData(), loadReferences()]);
  renderFeatured();
  renderFletes();
  renderCatalog(PROPERTIES);
  $("#favCountTop").textContent = favorites.length;
  initProviderSection();
}
init();

/* ---------- Proveedores ---------- */
let providerLoggedIn = false;
let providerData = null;
let providerListings = [];
let providerTransportList = [];

async function initProviderSection() {
  const saved = JSON.parse(localStorage.getItem("forania_provider") || "null");
  if (saved) {
    providerData = saved;
    providerLoggedIn = true;
    await loadProviderDataFromAPI();
    showProviderPanel();
  }
}

async function loadProviderDataFromAPI() {
  if (!providerData?.id) return;
  try {
    if (providerData.tipo === "transportista") {
      const res = await fetch(`${API_URL}/proveedores/${providerData.id}/fletes`);
      if (res.ok) providerTransportList = await res.json();
    } else {
      const res = await fetch(`${API_URL}/proveedores/${providerData.id}/alojamientos`);
      if (res.ok) providerListings = await res.json();
    }
  } catch (err) {
    console.error("Error cargando datos del proveedor:", err);
  }
}

function showProviderLogin() {
  $("#providerLogin").style.display = "";
  $("#providerPanel").style.display = "none";
}

function showProviderPanel() {
  if (!providerData) return;
  $("#providerLogin").style.display = "none";
  $("#providerPanel").style.display = "";
  $("#provAvatar").textContent = providerData.nombre.charAt(0).toUpperCase();
  $("#provName").textContent = providerData.nombre;
  const tipoLabels = { propietario: "Propietario", inmobiliaria: "Inmobiliaria", transportista: "Transportista / Fletero" };
  $("#provType").textContent = tipoLabels[providerData.tipo] || providerData.tipo;
  if (providerData.tipo === "transportista") {
    $("#providerProperties").style.display = "none";
    $("#providerTransport").style.display = "";
    renderProviderTransport();
  } else {
    $("#providerProperties").style.display = "";
    $("#providerTransport").style.display = "none";
    renderProviderListings();
  }
  updateProviderStats();
}

function renderProviderListings() {
  const g = $("#providerListings");
  g.innerHTML = "";
  if (!providerListings.length) {
    $("#noListings").style.display = "";
    g.style.display = "none";
    return;
  }
  $("#noListings").style.display = "none";
  g.style.display = "";
  providerListings.forEach((p, i) => {
    const div = document.createElement("article");
    div.className = "card prop-card provider-listing-card";
    div.innerHTML = `
      <div class="prop-img" style="${bg(p.img || 'dep1')}">
        <span class="prop-tag">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · ${p.barrio}</span>
      </div>
      <div class="prop-body">
        <h3 class="prop-title">${p.nombre}</h3>
        <div class="prop-price">${fmt(p.precio)} <small>/ mes</small></div>
        <div class="prop-meta">
          <span>&#128205; ${p.barrio}</span>
          <span>&#128716; ${p.habs} hab · ${p.banos} baño</span>
        </div>
        <div class="prop-actions">
          <button class="btn btn-ghost btn-sm provider-edit-btn" data-idx="${i}">Editar</button>
          <button class="btn btn-ghost btn-sm provider-delete-btn" data-idx="${i}" style="color:#ef4444;border-color:#fecaca">Eliminar</button>
        </div>
      </div>`;
    g.appendChild(div);
  });
  g.querySelectorAll(".provider-edit-btn").forEach(b => b.addEventListener("click", () => editProviderListing(+b.dataset.idx)));
  g.querySelectorAll(".provider-delete-btn").forEach(b => b.addEventListener("click", () => deleteProviderListing(+b.dataset.idx)));
}

function renderProviderTransport() {
  const g = $("#providerTransportList");
  g.innerHTML = "";
  if (!providerTransportList.length) {
    $("#noTransport").style.display = "";
    g.style.display = "none";
    return;
  }
  $("#noTransport").style.display = "none";
  g.style.display = "";
  providerTransportList.forEach((t, i) => {
    const div = document.createElement("article");
    div.className = "card flete-card provider-listing-card";
    div.innerHTML = `
      <div class="flete-img" style="${bg(t.img || 'dep7')}">&#128666;</div>
      <h3>${t.nombre}</h3>
      <div class="prop-meta"><span>&#128666; ${t.tipo}</span></div>
      <div class="flete-cobertura">&#128205; Cobertura: ${t.cobertura}</div>
      <div class="prop-actions">
        <button class="btn btn-ghost btn-sm provider-edit-transport" data-idx="${i}">Editar</button>
        <button class="btn btn-ghost btn-sm provider-delete-transport" data-idx="${i}" style="color:#ef4444;border-color:#fecaca">Eliminar</button>
      </div>`;
    g.appendChild(div);
  });
  g.querySelectorAll(".provider-edit-transport").forEach(b => b.addEventListener("click", () => editProviderTransport(+b.dataset.idx)));
  g.querySelectorAll(".provider-delete-transport").forEach(b => b.addEventListener("click", () => deleteProviderTransport(+b.dataset.idx)));
}

async function updateProviderStats() {
  $("#provTotalProps").textContent = providerData.tipo === "transportista" ? providerTransportList.length : providerListings.length;
  try {
    const res = await fetch(`${API_URL}/proveedores/${providerData.id}/stats`);
    if (res.ok) {
      const stats = await res.json();
      $("#provViews").textContent = stats.vistas || 0;
      $("#provContacts").textContent = stats.contactos || 0;
      return;
    }
  } catch (e) {}
  $("#provViews").textContent = 0;
  $("#provContacts").textContent = 0;
}

function openProviderModal(title, formHTML) {
  $("#providerModalContent").innerHTML = `<h2 style="margin-bottom:6px">${title}</h2>${formHTML}`;
  $("#providerModal").classList.add("show");
  $("#providerOverlay").classList.add("show");
}

function closeProviderModal() {
  $("#providerModal").classList.remove("show");
  $("#providerOverlay").classList.remove("show");
}

function providerFormHTML(p) {
  const tiposOpts = (REFS.tipos_alojamiento || [])
    .map(t => `<option value="${t.nombre.toLowerCase()}" ${p && p.tipo === t.nombre.toLowerCase() ? 'selected' : ''}>${t.nombre}</option>`).join("");
  const barriosOpts = (REFS.barrios || [])
    .map(b => `<option value="${b.nombre}" ${p && p.barrio === b.nombre ? 'selected' : ''}>${b.nombre}</option>`).join("");
  return `
    <form class="form" id="providerPropForm">
      <div class="form-row">
        <label>Título<input type="text" id="ppNombre" value="${p ? p.nombre : ''}" placeholder="Ej: Departamento moderno" required></label>
        <label>Precio ($/mes)<input type="number" id="ppPrecio" value="${p ? p.precio : ''}" placeholder="320000" required></label>
      </div>
      <div class="form-row">
        <label>Tipo<select id="ppTipo"><option value="">Seleccionar...</option>${tiposOpts}</select></label>
        <label>Barrio<select id="ppBarrio"><option value="">Seleccionar...</option>${barriosOpts}</select></label>
      </div>
      <div class="form-row">
        <label>Habitaciones<input type="number" id="ppHabs" min="1" value="${p ? p.habs : 1}"></label>
        <label>Baños<input type="number" id="ppBanos" min="1" value="${p ? p.banos : 1}"></label>
      </div>
      <label>Descripción<textarea id="ppDesc" rows="3" placeholder="Describí tu propiedad...">${p ? p.desc : ''}</textarea></label>
      <label>Universidad
        <select id="ppUni">
          <option value="">Seleccionar...</option>
          ${(REFS.universidades || []).map(u => `<option value="${u.nombre}" ${p && p.uni === u.nombre ? 'selected' : ''}>${u.nombre}</option>`).join("")}
        </select>
      </label>
      <div class="filter-group checks">
        <label><input type="checkbox" id="ppWifi" ${p && p.wifi ? 'checked' : ''}> WiFi</label>
        <label><input type="checkbox" id="ppAmoblado" ${p && p.amoblado ? 'checked' : ''}> Amoblado</label>
        <label><input type="checkbox" id="ppCochera" ${p && p.cochera ? 'checked' : ''}> Cochera</label>
      </div>
      <button type="submit" class="btn btn-primary btn-lg">${p ? 'Guardar cambios' : 'Publicar propiedad'}</button>
    </form>`;
}

function transportFormHTML(t) {
  const vehiculosOpts = (REFS.tipos_vehiculo || [])
    .map(v => `<option value="${v.nombre}" ${t && t.tipo === v.nombre ? 'selected' : ''}>${v.nombre}</option>`).join("");
  return `
    <form class="form" id="providerTransForm">
      <label>Nombre del servicio<input type="text" id="ptNombre" value="${t ? t.nombre : ''}" placeholder="Ej: Mudanzas Express" required></label>
      <div class="form-row">
        <label>Tipo de vehículo<select id="ptTipo" required><option value="">Seleccionar...</option>${vehiculosOpts}</select></label>
        <label>Zona de cobertura<input type="text" id="ptCobertura" value="${t ? t.cobertura : ''}" placeholder="Ej: Toda La Rioja" required></label>
      </div>
      <button type="submit" class="btn btn-primary btn-lg">${t ? 'Guardar cambios' : 'Registrar servicio'}</button>
    </form>`;
}

function saveProviderData() {
  localStorage.setItem("forania_provider", JSON.stringify(providerData));
}

async function addProviderListing() {
  openProviderModal("Nueva propiedad", providerFormHTML(null));
  $("#providerPropForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      proveedor_id: providerData.id,
      titulo: $("#ppNombre").value,
      tipo: $("#ppTipo").value,
      precio_mensual: +$("#ppPrecio").value,
      barrio: $("#ppBarrio").value,
      habitaciones: +$("#ppHabs").value,
      banos: +$("#ppBanos").value,
      descripcion: $("#ppDesc").value,
      wifi: $("#ppWifi").checked,
      amoblado: $("#ppAmoblado").checked,
      cochera: $("#ppCochera").checked,
      universidad: $("#ppUni").value
    };
    try {
      const res = await fetch(`${API_URL}/alojamientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error al crear");
      await loadProviderDataFromAPI();
      renderProviderListings();
      updateProviderStats();
      closeProviderModal();
      toast("Propiedad publicada correctamente");
    } catch (err) {
      toast("Error al publicar propiedad");
      console.error(err);
    }
  });
}

async function editProviderListing(idx) {
  const p = providerListings[idx];
  openProviderModal("Editar propiedad", providerFormHTML(p));
  $("#providerPropForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      titulo: $("#ppNombre").value,
      tipo: $("#ppTipo").value,
      precio_mensual: +$("#ppPrecio").value,
      barrio: $("#ppBarrio").value,
      habitaciones: +$("#ppHabs").value,
      banos: +$("#ppBanos").value,
      descripcion: $("#ppDesc").value,
      wifi: $("#ppWifi").checked,
      amoblado: $("#ppAmoblado").checked,
      cochera: $("#ppCochera").checked,
      universidad: $("#ppUni").value
    };
    try {
      const res = await fetch(`${API_URL}/alojamientos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error al actualizar");
      await loadProviderDataFromAPI();
      renderProviderListings();
      closeProviderModal();
      toast("Propiedad actualizada");
    } catch (err) {
      toast("Error al actualizar propiedad");
      console.error(err);
    }
  });
}

async function deleteProviderListing(idx) {
  const p = providerListings[idx];
  if (!confirm("¿Eliminar esta propiedad?")) return;
  try {
    await fetch(`${API_URL}/alojamientos/${p.id}`, { method: "DELETE" });
    await loadProviderDataFromAPI();
    renderProviderListings();
    updateProviderStats();
    toast("Propiedad eliminada");
  } catch (err) {
    toast("Error al eliminar propiedad");
    console.error(err);
  }
}

async function addProviderTransport() {
  openProviderModal("Nuevo servicio de transporte", transportFormHTML(null));
  $("#providerTransForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      proveedor_id: providerData.id,
      nombre_comercial: $("#ptNombre").value,
      tipo_vehiculo: $("#ptTipo").value,
      cobertura: $("#ptCobertura").value,
      telefono: providerData.tel || "",
      email: providerData.email || "",
      whatsapp: providerData.whatsapp || ""
    };
    try {
      const res = await fetch(`${API_URL}/fletes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error al crear");
      await loadProviderDataFromAPI();
      renderProviderTransport();
      updateProviderStats();
      closeProviderModal();
      toast("Servicio registrado correctamente");
    } catch (err) {
      toast("Error al registrar servicio");
      console.error(err);
    }
  });
}

async function editProviderTransport(idx) {
  const t = providerTransportList[idx];
  openProviderModal("Editar servicio", transportFormHTML(t));
  $("#providerTransForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      nombre_comercial: $("#ptNombre").value,
      tipo_vehiculo: $("#ptTipo").value,
      cobertura: $("#ptCobertura").value,
      telefono: providerData.tel || "",
      email: providerData.email || "",
      whatsapp: providerData.whatsapp || ""
    };
    try {
      const res = await fetch(`${API_URL}/fletes/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error al actualizar");
      await loadProviderDataFromAPI();
      renderProviderTransport();
      closeProviderModal();
      toast("Servicio actualizado");
    } catch (err) {
      toast("Error al actualizar servicio");
      console.error(err);
    }
  });
}

async function deleteProviderTransport(idx) {
  const t = providerTransportList[idx];
  if (!confirm("¿Eliminar este servicio?")) return;
  try {
    await fetch(`${API_URL}/fletes/${t.id}`, { method: "DELETE" });
    await loadProviderDataFromAPI();
    renderProviderTransport();
    updateProviderStats();
    toast("Servicio eliminado");
  } catch (err) {
    toast("Error al eliminar servicio");
    console.error(err);
  }
}

$("#providerLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const nombre = form.querySelector('input[type="text"]').value;
  const tipo = $("#providerType").value;
  const email = form.querySelector('input[type="email"]').value;
  const tel = form.querySelector('input[type="tel"]').value;
  if (!tipo) { toast("Seleccioná un tipo de proveedor"); return; }

  try {
    const res = await fetch(`${API_URL}/proveedores/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, tipo, email, telefono: tel })
    });
    if (!res.ok) throw new Error("Error al iniciar sesión");
    const prov = await res.json();
    providerData = {
      id: prov.id,
      nombre: prov.nombre_comercial,
      tipo,
      email: prov.email,
      tel: prov.telefono,
      whatsapp: prov.whatsapp || tel.replace(/\s/g, "").replace("+", "")
    };
    providerLoggedIn = true;
    saveProviderData();
    await loadProviderDataFromAPI();
    showProviderPanel();
    toast(`Bienvenido, ${nombre}`);
  } catch (err) {
    toast("Error al iniciar sesión");
    console.error(err);
  }
});

$("#provLogout").addEventListener("click", () => {
  providerLoggedIn = false;
  providerData = null;
  providerListings = [];
  providerTransportList = [];
  localStorage.removeItem("forania_provider");
  showProviderLogin();
  toast("Sesión cerrada");
});

$("#addNewProp").addEventListener("click", addProviderListing);
$("#addNewTransport").addEventListener("click", addProviderTransport);
$("#providerModalClose").addEventListener("click", closeProviderModal);
$("#providerOverlay").addEventListener("click", closeProviderModal);
