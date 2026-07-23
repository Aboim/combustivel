<script>
  let { view = 'grid' } = $props();
</script>

<div class="view-toggle">
  <button
    class="view-btn"
    class:active={view === 'grid'}
    onclick={() => (view = 'grid')}
  >
    &#x1F5B1;
  </button>
  <button
    class="view-btn"
    class:active={view === 'map'}
    onclick={() => (view = 'map')}
  >
    &#x1F5FA;
  </button>
</div>

<style>
  .view-toggle {
    display: flex;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 12px;
    padding: 4px;
    align-self: flex-end;
  }
  .view-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .view-btn.active {
    background: var(--primary);
    color: var(--text-main);
  }
  .view-btn:hover:not(.active) {
    color: var(--text-main);
  }
</style>
