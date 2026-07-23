<script>
  let { selected = 'gasolina95', onselect } = $props();
  import { FUEL_TYPES } from '../lib/brandColors.js';

  const fuels = Object.entries(FUEL_TYPES);
</script>

<div class="fuel-types">
  {#each fuels as [key, label]}
    <button
      class="fuel-btn"
      class:active={selected === key}
      onclick={() => (selected = key)}
    >
      {label}
    </button>
  {/each}
</div>

<style>
  .fuel-types {
    display: flex;
    gap: 10px;
  }
  .fuel-btn {
    background: rgba(30, 41, 59, 0.3);
    color: var(--text-muted);
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-family: var(--font-family);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .fuel-btn:hover {
    background: rgba(30, 41, 59, 0.6);
    color: #fff;
  }
  .fuel-btn.active {
    background: var(--primary);
    color: var(--text-main);
  }
</style>
