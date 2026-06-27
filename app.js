/* ASX no Brasil — mapa interativo de empresas ASX com projetos no Brasil.
   Dados: data/companies.json. Mapa: Leaflet + OpenStreetMap. */

const COMMODITY_COLORS = {
  "Terras Raras": "#e0b341",
  "Lítio": "#4ade80",
  "Níquel": "#22d3ee",
  "Minério de Ferro": "#f97316",
  "Fosfato / Cobre": "#c084fc",
  "Cobre": "#c084fc",
  "Titânio": "#94a3b8",
  "default": "#9ca3af",
};

const STATUS_COLORS = {
  "Produção": "#2ea043",
  "Desenvolvimento": "#3b82f6",
  "Exploração": "#a855f7",
  "Adquirida": "#6b7280",
};

function colorFor(commodity) {
  // Pega a primeira palavra-chave conhecida da string de commodity.
  for (const key of Object.keys(COMMODITY_COLORS)) {
    if (key !== "default" && commodity.includes(key)) return COMMODITY_COLORS[key];
  }
  return COMMODITY_COLORS.default;
}

const STATE_NAMES = {
  MG: "Minas Gerais", BA: "Bahia", PA: "Pará", SP: "São Paulo",
  RS: "Rio Grande do Sul", AM: "Amazonas",
};

let DATA = null;
let MAP = null;
const MARKERS = {}; // key: `${ticker}::${projectName}` -> marker
let activeTicker = null;

async function init() {
  try {
    const res = await fetch("data/companies.json");
    DATA = await res.json();
  } catch (e) {
    document.getElementById("companyList").innerHTML =
      `<li style="padding:16px;color:#f87171">Erro ao carregar dados: ${e.message}.<br>
       Rode via servidor local (ex.: <code>python3 -m http.server</code>) — abrir o arquivo direto pode bloquear o fetch.</li>`;
    return;
  }

  setupMap();
  populateFilters();
  renderFooter();
  render();

  document.getElementById("search").addEventListener("input", render);
  document.getElementById("commodityFilter").addEventListener("change", render);
  document.getElementById("stateFilter").addEventListener("change", render);
}

function setupMap() {
  MAP = L.map("map", { zoomControl: true, attributionControl: true })
    .setView([-15.5, -49], 4);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(MAP);

  // Cria os marcadores uma vez só.
  for (const company of DATA.companies) {
    for (const p of company.projects) {
      const color = colorFor(p.commodity);
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 8,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).bindPopup(popupHtml(company, p));
      marker._company = company;
      marker.addTo(MAP);
      MARKERS[`${company.ticker}::${p.name}`] = marker;
    }
  }

  buildLegend();
}

function popupHtml(company, p) {
  const statusColor = STATUS_COLORS[p.status] || "#6b7280";
  const site = company.website
    ? `<a class="popup-link" href="${company.website}" target="_blank" rel="noopener">Site da empresa ↗</a>`
    : "";
  return `
    <div class="popup-title">${p.name}</div>
    <div class="popup-sub">${company.name} · <b>ASX:${company.ticker}</b></div>
    <div class="popup-row"><b>Commodity:</b> ${p.commodity}</div>
    <div class="popup-row"><b>Tipo:</b> ${p.type || "—"}</div>
    <div class="popup-row"><b>Local:</b> ${p.municipality || "—"} — ${STATE_NAMES[p.state] || p.state}</div>
    <div class="popup-row"><b>Status:</b>
      <span class="status-badge" style="background:${statusColor}33;color:${statusColor}">${p.status}</span></div>
    ${p.note ? `<div class="popup-note">${p.note}</div>` : ""}
    ${site}
  `;
}

function buildLegend() {
  const used = new Set();
  DATA.companies.forEach(c => c.projects.forEach(p => used.add(colorFor(p.commodity))));

  const seenColors = new Set();
  const html = Object.keys(COMMODITY_COLORS)
    .filter(k => k !== "default")
    .filter(k => used.has(COMMODITY_COLORS[k]))
    .filter(k => {
      const c = COMMODITY_COLORS[k];
      if (seenColors.has(c)) return false;
      seenColors.add(c); return true;
    })
    .map(k => `<div class="legend-item"><span class="dot" style="background:${COMMODITY_COLORS[k]}"></span>${k}</div>`)
    .join("");

  document.getElementById("legend").innerHTML = `<h4>Commodity</h4>${html}`;
}

function populateFilters() {
  const commodities = new Set();
  const states = new Set();
  DATA.companies.forEach(c => c.projects.forEach(p => {
    p.commodity.split("/").forEach(part => commodities.add(part.trim()));
    states.add(p.state);
  }));

  const cf = document.getElementById("commodityFilter");
  [...commodities].sort().forEach(c => {
    cf.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`);
  });

  const sf = document.getElementById("stateFilter");
  [...states].sort().forEach(s => {
    sf.insertAdjacentHTML("beforeend", `<option value="${s}">${STATE_NAMES[s] || s} (${s})</option>`);
  });
}

function matches(company, q, commodity, state) {
  const hay = (company.name + " " + company.ticker + " " +
    company.projects.map(p => p.name + " " + p.commodity + " " + (p.municipality || "")).join(" ")).toLowerCase();
  if (q && !hay.includes(q)) return false;
  if (commodity && !company.projects.some(p => p.commodity.includes(commodity))) return false;
  if (state && !company.projects.some(p => p.state === state)) return false;
  return true;
}

function render() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const commodity = document.getElementById("commodityFilter").value;
  const state = document.getElementById("stateFilter").value;

  const visible = DATA.companies.filter(c => matches(c, q, commodity, state));
  const visibleTickers = new Set(visible.map(c => c.ticker));

  // Atualiza marcadores (mostra/esconde).
  DATA.companies.forEach(c => {
    c.projects.forEach(p => {
      const m = MARKERS[`${c.ticker}::${p.name}`];
      if (!m) return;
      const show = visibleTickers.has(c.ticker);
      if (show && !MAP.hasLayer(m)) m.addTo(MAP);
      if (!show && MAP.hasLayer(m)) MAP.removeLayer(m);
    });
  });

  // Lista lateral.
  const list = document.getElementById("companyList");
  const projCount = visible.reduce((n, c) => n + c.projects.length, 0);
  document.getElementById("stats").innerHTML =
    `<b>${visible.length}</b> empresas · <b>${projCount}</b> projetos`;

  if (visible.length === 0) {
    list.innerHTML = `<li style="padding:16px;color:#8b98a5">Nenhum resultado para os filtros atuais.</li>`;
    return;
  }

  list.innerHTML = visible.map(c => {
    const chips = c.projects.map(p =>
      `<span class="chip"><span class="dot" style="background:${colorFor(p.commodity)}"></span>${p.name} · ${p.state}</span>`
    ).join("");
    return `
      <li class="company-card ${c.ticker === activeTicker ? "active" : ""}" data-ticker="${c.ticker}">
        <div class="card-top">
          <span class="card-name">${c.name}</span>
          <span class="ticker">ASX:${c.ticker}</span>
        </div>
        <div class="card-commodity">${c.primaryCommodity}</div>
        <div class="card-projects">${chips}</div>
      </li>`;
  }).join("");

  list.querySelectorAll(".company-card").forEach(card => {
    card.addEventListener("click", () => focusCompany(card.dataset.ticker));
  });
}

function focusCompany(ticker) {
  activeTicker = ticker;
  const company = DATA.companies.find(c => c.ticker === ticker);
  if (!company) return;

  document.querySelectorAll(".company-card").forEach(el =>
    el.classList.toggle("active", el.dataset.ticker === ticker));

  const pts = company.projects.map(p => [p.lat, p.lng]);
  if (pts.length === 1) {
    MAP.flyTo(pts[0], 7, { duration: 0.8 });
    MARKERS[`${ticker}::${company.projects[0].name}`].openPopup();
  } else {
    MAP.flyToBounds(L.latLngBounds(pts).pad(0.4), { duration: 0.8 });
  }
}

function renderFooter() {
  const m = DATA.meta || {};
  document.getElementById("metaSource").textContent = m.source || "";
  document.getElementById("metaDisclaimer").textContent = m.disclaimer || "";
}

init();
