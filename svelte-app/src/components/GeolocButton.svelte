<script>
  import { userLocation } from '../lib/stores.js';

  let loading = $state(false);
  let active = $state(false);

  function handleClick() {
    if (!navigator.geolocation) {
      alert('Geolocalizacao nao suportada neste browser.');
      return;
    }

    loading = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation.set({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        loading = false;
        active = true;
      },
      () => {
        loading = false;
        active = false;
        alert('Nao foi possivel obter a localizacao. Verifica as permissoes do browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
</script>

<button class="geoloc-btn" class:active onclick={handleClick} disabled={loading}>
  {#if loading}
    &#x1F3AF; A localizar...
  {:else if active}
    &#x2705; Perto de mim
  {:else}
    &#x1F4CD; Localizacao
  {/if}
</button>

<style>
  .geoloc-btn {
    background: rgba(30, 41, 59, 0.3);
    color: var(--text-muted);
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 8px 16px;
    border-radius: 12px;
    font-family: var(--font-family);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .geoloc-btn:hover {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(56, 189, 248, 0.3);
    color: var(--text-main);
  }
  .geoloc-btn.active {
    background: var(--success);
    color: white;
    border-color: var(--success);
  }
  .geoloc-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>
