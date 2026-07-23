<script>
  import { onMount } from 'svelte';
  import { userLocation } from '../lib/stores.js';
  import { fetchFuelStations } from '../lib/api.js';
  import { FUEL_BRAND_COLORS } from '../lib/brandColors.js';
  import { haversineDistance, getDistanceText } from '../lib/utils.js';
  import Header from '../components/Header.svelte';
  import Logo from '../components/Logo.svelte';
  import SearchBar from '../components/SearchBar.svelte';
  import FuelTypeSelector from '../components/FuelTypeSelector.svelte';
  import Filters from '../components/Filters.svelte';
  import StatsBar from '../components/StatsBar.svelte';
  import StationGrid from '../components/StationGrid.svelte';
  import Map from '../components/Map.svelte';
  import LoadMore from '../components/LoadMore.svelte';
  import GeolocButton from '../components/GeolocButton.svelte';
  import ViewToggle from '../components/ViewToggle.svelte';

  const PAGE_SIZE = 50;

  let allStations = $state([]);
  let selectedFuel = $state('gasolina95');
  let view = $state('grid');
  let displayCount = $state(PAGE_SIZE);
  let search = $state('');
  let district = $state('Todos');
  let municipality = $state('Todos');
  let parish = $state('Todas');
  let brand = $state('Todas');
  let sort = $state('price');
  let sortExplicitlySet = $state(false);
  let error = $state('');
  let loading = $state(true);

  let userLoc = $state(null);
  $effect(() => {
    const unsub = userLocation.subscribe((v) => (userLoc = v));
    return unsub;
  });

  onMount(async () => {
    try {
      const data = await fetchFuelStations();
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
    } else if (sort === 'price') {
      arr.sort((a, b) => (a.prices[selectedFuel] || 999) - (b.prices[selectedFuel] || 999));
    } else {
      arr.sort((a, b) => a.brand.localeCompare(b.brand));
    }
    return arr;
  });

  let displayed = $derived(sorted.slice(0, displayCount));

  let avgPrice = $derived.by(() => {
    const prices = filtered.map((s) => s.prices[selectedFuel]).filter((p) => p > 0);
    if (prices.length === 0) return '0.000';
    return (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(3);
  });

  let minPrice = $derived.by(() => {
    const prices = filtered.map((s) => s.prices[selectedFuel]).filter((p) => p > 0);
    if (prices.length === 0) return '0.000';
    return Math.min(...prices).toFixed(3);
  });

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

  function loadMore() {
    displayCount += PAGE_SIZE;
  }

  function getBrandColor(b) {
    return FUEL_BRAND_COLORS[b] || '#1e293b';
  }

  function getMarkerColor(station) {
    return FUEL_BRAND_COLORS[station.brand] || '#1e293b';
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
      title="Fuel"
      highlight="Smart"
      subtitle="DIRECTORIO NACIONAL WEB"
      highlightColor="var(--primary)"
      icon={iconLogo}
    />
    <SearchBar onchange={onSearch} />
  {/snippet}

  {#snippet iconLogo()}
    &#x26A1;
  {/snippet}

  {#snippet filters()}
    <FuelTypeSelector bind:selected={selectedFuel} />
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
        { value: 'price', label: 'Preco' },
        { value: 'brand', label: 'Marca' },
      ]}
      onSortChange={handleSortChange}
      onchange={handleDistrictChange}
    />
  {/snippet}

  <Header {top} {filters} />

  <StatsBar
    stats={[
      { label: 'MEDIA NACIONAL', value: `${avgPrice}€/L` },
      { label: 'PRECO MINIMO', value: `${minPrice}€/L`, green: true },
      { label: '', value: `${sorted.length} Resultados em ${locLabel}` },
    ]}
  />

  <div class="view-row">
    <GeolocButton />
    <ViewToggle bind:view />
  </div>

  {#if view === 'grid'}
    <div class="grid-wrapper">
      <StationGrid type="fuel" stations={displayed} fuelType={selectedFuel} {distanceTexts} />
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
        type="fuel"
        stations={sorted}
        fuelType={selectedFuel}
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
  @media (max-width: 768px) {
    .view-row {
      padding: 0 20px;
    }
  }
</style>
