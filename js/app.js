/* ===== FORANIA — lógica y datos simulados ===== */
"use strict";

/* ---------- Datos ---------- */
const IMGS = {
  dep1: "linear-gradient(135deg,#8b5cf6,#4c1d95)",
  dep2: "linear-gradient(135deg,#3b82f6,#1e40af)",
  dep3: "linear-gradient(135deg,#f59e0b,#b45309)",
  dep4: "linear-gradient(135deg,#10b981,#047857)",
  dep5: "linear-gradient(135deg,#ec4899,#831843)",
  dep6: "linear-gradient(135deg,#06b6d4,#155e75)",
  dep7: "linear-gradient(135deg,#f97316,#7c2d12)",
  dep8: "linear-gradient(135deg,#6366f1,#312e81)",
  dep9: "linear-gradient(135deg,#14b8a6,#115e59)",
  dep10: "linear-gradient(135deg,#a855f7,#581c87)",
  dep11: "linear-gradient(135deg,#f43f5e,#9f1239)",
  dep12: "linear-gradient(135deg,#64748b,#1e293b)"
};
const bg = (img) => img ? `background:${img}` : "background:#a78bfa";

const PROPERTIES = [
  { id:1, nombre:"Departamento moderno en Centro", tipo:"departamento", precio:320000, barrio:"Centro", dist:3.0, uni:"UNLaR", habs:2, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Aire acondicionado","Mesa de estudio"], img:"dep1", propietario:"María González", propAv:"MG", tel:"+54 9 3804 123456", email:"maria.gonzalez@email.com", whatsapp:"+5493804123456", desc:"Departamento luminoso en pleno centro, a pasos de la peatonal y a minutos de la UNLaR. Ideal para estudiantes que buscan comodidad y cercanía.", lat:-29.4126, lng:-66.8445 },
  { id:2, nombre:"Monoambiente Zona UNLaR", tipo:"departamento", precio:220000, barrio:"Zona UNLaR", dist:1.5, uni:"UNLaR", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Mesa de estudio","Lavadora"], img:"dep2", propietario:"Carlos Sosa", propAv:"CS", tel:"+54 9 3804 234567", email:"carlos.sosa@email.com", whatsapp:"+5493804234567", desc:"Monoambiente amoblado a 4 cuadras de la UNLaR. Podés ir caminando y olvidarte del bondi.", lat:-29.4223, lng:-66.8822 },
  { id:3, nombre:"Casa con patio en San Vicente", tipo:"casa", precio:400000, barrio:"San Vicente", dist:3.0, uni:"UNLaR", habs:3, banos:2, wifi:true, amoblado:false, cochera:true, servicios:["Cochera","Patio","WiFi","Calefacción"], img:"dep3", propietario:"Laura Fernández", propAv:"LF", tel:"+54 9 3804 345678", email:"laura.fernandez@email.com", whatsapp:"+5493804345678", desc:"Casa amplia con patio y cochera, ideal para compartir entre 3 estudiantes. Zona tranquila y segura.", lat:-29.405691904492766, lng:-66.84856910945868 },
  { id:4, nombre:"Habitación en Coquimbito", tipo:"habitacion", precio:150000, barrio:"Coquimbito", dist:1.2, uni:"UTN", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Gastos incluidos"], img:"dep4", propietario:"Jorge Medina", propAv:"JM", tel:"+54 9 3804 456789", email:"jorge.medina@email.com", whatsapp:"+5493804456789", desc:"Habitación individual en casa compartida con otros estudiantes. Gastos y wifi incluidos en el precio.", lat:-29.416394976505227, lng:-66.83698377723476 },
  { id:5, nombre:"Departamento Santa Justina", tipo:"departamento", precio:280000, barrio:"Santa Justina", dist:4.3, uni:"UTN", habs:2, banos:1, wifi:true, amoblado:false, cochera:true, servicios:["Cochera","WiFi","Balcón"], img:"dep5", propietario:"Ana Ríos", propAv:"AR", tel:"+54 9 3804 567890", email:"ana.rios@email.com", whatsapp:"+5493804567890", desc:"Dúplex de 2 dormitorios con balcón y cochera cubierta. Excelente relación precio-superficie.", lat:-29.436423918757917, lng:-66.87366214101084 },
  { id:6, nombre:"Loft amueblado Centro", tipo:"departamento", precio:350000, barrio:"Centro", dist:3.4, uni:"UNLaR", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Smart TV","Microondas"], img:"dep6", propietario:"Diego Luna", propAv:"DL", tel:"+54 9 3804 678901", email:"diego.luna@email.com", whatsapp:"+5493804678901", desc:"Loft moderno totalmente equipado. Pensado para estudiantes que quieren llegar y mudarse el mismo día.", lat:-29.41197033435157, lng:-66.8383682365972 },
  { id:7, nombre:"Departamento económico Centro", tipo:"departamento", precio:180000, barrio:"Centro", dist:2.5, uni:"UNLaR", habs:1, banos:1, wifi:false, amoblado:false, cochera:false, servicios:["Balcón","Mesa de estudio"], img:"dep7", propietario:"Raúl Castro", propAv:"RC", tel:"+54 9 3804 789012", email:"raul.castro@email.com", whatsapp:"+5493804789012", desc:"Departamento accesible para presupuestos ajustados. A 10 minutos caminando de la facultad.", lat:-29.4293, lng:-66.8940 },
  { id:8, nombre:"Casa compartida Zona UNLaR", tipo:"casa", precio:200000, barrio:"Zona UNLaR", dist:2.0, uni:"UNLaR", habs:3, banos:2, wifi:true, amoblado:true, cochera:true, servicios:["WiFi","Amoblado","Cochera","Patio"], img:"dep8", propietario:"Silvia Torres", propAv:"ST", tel:"+54 9 3804 890123", email:"silvia.torres@email.com", whatsapp:"+5493804890123", desc:"Casa amplia a 2 cuadras de la UNLaR, perfecta para un grupo de amigos que quiere compartir.", lat:-29.4170, lng:-66.8575 },
  { id:9, nombre:"Habitación premium San Vicente", tipo:"habitacion", precio:190000, barrio:"San Vicente", dist:4.0, uni:"UNLaR", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Baño privado","Aire acondicionado"], img:"dep9", propietario:"Hugo Aguirre", propAv:"HA", tel:"+54 9 3804 901234", email:"hugo.aguirre@email.com", whatsapp:"+5493804901234", desc:"Habitación con baño privado y aire acondicionado en casa moderna. Muy cómoda para estudiar.", lat:-29.4660, lng:-66.8520 },
  { id:10, nombre:"Departamento dúplex Coquimbito", tipo:"departamento", precio:380000, barrio:"Coquimbito", dist:4.0, uni:"UTN", habs:2, banos:2, wifi:true, amoblado:true, cochera:true, servicios:["WiFi","Amoblado","Cochera","Terraza"], img:"dep10", propietario:"Marta López", propAv:"ML", tel:"+54 9 3804 012345", email:"marta.lopez@email.com", whatsapp:"+5493804012345", desc:"Dúplex con terraza propia y cochera doble. Uno de los alojamientos mejor puntuados del barrio.", lat:-29.4377, lng:-66.8598 },
  { id:11, nombre:"Estudio minimalista Centro", tipo:"departamento", precio:260000, barrio:"Centro", dist:3.2, uni:"UNLaR", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Mesa de estudio","Ascensor"], img:"dep11", propietario:"Pedro Villafañe", propAv:"PV", tel:"+54 9 3804 112233", email:"pedro.villafane@email.com", whatsapp:"+5493804112233", desc:"Estudio moderno con diseño minimalista en edificio con ascensor. A 5 cuadras de la UNLaR.", lat:-29.416158886319486, lng:-66.83690480912735 },
  { id:12, nombre:"Casa con cochera Santa Justina", tipo:"casa", precio:450000, barrio:"Santa Justina", dist:3.9, uni:"UTN", habs:4, banos:2, wifi:true, amoblado:false, cochera:true, servicios:["Cochera","Jardín","WiFi","Parrilla"], img:"dep12", propietario:"Nora Campos", propAv:"NC", tel:"+54 9 3804 445566", email:"nora.campos@email.com", whatsapp:"+5493804445566", desc:"Casa familiar espaciosa con jardín y parrilla. Muy buena para grupos grandes de estudiantes.", lat:-29.43425699193456, lng:-66.86681127404425 }
];

const FLETES = [
  { id:1, nombre:"Mudanzas Rioja Express", tipo:"Camión mediano", rating:4.8, cobertura:"Toda La Rioja", img:"linear-gradient(135deg,#f97316,#7c2d12)", emoji:"🚛", telefono:"+5493804555001", email:"contacto@riojaexpress.com", whatsapp:"5493804555001" },
  { id:2, nombre:"Flete Veloz UNLaR", tipo:"Camioneta", rating:4.6, cobertura:"Centro y Zona UNLaR", img:"linear-gradient(135deg,#06b6d4,#155e75)", emoji:"🛻", telefono:"+5493804555002", email:"info@fleteveloz.com", whatsapp:"5493804555002" },
  { id:3, nombre:"Transportes Catamarca", tipo:"Camión grande", rating:4.9, cobertura:"Provincia completa", img:"linear-gradient(135deg,#10b981,#047857)", emoji:"🚚", telefono:"+5493804555003", email:"reservas@transportescatamarca.com", whatsapp:"5493804555003" },
  { id:4, nombre:"Mudanza Express 24hs", tipo:"Camión pequeño", rating:4.5, cobertura:"Toda La Rioja", img:"linear-gradient(135deg,#6366f1,#312e81)", emoji:"📦", telefono:"+5493804555004", email:"mudanzaexpress24hs@gmail.com", whatsapp:"5493804555004" }
];

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
  if (page === "alquileres") {
    const allProps = [...PROPERTIES, ...serverProperties];
    filteredProps = allProps;
    renderCatalog(filteredProps);
  }
  if (page === "favoritos") renderFavorites();
  if (page === "perfil") { $("#profFavs").textContent = favorites.length; $("#profComp").textContent = compare.length; }
}

$$("[data-nav]").forEach(el => el.addEventListener("click", (e) => {
  e.preventDefault();
  goTo(el.dataset.nav);
}));
$("#hamburger").addEventListener("click", () => document.body.classList.toggle("nav-open"));

/* ---------- Tarjetas ---------- */
function propImgHTML(p) {
  if (Array.isArray(p.img) && p.img.length) {
    return `<img src="http://localhost:3001/${p.img[0]}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover">`;
  }
  return "";
}

function propCard(p, grid) {
  const fav = favorites.includes(p.id);
  const servs = p.servicios.slice(0, 2);
  const div = document.createElement("article");
  div.className = "card prop-card";
  const hasRealImg = Array.isArray(p.img) && p.img.length;
  div.innerHTML = `
    <div class="prop-img" style="${hasRealImg ? '' : bg(p.img)}">
      ${hasRealImg ? propImgHTML(p) : ''}
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
  const allProps = [...PROPERTIES, ...serverProperties];
  const list = allProps.filter(p => favorites.includes(p.id));
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
  const allProps = [...PROPERTIES, ...serverProperties];
  filteredProps = allProps.filter(p =>
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
  filteredProps = [...PROPERTIES, ...serverProperties];
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
  const p = PROPERTIES.find(x => x.id === id) || serverProperties.find(x => x.id === id);
  if (!p) return;
  const modal = $("#modal");
  const hasRealImg = Array.isArray(p.img) && p.img.length;
  const galleryHTML = hasRealImg
    ? `<div class="gallery">
        <div class="gallery-main"><img src="http://localhost:3001/${p.img[0]}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"></div>
        <div class="gallery-side">
          ${p.img.length > 1 ? `<div><img src="http://localhost:3001/${p.img[1]}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px"></div>` : `<div style="${bg(p.img[0])}"></div>`}
          ${p.img.length > 2 ? `<div><img src="http://localhost:3001/${p.img[2]}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px"></div>` : `<div style="${bg(p.img[0])};opacity:.7"></div>`}
        </div>
       </div>`
    : `<div class="gallery">
        <div class="gallery-main" style="${bg(p.img)}"></div>
        <div class="gallery-side">
          <div style="${bg(p.img)};opacity:.85"></div>
          <div style="${bg(p.img)};opacity:.7"></div>
        </div>
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
        <div><b>${p.propietario}</b><div class="muted" style="font-size:.85rem">Propietario verificado · ${barrioName(p)}${barrioField(p, 'calle') ? ' · ' + barrioField(p, 'calle') : ''}${barrioField(p, 'referencia') ? ' · ' + barrioField(p, 'referencia') : ''}</div>${barrioField(p, 'googleMapsUrl') ? '<a href="' + barrioField(p, 'googleMapsUrl') + '" target="_blank" style="font-size:.82rem;color:var(--primary)">Ver en Google Maps</a>' : ''}</div>
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
    const p = PROPERTIES.find(x => x.id === id) || serverProperties.find(x => x.id === id);
    if (!p) return;
    const el = document.createElement("div");
    el.className = "compare-thumb";
    if (Array.isArray(p.img) && p.img.length) {
      el.innerHTML = `<img src="http://localhost:3001/${p.img[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:10px"><button data-rm="${id}">&times;</button>`;
    } else {
      el.style.background = IMGS[p.img] || "";
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
  const items = compare.map(id => PROPERTIES.find(x => x.id === id) || serverProperties.find(x => x.id === id)).filter(Boolean);
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
const CHATBOT_API = "http://localhost:3001/api";
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
  const allProps = [...PROPERTIES, ...serverProperties];
  filteredProps = allProps.filter(p =>
    (uni === "Cualquiera" || p.uni === uni) &&
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

let publishMiniMap = null;
let publishMarker = null;
let publishLat = null;
let publishLng = null;
let publishImages = [];

function parseGoogleMapsUrl(url) {
  if (!url || typeof url !== "string") return null;
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  return null;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcDistInfo(lat, lng) {
  const dUnilar = haversine(lat, lng, UNLaR_COORDS[0], UNLaR_COORDS[1]);
  const dUtn = haversine(lat, lng, UTN_COORDS[0], UTN_COORDS[1]);
  return { dUnilar, dUtn };
}

function initPublishMap() {
  if (publishMiniMap) return;
  const container = document.getElementById("publishMapPreview");
  if (!container) return;
  container.style.display = "";
  publishMiniMap = L.map(container, { zoomControl: true }).setView([-29.445, -66.855], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(publishMiniMap);
  publishMiniMap.on("click", (e) => {
    placePublishMarker(e.latlng.lat, e.latlng.lng);
  });
  setTimeout(() => publishMiniMap.invalidateSize(), 100);
}

function placePublishMarker(lat, lng) {
  publishLat = lat;
  publishLng = lng;
  if (publishMarker) {
    publishMarker.setLatLng([lat, lng]);
  } else {
    publishMarker = L.marker([lat, lng], { draggable: true }).addTo(publishMiniMap);
    publishMarker.on("dragend", (e) => {
      publishLat = e.target.getLatLng().lat;
      publishLng = e.target.getLatLng().lng;
      updatePublishDistInfo();
    });
  }
  publishMiniMap.setView([lat, lng], 15);
  updatePublishDistInfo();
}

function updatePublishDistInfo() {
  const infoEl = document.getElementById("publishDistInfo");
  if (!publishLat || !publishLng || !infoEl) return;
  const { dUnilar, dUtn } = calcDistInfo(publishLat, publishLng);
  infoEl.style.display = "";
  infoEl.innerHTML = `<strong>${dUnilar.toFixed(1)} km</strong> de UNLaR &mdash; <strong>${dUtn.toFixed(1)} km</strong> de UTN`;
}

function renderPublishPreviews() {
  const container = document.getElementById("publishPreview");
  if (!container) return;
  container.innerHTML = "";
  publishImages.forEach((src, i) => {
    const item = document.createElement("div");
    item.className = "publish-preview-item";
    item.innerHTML = `<img src="${src}" alt="Foto ${i + 1}"><button type="button" class="remove-btn" data-rm="${i}">&times;</button>`;
    container.appendChild(item);
  });
  container.querySelectorAll(".remove-btn").forEach(b => {
    b.addEventListener("click", () => {
      publishImages.splice(+b.dataset.rm, 1);
      renderPublishPreviews();
    });
  });
}

function handlePublishFiles(files) {
  const maxFiles = 10;
  const maxSize = 5 * 1024 * 1024;
  Array.from(files).forEach(file => {
    if (publishImages.length >= maxFiles) { toast("Máximo 10 fotos"); return; }
    if (!file.type.startsWith("image/")) { toast("Solo se aceptan imágenes"); return; }
    if (file.size > maxSize) { toast(`${file.name} supera 5MB`); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      publishImages.push(e.target.result);
      renderPublishPreviews();
    };
    reader.readAsDataURL(file);
  });
}

const publishFileInput = document.getElementById("publishFiles");
if (publishFileInput) {
  publishFileInput.addEventListener("change", (e) => {
    handlePublishFiles(e.target.files);
    e.target.value = "";
  });
}

const publishGmInput = document.getElementById("pubGoogleMapsUrl");
if (publishGmInput) {
  publishGmInput.addEventListener("paste", () => {
    setTimeout(() => {
      const coords = parseGoogleMapsUrl(publishGmInput.value);
      if (coords) {
        initPublishMap();
        placePublishMarker(coords.lat, coords.lng);
      }
    }, 100);
  });
  publishGmInput.addEventListener("input", () => {
    const coords = parseGoogleMapsUrl(publishGmInput.value);
    if (coords) {
      initPublishMap();
      placePublishMarker(coords.lat, coords.lng);
    }
  });
}

async function fetchPropiedades() {
  try {
    const res = await fetch("http://localhost:3001/api/propiedades");
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

let serverProperties = [];

async function initServerProperties() {
  serverProperties = await fetchPropiedades();
  if (serverProperties.length) {
    const allProps = [...PROPERTIES, ...serverProperties];
    filteredProps = allProps;
    renderCatalog(filteredProps);
    renderFeatured();
  }
}

$("#publishForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!publishLat || !publishLng) {
    toast("Pegá la URL de Google Maps y verificá la ubicación en el mapa");
    return;
  }
  if (!publishImages.length) {
    toast("Subí al menos 1 foto de la propiedad");
    return;
  }
  const titulo = document.getElementById("pubTitulo").value.trim();
  const precio = +document.getElementById("pubPrecio").value;
  const tipo = document.getElementById("pubTipo").value;
  const barrio = document.getElementById("pubBarrio").value.trim();
  const calle = document.getElementById("pubCalle").value.trim();
  const referencia = document.getElementById("pubReferencia").value.trim();
  const googleMapsUrl = document.getElementById("pubGoogleMapsUrl").value.trim();
  const habs = +document.getElementById("pubHabs").value;
  const banos = +document.getElementById("pubBanos").value;
  const desc = document.getElementById("pubDesc").value.trim();
  const wifi = document.getElementById("pubWifi").checked;
  const amoblado = document.getElementById("pubAmoblado").checked;
  const cochera = document.getElementById("pubCochera").checked;
  const balcon = document.getElementById("pubBalcon").checked;
  const calefaccion = document.getElementById("pubCalefaccion").checked;
  const aire = document.getElementById("pubAire").checked;
  const parrilla = document.getElementById("pubParrilla").checked;

  const servicios = [];
  if (wifi) servicios.push("WiFi");
  if (amoblado) servicios.push("Amoblado");
  if (cochera) servicios.push("Cochera");
  if (balcon) servicios.push("Balcón");
  if (calefaccion) servicios.push("Calefacción");
  if (aire) servicios.push("Aire acondicionado");
  if (parrilla) servicios.push("Parrilla");

  const { dUnilar, dUtn } = calcDistInfo(publishLat, publishLng);
  const closestUni = dUnilar <= dUtn ? "UNLaR" : "UTN";
  const dist = Math.round(Math.min(dUnilar, dUtn) * 10) / 10;

  const formData = new FormData();
  formData.append("titulo", titulo);
  formData.append("precio", precio);
  formData.append("tipo", tipo);
  formData.append("barrio", barrio);
  formData.append("calle", calle);
  formData.append("referencia", referencia);
  formData.append("googleMapsUrl", googleMapsUrl);
  formData.append("lat", publishLat);
  formData.append("lng", publishLng);
  formData.append("dist", dist);
  formData.append("uni", closestUni);
  formData.append("habs", habs);
  formData.append("banos", banos);
  formData.append("desc", desc);
  formData.append("wifi", wifi);
  formData.append("amoblado", amoblado);
  formData.append("cochera", cochera);
  formData.append("servicios", JSON.stringify(servicios));

  const fileInput = document.getElementById("publishFiles");
  for (const file of fileInput.files) {
    formData.append("fotos", file);
  }

  try {
    const res = await fetch("http://localhost:3001/api/propiedades", {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Error del servidor");
    toast("Propiedad publicada correctamente");
    e.target.reset();
    publishImages = [];
    publishLat = null;
    publishLng = null;
    publishMarker = null;
    renderPublishPreviews();
    const distInfo = document.getElementById("publishDistInfo");
    if (distInfo) distInfo.style.display = "none";
    if (publishMiniMap) { publishMiniMap.remove(); publishMiniMap = null; }
    await initServerProperties();
    goTo("alquileres");
  } catch (err) {
    toast("Error al publicar. Intentá de nuevo.");
  }
});

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

renderFeatured();
renderFletes();
renderCatalog(PROPERTIES);
$("#favCountTop").textContent = favorites.length;
initCarousel();
initServerProperties();

/* ---------- Proveedores ---------- */
let providerLoggedIn = false;
let providerData = null;
let providerListings = [];
let providerTransportList = [];

function initProviderSection() {
  const saved = JSON.parse(localStorage.getItem("forania_provider") || "null");
  if (saved) {
    providerData = saved;
    providerLoggedIn = true;
    providerListings = JSON.parse(localStorage.getItem("forania_provider_listings") || "[]");
    providerTransportList = JSON.parse(localStorage.getItem("forania_provider_transport") || "[]");
    showProviderPanel();
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
      <span class="prop-tag">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · ${barrioName(p)}</span>
      </div>
      <div class="prop-body">
        <h3 class="prop-title">${p.nombre}</h3>
        <div class="prop-price">${fmt(p.precio)} <small>/ mes</small></div>
        <div class="prop-meta">
          <span>&#128205; ${barrioName(p)}</span>
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

function updateProviderStats() {
  $("#provTotalProps").textContent = providerData.tipo === "transportista" ? providerTransportList.length : providerListings.length;
  $("#provViews").textContent = Math.floor(Math.random() * 200) + 50;
  $("#provContacts").textContent = Math.floor(Math.random() * 30) + 5;
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

function barrioName(p) {
  if (!p || !p.barrio) return '';
  return typeof p.barrio === 'string' ? p.barrio : (p.barrio.nombre || '');
}

function barrioField(p, field) {
  if (!p || !p.barrio) return '';
  if (typeof p.barrio === 'string') return '';
  return p.barrio[field] || '';
}

function providerFormHTML(p) {
  return `
    <form class="form" id="providerPropForm">
      <div class="form-row">
        <label>Título<input type="text" id="ppNombre" value="${p ? p.nombre : ''}" placeholder="Ej: Departamento moderno" required></label>
        <label>Precio ($/mes)<input type="number" id="ppPrecio" value="${p ? p.precio : ''}" placeholder="320000" required></label>
      </div>
      <div class="form-row">
        <label>Tipo<select id="ppTipo"><option value="departamento" ${p && p.tipo === 'departamento' ? 'selected' : ''}>Departamento</option><option value="habitacion" ${p && p.tipo === 'habitacion' ? 'selected' : ''}>Habitación</option><option value="casa" ${p && p.tipo === 'casa' ? 'selected' : ''}>Casa</option></select></label>
        <label>Barrio<input type="text" id="ppBarrio" value="${p ? barrioName(p) : ''}" placeholder="Ej: Centro" required></label>
        <label>Calle (opcional)<input type="text" id="ppCalle" value="${p ? barrioField(p, 'calle') : ''}" placeholder="Ej: San Martín 450"></label>
        <label>Referencia (opcional)<input type="text" id="ppReferencia" value="${p ? barrioField(p, 'referencia') : ''}" placeholder="Ej: frente a la plaza"></label>
        <label>URL Google Maps (opcional)<input type="text" id="ppGoogleMaps" value="${p ? barrioField(p, 'googleMapsUrl') : ''}" placeholder="https://maps.google.com/..."></label>
      </div>
      <div class="form-row">
        <label>Habitaciones<input type="number" id="ppHabs" min="1" value="${p ? p.habs : 1}"></label>
        <label>Baños<input type="number" id="ppBanos" min="1" value="${p ? p.banos : 1}"></label>
      </div>
      <label>Descripción<textarea id="ppDesc" rows="3" placeholder="Describí tu propiedad...">${p ? p.desc : ''}</textarea></label>
      <label>URL de foto (opcional)<input type="text" id="ppImg" placeholder="URL de imagen..." value="${p ? p.img : ''}"></label>
      <div class="filter-group checks">
        <label><input type="checkbox" id="ppWifi" ${p && p.wifi ? 'checked' : ''}> WiFi</label>
        <label><input type="checkbox" id="ppAmoblado" ${p && p.amoblado ? 'checked' : ''}> Amoblado</label>
        <label><input type="checkbox" id="ppCochera" ${p && p.cochera ? 'checked' : ''}> Cochera</label>
      </div>
      <button type="submit" class="btn btn-primary btn-lg">${p ? 'Guardar cambios' : 'Publicar propiedad'}</button>
    </form>`;
}

function transportFormHTML(t) {
  return `
    <form class="form" id="providerTransForm">
      <label>Nombre del servicio<input type="text" id="ptNombre" value="${t ? t.nombre : ''}" placeholder="Ej: Mudanzas Express" required></label>
      <div class="form-row">
        <label>Tipo de vehículo<input type="text" id="ptTipo" value="${t ? t.tipo : ''}" placeholder="Ej: Camión mediano" required></label>
        <label>Zona de cobertura<input type="text" id="ptCobertura" value="${t ? t.cobertura : ''}" placeholder="Ej: Toda La Rioja" required></label>
      </div>
      <button type="submit" class="btn btn-primary btn-lg">${t ? 'Guardar cambios' : 'Registrar servicio'}</button>
    </form>`;
}

function saveProviderData() {
  localStorage.setItem("forania_provider", JSON.stringify(providerData));
  localStorage.setItem("forania_provider_listings", JSON.stringify(providerListings));
  localStorage.setItem("forania_provider_transport", JSON.stringify(providerTransportList));
}

function addProviderListing() {
  openProviderModal("Nueva propiedad", providerFormHTML(null));
  $("#providerPropForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const barrioVal = $("#ppBarrio").value.trim();
    const calleVal = $("#ppCalle").value.trim();
    const refVal = $("#ppReferencia").value.trim();
    const gmVal = $("#ppGoogleMaps").value.trim();
    const barrioObj = { nombre: barrioVal };
    if (calleVal) barrioObj.calle = calleVal;
    if (refVal) barrioObj.referencia = refVal;
    if (gmVal) barrioObj.googleMapsUrl = gmVal;
    const newProp = {
      id: Date.now(),
      nombre: $("#ppNombre").value,
      tipo: $("#ppTipo").value,
      precio: +$("#ppPrecio").value,
      barrio: barrioObj,
      dist: Math.round((Math.random() * 4 + 0.5) * 10) / 10,
      uni: barrioVal.includes("UNLaR") ? "UNLaR" : "UTN",
      habs: +$("#ppHabs").value,
      banos: +$("#ppBanos").value,
      wifi: $("#ppWifi").checked,
      amoblado: $("#ppAmoblado").checked,
      cochera: $("#ppCochera").checked,
      servicios: [],
      img: $("#ppImg").value || "dep1",
      propietario: providerData.nombre,
      propAv: providerData.nombre.charAt(0),
      tel: providerData.tel || "",
      email: providerData.email || "",
      whatsapp: providerData.whatsapp || "",
      desc: $("#ppDesc").value
    };
    if (newProp.wifi) newProp.servicios.push("WiFi");
    if (newProp.amoblado) newProp.servicios.push("Amoblado");
    if (newProp.cochera) newProp.servicios.push("Cochera");
    providerListings.push(newProp);
    saveProviderData();
    renderProviderListings();
    updateProviderStats();
    closeProviderModal();
    toast("Propiedad publicada correctamente");
  });
}

function editProviderListing(idx) {
  const p = providerListings[idx];
  openProviderModal("Editar propiedad", providerFormHTML(p));
  $("#providerPropForm").addEventListener("submit", (e) => {
    e.preventDefault();
    p.nombre = $("#ppNombre").value;
    p.tipo = $("#ppTipo").value;
    p.precio = +$("#ppPrecio").value;
    const barrioVal = $("#ppBarrio").value.trim();
    const calleVal = $("#ppCalle").value.trim();
    const refVal = $("#ppReferencia").value.trim();
    const gmVal = $("#ppGoogleMaps").value.trim();
    p.barrio = { nombre: barrioVal };
    if (calleVal) p.barrio.calle = calleVal;
    if (refVal) p.barrio.referencia = refVal;
    if (gmVal) p.barrio.googleMapsUrl = gmVal;
    p.habs = +$("#ppHabs").value;
    p.banos = +$("#ppBanos").value;
    p.wifi = $("#ppWifi").checked;
    p.amoblado = $("#ppAmoblado").checked;
    p.cochera = $("#ppCochera").checked;
    p.img = $("#ppImg").value || p.img;
    p.desc = $("#ppDesc").value;
    p.servicios = [];
    if (p.wifi) p.servicios.push("WiFi");
    if (p.amoblado) p.servicios.push("Amoblado");
    if (p.cochera) p.servicios.push("Cochera");
    saveProviderData();
    renderProviderListings();
    closeProviderModal();
    toast("Propiedad actualizada");
  });
}

function deleteProviderListing(idx) {
  providerListings.splice(idx, 1);
  saveProviderData();
  renderProviderListings();
  updateProviderStats();
  toast("Propiedad eliminada");
}

function addProviderTransport() {
  openProviderModal("Nuevo servicio de transporte", transportFormHTML(null));
  $("#providerTransForm").addEventListener("submit", (e) => {
    e.preventDefault();
    providerTransportList.push({
      id: Date.now(),
      nombre: $("#ptNombre").value,
      tipo: $("#ptTipo").value,
      cobertura: $("#ptCobertura").value,
      rating: 0,
      img: "linear-gradient(135deg,#f97316,#7c2d12)",
      emoji: "&#128666;"
    });
    saveProviderData();
    renderProviderTransport();
    updateProviderStats();
    closeProviderModal();
    toast("Servicio registrado correctamente");
  });
}

function editProviderTransport(idx) {
  const t = providerTransportList[idx];
  openProviderModal("Editar servicio", transportFormHTML(t));
  $("#providerTransForm").addEventListener("submit", (e) => {
    e.preventDefault();
    t.nombre = $("#ptNombre").value;
    t.tipo = $("#ptTipo").value;
    t.cobertura = $("#ptCobertura").value;
    saveProviderData();
    renderProviderTransport();
    closeProviderModal();
    toast("Servicio actualizado");
  });
}

function deleteProviderTransport(idx) {
  providerTransportList.splice(idx, 1);
  saveProviderData();
  renderProviderTransport();
  updateProviderStats();
  toast("Servicio eliminado");
}

$("#providerLoginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const nombre = form.querySelector('input[type="text"]').value;
  const tipo = $("#providerType").value;
  const email = form.querySelector('input[type="email"]').value;
  const tel = form.querySelector('input[type="tel"]').value;
  if (!tipo) { toast("Seleccioná un tipo de proveedor"); return; }
  providerData = { nombre, tipo, email, tel, whatsapp: tel.replace(/\s/g, "").replace("+", "") };
  providerLoggedIn = true;
  showProviderPanel();
  toast(`Bienvenido, ${nombre}`);
});

$("#provLogout").addEventListener("click", () => {
  providerLoggedIn = false;
  providerData = null;
  providerListings = [];
  providerTransportList = [];
  localStorage.removeItem("forania_provider");
  localStorage.removeItem("forania_provider_listings");
  localStorage.removeItem("forania_provider_transport");
  showProviderLogin();
  toast("Sesión cerrada");
});

$("#addNewProp").addEventListener("click", addProviderListing);
$("#addNewTransport").addEventListener("click", addProviderTransport);
$("#providerModalClose").addEventListener("click", closeProviderModal);
$("#providerOverlay").addEventListener("click", closeProviderModal);

initProviderSection();
