<script>
  import Combustiveis from './pages/Combustiveis.svelte';
  import Eletricos from './pages/Eletricos.svelte';

  let tab = $state('combustiveis');
</script>

<div class="app-container">
  <nav class="app-navigation">
    <button
      class="nav-tab"
      class:active={tab === 'combustiveis'}
      onclick={() => (tab = 'combustiveis')}
    >
      &#x26FD; Combustiveis
    </button>
    <button
      class="nav-tab ev-tab"
      class:active={tab === 'eletricos'}
      onclick={() => (tab = 'eletricos')}
    >
      &#x26A1; Eletricos
    </button>
  </nav>

  {#if tab === 'combustiveis'}
    <Combustiveis />
  {:else}
    <Eletricos />
  {/if}
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .app-navigation {
    display: flex;
    justify-content: center;
    gap: 15px;
    padding: 20px 0 10px 0;
  }

  .nav-tab {
    padding: 10px 24px;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-family: var(--font-family);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-tab:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .nav-tab.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
  }

  .ev-tab.active {
    background: var(--success);
    border-color: var(--success);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  }
</style>
