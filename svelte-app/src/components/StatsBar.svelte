<script>
  let { stats = [], right } = $props();
</script>

<div class="dashboard-stats">
  <div class="stat-box">
    <span class="stat-label">{stats[0]?.label || ''}</span>
    <span class="stat-value">{stats[0]?.value || ''}</span>
  </div>
  <div class="stat-divider"></div>
  <div class="stat-box">
    <span class="stat-label">{stats[1]?.label || ''}</span>
    <span class="stat-value" class:highlight-green={stats[1]?.green}>{stats[1]?.value || ''}</span>
  </div>
  <div class="spacer"></div>
  <div class="stat-right">
    {#if right}
      {@render right()}
    {/if}
    <span class="results-count">{stats[2]?.value || '0 Resultados'}</span>
    <div class="badge">
      <span class="badge-icon">&#x2705;</span>
      <span>DADOS OFICIAIS DGEG</span>
    </div>
  </div>
</div>

<style>
  .dashboard-stats {
    display: flex;
    align-items: center;
    padding: 30px 40px;
    gap: 30px;
    flex-wrap: wrap;
  }
  .stat-box {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .stat-label {
    font-size: 10px;
    font-weight: 900;
    color: var(--text-dark);
    letter-spacing: 0.5px;
  }
  .stat-value {
    font-size: 24px;
    font-weight: 900;
  }
  .highlight-green {
    color: var(--success);
  }
  .stat-divider {
    width: 1px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.05);
  }
  .spacer {
    flex: 1;
  }
  .stat-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
  }
  .results-count {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted);
  }
  .badge {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--primary);
    font-size: 10px;
    font-weight: 900;
  }
  .badge-icon {
    font-size: 14px;
  }
  @media (max-width: 768px) {
    .dashboard-stats {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px;
    }
    .stat-divider {
      width: 100%;
      height: 1px;
    }
    .stat-right {
      align-items: flex-start;
    }
  }
</style>
