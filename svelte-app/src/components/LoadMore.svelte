<script>
  let { remaining = 0, pageSize = 50, onclick } = $props();
</script>

{#if remaining > 0}
  <div class="load-more-wrapper">
    <button class="load-more-btn" {onclick}>
      &#x2B07;
      Carregar mais {Math.min(remaining, pageSize)} de {remaining} postos
    </button>
  </div>
{/if}

<style>
  .load-more-wrapper {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    padding: 10px 0 30px;
  }
  .load-more-btn {
    background: rgba(30, 41, 59, 0.3);
    color: var(--primary);
    border: 1px solid rgba(56, 189, 248, 0.2);
    padding: 14px 32px;
    border-radius: 16px;
    font-family: var(--font-family);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .load-more-btn:hover {
    background: rgba(56, 189, 248, 0.15);
    border-color: rgba(56, 189, 248, 0.5);
    transform: translateY(-2px);
  }
</style>
