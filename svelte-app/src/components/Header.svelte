<script>
  let { top, filters } = $props();
</script>

<header class="glass-header">
  <div class="header-top">
    {#if top}
      {@render top()}
    {/if}
  </div>
  <div class="header-filters">
    {#if filters}
      {@render filters()}
    {/if}
  </div>
</header>

<style>
  .glass-header {
    background: rgba(2, 6, 23, 0.93);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding: 30px 40px 20px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    gap: 20px;
  }
  .header-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }
  @media (max-width: 768px) {
    .glass-header {
      padding: 20px 20px 15px;
    }
    .header-top {
      flex-direction: column;
      align-items: flex-start;
    }
    .header-filters {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
