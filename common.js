const $ = (id) => document.getElementById(id);
const PAGE_SIZE = 50;

const FUEL_BRAND_COLORS = {
    "Galp": "#FF8C00",
    "Repsol": "#FF4500",
    "BP": "#32CD32",
    "Prio": "#00BFFF",
    "Cepsa": "#DC143C",
    "Auchan": "#FF0000",
    "Jumbo": "#E3000F",
    "Intermarché": "#B22222",
    "Alves Bandeira": "#00008B",
    "Pingo Doce": "#006400",
    "OZ Energia": "#4B0082"
};

const EV_BRAND_COLORS = {
    "EDP": "#ef4444",
    "Galp": "#FF8C00",
    "Mobi.E": "#0ea5e9",
    "Powerdot": "#10b981",
    "Ionity": "#8b5cf6",
    "Tesla": "#e11d48",
    "Continente Plug&Charge": "#dc2626",
    "Pingo Doce": "#16a34a",
    "Lidl": "#0284c7",
    "Aldi": "#2563eb",
    "Mercadona": "#15803d",
    "IKEA": "#fbbf24",
    "Auchan": "#ef4444",
    "Kargo": "#f59e0b",
    "PRIO": "#9333ea",
    "Iberdrola": "#14b8a6",
    "Atlante": "#ec4899",
    "Repsol": "#eab308",
    "wowplug": "#6366f1",
    "Mobiletric": "#f97316",
    "Helexia": "#84cc16",
    "Renewing": "#06b6d4",
    "SEGMA": "#a855f7",
    "Maksu": "#f43f5e",
    "ecoinside": "#22d3ee",
    "MobiSmart": "#a3e635",
    "Moon": "#fbbf24",
    "leve": "#2dd4bf",
    "Moeve": "#fb923c",
    "EVCE": "#c084fc",
    "KLC": "#38bdf8",
    "Hexagonal Ocean": "#4ade80",
    "Factor Energia": "#fb7185",
    "Cepsa": "#e11d48",
    "e-flow": "#818cf8",
    "Porsche": "#facc15",
    "Charging Together": "#34d399",
    "Loulé Concelho Global": "#f472b6",
    "EMEL": "#60a5fa",
    "EV Power": "#cbd5e1",
    "DTE": "#f87171",
    "Mota Engil": "#a78bfa",
    "EVIO": "#fbbf24",
    "Plug4Us": "#34d399",
    "Outra": "#94a3b8"
};

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function initLeafletMap(app) {
    const mapContainer = $('mapContainer');
    if (mapContainer) mapContainer.style.display = '';
    app.map = L.map('map').setView([39.5, -8.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(app.map);
    if (typeof L.markerClusterGroup === 'function') {
        app.markerCluster = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false
        });
        app.map.addLayer(app.markerCluster);
    }
    app.map.invalidateSize();
}

class AppCore {
    constructor(config) {
        this.state = {
            district: 'Todos',
            municipality: 'Todos',
            parish: 'Todas',
            brand: 'Todas',
            sort: config.defaultSort,
            search: '',
            stations: [],
            view: 'grid'
        };
        this.userLocation = null;
        this.apiEndpoint = config.apiEndpoint;
        this.onUpdate = config.onUpdate;
        this.onRenderGrid = config.onRenderGrid;
        this.onRenderMap = config.onRenderMap;
        this.getStationStatus = config.getStationStatus || (() => 0);
        this.customSort = config.customSort || null;

        this.lastFiltered = [];
        this.displayCount = PAGE_SIZE;
        this.map = null;
        this.mapMarkers = [];
        this.markerCluster = null;
        this._sortExplicitlySet = false;
    }

    async init() {
        this.attachEventListeners();
        this.tryGeolocate();

        try {
            const response = await fetch(this.apiEndpoint);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const db = await response.json();
            this.state.stations = db.stations;
            this.populateSelects();
            this.updateUI();
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            const grid = $('resultsGrid');
            if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8;font-size:18px;"><span class="material-icons-outlined" style="font-size:48px;display:block;margin-bottom:12px;">error_outline</span>Erro ao carregar dados do servidor.<br><small>Verifica se o servidor está a correr na porta 8080.</small></div>';
        }
    }

    tryGeolocate() {
        const btn = $('btnGeoloc');
        if (!btn || !navigator.geolocation) {
            if (btn) btn.style.display = 'none';
            return;
        }

        btn.addEventListener('click', () => {
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
            btn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px;animation:spin 1s linear infinite;">my_location</span> A localizar...';

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    btn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px;color:#10b981;">my_location</span> Perto de mim';
                    btn.classList.add('active');
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                    if (!this._sortExplicitlySet) {
                        const sortSelect = $('sortSelect');
                        if (sortSelect) sortSelect.value = 'distance';
                        this.state.sort = 'distance';
                    }
                    this.updateUI();
                },
                () => {
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                    btn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px;">my_location</span> Localização';
                    alert('Não foi possível obter a localização. Verifica as permissões do browser.');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    populateSelects() {
        const allDistricts = [...new Set(this.state.stations.map(s => s.district))].sort();
        const allBrands = [...new Set(this.state.stations.map(s => s.brand))].sort();

        const districtSelect = $('districtSelect');
        if (districtSelect) {
            districtSelect.innerHTML = '<option value="Todos">Todos os Distritos</option>' +
                allDistricts.map(d => `<option value="${d}">${d}</option>`).join('');
        }

        const brandSelect = $('brandSelect');
        if (brandSelect) {
            brandSelect.innerHTML = '<option value="Todas">Todas as Marcas</option>' +
                allBrands.map(b => `<option value="${b}">${b}</option>`).join('');
        }

        const sortSelect = $('sortSelect');
        if (sortSelect && !sortSelect.querySelector('option[value="distance"]')) {
            const opt = document.createElement('option');
            opt.value = 'distance';
            opt.textContent = 'Distância';
            sortSelect.appendChild(opt);
        }

        this.updateMunicipalityDropdown();
    }

    updateMunicipalityDropdown() {
        const muniSelect = $('municipalitySelect');
        if (!muniSelect) return;
        let munis = [];
        if (this.state.district !== 'Todos') {
            munis = [...new Set(this.state.stations.filter(s => s.district === this.state.district).map(s => s.municipality))].sort();
        }
        muniSelect.innerHTML = '<option value="Todos">Todos os Concelhos</option>' +
            munis.map(m => `<option value="${m}">${m}</option>`).join('');
        this.state.municipality = 'Todos';
        this.updateParishDropdown();
    }

    updateParishDropdown() {
        const parishSelect = $('parishSelect');
        if (!parishSelect) return;
        let parishes = [];
        if (this.state.municipality !== 'Todos') {
            parishes = [...new Set(this.state.stations.filter(s => s.municipality === this.state.municipality).map(s => s.parish))].sort();
        }
        parishSelect.innerHTML = '<option value="Todas">Todas as Freguesias</option>' +
            parishes.map(p => `<option value="${p}">${p}</option>`).join('');
        this.state.parish = 'Todas';
    }

    attachEventListeners() {
        const searchInput = $('searchInput');
        if (searchInput) {
            const debouncedSearch = debounce(() => {
                this.state.search = searchInput.value.toLowerCase();
                this.displayCount = PAGE_SIZE;
                this.updateUI();
            }, 300);
            searchInput.addEventListener('input', debouncedSearch);
        }

        const districtSelect = $('districtSelect');
        if (districtSelect) {
            districtSelect.addEventListener('change', (e) => {
                this.state.district = e.target.value;
                this.updateMunicipalityDropdown();
                this.displayCount = PAGE_SIZE;
                this.updateUI();
            });
        }

        const muniSelect = $('municipalitySelect');
        if (muniSelect) {
            muniSelect.addEventListener('change', (e) => {
                this.state.municipality = e.target.value;
                this.updateParishDropdown();
                this.displayCount = PAGE_SIZE;
                this.updateUI();
            });
        }

        const parishSelect = $('parishSelect');
        if (parishSelect) {
            parishSelect.addEventListener('change', (e) => {
                this.state.parish = e.target.value;
                this.displayCount = PAGE_SIZE;
                this.updateUI();
            });
        }

        const brandSelect = $('brandSelect');
        if (brandSelect) {
            brandSelect.addEventListener('change', (e) => {
                this.state.brand = e.target.value;
                this.displayCount = PAGE_SIZE;
                this.updateUI();
            });
        }

        const sortSelect = $('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.state.sort = e.target.value;
                this._sortExplicitlySet = true;
                this.displayCount = PAGE_SIZE;
                this.updateUI();
            });
        }

        const btnGrid = $('btnGrid');
        const btnMap = $('btnMap');
        const grid = $('resultsGrid');
        const mapContainer = $('mapContainer');

        if (btnGrid && btnMap) {
            btnGrid.addEventListener('click', () => {
                this.state.view = 'grid';
                btnGrid.classList.add('active');
                btnMap.classList.remove('active');
                if (grid) grid.style.display = '';
                if (mapContainer) mapContainer.style.display = 'none';
                this.displayCount = PAGE_SIZE;
                this.updateUI();
            });
        }
    }

    filter() {
        return this.state.stations.filter(s => {
            if (this.state.district !== 'Todos' && s.district !== this.state.district) return false;
            if (this.state.municipality !== 'Todos' && s.municipality !== this.state.municipality) return false;
            if (this.state.parish !== 'Todas' && s.parish !== this.state.parish) return false;
            if (this.state.brand !== 'Todas' && s.brand !== this.state.brand) return false;
            if (this.state.search) {
                const searchStr = `${s.name} ${s.brand} ${s.municipality} ${s.parish}`.toLowerCase();
                if (!searchStr.includes(this.state.search)) return false;
            }
            return true;
        });
    }

    sort(filtered) {
        if (this.state.sort === 'distance' && this.userLocation) {
            return filtered.sort((a, b) => {
                const dA = haversineDistance(this.userLocation.lat, this.userLocation.lng, a.lat, a.lng);
                const dB = haversineDistance(this.userLocation.lat, this.userLocation.lng, b.lat, b.lng);
                return dA - dB;
            });
        }
        if (this.customSort) {
            return this.customSort(filtered, this.state);
        }
        return filtered.sort((a, b) => a.brand.localeCompare(b.brand));
    }

    getDistance(station) {
        if (!this.userLocation) return null;
        return haversineDistance(this.userLocation.lat, this.userLocation.lng, station.lat, station.lng);
    }

    updateUI() {
        let filtered = this.filter();
        filtered = this.sort(filtered);

        const resultsCount = $('resultsCount');
        let loc = this.state.parish !== 'Todas' ? this.state.parish :
            (this.state.municipality !== 'Todos' ? this.state.municipality : this.state.district);
        if (loc === 'Todos' || loc === 'Todas') loc = 'Portugal';
        if (resultsCount) resultsCount.textContent = `${filtered.length} Resultados em ${loc}`;

        this.lastFiltered = filtered;

        if (this.state.view === 'grid') {
            const display = filtered.slice(0, this.displayCount);
            this.onRenderGrid(this, display, filtered.length);
            this.renderLoadMore(filtered.length);
        } else if (this.map) {
            this.onRenderMap(this, filtered);
        }

        if (this.onUpdate) this.onUpdate(this, filtered);
    }

    renderLoadMore(total) {
        let container = $('loadMoreContainer');
        if (!container) {
            const grid = $('resultsGrid');
            if (!grid) return;
            container = document.createElement('div');
            container.id = 'loadMoreContainer';
            container.style.cssText = 'grid-column:1/-1;display:flex;justify-content:center;padding:10px 0 30px;';
            grid.parentNode.insertBefore(container, grid.nextSibling);
        }

        if (this.displayCount >= total) {
            container.innerHTML = '';
            return;
        }

        const remaining = total - this.displayCount;
        container.innerHTML = `
            <button id="btnLoadMore" class="load-more-btn" onclick="window._appCore.loadMore()">
                <span class="material-icons-outlined" style="font-size:16px;">expand_more</span>
                Carregar mais ${Math.min(remaining, PAGE_SIZE)} de ${remaining} postos
            </button>`;
    }

    loadMore() {
        this.displayCount += PAGE_SIZE;
        const filtered = this.lastFiltered;
        const display = filtered.slice(0, this.displayCount);
        this.onRenderGrid(this, display, filtered.length);
        this.renderLoadMore(filtered.length);

        const grid = $('resultsGrid');
        if (grid) {
            grid.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    hideLoadMore() {
        const container = $('loadMoreContainer');
        if (container) container.innerHTML = '';
    }
}
