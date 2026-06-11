const BRAND_COLORS = FUEL_BRAND_COLORS;

const FUEL_TYPES = {
    "gasolina95": "Gasolina 95",
    "gasolina98": "Gasolina 98",
    "gasoleo": "Gasóleo",
    "gpl": "GPL"
};

let app;

function renderFuelTypes() {
    const container = document.getElementById('fuelTypes');
    if (!container) return;
    container.innerHTML = '';

    for (const [key, label] of Object.entries(FUEL_TYPES)) {
        const btn = document.createElement('button');
        btn.className = `fuel-btn ${key === app.state.fuel ? 'active' : ''}`;
        btn.textContent = label;
        btn.onclick = () => {
            app.state.fuel = key;
            document.querySelectorAll('.fuel-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            app.displayCount = PAGE_SIZE;
            app.updateUI();
        };
        container.appendChild(btn);
    }
}

function renderFuelGrid(core, stations, total) {
    const grid = document.getElementById('resultsGrid');
    if (!grid) return;

    if (stations.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8;font-size:18px;"><span class="material-icons-outlined" style="font-size:48px;display:block;margin-bottom:12px;">search_off</span>Nenhum posto encontrado.<br><small>Tenta ajustar os filtros ou a pesquisa.</small></div>';
        return;
    }

    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    stations.forEach((station, index) => {
        const price = station.prices[app.state.fuel].toFixed(3).split('.');
        const brandColor = BRAND_COLORS[station.brand] || '#1e293b';
        const dist = core.getDistance(station);
        const distText = dist !== null ? `<span style="font-size:11px;color:#10b981;font-weight:600;display:flex;align-items:center;gap:4px;"><span class="material-icons-outlined" style="font-size:14px;">near_me</span>${dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(1) + ' km'}</span>` : '';

        const card = document.createElement('div');
        card.className = 'station-card';
        card.style.animationDelay = `${(index % 20) * 0.05}s`;

        card.innerHTML = `
            <div class="card-header">
                <div style="display: flex; flex-direction: column;">
                    <span class="card-brand" style="color: ${brandColor}">${sanitizeHTML(station.brand.toUpperCase())}</span>
                    <span class="card-name" title="${sanitizeHTML(station.name)}">${sanitizeHTML(station.name)}</span>
                </div>
                <span class="material-icons-outlined card-icon">local_gas_station</span>
            </div>

            <div class="spacer"></div>

            <div class="card-location" style="align-items: flex-start; display: flex;">
                <span class="material-icons-outlined" style="margin-right: 8px;">location_on</span>
                <div style="text-align: left;">
                    <div style="font-weight: 500; font-size: 13px; line-height: 1.3; margin-bottom: 3px;">${sanitizeHTML(station.address)}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${sanitizeHTML(station.parish)}, ${sanitizeHTML(station.municipality)}</div>
                    ${distText}
                </div>
            </div>

            <div class="card-divider"></div>

            <div class="card-footer">
                <div style="display: flex; flex-direction: column;">
                    <div class="price-display">
                        <span class="price-main">${price[0]}</span>
                        <span class="price-dec">.${price[1]}</span>
                        <span class="price-unit">€/L</span>
                    </div>
                    <span class="card-address" title="${sanitizeHTML(station.address)}">${sanitizeHTML(station.address)}</span>
                </div>

                <div class="card-index">${index + 1}</div>
            </div>
        `;
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

function renderFuelMap(core, stations) {
    if (core.markerCluster) {
        core.markerCluster.clearLayers();
    } else {
        core.mapMarkers.forEach(m => core.map.removeLayer(m));
        core.mapMarkers = [];
    }

    const bounds = [];
    const fuelLabel = FUEL_TYPES[app.state.fuel] || app.state.fuel;
    const allMarkers = [];

    stations.slice(0, 500).forEach(station => {
        const brandColor = BRAND_COLORS[station.brand] || '#1e293b';
        const price = station.prices[app.state.fuel];
        const priceDisplay = price > 0 ? price.toFixed(3) : 'N/D';

        const popupContent = `
            <div style="font-family: Outfit, sans-serif; min-width: 180px;">
                <div style="font-weight: 700; color: ${brandColor}; font-size: 13px;">${sanitizeHTML(station.brand.toUpperCase())}</div>
                <div style="font-weight: 600; margin: 4px 0;">${sanitizeHTML(station.name)}</div>
                <div style="font-size: 11px; color: #94a3b8;">${sanitizeHTML(station.address)}</div>
                <div style="margin-top: 6px; font-size: 20px; font-weight: 900; color: #0ea5e9;">
                    ${priceDisplay}€/L
                </div>
                <div style="font-size: 10px; color: #94a3b8;">${fuelLabel}</div>
            </div>`;

        const icon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="
                width: 28px; height: 28px;
                background: ${brandColor};
                border: 2px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ">⛽</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker([station.lat, station.lng], { icon })
            .bindPopup(popupContent);

        if (core.markerCluster) {
            allMarkers.push(marker);
        } else {
            core.mapMarkers.push(marker);
        }
        bounds.push([station.lat, station.lng]);
    });

    if (core.markerCluster && allMarkers.length > 0) {
        core.markerCluster.addLayers(allMarkers);
        core.map.fitBounds(L.latLngBounds(bounds).pad(0.1));
    } else if (core.mapMarkers.length > 0) {
        const group = L.featureGroup(core.mapMarkers).addTo(core.map);
        core.map.fitBounds(group.getBounds().pad(0.1));
    }
}

function updateStats(core, filtered) {
    const prices = filtered.map(s => s.prices[app.state.fuel]).filter(p => p > 0);
    const avgPrice = document.getElementById('avgPrice');
    const minPrice = document.getElementById('minPrice');
    if (prices.length > 0) {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        if (avgPrice) avgPrice.textContent = `${avg.toFixed(3)}€/L`;
        if (minPrice) minPrice.textContent = `${min.toFixed(3)}€/L`;
    } else {
        if (avgPrice) avgPrice.textContent = '0.000€/L';
        if (minPrice) minPrice.textContent = '0.000€/L';
    }
}

function sortFuel(filtered, state) {
    if (state.sort === 'price') {
        return filtered.sort((a, b) => a.prices[state.fuel] - b.prices[state.fuel]);
    }
    return filtered.sort((a, b) => a.brand.localeCompare(b.brand));
}

document.addEventListener('DOMContentLoaded', () => {
    app = new AppCore({
        apiEndpoint: '/api/stations/fuel',
        defaultSort: 'price',
        onUpdate: updateStats,
        onRenderGrid: renderFuelGrid,
        onRenderMap: renderFuelMap,
        customSort: sortFuel
    });
    window._appCore = app;
    app.state.fuel = 'gasolina95';

    renderFuelTypes();
    app.init();

    var mapBtn = document.getElementById('btnMap');
    var gridBtn = document.getElementById('btnGrid');
    var grid = document.getElementById('resultsGrid');
    var mapContainer = document.getElementById('mapContainer');
    if (mapBtn) {
        mapBtn.addEventListener('click', function() {
            app.state.view = 'map';
            mapBtn.classList.add('active');
            gridBtn.classList.remove('active');
            grid.style.display = 'none';
            mapContainer.style.display = '';
            if (!app.map) {
                initLeafletMap(app);
            } else {
                app.map.invalidateSize();
            }
            app.onRenderMap(app, app.lastFiltered);
            app.hideLoadMore();
        });
    }
});
