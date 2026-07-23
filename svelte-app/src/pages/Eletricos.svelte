<script>
  import { onMount } from 'svelte';
  import { userLocation } from '../lib/stores.js';
  import { fetchEVStations, fetchEVLive } from '../lib/api.js';
  import { EV_BRAND_COLORS } from '../lib/brandColors.js';
  import { haversineDistance, getDistanceText } from '../lib/utils.js';
  import Header from '../components/Header.svelte';
  import Logo from '../components/Logo.svelte';
  import SearchBar from '../components/SearchBar.svelte';
  import Filters from '../components/Filters.svelte';
  import StatsBar from '../components/StatsBar.svelte';
  import StationGrid from '../components/StationGrid.svelte';
  import Map from '../components/Map.svelte';
  import LoadMore from '../components/LoadMore.svelte';
  import GeolocButton from '../components/GeolocButton.svelte';
  import ViewToggle from '../components/ViewToggle.svelte';

  const PAGE_SIZE = 50;

  let allStations = $state([]);
  let view = $state('grid');
  let displayCount = $state(PAGE_SIZE);
  let search = $state('');
  let district = $state('Todos');
  let municipality = $state('Todos');
  let parish = $state('Todas');
  let brand = $state('Todas');
  let sort = $state('status');
  let sortExplicitlySet = $state(false);
  let error = $state('');
  let loading = $state(true);
  let updatingLive = $state(false);

  let userLoc = $state(null);
  $effect(() => {
    const unsub = userLocation.subscribe((v) => (userLoc = v));
    return unsub;
  });

  onMount(async () => {
    try {
      const data = await fetchEVStations();
      allStations = data.stations;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  let districts = $derived([...new Set(allStations.map((s) => s.district))].sort());
  let brands = $derived([...new Set(allStations.map((s) => s.brand))].sort());

  let municipalities = $derived.by(() => {
    if (district === 'Todos') return [];
    return [...new Set(allStations.filter((s) => s.district === district).map((s) => s.municipality))].sort();
  });

  let parishes = $derived.by(() => {
    if (municipality === 'Todos') return [];
    return [...new Set(allStations.filter((s) => s.municipality === municipality).map((s) => s.parish))].sort();
  });

  $effect(() => {
    if (district === 'Todos') municipality = 'Todos';
  });

  $effect(() => {
    if (municipality === 'Todos') parish = 'Todas';
  });

  $effect(() => {
    if (userLoc && !sortExplicitlySet) sort = 'distance';
  });

  function isStationAvailable(station) {
    return (station.chargers?.available_posts ?? 0) > 0;
  }

  let filtered = $derived(
    allStations.filter((s) => {
      if (district !== 'Todos' && s.district !== district) return false;
      if (municipality !== 'Todos' && s.municipality !== municipality) return false;
      if (parish !== 'Todas' && s.parish !== parish) return false;
      if (brand !== 'Todas' && s.brand !== brand) return false;
      if (search) {
        const str = `${s.name} ${s.brand} ${s.municipality} ${s.parish}`.toLowerCase();
        if (!str.includes(search.toLowerCase())) return false;
      }
      return true;
    }),
  );

  let sorted = $derived.by(() => {
    const arr = [...filtered];
    if (sort === 'distance' && userLoc) {
      arr.sort((a, b) => {
        const dA = haversineDistance(userLoc.lat, userLoc.lng, a.lat, a.lng);
        const dB = haversineDistance(userLoc.lat, userLoc.lng, b.lat, b.lng);
        return dA - dB;
      });
    } else if (sort === 'status') {
      arr.sort((a, b) => {
        const aAvail = isStationAvailable(a) ? 1 : 0;
        const bAvail = isStationAvailable(b) ? 1 : 0;
        return bAvail - aAvail;
      });
    } else {
      arr.sort((a, b) => a.brand.localeCompare(b.brand));
    }
    return arr;
  });

  let displayed = $derived(sorted.slice(0, displayCount));

  let totalStations = $derived(filtered.length);
  let availableCount = $derived(filtered.filter(isStationAvailable).length);

  let locLabel = $derived.by(() => {
    if (parish !== 'Todas') return parish;
    if (municipality !== 'Todos') return municipality;
    if (district !== 'Todos') return district;
    return 'Portugal';
  });

  let distanceTexts = $derived.by(() => {
    if (!userLoc) return {};
    const texts = {};
    displayed.forEach((s, i) => {
      texts[i] = getDistanceText(s, userLoc);
    });
    return texts;
  });

  function onSearch(e) {
    search = e.detail.search;
    displayCount = PAGE_SIZE;
  }

  function handleSortChange(newSort) {
    sortExplicitlySet = true;
    displayCount = PAGE_SIZE;
  }

  function handleDistrictChange() {
    displayCount = PAGE_SIZE;
  }

  async function handleLiveUpdate() {
    updatingLive = true;
    try {
      const data = await fetchEVLive();
      allStations = allStations.map((s) => {
        const live = data.stations.find((ls) => ls.id === s.id);
        if (live) {
          return { ...s, chargers: { ...s.chargers, ...live.chargers } };
        }
        return s;
      });
    } catch (e) {
      alert('Nao foi possivel ligar ao servidor para verificacao online.');
    } finally {
      updatingLive = false;
    }
  }

  function loadMore() {
    displayCount += PAGE_SIZE;
  }

  function getBrandColor(b) {
    return EV_BRAND_COLORS[b] || '#10b981';
  }

  function getMarkerColor(station) {
    const available = station.chargers?.available_posts || 0;
    const total = station.chargers?.total_posts || 0;
    return available > 0 ? '#10b981' : total > 0 ? '#f59e0b' : '#ef4444';
  }
</script>

{#if loading}
  <div class="loading">A carregar dados...</div>
{:else if error}
  <div class="error">
    Erro ao carregar dados do servidor.<br />
    <small>Verifica se o servidor esta a correr na porta 8080.</small>
  </div>
{:else}
  {#snippet top()}
    <Logo
      title="EV"
      highlight="Smart"
      subtitle="POSTOS DE CARREGAMENTO"
      highlightColor="var(--success)"
      icon={iconLogo}
    />
    <SearchBar onchange={onSearch} />
  {/snippet}

  {#snippet iconLogo()}
    &#x26A1;
  {/snippet}

  {#snippet filters()}
    <div class="fuel-types-spacer"></div>
    <Filters
      bind:district
      bind:municipality
      bind:parish
      bind:brand
      {sort}
      {districts}
      {municipalities}
      {parishes}
      {brands}
      sortOptions={[
        { value: 'status', label: 'Estado (Disp./Ocup.)' },
        { value: 'brand', label: 'Marca' },
      ]}
      onSortChange={handleSortChange}
      onchange={handleDistrictChange}
    />
  {/snippet}

  <Header {top} {filters} />

  {#snippet rightContent()}
    <button class="btn-online" disabled={updatingLive} onclick={handleLiveUpdate}>
      {#if updatingLive}
        &#x1F504; A Atualizar...
      {:else}
        &#x1F504; Atualizar Online
      {/if}
    </button>
  {/snippet}

  <StatsBar
    stats={[
      { label: 'TOTAL DE POSTOS', value: `${totalStations}` },
      { label: 'DISPONIVEIS AGORA', value: `${availableCount}`, green: true },
      { label: '', value: `${sorted.length} Resultados em ${locLabel}` },
    ]}
    right={rightContent}
  />

  <div class="view-row">
    <GeolocButton />
    <ViewToggle bind:view />
  </div>

  {#if view === 'grid'}
    <div class="grid-wrapper">
      <StationGrid type="ev" stations={displayed} {distanceTexts} />
      {#if displayed.length < sorted.length}
        <LoadMore
          remaining={sorted.length - displayed.length}
          pageSize={PAGE_SIZE}
          onclick={loadMore}
        />
      {/if}
    </div>
  {:else}
    <div class="map-wrapper">
      <Map
        type="ev"
        stations={sorted}
        {getBrandColor}
        {getMarkerColor}
      />
    </div>
  {/if}
{/if}

<style>
  .loading,
  .error {
    text-align: center;
    padding: 100px 40px;
    color: #94a3b8;
    font-size: 18px;
  }
  .error small {
    display: block;
    margin-top: 8px;
    font-size: 14px;
  }
  .fuel-types-spacer {
    width: 0;
    height: 0;
    overflow: hidden;
  }
  .view-row {
    padding: 0 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  .grid-wrapper {
    display: contents;
  }
  .map-wrapper {
    width: 100%;
    min-height: 600px;
  }
  .btn-online {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-family);
    font-weight: 600;
    font-size: 13px;
    transition: all 0.3s ease;
  }
  .btn-online:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .btn-online:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  @media (max-width: 768px) {
    .view-row {
      padding: 0 20px;
    }
  }
</style>
