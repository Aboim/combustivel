<script>
  import { EV_BRAND_COLORS } from '../lib/brandColors.js';
  import { getSocketLabels } from './evHelpers.js';

  let { station, index = 0, distanceText = null } = $props();

  let brandColor = $derived(EV_BRAND_COLORS[station.brand] || '#10b981');
  let availablePosts = $derived(station.chargers?.available_posts ?? 0);
  let totalPosts = $derived(station.chargers?.total_posts ?? 0);
  let powerInfo = $derived(station.chargers?.power_info ?? 'N/A');
  let socketTypes = $derived(station.chargers?.socket_types ?? null);
  let fee = $derived(station.chargers?.fee ?? 'yes');
  let access = $derived(station.chargers?.access ?? 'yes');
  let openingHours = $derived(station.chargers?.opening_hours ?? '24/7');

  let statusText = $derived(
    availablePosts > 0
      ? `${availablePosts} de ${totalPosts} Disponiveis`
      : totalPosts > 0
        ? 'Ocupado'
        : 'Sem Informacao',
  );

  let statusColor = $derived(
    availablePosts > 0 ? '#10b981' : totalPosts > 0 ? '#f59e0b' : '#ef4444',
  );

  let feeLabel = $derived(fee === 'yes' ? 'Pago' : fee === 'no' ? 'Gratuito' : fee);
  let feeColor = $derived(fee === 'no' ? '#10b981' : '#f59e0b');

  let accessLabel = $derived(
    access === 'yes' ? 'Publico' : access === 'customers' ? 'Clientes' : access === 'private' ? 'Privado' : access,
  );
  let accessColor = $derived(
    access === 'yes' ? '#10b981' : access === 'customers' ? '#0ea5e9' : '#f59e0b',
  );

  let socketLabels = $derived(getSocketLabels(socketTypes));
</script>

<div class="station-card" style="animation-delay: {(index % 20) * 0.05}s">
  <div class="card-header">
    <div class="card-brand-info">
      <span class="card-brand" style="color: {brandColor}">{station.brand.toUpperCase()}</span>
      <span class="card-name" title={station.name}>{station.name}</span>
    </div>
    <span class="card-icon ev-icon" style="color: {brandColor}">&#x26A1;</span>
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

  <div class="card-footer-ev">
    <div class="status-row">
      <div class="status-left">
        &#x26A1;
        <span>Postos</span>
      </div>
      <span class="status-badge" style="color: {statusColor}; background: {statusColor}20">
        {statusText}
      </span>
    </div>

    <div class="socket-row">
      {#if socketLabels && socketLabels.length > 0}
        {#each socketLabels.slice(0, 3) as label}
          <span class="socket-tag">{label}</span>
        {/each}
      {:else}
        <span class="socket-tag muted">Info: {powerInfo}</span>
      {/if}
    </div>

    <div class="meta-row">
      <div class="meta-pill" style="color: {feeColor}">
        &#x1F4B6;
        <span>{feeLabel}</span>
      </div>
      <div class="meta-pill" style="color: {accessColor}">
        &#x1F513;
        <span>{accessLabel}</span>
      </div>
      <div class="meta-pill muted">
        &#x1F552;
        <span>{openingHours}</span>
      </div>
    </div>
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
    min-height: 380px;
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
    font-size: 18px;
  }
  .ev-icon {
    color: #10b981;
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
  .card-footer-ev {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
  }
  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .status-left {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .status-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
  }
  .socket-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .socket-tag {
    font-size: 10px;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    color: #0ea5e9;
  }
  .socket-tag.muted {
    color: var(--text-muted);
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .meta-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.03);
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 10px;
    font-weight: 500;
  }
  .meta-pill.muted {
    color: var(--text-muted);
  }
</style>
