<script>
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import 'leaflet.markercluster';
  import 'leaflet.markercluster/dist/MarkerCluster.css';
  import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
  import { onMount } from 'svelte';

  let { stations = [], type = 'fuel', fuelType, getBrandColor, getMarkerColor } = $props();

  let mapContainer;
  let map = null;
  let markerCluster = null;

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  onMount(() => {
    map = L.map(mapContainer).setView([39.5, -8.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markerCluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    map.addLayer(markerCluster);

    updateMarkers();
  });

  function updateMarkers() {
    if (!markerCluster || !stations) return;
    markerCluster.clearLayers();
    if (stations.length === 0) return;

    const bounds = [];
    const limited = stations.slice(0, 500);

    limited.forEach((station) => {
      const brand = station.brand;
      const color = getBrandColor ? getBrandColor(brand) : '#38BDF8';
      const mColor = getMarkerColor ? getMarkerColor(station) : '#38BDF8';

      let popupContent;
      if (type === 'fuel' && fuelType) {
        const price = station.prices[fuelType];
        const priceDisplay = price > 0 ? price.toFixed(3) : 'N/D';
        const fuelLabels = {
          gasolina95: 'Gasolina 95',
          gasolina98: 'Gasolina 98',
          gasoleo: 'Gasoleo',
          gpl: 'GPL',
        };
        popupContent = `
          <div style="font-family: Outfit, sans-serif; min-width: 180px; color: #fff;">
            <div style="font-weight: 700; color: ${color}; font-size: 13px;">${station.brand.toUpperCase()}</div>
            <div style="font-weight: 600; margin: 4px 0;">${station.name}</div>
            <div style="font-size: 11px; color: #94a3b8;">${station.address}</div>
            <div style="margin-top: 6px; font-size: 20px; font-weight: 900; color: #0ea5e9;">
              ${priceDisplay}&euro;/L
            </div>
            <div style="font-size: 10px; color: #94a3b8;">${fuelLabels[fuelType] || fuelType}</div>
          </div>`;
      } else {
        const available = station.chargers?.available_posts || 0;
        const total = station.chargers?.total_posts || 0;
        const statusColor = available > 0 ? '#10b981' : total > 0 ? '#f59e0b' : '#ef4444';
        popupContent = `
          <div style="font-family: Outfit, sans-serif; min-width: 180px; color: #fff;">
            <div style="font-weight: 700; color: ${color}; font-size: 13px;">${station.brand.toUpperCase()}</div>
            <div style="font-weight: 600; margin: 4px 0;">${station.name}</div>
            <div style="font-size: 11px; color: #94a3b8;">${station.address}</div>
            <div style="margin-top: 6px; display: flex; gap: 8px; font-size: 11px;">
              <span style="color: ${statusColor}; font-weight: 600;">${available}/${total} disponiveis</span>
              <span style="color: #94a3b8;">${station.chargers?.power_info || 'N/A'}</span>
            </div>
          </div>`;
      }

      const emoji = type === 'fuel' ? '&#x26FD;' : '&#x26A1;';

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="
          width:28px;height:28px;
          background:${color};
          border:2px solid ${mColor};
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;color:white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        ">${emoji}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([station.lat, station.lng], { icon }).bindPopup(popupContent);
      markerCluster.addLayer(marker);
      bounds.push([station.lat, station.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.1));
    }
  }

  $effect(() => {
    if (map && markerCluster && stations) {
      updateMarkers();
    }
  });
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
  .map-container {
    width: calc(100% - 80px);
    margin: 0 40px 60px 40px;
    border-radius: 30px;
    border: 1px solid var(--card-border);
    overflow: hidden;
    min-height: 600px;
    z-index: 10;
  }

  @media (max-width: 768px) {
    .map-container {
      width: calc(100% - 40px);
      margin: 0 20px 40px 20px;
      min-height: 400px;
    }
  }

  :global(.leaflet-popup-content-wrapper) {
    background: #1e293b !important;
    color: #fff !important;
    border-radius: 12px !important;
    font-family: 'Outfit', sans-serif !important;
  }

  :global(.leaflet-popup-tip) {
    background: #1e293b !important;
  }

  :global(.leaflet-popup-close-button) {
    color: #94a3b8 !important;
  }
</style>
