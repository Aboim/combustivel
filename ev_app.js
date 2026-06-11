const BRAND_COLORS = EV_BRAND_COLORS;

let app;

function isStationAvailable(station) {
    return (station.chargers?.available_posts > 0);
}

function getSocketLabels(socketTypes) {
    if (!socketTypes) return null;
    const labels = [];
    const socketNames = {
        'type2': 'Type 2',
        'type2_cable': 'Type 2 (Cabo)',
        'type2_combo': 'CCS Combo',
        'chademo': 'CHAdeMO',
        'schuko': 'Schuko',
        'tesla_destination': 'Tesla Dest.',
        'cee_blue': 'CEE Azul',
        'cee_red_16a': 'CEE Verm.',
        'bosch_3pin': 'Bosch 3P',
        'shimano_steps_5pin': 'Shimano 5P'
    };
    for (const [type, details] of Object.entries(socketTypes)) {
        const name = socketNames[type] || type;
        const count = details.count || details.output || Object.values(details)[0] || '?';
        const output = details.output || '';
        const label = output ? `${name}: ${output}` : `${name}: ${count}`;
        labels.push(label);
    }
    return labels;
}

function renderEvGrid(core, stations, total) {
    const grid = document.getElementById('resultsGrid');
    if (!grid) return;

    if (stations.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8;font-size:18px;"><span class="material-icons-outlined" style="font-size:48px;display:block;margin-bottom:12px;">search_off</span>Nenhum posto encontrado.<br><small>Tenta ajustar os filtros ou a pesquisa.</small></div>';
        return;
    }

    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    stations.forEach((station, index) => {
        const brandColor = BRAND_COLORS[station.brand] || '#10b981';
        const dist = core.getDistance(station);
        const distText = dist !== null ? `<span style="font-size:11px;color:#10b981;font-weight:600;display:flex;align-items:center;gap:4px;margin-top:4px;"><span class="material-icons-outlined" style="font-size:14px;">near_me</span>${dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(1) + ' km'}</span>` : '';

        const availablePosts = station.chargers?.available_posts || 0;
        const totalPosts = station.chargers?.total_posts || 0;
        const powerInfo = station.chargers?.power_info || 'N/A';
        const socketTypes = station.chargers?.socket_types || null;
        const fee = station.chargers?.fee || 'yes';
        const access = station.chargers?.access || 'yes';
        const openingHours = station.chargers?.opening_hours || '24/7';

        const statusText = availablePosts > 0
            ? `${availablePosts} de ${totalPosts} Disponíveis`
            : (totalPosts > 0 ? 'Ocupado' : 'Sem Informação');
        const statusColor = availablePosts > 0 ? '#10b981' : (totalPosts > 0 ? '#f59e0b' : '#ef4444');

        const feeLabel = fee === 'yes' ? 'Pago' : fee === 'no' ? 'Gratuito' : fee;
        const feeColor = fee === 'no' ? '#10b981' : '#f59e0b';
        const accessLabel = access === 'yes' ? 'Público' : access === 'customers' ? 'Clientes' : access === 'private' ? 'Privado' : access;
        const accessColor = access === 'yes' ? '#10b981' : (access === 'customers' ? '#0ea5e9' : '#f59e0b');

        const socketLabels = getSocketLabels(socketTypes);
        const socketHtml = socketLabels && socketLabels.length > 0
            ? socketLabels.slice(0, 3).map(l => `<span style="font-size: 10px; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; color: #0ea5e9;">${l}</span>`).join(' ')
            : `<span style="font-size: 10px; color: var(--text-muted);">Info: ${powerInfo}</span>`;

        const card = document.createElement('div');
        card.className = 'station-card';
        card.style.animationDelay = `${(index % 20) * 0.05}s`;

        card.innerHTML = `
            <div class="card-header">
                <div style="display: flex; flex-direction: column;">
                    <span class="card-brand" style="color: ${brandColor}">${sanitizeHTML(station.brand.toUpperCase())}</span>
                    <span class="card-name" title="${sanitizeHTML(station.name)}">${sanitizeHTML(station.name)}</span>
                </div>
                <span class="material-icons-outlined card-icon" style="color: ${brandColor}">ev_station</span>
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

            <div class="card-footer" style="flex-direction: column; align-items: stretch; gap: 8px; justify-content: flex-start; margin-top: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="material-icons-outlined" style="font-size: 16px; color: ${statusColor}">ev_station</span>
                        <span style="font-size: 12px; font-weight: 600;">Postos</span>
                    </div>
                    <span style="font-size: 11px; font-weight: 600; color: ${statusColor}; background: ${statusColor}20; padding: 2px 8px; border-radius: 12px;">${statusText}</span>
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    ${socketHtml}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                        <span class="material-icons-outlined" style="font-size: 12px; color: ${feeColor}">euro</span>
                        <span style="font-size: 10px; color: ${feeColor}; font-weight: 500;">${feeLabel}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                        <span class="material-icons-outlined" style="font-size: 12px; color: ${accessColor}">lock_open</span>
                        <span style="font-size: 10px; color: ${accessColor}; font-weight: 500;">${accessLabel}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.03); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                        <span class="material-icons-outlined" style="font-size: 12px; color: var(--text-muted)">schedule</span>
                        <span style="font-size: 10px; color: var(--text-muted); font-weight: 500;">${openingHours}</span>
                    </div>
                </div>
            </div>
        `;
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

function renderEvMap(core, stations) {
    if (core.markerCluster) {
        core.markerCluster.clearLayers();
    } else {
        core.mapMarkers.forEach(m => core.map.removeLayer(m));
        core.mapMarkers = [];
    }

    const bounds = [];
    const allMarkers = [];

    stations.slice(0, 500).forEach(station => {
        const brandColor = BRAND_COLORS[station.brand] || '#10b981';
        const available = station.chargers?.available_posts || 0;
        const total = station.chargers?.total_posts || 0;
        const statusColor = available > 0 ? '#10b981' : (total > 0 ? '#f59e0b' : '#ef4444');

        const popupContent = `
            <div style="font-family: Outfit, sans-serif; min-width: 180px;">
                <div style="font-weight: 700; color: ${brandColor}; font-size: 13px;">${sanitizeHTML(station.brand.toUpperCase())}</div>
                <div style="font-weight: 600; margin: 4px 0;">${sanitizeHTML(station.name)}</div>
                <div style="font-size: 11px; color: #94a3b8;">${sanitizeHTML(station.address)}</div>
                <div style="margin-top: 6px; display: flex; gap: 8px; font-size: 11px;">
                    <span style="color: ${statusColor}; font-weight: 600;">
                        ${available}/${total} disponiveis
                    </span>
                    <span style="color: #94a3b8;">${station.chargers?.power_info || 'N/A'}</span>
                </div>
            </div>`;

        const icon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="
                width: 28px; height: 28px;
                background: ${brandColor};
                border: 2px solid ${statusColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ">⚡</div>`,
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
    const totalEl = document.getElementById('totalStations');
    const availEl = document.getElementById('availableStations');
    const availableCount = filtered.filter(isStationAvailable).length;
    if (totalEl) totalEl.textContent = filtered.length;
    if (availEl) availEl.textContent = availableCount;
}

function sortEv(filtered, state) {
    if (state.sort === 'status') {
        return filtered.sort((a, b) => {
            const aAvail = isStationAvailable(a) ? 1 : 0;
            const bAvail = isStationAvailable(b) ? 1 : 0;
            return bAvail - aAvail;
        });
    }
    return filtered.sort((a, b) => a.brand.localeCompare(b.brand));
}

function attachLiveUpdate() {
    const btn = document.getElementById('btnAtualizarOnline');
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
        const btnEl = e.currentTarget;
        btnEl.style.opacity = "0.7";
        btnEl.style.pointerEvents = "none";
        btnEl.innerHTML = '<span class="material-icons-outlined" style="font-size: 16px; animation: spin 1s linear infinite;">sync</span> A Atualizar...';

        try {
            const response = await fetch('/api/stations/ev/live');
            if (!response.ok) throw new Error("Erro na rede");
            const db = await response.json();

            app.state.stations.forEach(s => {
                const liveS = db.stations.find(ls => ls.id === s.id);
                if (liveS) {
                    s.chargers = liveS.chargers;
                }
            });

            app.updateUI();
        } catch (error) {
            console.error("Erro ao atualizar dados online:", error);
            alert("Não foi possível ligar ao servidor para verificação online.");
        } finally {
            btnEl.style.opacity = "1";
            btnEl.style.pointerEvents = "auto";
            btnEl.innerHTML = '<span class="material-icons-outlined" style="font-size: 16px;">sync</span> Atualizar Online';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const fuelTypes = document.getElementById('fuelTypes');
    if (fuelTypes) fuelTypes.style.display = 'none';

    app = new AppCore({
        apiEndpoint: '/api/stations/ev',
        defaultSort: 'status',
        onUpdate: updateStats,
        onRenderGrid: renderEvGrid,
        onRenderMap: renderEvMap,
        customSort: sortEv
    });
    window._appCore = app;

    attachLiveUpdate();
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
