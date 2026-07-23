<script>
  let { title = 'FuelSmart', highlight = 'Smart', subtitle = 'DIRECTORIO NACIONAL WEB', highlightColor = 'var(--primary)', icon } = $props();
</script>

<div class="logo-section">
  <div class="logo-icon" style="color: {highlightColor}">
    {#if icon}
      {@render icon()}
    {/if}
  </div>
  <div class="logo-text">
    <h1>
      {title}<span class="highlight" style="color: {highlightColor}">{highlight}</span>
    </h1>
    <span class="subtitle">{subtitle}</span>
  </div>
</div>

<style>
  .logo-section {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .logo-icon {
    background: rgba(56, 189, 248, 0.2);
    padding: 10px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .logo-text h1 {
    font-size: 24px;
    font-weight: 900;
    font-style: italic;
    line-height: 1;
    white-space: nowrap;
  }
  .subtitle {
    font-size: 9px;
    font-weight: 800;
    color: var(--text-dark);
    letter-spacing: 1px;
  }
</style>
