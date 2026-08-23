/* ===== FORANIA — lógica y datos desde Supabase ===== */
"use strict";

/* ---------- Datos ---------- */
const bg = (img) => img ? `background:${img}` : "background:#a78bfa";

const API_URL = "/api";
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

/* ---------- Sesión ---------- */
let session = JSON.parse(localStorage.getItem("forania_session") || "null");
let currentUser = JSON.parse(localStorage.getItem("forania_user") || "null");
let linkedProvider = null;

function saveSession(s, u) {
  session = s;
  currentUser = u;
  localStorage.setItem("forania_session", JSON.stringify(s));
  localStorage.setItem("forania_user", JSON.stringify(u));
}
function clearSession() {
  session = null;
  currentUser = null;
  linkedProvider = null;
  localStorage.removeItem("forania_session");
  localStorage.removeItem("forania_user");
}
function estaLogueado() { return !!(session?.access_token && currentUser); }
function authHeaders(extra = {}) {
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}`, ...extra } : { ...extra };
}

async function refrescarSesion() {
  if (!session?.refresh_token) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refrescar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    if (!res.ok) return false;
    const data = await res.json();
    saveSession(data.session, currentUser);
    return true;
  } catch { return false; }
}

// fetch con token automático; si expiró, intenta refrescar y reintenta una vez
async function apiFetch(url, opts = {}) {
  let res = await fetch(url, { ...opts, headers: authHeaders(opts.headers || {}) });
  if (res.status === 401 && (await refrescarSesion())) {
    res = await fetch(url, { ...opts, headers: authHeaders(opts.headers || {}) });
  }
  return res;
}

/* ---------- Helpers ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fmt = (n) => "$" + Number(n).toLocaleString("es-AR");
function barrioName(p) {
  if (!p || !p.barrio) return '';
  return typeof p.barrio === 'string' ? p.barrio : (p.barrio.nombre || '');
}
function barrioField(p, field) {
  if (!p || !p.barrio) return '';
  if (typeof p.barrio === 'string') return '';
  return p.barrio[field] || '';
}
const toast = (msg, ms = 2200) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), ms);
};

function flashAlert(el) {
  if (!el) return;
  el.classList.remove("highlight-alert");
  void el.offsetWidth;
  el.classList.add("highlight-alert");
  setTimeout(() => el.classList.remove("highlight-alert"), 2600);
}

function alertarZona(el, msg) {
  toast(msg, 4500);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  flashAlert(el);
}

function validarRequeridos(form) {
  for (const campo of form.querySelectorAll("[required]")) {
    if (!campo.checkValidity()) {
      const label = campo.closest("label");
      const nombre = label ? (label.childNodes[0]?.textContent || "").trim() : "";
      alertarZona(
        label || campo,
        nombre ? `Falta completar: ${nombre}` : "Hay campos obligatorios sin completar"
      );
      campo.focus({ preventScroll: true });
      return campo;
    }
  }
  return null;
}

/* ---------- Navegación ---------- */
function goTo(page) {
  $$(".page").forEach(p => p.classList.remove("active"));
  $("#" + page).classList.add("active");
  $$(".nav-link").forEach(l => l.classList.toggle("active", l.dataset.nav === page));
  document.body.classList.remove("nav-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (page === "alquileres") renderCatalog(filteredProps);
if (page === "favoritos") { if (estaLogueado()) recargarFavoritosServidor().then(renderFavorites); renderFavorites(); }
if (page === "perfil") { $("#profFavs").textContent = favorites.length; $("#profComp").textContent = compare.length; updateAuthUI(); }
  if (page === "publicar") renderPublicarForm();
}

$$("[data-nav]").forEach(el => el.addEventListener("click", (e) => {
  e.preventDefault();
  goTo(el.dataset.nav);
}));
$("#hamburger").addEventListener("click", () => document.body.classList.toggle("nav-open"));
// Cierra el menú móvil al tocar fuera del drawer
document.addEventListener("click", (e) => {
  if (!document.body.classList.contains("nav-open")) return;
  if (e.target.closest(".nav") || e.target.closest("#hamburger")) return;
  document.body.classList.remove("nav-open");
});

/* ---------- Tarjetas ---------- */
function propCard(p, grid) {
  const fav = favorites.includes(p.id);
  const servs = p.servicios.slice(0, 2);
  const hasImg = Array.isArray(p.imgs) && p.imgs.length > 0;
  const imgStyle = hasImg
    ? ''
    : `style="${bg(p.img)}"`;
  const div = document.createElement("article");
  div.className = "card prop-card";
  div.innerHTML = `
    <div class="prop-img" ${imgStyle}>
      ${hasImg ? `<img src="${p.imgs[0]}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:var(--radius) var(--radius) 0 0">` : ''}
      <button class="prop-fav ${fav ? 'on' : ''}" data-fav="${p.id}">${fav ? "&#9829;" : "&#9825;"}</button>
      <span class="prop-tag">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · ${barrioName(p)}</span>
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
async function toggleFav(id) {
  const i = favorites.indexOf(id);
  const quitando = i >= 0;
  if (quitando) { favorites.splice(i, 1); } else { favorites.push(id); }

  if (estaLogueado()) {
    try {
      const res = await apiFetch(`${API_URL}/favoritos/${id}`, { method: quitando ? "DELETE" : "POST" });
      if (!res.ok) throw new Error("fallo");
      if (quitando) toast("Quitado de favoritos");
      else toast("Agregado a favoritos &#9829;");
    } catch {
      if (quitando) favorites.push(id); else favorites.splice(favorites.indexOf(id), 1);
      toast("No se pudo actualizar el favorito");
    }
  } else {
    localStorage.setItem("forania_favs", JSON.stringify(favorites));
    if (quitando) toast("Quitado de favoritos");
    else toast("Agregado a favoritos &#9829;");
  }
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
  const msg = $("#favMsg");
  if (estaLogueado()) {
    msg.textContent = list.length
      ? `${list.length} propiedades guardadas en tu cuenta`
      : "Todavía no tenés favoritos guardados en tu cuenta. Tocá el corazón en cualquier propiedad.";
  } else {
    msg.textContent = list.length
      ? `${list.length} favoritos locales de este navegador. Iniciá sesión para guardarlos en tu cuenta.`
      : "Todavía no tenés favoritos. Tocá el corazón en cualquier propiedad.";
  }
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
    (!barrio || barrioName(p).toLowerCase().includes(barrio.toLowerCase())) &&
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

/* ---------- Mapa Leaflet ---------- */
let leafletMap = null;
let mapMarkers = [];

const ICONS = {
  prop: L.divIcon({ className: "", html: '<div style="width:14px;height:14px;background:#16a34a;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,.35)"></div>', iconSize: [14,14], iconAnchor: [7,7] }),
  flete: L.divIcon({ className: "", html: '<div style="width:14px;height:14px;background:#f97316;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,.35)"></div>', iconSize: [14,14], iconAnchor: [7,7] }),
  uni: L.divIcon({ className: "", html: '<div style="width:18px;height:18px;background:#1d4ed8;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>', iconSize: [18,18], iconAnchor: [9,9] })
};

function initMap() {
  if (leafletMap) return;
  leafletMap = L.map("leafletMap", { zoomControl: true }).setView([-29.4450, -66.8550], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(leafletMap);

  const UNLaR = [-29.429795464675685, -66.86895000115601];
  const UTN = [-29.409302686325614, -66.83154047687555];
  L.marker(UNLaR, { icon: ICONS.uni }).addTo(leafletMap).bindPopup("<b>UNLaR</b>");
  L.marker(UTN, { icon: ICONS.uni }).addTo(leafletMap).bindPopup("<b>UTN</b>");

  setTimeout(() => leafletMap.invalidateSize(), 100);
}

function renderMap(list) {
  if (!leafletMap) initMap();
  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  list.forEach(p => {
    if (!p.lat || !p.lng) return;
    const m = L.marker([p.lat, p.lng], { icon: ICONS.prop }).addTo(leafletMap);
    m.bindPopup(`<b>${p.nombre}</b><br>${fmt(p.precio)}/mes<br>${barrioName(p)}`);
    m.on("click", () => openDetail(p.id));
    mapMarkers.push(m);
  });

  FLETES.forEach(f => {
    const coords = { 1:[-29.4220,-66.8530], 2:[-29.4300,-66.8660], 3:[-29.4100,-66.8400], 4:[-29.4180,-66.8600] };
    const c = coords[f.id];
    if (!c) return;
    const m = L.marker(c, { icon: ICONS.flete }).addTo(leafletMap);
    m.bindPopup(`<b>${f.nombre}</b><br>${f.tipo}`);
    mapMarkers.push(m);
  });

  setTimeout(() => leafletMap.invalidateSize(), 50);
}

$("#toggleMapBtn").addEventListener("click", () => {
  const m = $("#mapSection");
  const hidden = m.style.display === "none";
  m.style.display = hidden ? "" : "none";
  $("#toggleMapBtn").textContent = hidden ? "Ocultar mapa" : "Mostrar mapa";
  if (hidden && leafletMap) setTimeout(() => leafletMap.invalidateSize(), 100);
});

/* ---------- Detalle ---------- */
function openDetail(id) {
  const p = PROPERTIES.find(x => x.id === id);
  if (!p) return;
  if (p.proveedor_id) trackView(p.proveedor_id, p.id);
  const modal = $("#modal");

  const hasImgs = Array.isArray(p.imgs) && p.imgs.length > 0;
  // Miniaturas: hasta 4 imágenes reales secundarias; si faltan, fallback con gradiente
  const thumbSlots = [];
  if (hasImgs) {
    p.imgs.slice(1, 5).forEach(src => thumbSlots.push({ src }));
    if (p.imgs.length === 1) { thumbSlots.push({ op: ".85" }, { op: ".7" }); }
  } else {
    thumbSlots.push({ op: ".85" }, { op: ".7" });
  }
  const thumbsHTML = thumbSlots.map((t, i) =>
    t.src
      ? `<div class="lb-thumb" data-lb="${i + 1}"><img src="${t.src}" alt="" loading="lazy"></div>`
      : `<div style="${bg(p.img)}${t.op ? `;opacity:${t.op}` : ""}"></div>`
  ).join("");
  const galleryHTML = `<div class="gallery">
      <div class="gallery-main"${hasImgs ? ' data-lb="0"' : ""}${hasImgs ? "" : ` style="${bg(p.img)}"`}>${hasImgs ? `<img src="${p.imgs[0]}" alt="${p.nombre}">` : ""}</div>
      <div class="gallery-side">${thumbsHTML}</div>
    </div>`;

  $("#modalContent").innerHTML = `${galleryHTML}
    <div class="detail-body">
      <div class="detail-head">
        <div>
          <span class="prop-tag" style="position:static;background:#e8f4f8;color:var(--primary);display:inline-block;margin-bottom:8px">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · ${barrioName(p)}</span>
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
        <div><b>${p.propietario}</b><div class="muted" style="font-size:.85rem">Propietario verificado · ${barrioName(p)}${p.calle ? ' · ' + p.calle : ''}${p.referencia ? ' · ' + p.referencia : ''}</div></div>
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
  if (hasImgs) {
    $("#modalContent").querySelectorAll("[data-lb]").forEach(el => {
      el.addEventListener("click", () => openLightbox(p.imgs, +el.dataset.lb));
    });
  }
}
$("#modalClose").addEventListener("click", () => { $("#modal").classList.remove("show"); $("#overlay").classList.remove("show"); });
$("#overlay").addEventListener("click", () => { $("#modal").classList.remove("show"); $("#overlay").classList.remove("show"); });

/* ---------- Lightbox (visor ampliado) ---------- */
const lbState = { imgs: [], idx: 0, scale: 1 };

function lbApplyZoom() {
  $("#lbImg").style.transform = `scale(${lbState.scale})`;
}

function lbShow(i) {
  const n = lbState.imgs.length;
  if (!n) return;
  lbState.idx = ((i % n) + n) % n;
  lbState.scale = 1;
  lbApplyZoom();
  $("#lbImg").src = lbState.imgs[lbState.idx];
  $("#lbCounter").textContent = `${lbState.idx + 1} / ${n}`;
  const single = n <= 1;
  $("#lbPrev").style.display = single ? "none" : "";
  $("#lbNext").style.display = single ? "none" : "";
}

function openLightbox(imgs, i) {
  if (!Array.isArray(imgs) || !imgs.length) return;
  lbState.imgs = imgs;
  $("#lightbox").classList.add("show");
  document.body.style.overflow = "hidden";
  lbShow(i);
}

function closeLightbox() {
  $("#lightbox").classList.remove("show");
  document.body.style.overflow = "";
}

$("#lbClose").addEventListener("click", closeLightbox);
$("#lbPrev").addEventListener("click", () => lbShow(lbState.idx - 1));
$("#lbNext").addEventListener("click", () => lbShow(lbState.idx + 1));
$("#lightbox").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeLightbox();
});
$("#lightbox").addEventListener("wheel", (e) => {
  e.preventDefault();
  lbState.scale = Math.min(4, Math.max(1, lbState.scale + (e.deltaY < 0 ? 0.25 : -0.25)));
  lbApplyZoom();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (!$("#lightbox").classList.contains("show")) return;
  if (e.key === "Escape") closeLightbox();
  else if (e.key === "ArrowLeft") lbShow(lbState.idx - 1);
  else if (e.key === "ArrowRight") lbShow(lbState.idx + 1);
});

let lbTouchX = null;
$("#lightbox").addEventListener("touchstart", (e) => {
  lbTouchX = e.touches[0].clientX;
}, { passive: true });
$("#lightbox").addEventListener("touchend", (e) => {
  if (lbTouchX !== null && lbState.scale <= 1) {
    const dx = e.changedTouches[0].clientX - lbTouchX;
    if (Math.abs(dx) > 50) lbShow(lbState.idx + (dx < 0 ? 1 : -1));
  }
  lbTouchX = null;
}, { passive: true });

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
    if (!p) return;
    const el = document.createElement("div");
    el.className = "compare-thumb";
    if (Array.isArray(p.imgs) && p.imgs.length) {
      el.innerHTML = `<img src="${p.imgs[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:10px"><button data-rm="${id}">&times;</button>`;
    } else {
      el.style.background = p.img;
      el.innerHTML = `<button data-rm="${id}">&times;</button>`;
    }
    el.title = p.nombre;
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
      <div class="table-scroll"><table class="comp-table">
        ${head}
        ${row("Precio", p => `<b style="color:var(--primary)">${fmt(p.precio)}</b>`)}
        ${row("Distancia", p => `${p.dist.toFixed(1)} km · ${Math.round(p.dist * 12)} min cam · ${Math.round(p.dist * 4)} min bici · ${Math.round(p.dist * 2)} min auto`)}
        ${row("Tipo", p => p.tipo)}
        ${row("Habitaciones", p => p.habs)}
        ${row("WiFi", p => p.wifi ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
        ${row("Amoblado", p => p.amoblado ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
        ${row("Cochera", p => p.cochera ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
      </table></div>
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

/* ---------- Mi Cuenta: login y registro ---------- */

async function recargarFavoritosServidor() {
  try {
    const res = await apiFetch(`${API_URL}/favoritos`);
    if (!res.ok) return;
    const data = await res.json();
    data.alojamientos.forEach(a => {
      const i = PROPERTIES.findIndex(p => p.id === a.id);
      if (i >= 0) PROPERTIES[i] = a; else PROPERTIES.push(a);
    });
    favorites = data.ids.map(Number);
  } catch { /* silencioso */ }
}

async function sincronizarFavoritosLocales() {
  const locales = JSON.parse(localStorage.getItem("forania_favs") || "[]");
  if (locales.length) {
    try {
      const res = await apiFetch(`${API_URL}/favoritos/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: locales })
      });
      if (res.ok) localStorage.removeItem("forania_favs");
    } catch { /* se reintenta en el próximo login */ }
  }
  await recargarFavoritosServidor();
}

function updateAuthUI() {
  const logged = estaLogueado();
  $("#btnCuenta").style.display = logged ? "none" : "";
  $("#userChip").style.display = logged ? "" : "none";
  $$(".js-cuenta-mob").forEach(b => b.style.display = logged ? "none" : "");
  if (logged) {
    const n = (currentUser.nombre || currentUser.email || "Usuario").trim();
    $("#userName").textContent = n.split(" ")[0];
    $("#userAvatar").textContent = (n[0] || "U").toUpperCase();
    const pn = $("#profNombre");
    if (pn) pn.textContent = currentUser.nombre || "Usuario";
    const pe = $("#profEmail");
    if (pe) pe.textContent = currentUser.email || "";
    const pa = $("#profAvatar");
    if (pa) pa.textContent = (n[0] || "U").toUpperCase();
  } else {
    const pn = $("#profNombre");
    if (pn) pn.textContent = "Estudiante";
    const pe = $("#profEmail");
    if (pe) pe.textContent = "Iniciá sesión para guardar tus favoritos en la nube";
  }
  renderProviderGate();
}

const cuentaModal = () => $("#cuentaModal");

function openCuenta(tab = "login") {
  renderCuenta(tab);
  cuentaModal().classList.add("show");
  $("#overlayCuenta").classList.add("show");
}
function closeCuenta() {
  cuentaModal().classList.remove("show");
  $("#overlayCuenta").classList.remove("show");
}

function renderCuenta(tab) {
  $("#cuentaContent").innerHTML = `
    <div class="detail-body">
      <h2 style="margin-bottom:12px">Mi cuenta</h2>
      <div class="cuenta-tabs">
        <button class="cuenta-tab ${tab === "login" ? "active" : ""}" data-tab="login">Iniciar sesi&oacute;n</button>
        <button class="cuenta-tab ${tab === "registro" ? "active" : ""}" data-tab="registro">Crear cuenta</button>
      </div>
      <form class="form" id="formLogin" style="${tab === "login" ? "" : "display:none"}">
        <label>Email<input type="email" id="logEmail" placeholder="tucorreo@gmail.com" required></label>
        <label>Contrase&ntilde;a<input type="password" id="logPass" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" required minlength="6"></label>
        <p class="form-error" id="logErr"></p>
        <button type="submit" class="btn btn-primary btn-lg">Entrar</button>
      </form>
      <form class="form" id="formRegistro" style="${tab === "registro" ? "" : "display:none"}">
        <label>Nombre completo<input type="text" id="regNombre" placeholder="Ej: Juan P&eacute;rez" required></label>
        <label>Email<input type="email" id="regEmail" placeholder="tucorreo@gmail.com" required></label>
        <label>Contrase&ntilde;a<input type="password" id="regPass" placeholder="M&iacute;nimo 6 caracteres" required minlength="6"></label>
        <label>Confirmar contrase&ntilde;a<input type="password" id="regPass2" placeholder="Repet&iacute; la contrase&ntilde;a" required></label>
        <p class="form-error" id="regErr"></p>
        <button type="submit" class="btn btn-primary btn-lg">Crear mi cuenta</button>
      </form>
    </div>`;
  $$("#cuentaContent .cuenta-tab").forEach(b =>
    b.addEventListener("click", () => renderCuenta(b.dataset.tab))
  );
  $("#formLogin").addEventListener("submit", handleLogin);
  $("#formRegistro").addEventListener("submit", handleRegistro);
}

async function postAuthSuccess(data) {
  saveSession(data.session, data.usuario);
  closeCuenta();
  document.body.classList.remove("nav-open");
  updateAuthUI();
  toast(`¡Hola, ${(data.usuario.nombre || "").split(" ")[0]}!`);
  await sincronizarFavoritosLocales();
  await initProviderSection();
  $("#favCountTop").textContent = favorites.length;
  renderFeatured();
  if ($("#favoritos").classList.contains("active")) renderFavorites();
}

async function handleLogin(e) {
  e.preventDefault();
  const errEl = $("#logErr");
  errEl.textContent = "";
  const email = $("#logEmail").value.trim();
  const password = $("#logPass").value;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { errEl.textContent = data.error || "No se pudo iniciar sesión"; return; }
    await postAuthSuccess(data);
  } catch {
    errEl.textContent = "Error de conexión con el servidor";
  }
}

async function handleRegistro(e) {
  e.preventDefault();
  const errEl = $("#regErr");
  errEl.textContent = "";
  const nombre = $("#regNombre").value.trim();
  const email = $("#regEmail").value.trim();
  const password = $("#regPass").value;
  const password2 = $("#regPass2").value;

  if (nombre.length < 2) { errEl.textContent = "Ingresá tu nombre"; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = "El email no es válido"; return; }
  if (password.length < 6) { errEl.textContent = "La contraseña debe tener al menos 6 caracteres"; return; }
  if (password !== password2) { errEl.textContent = "Las contraseñas no coinciden"; return; }

  try {
    const res = await fetch(`${API_URL}/auth/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { errEl.textContent = data.error || "No se pudo crear la cuenta"; return; }
    if (data.requiereConfirmacion) {
      closeCuenta();
      toast("Cuenta creada. Revisá tu email para confirmarla.");
      return;
    }
    await postAuthSuccess(data);
  } catch {
    errEl.textContent = "Error de conexión con el servidor";
  }
}

$("#btnCuenta").addEventListener("click", () => openCuenta("login"));
$$(".js-cuenta-mob").forEach(b => b.addEventListener("click", () => openCuenta("login")));
$("#cuentaClose").addEventListener("click", closeCuenta);
$("#overlayCuenta").addEventListener("click", closeCuenta);

$("#userBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  $("#userMenu").classList.toggle("open");
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".user-chip")) $("#userMenu")?.classList.remove("open");
});

$("#btnLogout").addEventListener("click", async () => {
  clearSession();
  providerLoggedIn = false;
  providerData = null;
  providerListings = [];
  providerTransportList = [];
  localStorage.removeItem("forania_provider");
  favorites = JSON.parse(localStorage.getItem("forania_favs") || "[]");
  $("#favCountTop").textContent = favorites.length;
  $("#userMenu").classList.remove("open");
  updateAuthUI();
  renderProviderGate();
  renderFeatured();
  if ($("#favoritos").classList.contains("active")) renderFavorites();
  goTo("home");
  toast("Sesión cerrada");
});

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
          <label>Nombre<input type="text" id="qNombre" placeholder="Tu nombre" required></label>
          <label>Teléfono / WhatsApp<input type="tel" id="qTelefono" placeholder="+54 9 3804 ..." required></label>
        </div>
        <div class="form-row">
          <label>Dirección de origen<input type="text" id="qOrigen" placeholder="Ej: Centro, La Rioja" required></label>
          <label>Dirección de destino<input type="text" id="qDestino" placeholder="Ej: Zona UNLaR" required></label>
        </div>
        <div class="form-row">
          <label>Tamaño de la mudanza<select id="qTamano" required><option value="">Seleccionar...</option><option value="pequeña">Pequena (1 ambiente)</option><option value="mediana">Mediana (2-3 ambientes)</option><option value="grande">Grande (4+ ambientes)</option></select></label>
          <label>Fecha estimada<input type="date" id="qFecha" required></label>
        </div>
        <label>Observaciones<textarea id="qObs" rows="3" placeholder="Ej: Horario preferido, accesos especiales..."></textarea></label>
        <button type="submit" class="btn btn-primary btn-lg" id="qSubmitBtn">Enviar solicitud</button>
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

  modal.querySelector("#quoteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    try {
      const res = await apiFetch(`${API_URL}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: $("#qNombre").value.trim(),
          telefono: $("#qTelefono").value.trim(),
          origen: $("#qOrigen").value.trim(),
          destino: $("#qDestino").value.trim(),
          tamano: $("#qTamano").value,
          fecha: $("#qFecha").value,
          observaciones: $("#qObs").value.trim()
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error del servidor");
      }
      closeModal();
      toast("Solicitud enviada. Un transportista se va a contactar contigo.");
    } catch (err) {
      toast(`No se pudo enviar la solicitud: ${err.message}`);
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar solicitud";
    }
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
const UNLaR_COORDS = [-29.429795464675685, -66.86895000115601];
const UTN_COORDS = [-29.409302686325614, -66.83154047687555];

function calcDistInfo(lat, lng) {
  function hav(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return { dUnilar: hav(lat, lng, UNLaR_COORDS[0], UNLaR_COORDS[1]), dUtn: hav(lat, lng, UTN_COORDS[0], UTN_COORDS[1]) };
}

/* ---------- Mapa de edición (modal proveedor) ----------
   Misma lógica que el mapa de publicación: Leaflet + marcador
   arrastrable + geocodificación Nominatim. Se recrea en cada
   apertura del modal porque el contenedor se regenera. */
let editMiniMap = null;
let editMarker = null;
let editLat = null;
let editLng = null;

function resetEditMapState() {
  if (editMiniMap) { editMiniMap.remove(); editMiniMap = null; }
  editMarker = null;
  editLat = null;
  editLng = null;
}

function updateEditDistInfo() {
  const infoEl = document.getElementById("ppDistInfo");
  if (!editLat || !editLng || !infoEl) return;
  const { dUnilar, dUtn } = calcDistInfo(editLat, editLng);
  infoEl.style.display = "";
  infoEl.innerHTML = `<strong>${dUnilar.toFixed(1)} km</strong> de UNLaR &mdash; <strong>${dUtn.toFixed(1)} km</strong> de UTN`;
}

function placeEditMarker(lat, lng) {
  editLat = lat;
  editLng = lng;
  if (editMarker) {
    editMarker.setLatLng([lat, lng]);
  } else {
    editMarker = L.marker([lat, lng], { draggable: true }).addTo(editMiniMap);
    editMarker.on("dragend", (e) => {
      editLat = e.target.getLatLng().lat;
      editLng = e.target.getLatLng().lng;
      updateEditDistInfo();
    });
  }
  editMiniMap.setView([lat, lng], 15);
  updateEditDistInfo();
}

// Inicializa el mapa del modal. Si hay coordenadas guardadas,
// centra ahí y muestra el marcador; si no, vista general de La Rioja.
function initEditMap(lat, lng) {
  const container = document.getElementById("ppMapPreview");
  if (!container) return;
  container.style.display = "block";
  resetEditMapState();
  editMiniMap = L.map(container, { zoomControl: true }).setView(
    lat && lng ? [lat, lng] : [-29.445, -66.855],
    lat && lng ? 15 : 13
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(editMiniMap);
  editMiniMap.on("click", (e) => placeEditMarker(e.latlng.lat, e.latlng.lng));
  setTimeout(() => editMiniMap.invalidateSize(), 100);
  if (lat && lng) placeEditMarker(lat, lng);
}

async function geocodeEditAddress() {
  const btn = document.getElementById("ppGeocodeBtn");
  const calle = document.getElementById("ppCalle").value.trim();
  const barrio = document.getElementById("ppBarrio").value.trim();
  const statusEl = document.getElementById("ppGeocodeStatus");

  if (!statusEl) return;

  if (!calle) {
    statusEl.style.display = "";
    statusEl.className = "geocode-status error";
    statusEl.textContent = "Ingresá una calle y número para buscar.";
    return;
  }

  const btnText = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.textContent = "Buscando ubicación..."; }
  statusEl.style.display = "";
  statusEl.className = "geocode-status loading";
  statusEl.textContent = "Buscando ubicación...";

  try {
    const { found, hadNetworkError } = await buscarEnNominatim(calle, barrio);

    if (found) {
      initEditMap(parseFloat(found.lat), parseFloat(found.lon));
      statusEl.className = "geocode-status success";
      statusEl.textContent = `Ubicación encontrada: ${found.display_name.split(",").slice(0, 3).join(", ")}. Podés arrastrar el marcador para corregir la posición.`;
    } else if (hadNetworkError) {
      statusEl.className = "geocode-status error";
      statusEl.textContent = "Error de conexión con el servicio de mapas. Verificá tu conexión e intentá de nuevo, o colocá el marcador manualmente en el mapa.";
    } else {
      statusEl.className = "geocode-status error";
      statusEl.textContent = "No encontramos esa dirección. Podés seleccionar la ubicación manualmente en el mapa.";
    }
  } catch (err) {
    console.error("Geocoding error:", err);
    statusEl.className = "geocode-status error";
    statusEl.textContent = "Ocurrió un error al buscar la ubicación. Podés colocar el marcador manualmente en el mapa.";
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btnText; }
  }
}

/* ---------- Geocodificación con Nominatim ---------- */

// Viewbox de La Rioja Capital para priorizar/acotar resultados locales
const RIOJA_VIEWBOX = "-66.915,-29.355,-66.770,-29.500";

function nominatimUrl(query, bounded) {
  let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ar&viewbox=${RIOJA_VIEWBOX}`;
  if (bounded) url += "&bounded=1";
  return url;
}

async function fetchWithTimeout(url, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { headers: { "Accept-Language": "es" }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Núcleo de geocodificación compartido por Publicar y Editar.
// Intentos en orden: (1) acotado a La Rioja Capital, (2) incluyendo el
// barrio (si es un nombre real ayuda a desambiguar), (3) a nivel país.
// El campo "Referencia" no se envía: Nominatim no lo resuelve y empeora
// la búsqueda. Devuelve { found, hadNetworkError }.
async function buscarEnNominatim(calle, barrio) {
  const attempts = [
    { q: `${calle}, La Rioja, Argentina`, bounded: true },
    ...(barrio ? [{ q: `${calle}, ${barrio}, La Rioja, Argentina` }] : []),
    { q: `${calle}, La Rioja, Argentina` }
  ];

  let hadNetworkError = false;
  for (const attempt of attempts) {
    try {
      const res = await fetchWithTimeout(nominatimUrl(attempt.q, attempt.bounded));
      if (!res.ok) { hadNetworkError = true; continue; }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return { found: data[0], hadNetworkError };
    } catch (e) {
      hadNetworkError = true;
    }
  }
  return { found: null, hadNetworkError };
}

/* ---------- Sección Publicar ----------
   Reutiliza el generador del panel de proveedores (providerFormHTML)
   para que esta sección use el mismo formulario completo:
   características desde la base, universidad, fotos y mapa. */
async function renderPublicarForm() {
  const host = $("#publicarFormHost");
  if (!host) return;

  if (!estaLogueado()) {
    host.innerHTML = `
      <div class="card" style="text-align:center;padding:40px">
        <h3>Publicá tu propiedad en ForanIA</h3>
        <p class="muted" style="margin:10px auto 16px;max-width:420px">Necesitás una sesión iniciada para publicar. Creá tu cuenta en un minuto.</p>
        <button class="btn btn-primary btn-lg" id="pubLoginBtn">Iniciar sesi&oacute;n / Crear cuenta</button>
      </div>`;
    $("#pubLoginBtn").addEventListener("click", () => openCuenta("login"));
    return;
  }

  if (!providerData) await initProviderSection();

  if (!providerData) {
    host.innerHTML = `
      <div class="card" style="text-align:center;padding:40px">
        <h3>Activá tu perfil para publicar</h3>
        <p class="muted" style="margin:10px auto 16px;max-width:440px">Vinculá tu cuenta con un perfil de propietario o inmobiliaria desde la sección Proveedores.</p>
        <button class="btn btn-primary btn-lg" id="pubGoProv">Ir a Proveedores</button>
      </div>`;
    $("#pubGoProv").addEventListener("click", () => goTo("proveedores"));
    return;
  }

  if (providerData.tipo === "transportista") {
    host.innerHTML = `
      <div class="card" style="text-align:center;padding:40px">
        <h3>Tu perfil es de transportista</h3>
        <p class="muted" style="margin:10px auto 16px;max-width:480px">Las propiedades se publican con un perfil de propietario o inmobiliaria. Tus servicios de mudanza se gestionan desde el panel de proveedores.</p>
        <button class="btn btn-primary btn-lg" id="pubGoProv">Ir a mi panel</button>
      </div>`;
    $("#pubGoProv").addEventListener("click", () => goTo("proveedores"));
    return;
  }

  host.innerHTML = `<div class="card">${providerFormHTML(null)}</div>`;
  const imgState = setupFormImages();
  setupAgregarCaracteristica();
  initEditMap(null, null);
  $("#ppGeocodeBtn").addEventListener("click", geocodeEditAddress);
  $("#providerPropForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (validarRequeridos(e.target)) return;

    if (!editLat || !editLng) {
      alertarZona(
        document.getElementById("ppMapPreview"),
        "Falta la ubicación: buscá la dirección o hacé click en el mapa para colocar el marcador"
      );
      return;
    }

    const payload = {
      proveedor_id: providerData.id,
      titulo: $("#ppNombre").value,
      tipo: $("#ppTipo").value,
      precio_mensual: +$("#ppPrecio").value,
      barrio: $("#ppBarrio").value,
      calle: $("#ppCalle").value.trim(),
      referencia: $("#ppReferencia").value.trim(),
      habitaciones: +$("#ppHabs").value,
      banos: +$("#ppBanos").value,
      descripcion: $("#ppDesc").value,
      latitud: editLat,
      longitud: editLng,
      caracteristicas: colectarCaracteristicas(),
      universidad: $("#ppUni").value
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const res = await apiFetch(`${API_URL}/alojamientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error del servidor");
      }
      const result = await res.json().catch(() => ({}));

      if (imgState && imgState.hasNew() && result.id) {
        const imgRes = await apiFetch(`${API_URL}/alojamientos/${result.id}/imagenes`, {
          method: "POST",
          headers: authHeaders(),
          body: imgState.buildFormData()
        });
        if (!imgRes.ok) toast("Propiedad publicada, pero hubo un error al subir las fotos");
      }

      toast("¡Propiedad publicada correctamente!");
      loadProviderDataFromAPI();
      renderPublicarForm();
    } catch (err) {
      toast(`Error al publicar: ${err.message}`);
      console.error(err);
      submitBtn.disabled = false;
    }
  });
}

/* ---------- Init ---------- */
function initCarousel() {
  const slides = document.querySelectorAll(".hero-carousel-slide");
  if (!slides.length) return;
  let current = 0;
  const total = slides.length;
  const INTERVAL = 9000;
  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % total;
    slides[current].classList.add("active");
  }, INTERVAL);
}

async function init() {
  await Promise.all([loadData(), loadReferences()]);
  renderFeatured();
  renderFletes();
  renderCatalog(PROPERTIES);
  $("#favCountTop").textContent = favorites.length;
  updateAuthUI();
  initProviderSection();
  initCarousel();
}
init();

/* ---------- Proveedores ---------- */
let providerLoggedIn = false;
let providerData = null;
let providerListings = [];
let providerTransportList = [];
let providerSolicitudes = [];

async function initProviderSection() {
  if (!estaLogueado()) { renderProviderGate(); return; }
  try {
    const res = await apiFetch(`${API_URL}/auth/perfil`);
    if (res.ok) {
      const data = await res.json();
      linkedProvider = data.proveedor || null;
    } else {
      linkedProvider = null;
    }
  } catch {
    linkedProvider = null;
  }

  if (linkedProvider) {
    providerData = {
      id: linkedProvider.id,
      nombre: linkedProvider.nombre_comercial,
      tipo: linkedProvider.tipo_proveedor_id === 3 ? "transportista" : "propietario",
      email: currentUser?.email || "",
      tel: linkedProvider.telefono || "",
      whatsapp: linkedProvider.whatsapp || ""
    };
    if (linkedProvider.tipo_proveedor_id === 2) providerData.tipo = "inmobiliaria";
    providerLoggedIn = true;
    saveProviderData();
    await loadProviderDataFromAPI();
    showProviderPanel();
  } else {
    providerLoggedIn = false;
    providerData = null;
    renderProviderGate();
  }
}

// Controla qué se muestra en la sección Proveedores según el estado de sesión
function renderProviderGate() {
  const loginBox = $("#providerLogin");
  const panel = $("#providerPanel");
  if (!loginBox) return;

  // Caso 3: con proveedor vinculado -> el panel manda
  if (estaLogueado() && linkedProvider) return;

  panel.style.display = "none";

  // Caso 1: sin sesión -> invitación a entrar
  if (!estaLogueado()) {
    loginBox.style.display = "";
    loginBox.innerHTML = `
      <h3>Accedé con tu cuenta</h3>
      <p class="muted" style="margin-bottom:16px">Para publicar y gestionar propiedades o servicios de mudanza necesitás una sesión iniciada.</p>
      <button class="btn btn-primary btn-lg" id="gateLoginBtn">Iniciar sesi&oacute;n / Crear cuenta</button>`;
    $("#gateLoginBtn")?.addEventListener("click", () => openCuenta("login"));
    return;
  }

  // Caso 2: con sesión pero sin perfil de proveedor -> formulario para activarlo
  loginBox.style.display = "";
  loginBox.innerHTML = `
    <h3>Activá tu perfil de proveedor</h3>
    <p class="muted" style="margin-bottom:16px">Hola ${currentUser?.nombre?.split(" ")[0] || ""}, vinculá tu cuenta con un perfil para publicar.</p>
    <form class="form" id="vincularForm">
      <div class="form-row">
        <label>Nombre o Empresa<input type="text" id="vinNombre" placeholder="Ej: Inmobiliaria La Rioja" required></label>
        <label>Tipo de proveedor<select id="vinTipo" required>
          <option value="">Seleccionar...</option>
          <option value="propietario">Propietario</option>
          <option value="inmobiliaria">Inmobiliaria</option>
          <option value="transportista">Transportista / Fletero</option>
        </select></label>
      </div>
      <label>Tel&eacute;fono / WhatsApp<input type="tel" id="vinTel" placeholder="+54 9 3804 ..." required></label>
      <p class="form-error" id="vinErr"></p>
      <button type="submit" class="btn btn-primary btn-lg">Crear mi perfil y entrar al panel</button>
    </form>`;
  $("#vincularForm").addEventListener("submit", handleVincular);
}

async function handleVincular(e) {
  e.preventDefault();
  const errEl = $("#vinErr");
  errEl.textContent = "";
  const nombre = $("#vinNombre").value.trim();
  const tipo = $("#vinTipo").value;
  const telefono = $("#vinTel").value.trim();
  if (!tipo) { errEl.textContent = "Seleccioná un tipo de proveedor"; return; }

  try {
    const res = await apiFetch(`${API_URL}/proveedores/vincular`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, tipo, telefono })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { errEl.textContent = data.error || "No se pudo crear el perfil"; return; }
    toast("¡Perfil de proveedor creado!");
    await initProviderSection();
  } catch {
    errEl.textContent = "Error de conexión";
  }
}

async function loadProviderDataFromAPI() {
  if (!providerData?.id) return;
  try {
    if (providerData.tipo === "transportista") {
      const res = await fetch(`${API_URL}/proveedores/${providerData.id}/fletes`);
      if (res.ok) providerTransportList = await res.json();
      const solRes = await fetch(`${API_URL}/proveedores/${providerData.id}/solicitudes`, { headers: authHeaders() });
      if (solRes.ok) providerSolicitudes = await solRes.json();
    } else {
      const res = await fetch(`${API_URL}/proveedores/${providerData.id}/alojamientos`);
      if (res.ok) providerListings = await res.json();
    }
  } catch (err) {
    console.error("Error cargando datos del proveedor:", err);
  }
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
    renderProviderSolicitudes();
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
    const hasImg = Array.isArray(p.imgs) && p.imgs.length > 0;
    const imgStyle = hasImg ? '' : `style="${bg(p.img || 'dep1')}"`;
    const div = document.createElement("article");
    div.className = "card prop-card provider-listing-card";
    div.innerHTML = `
      <div class="prop-img" ${imgStyle}>
        ${hasImg ? `<img src="${p.imgs[0]}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:var(--radius) var(--radius) 0 0">` : ''}
        <span class="prop-tag">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · ${barrioName(p)}</span>
      </div>
      <div class="prop-body">
        <h3 class="prop-title">${p.nombre}</h3>
        <div class="prop-price">${fmt(p.precio)} <small>/ mes</small></div>
        <div class="prop-meta">
          <span>📍 ${barrioName(p)}</span>
          <span>🛏 ${p.habs} hab · ${p.banos} baño</span>
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

function escHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const ESTADO_SOLICITUD = { pendiente: "#b45309", contactada: "#15803d", cerrada: "#64748b" };

function renderProviderSolicitudes() {
  const g = $("#providerSolicitudesList");
  if (!g) return;
  g.innerHTML = "";
  if (!providerSolicitudes.length) {
    $("#noSolicitudes").style.display = "";
    g.style.display = "none";
    return;
  }
  $("#noSolicitudes").style.display = "none";
  g.style.display = "";
  providerSolicitudes.forEach(s => {
    const fechaTxt = s.fecha_mudanza
      ? new Date(`${s.fecha_mudanza}T00:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
      : "A coordinar";
    const colorEstado = ESTADO_SOLICITUD[s.estado] || "#64748b";
    const wa = s.telefono ? `https://wa.me/${s.telefono.replace(/[^0-9]/g, "")}` : null;
    const div = document.createElement("article");
    div.className = "card provider-listing-card";
    div.style.padding = "16px";
    div.innerHTML = `
      <div class="prop-meta">
        <strong>${escHtml(s.nombre_contacto)}</strong>
        <span class="prop-tag">${s.proveedor_id ? "Directa" : "General"}</span>
      </div>
      <div class="prop-meta" style="margin-top:8px">
        <span>&#128205; ${escHtml(s.origen)}</span>
        <span>&#10145; ${escHtml(s.destino)}</span>
      </div>
      <div class="prop-meta" style="margin-top:8px">
        <span>Tama&ntilde;o: ${escHtml(s.tamano) || "&mdash;"}</span>
        <span>Fecha: ${fechaTxt}</span>
      </div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:600;color:${colorEstado};text-transform:uppercase">${escHtml(s.estado)}</span>
        ${wa ? `<a class="btn btn-primary btn-sm" href="${wa}" target="_blank" rel="noopener">Contactar por WhatsApp</a>` : ""}
      </div>
      ${s.observaciones ? `<p class="muted" style="margin-top:10px;font-size:14px">${escHtml(s.observaciones)}</p>` : ""}
    `;
    g.appendChild(div);
  });
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
  const tieneFotos = p && Array.isArray(p.imgs) && p.imgs.length > 0;
  const serviciosActuales = (p && Array.isArray(p.servicios)) ? p.servicios : [];
  const fotosActualesHTML = p
    ? (tieneFotos ? `
      <label>Fotos actuales</label>
      <div class="form-images-grid" id="ppExistingImages">
        ${p.imgs.map((src, i) => `
          <div class="publish-preview-item">
            <img src="${src}" alt="Foto ${i + 1}">
            <button type="button" class="remove-btn" data-rm-existing="${(p.imgIds || [])[i] ?? ''}">&times;</button>
          </div>`).join("")}
      </div>` : `<p style="color:var(--muted);font-size:.85rem;margin:0 0 8px">Sin fotos todavía. Agregá las primeras abajo.</p>`)
    : "";
  const fotosHTML = `
    ${fotosActualesHTML}
    <label class="file-upload-label" for="ppFiles">${p ? "Agregar fotos" : "Fotos (opcional)"} — hasta 10, máx. 5MB c/u</label>
    <input type="file" id="ppFiles" multiple accept="image/*" class="file-upload-input">
    <div class="form-images-grid" id="ppNewPreview"></div>
  `;
  const caracteristicasHTML = `
    <label>Características</label>
    <div class="filter-group checks" id="ppCaracts">
      ${(REFS.caracteristicas || []).map(c => `
        <label><input type="checkbox" value="${c.nombre}" ${serviciosActuales.includes(c.nombre) ? 'checked' : ''}> ${c.nombre}</label>`).join("")}
    </div>
    <div class="form-row">
      <label>Nueva característica<input type="text" id="ppNuevaCaract" placeholder="Ej: Patio interno"></label>
      <label style="align-self:flex-end"><button type="button" class="btn btn-ghost" id="ppAddCaract">+ Agregar</button></label>
    </div>
  `;
  return `
     <form class="form" id="providerPropForm" novalidate>
      <div class="form-row">
        <label>Título<input type="text" id="ppNombre" value="${p ? p.nombre : ''}" placeholder="Ej: Departamento moderno" required></label>
        <label>Precio ($/mes)<input type="number" id="ppPrecio" value="${p ? p.precio : ''}" placeholder="320000" required></label>
      </div>
      <div class="form-row">
        <label>Tipo<select id="ppTipo" required><option value="">Seleccionar...</option>${tiposOpts}</select></label>
        <label>Barrio<select id="ppBarrio"><option value="">Seleccionar...</option>${barriosOpts}</select></label>
      </div>
      <div class="form-row">
        <label>Calle y número<input type="text" id="ppCalle" value="${p ? (p.calle || '') : ''}" placeholder="Ej: San Martín 450" required></label>
        <label>Referencia (opcional)<input type="text" id="ppReferencia" value="${p ? (p.referencia || '') : ''}" placeholder="Ej: frente a la plaza"></label>
      </div>
      <button type="button" class="btn btn-ghost" id="ppGeocodeBtn" style="margin-bottom:8px">Buscar ubicación</button>
      <div id="ppGeocodeStatus" class="geocode-status" style="display:none"></div>
      <div id="ppMapPreview" class="publish-map-preview"></div>
      <div id="ppDistInfo" class="dist-info" style="display:none"></div>
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
      ${caracteristicasHTML}
      ${fotosHTML}
      <button type="submit" class="btn btn-primary btn-lg">${p ? 'Guardar cambios' : 'Publicar propiedad'}</button>
    </form>`;
}

// Lee las características marcadas en el formulario del proveedor
function colectarCaracteristicas() {
  return $$("#ppCaracts input:checked")
    .map(cb => cb.closest("label").textContent.trim())
    .filter(Boolean);
}

// Conecta el input "+ Agregar característica": crea un checkbox marcado,
// sin duplicados (comparación case-insensitive) y con espacios normalizados
function setupAgregarCaracteristica() {
  const input = $("#ppNuevaCaract");
  const btn = $("#ppAddCaract");
  const grid = $("#ppCaracts");
  if (!input || !btn || !grid) return;

  function agregar() {
    const nombre = input.value.trim().replace(/\s+/g, " ");
    if (!nombre) { toast("Escribí el nombre de la característica"); return; }
    const existentes = $$("#ppCaracts label").map(l => l.textContent.trim().toLowerCase());
    if (existentes.includes(nombre.toLowerCase())) { toast("Esa característica ya está en la lista"); return; }
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" checked> ${nombre}`;
    grid.appendChild(label);
    input.value = "";
  }

  btn.addEventListener("click", agregar);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); agregar(); }
  });
}

function setupFormImages() {
  const input = $("#ppFiles");
  if (!input) return null;

  const newImages = [];
  const removedImageIds = [];
  const existingGrid = $("#ppExistingImages");
  const previewGrid = $("#ppNewPreview");

  function renderPreviews() {
    if (!previewGrid) return;
    previewGrid.innerHTML = "";
    newImages.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "publish-preview-item";
      div.innerHTML = `<img src="${item.src}" alt="Nueva foto ${i + 1}"><button type="button" class="remove-btn" data-rm-new="${i}">&times;</button>`;
      previewGrid.appendChild(div);
    });
    previewGrid.querySelectorAll("[data-rm-new]").forEach(b => {
      b.addEventListener("click", () => {
        newImages.splice(+b.dataset.rmNew, 1);
        renderPreviews();
      });
    });
  }

  if (existingGrid) {
    existingGrid.querySelectorAll("[data-rm-existing]").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.dataset.rmExisting;
        if (!id) return;
        if (!removedImageIds.includes(id)) removedImageIds.push(id);
        b.closest(".publish-preview-item").remove();
      });
    });
  }

  input.addEventListener("change", (e) => {
    const maxSize = 5 * 1024 * 1024;
    Array.from(e.target.files).forEach(file => {
      if (newImages.length >= 10) { toast("Máximo 10 fotos nuevas"); return; }
      if (!file.type.startsWith("image/")) { toast("Solo se aceptan imágenes"); return; }
      if (file.size > maxSize) { toast(`${file.name} supera 5MB`); return; }
      const item = { file, src: "" };
      newImages.push(item);
      const reader = new FileReader();
      reader.onload = (ev) => { item.src = ev.target.result; renderPreviews(); };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
    renderPreviews();
  });

  return {
    removedImageIds,
    hasNew: () => newImages.length > 0,
    buildFormData: () => {
      const fd = new FormData();
      newImages.forEach(it => fd.append("fotos", it.file));
      return fd;
    }
  };
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

async function editProviderListing(idx) {
  const p = providerListings[idx];
  openProviderModal("Editar propiedad", providerFormHTML(p));
  const imgState = setupFormImages();
  setupAgregarCaracteristica();
  initEditMap(p.lat, p.lng);
  const geocodeBtn = $("#ppGeocodeBtn");
  if (geocodeBtn) geocodeBtn.addEventListener("click", geocodeEditAddress);
  $("#providerPropForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (validarRequeridos(e.target)) return;

    if (!editLat || !editLng) {
      alertarZona(
        document.getElementById("ppMapPreview"),
        "Falta la ubicación: buscá la dirección o hacé click en el mapa para colocar el marcador"
      );
      return;
    }

    const payload = {
      titulo: $("#ppNombre").value,
      tipo: $("#ppTipo").value,
      precio_mensual: +$("#ppPrecio").value,
      barrio: $("#ppBarrio").value,
      calle: $("#ppCalle").value.trim(),
      referencia: $("#ppReferencia").value.trim(),
      habitaciones: +$("#ppHabs").value,
      banos: +$("#ppBanos").value,
      descripcion: $("#ppDesc").value,
      latitud: editLat,
      longitud: editLng,
      caracteristicas: colectarCaracteristicas(),
      universidad: $("#ppUni").value
    };
    try {
      const res = await apiFetch(`${API_URL}/alojamientos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al actualizar");
      }

      if (imgState) {
        for (const imgId of imgState.removedImageIds) {
          await apiFetch(`${API_URL}/imagenes/${imgId}`, { method: "DELETE" });
        }
        if (imgState.hasNew()) {
          const imgRes = await apiFetch(`${API_URL}/alojamientos/${p.id}/imagenes`, {
            method: "POST",
            headers: authHeaders(),
            body: imgState.buildFormData()
          });
          if (!imgRes.ok) toast("Propiedad actualizada, pero hubo un error al subir las fotos");
        }
      }

      await loadProviderDataFromAPI();
      renderProviderListings();
      closeProviderModal();
      toast("Propiedad actualizada");
    } catch (err) {
      toast(`Error al actualizar propiedad: ${err.message}`);
      console.error(err);
    }
  });
}

async function deleteProviderListing(idx) {
  const p = providerListings[idx];
  if (!confirm("¿Eliminar esta propiedad?")) return;
  try {
    const res = await apiFetch(`${API_URL}/alojamientos/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al eliminar");
    }
    await loadProviderDataFromAPI();
    renderProviderListings();
    updateProviderStats();
    toast("Propiedad eliminada");
  } catch (err) {
    toast(err.message.includes("permiso") ? err.message : "Error al eliminar propiedad");
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
      const res = await apiFetch(`${API_URL}/fletes`, {
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
      const res = await apiFetch(`${API_URL}/fletes/${t.id}`, {
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
    const res = await apiFetch(`${API_URL}/fletes/${t.id}`, { method: "DELETE" });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al eliminar");
    }
    await loadProviderDataFromAPI();
    renderProviderTransport();
    updateProviderStats();
    toast("Servicio eliminado");
  } catch (err) {
    toast(err.message.includes("permiso") ? err.message : "Error al eliminar servicio");
    console.error(err);
  }
}

// El login viejo por email fue reemplazado por el flujo de sesión real:
// renderProviderGate() + handleVincular() gestionan esta sección.
// El botón "Cerrar sesión" del panel se quitó: el menú del usuario
// en el header (#btnLogout) cubre desktop y móvil.

  $("#addNewProp").addEventListener("click", () => goTo("publicar"));
$("#addNewTransport").addEventListener("click", addProviderTransport);
$("#providerModalClose").addEventListener("click", closeProviderModal);
$("#providerOverlay").addEventListener("click", closeProviderModal);
