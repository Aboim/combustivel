<script>
  import StationCard from './StationCard.svelte';
  import EVStationCard from './EVStationCard.svelte';

  let { stations = [], fuelType, type = 'fuel', distanceTexts = {} } = $props();
</script>

<div class="grid-container">
  {#if stations.length === 0}
    <div class="empty">
      &#x1F50D;
      <p>Nenhum posto encontrado.</p>
      <small>Tenta ajustar os filtros ou a pesquisa.</small>
    </div>
  {:else}
    {#each stations as station, i}
      {#if type === 'fuel'}
        <StationCard
          {station}
          {fuelType}
          index={i}
          distanceText={distanceTexts[i] || null}
        />
      {:else}
        <EVStationCard
          {station}
          index={i}
          distanceText={distanceTexts[i] || null}
        />
      {/if}
    {/each}
  {/if}
</div>

<style>
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px;
    padding: 0 40px 60px;
  }
  .empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px;
    color: #94a3b8;
    font-size: 18px;
  }
  .empty p {
    margin-top: 12px;
  }
  .empty small {
    display: block;
    margin-top: 8px;
    font-size: 14px;
  }
  @media (max-width: 768px) {
    .grid-container {
      padding: 0 20px 40px;
    }
  }
</style>
