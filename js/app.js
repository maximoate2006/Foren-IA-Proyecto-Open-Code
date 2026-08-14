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
  { id:1, nombre:"Departamento moderno en Centro", tipo:"departamento", precio:320000, barrio:"Centro", dist:1.2, uni:"UNLaR", habs:2, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Aire acondicionado","Mesa de estudio"], score:{total:92, cercania:95, precio:88, servicios:96, ubicacion:90}, img:"dep1", propietario:"María González", propAv:"MG", desc:"Departamento luminoso en pleno centro, a pasos de la peatonal y a minutos de la UNLaR. Ideal para estudiantes que buscan comodidad y cercanía." },
  { id:2, nombre:"Monoambiente Zona UNLaR", tipo:"departamento", precio:220000, barrio:"Zona UNLaR", dist:0.4, uni:"UNLaR", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Mesa de estudio","Lavadora"], score:{total:95, cercania:99, precio:90, servicios:94, ubicacion:97}, img:"dep2", propietario:"Carlos Sosa", propAv:"CS", desc:"Monoambiente amoblado a 4 cuadras de la UNLaR. Podés ir caminando y olvidarte del bondi." },
  { id:3, nombre:"Casa con patio en San Vicente", tipo:"casa", precio:400000, barrio:"San Vicente", dist:3.5, uni:"UNLaR", habs:3, banos:2, wifi:true, amoblado:false, cochera:true, servicios:["Cochera","Patio","WiFi","Calefacción"], score:{total:85, cercania:70, precio:80, servicios:92, ubicacion:88}, img:"dep3", propietario:"Laura Fernández", propAv:"LF", desc:"Casa amplia con patio y cochera, ideal para compartir entre 3 estudiantes. Zona tranquila y segura." },
  { id:4, nombre:"Habitación en Coquimbito", tipo:"habitacion", precio:150000, barrio:"Coquimbito", dist:2.1, uni:"UTN", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Gastos incluidos"], score:{total:88, cercania:82, precio:94, servicios:85, ubicacion:90}, img:"dep4", propietario:"Jorge Medina", propAv:"JM", desc:"Habitación individual en casa compartida con otros estudiantes. Gastos y wifi incluidos en el precio." },
  { id:5, nombre:"Departamento Santa Justina", tipo:"departamento", precio:280000, barrio:"Santa Justina", dist:5.2, uni:"UTN", habs:2, banos:1, wifi:true, amoblado:false, cochera:true, servicios:["Cochera","WiFi","Balcón"], score:{total:80, cercania:65, precio:84, servicios:88, ubicacion:83}, img:"dep5", propietario:"Ana Ríos", propAv:"AR", desc:"Dúplex de 2 dormitorios con balcón y cochera cubierta. Excelente relación precio-superficie." },
  { id:6, nombre:"Loft amueblado Centro", tipo:"departamento", precio:350000, barrio:"Centro", dist:1.5, uni:"UNLaR", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Smart TV","Microondas"], score:{total:93, cercania:90, precio:82, servicios:99, ubicacion:92}, img:"dep6", propietario:"Diego Luna", propAv:"DL", desc:"Loft moderno totalmente equipado. Pensado para estudiantes que quieren llegar y mudarse el mismo día." },
  { id:7, nombre:"Departamento económico Centro", tipo:"departamento", precio:180000, barrio:"Centro", dist:1.0, uni:"UNLaR", habs:1, banos:1, wifi:false, amoblado:false, cochera:false, servicios:["Balcón","Mesa de estudio"], score:{total:76, cercania:92, precio:96, servicios:55, ubicacion:85}, img:"dep7", propietario:"Raúl Castro", propAv:"RC", desc:"Departamento accesible para presupuestos ajustados. A 10 minutos caminando de la facultad." },
  { id:8, nombre:"Casa compartida Zona UNLaR", tipo:"casa", precio:200000, barrio:"Zona UNLaR", dist:0.8, uni:"UNLaR", habs:3, banos:2, wifi:true, amoblado:true, cochera:true, servicios:["WiFi","Amoblado","Cochera","Patio"], score:{total:90, cercania:96, precio:86, servicios:90, ubicacion:89}, img:"dep8", propietario:"Silvia Torres", propAv:"ST", desc:"Casa amplia a 2 cuadras de la UNLaR, perfecta para un grupo de amigos que quiere compartir." },
  { id:9, nombre:"Habitación premium San Vicente", tipo:"habitacion", precio:190000, barrio:"San Vicente", dist:3.0, uni:"UNLaR", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Baño privado","Aire acondicionado"], score:{total:87, cercania:74, precio:88, servicios:93, ubicacion:80}, img:"dep9", propietario:"Hugo Aguirre", propAv:"HA", desc:"Habitación con baño privado y aire acondicionado en casa moderna. Muy cómoda para estudiar." },
  { id:10, nombre:"Departamento dúplex Coquimbito", tipo:"departamento", precio:380000, barrio:"Coquimbito", dist:2.8, uni:"UTN", habs:2, banos:2, wifi:true, amoblado:true, cochera:true, servicios:["WiFi","Amoblado","Cochera","Terraza"], score:{total:91, cercania:78, precio:80, servicios:97, ubicacion:92}, img:"dep10", propietario:"Marta López", propAv:"ML", desc:"Dúplex con terraza propia y cochera doble. Uno de los alojamientos mejor puntuados del barrio." },
  { id:11, nombre:"Estudio minimalista Centro", tipo:"departamento", precio:260000, barrio:"Centro", dist:1.3, uni:"UNLaR", habs:1, banos:1, wifi:true, amoblado:true, cochera:false, servicios:["WiFi","Amoblado","Mesa de estudio","Ascensor"], score:{total:89, cercania:91, precio:84, servicios:92, ubicacion:88}, img:"dep11", propietario:"Pedro Villafañe", propAv:"PV", desc:"Estudio moderno con diseño minimalista en edificio con ascensor. A 5 cuadras de la UNLaR." },
  { id:12, nombre:"Casa con cochera Santa Justina", tipo:"casa", precio:450000, barrio:"Santa Justina", dist:4.6, uni:"UTN", habs:4, banos:2, wifi:true, amoblado:false, cochera:true, servicios:["Cochera","Jardín","WiFi","Parrilla"], score:{total:83, cercania:60, precio:78, servicios:91, ubicacion:88}, img:"dep12", propietario:"Nora Campos", propAv:"NC", desc:"Casa familiar espaciosa con jardín y parrilla. Muy buena para grupos grandes de estudiantes." }
];

const FLETES = [
  { id:1, nombre:"Mudanzas Rioja Express", tipo:"Camión mediano", rating:4.8, cobertura:"Toda La Rioja", img:"linear-gradient(135deg,#f97316,#7c2d12)", emoji:"🚛" },
  { id:2, nombre:"Flete Veloz UNLaR", tipo:"Camioneta", rating:4.6, cobertura:"Centro y Zona UNLaR", img:"linear-gradient(135deg,#06b6d4,#155e75)", emoji:"🛻" },
  { id:3, nombre:"Transportes Catamarca", tipo:"Camión grande", rating:4.9, cobertura:"Provincia completa", img:"linear-gradient(135deg,#10b981,#047857)", emoji:"🚚" },
  { id:4, nombre:"Mudanza Express 24hs", tipo:"Camión pequeño", rating:4.5, cobertura:"Toda La Rioja", img:"linear-gradient(135deg,#6366f1,#312e81)", emoji:"📦" }
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
        <span>&#128716; ${p.habs} hab · ${p.banos} baño</span>
      </div>
      <div class="prop-meta">${servs.map(s => `<span class="serv-tag ${p.amoblado ? 'hot' : ''}">${s}</span>`).join("")}</div>
      <span class="score">FORANSCORE ${p.score.total}</span>
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
  const maxD = +$("#fDist").value;
  const amob = $("#fAmoblado").checked;
  const wifi = $("#fWifi").checked;
  const coch = $("#fCochera").checked;
  filteredProps = PROPERTIES.filter(p =>
    p.precio <= maxP &&
    (!tipo || p.tipo === tipo) &&
    (!uni || p.uni === uni) &&
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
  $("#fType").value = ""; $("#fUni").value = ""; $("#fDist").value = "99";
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
          <span class="prop-tag" style="position:static;background:#f3e8ff;color:var(--primary);display:inline-block;margin-bottom:8px">${p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · ${p.barrio}</span>
          <h2>${p.nombre}</h2>
          <div class="prop-meta"><span>&#128205; ${p.dist.toFixed(1)} km de ${p.uni} · ${Math.round(p.dist * 12)} min caminando</span></div>
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
      </div>
      <div class="score-block">
        <h4>FORANSCORE <span class="score">${p.score.total} / 100</span></h4>
        <div class="score-row">
          <div><b>${p.score.cercania}</b> Cercanía<div class="score-bar"><i style="width:${p.score.cercania}%"></i></div></div>
          <div><b>${p.score.precio}</b> Precio<div class="score-bar"><i style="width:${p.score.precio}%"></i></div></div>
          <div><b>${p.score.servicios}</b> Servicios<div class="score-bar"><i style="width:${p.score.servicios}%"></i></div></div>
          <div><b>${p.score.ubicacion}</b> Ubicación<div class="score-bar"><i style="width:${p.score.ubicacion}%"></i></div></div>
        </div>
      </div>
      <div class="owner-row">
        <div class="owner-av">${p.propAv}</div>
        <div><b>${p.propietario}</b><div class="muted" style="font-size:.85rem">Propietario verificado · ${p.barrio}</div></div>
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
    el.style.background = IMGS[p.img];
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
        ${row("Distancia", p => `${p.dist.toFixed(1)} km · ${Math.round(p.dist * 12)} min`)}
        ${row("Tipo", p => p.tipo)}
        ${row("Habitaciones", p => p.habs)}
        ${row("WiFi", p => p.wifi ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
        ${row("Amoblado", p => p.amoblado ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
        ${row("Cochera", p => p.cochera ? '<span class="yes">Sí</span>' : '<span class="no">No</span>')}
        ${row("ForanScore", p => `<span class="score">${p.score.total}</span>`)}
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
function renderFletes() {
  const g = $("#fletesGrid");
  g.innerHTML = "";
  FLETES.forEach(f => {
    const div = document.createElement("article");
    div.className = "card flete-card";
    div.innerHTML = `
      <div class="flete-img" style="${bg(f.img)}">${f.emoji}</div>
      <h3>${f.nombre}</h3>
      <div class="prop-meta"><span>&#128666; ${f.tipo}</span><span class="flete-rating">&#9733; ${f.rating}</span></div>
      <div class="flete-cobertura">&#128205; Cobertura: ${f.cobertura}</div>
      <div class="flete-badges"><span class="serv-tag hot">Disponible</span><span class="serv-tag">Respuesta rápida</span></div>
      <button class="btn btn-primary" data-contact="${f.nombre}" style="width:100%;justify-content:center">Contactar</button>`;
    div.querySelector("[data-contact]").addEventListener("click", () => toast(`Contactando a ${f.nombre} (demo)`));
    g.appendChild(div);
  });
}

/* ---------- Búsqueda hero ---------- */
$("#heroSearch").addEventListener("submit", (e) => {
  e.preventDefault();
  const uni = $("#searchUni").value;
  const bud = +$("#searchBudget").value;
  const tipo = $("#searchType").value;
  filteredProps = PROPERTIES.filter(p =>
    (uni === "Cualquiera" || p.uni === uni) &&
    (!bud || p.precio <= bud) &&
    (!tipo || p.tipo === tipo)
  );
  $("#fUni").value = uni === "Cualquiera" ? "" : uni;
  if (bud) { $("#fPrice").value = bud; $("#fPriceLabel").textContent = fmt(bud); }
  $("#fType").value = tipo;
  goTo("alquileres");
  toast("Buscando alojamiento...");
});

/* ---------- Publicar ---------- */
$("#publishForm").addEventListener("submit", (e) => {
  e.preventDefault();
  toast("Propiedad publicada correctamente.");
  e.target.reset();
});

/* ---------- Init ---------- */
renderFeatured();
renderFletes();
renderCatalog(PROPERTIES);
$("#favCountTop").textContent = favorites.length;
