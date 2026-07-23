<script>
  import { FUEL_BRAND_COLORS } from '../lib/brandColors.js';

  let { station, fuelType, index = 0, distanceText = null } = $props();

  let priceParts = $derived.by(() => {
    if (!fuelType || !station.prices) return ['0', '000'];
    const price = station.prices[fuelType];
    if (price === undefined || price === null) return ['N/D', ''];
    return price.toFixed(3).split('.');
  });

  let brandColor = $derived(FUEL_BRAND_COLORS[station.brand] || '#1e293b');
</script>

<div class="station-card" style="animation-delay: {(index % 20) * 0.05}s">
  <div class="card-header">
    <div class="card-brand-info">
      <span class="card-brand" style="color: {brandColor}">{station.brand.toUpperCase()}</span>
      <span class="card-name" title={station.name}>{station.name}</span>
    </div>
    <span class="card-icon">&#x26FD;</span>
  </div>

  <div class="spacer"></div>

  <div class="card-location">
    <span class="location-icon">&#x1F4CD;</span>
    <div class="loc-info">
      <div class="loc-address">{station.address}</div>
      <div class="loc-muni">{station.parish}, {station.municipality}</div>
      {#if distanceText}
        <span class="distance">
          &#x1F3AF; {distanceText}
        </span>
      {/if}
    </div>
  </div>

  <div class="card-divider"></div>

  <div class="card-footer">
    <div class="price-info">
      <div class="price-display">
        <span class="price-main">{priceParts[0]}</span>
        {#if priceParts[1]}
          <span class="price-dec">.{priceParts[1]}</span>
        {/if}
        <span class="price-unit">&euro;/L</span>
      </div>
      <span class="card-address" title={station.address}>{station.address}</span>
    </div>
    <div class="card-index">{index + 1}</div>
  </div>
</div>

<style>
  .station-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 30px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    position: relative;
    overflow: hidden;
    min-height: 320px;
    opacity: 0;
    animation: fadeIn 0.4s ease forwards;
  }
  .station-card:hover {
    background: var(--card-hover-bg);
    border-color: var(--card-hover-border);
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 25px;
  }
  .card-brand-info {
    display: flex;
    flex-direction: column;
  }
  .card-brand {
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.5px;
  }
  .card-name {
    font-size: 18px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    margin-top: 2px;
  }
  .card-icon {
    color: var(--text-dark);
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .card-location {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 25px;
  }
  .location-icon {
    font-size: 16px;
    margin-top: 2px;
  }
  .loc-info {
    display: flex;
    flex-direction: column;
  }
  .loc-address {
    font-weight: 500;
    font-size: 13px;
    line-height: 1.3;
    margin-bottom: 3px;
  }
  .loc-muni {
    font-size: 11px;
    color: var(--text-muted);
  }
  .distance {
    font-size: 11px;
    color: var(--success);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }
  .card-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 25px;
  }
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .price-info {
    display: flex;
    flex-direction: column;
  }
  .price-display {
    display: flex;
    align-items: baseline;
    gap: 2px;
  }
  .price-main {
    font-size: 44px;
    font-weight: 900;
    font-style: italic;
    line-height: 1;
  }
  .price-dec {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-muted);
  }
  .price-unit {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-dark);
  }
  .card-address {
    font-size: 9px;
    font-weight: 700;
    color: var(--text-dark);
    margin-top: 5px;
    line-height: 1.3;
  }
  .card-index {
    width: 32px;
    height: 32px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
  }
</style>
