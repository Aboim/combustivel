<script>
  let {
    district = 'Todos',
    municipality = 'Todos',
    parish = 'Todas',
    brand = 'Todas',
    sort = 'price',
    districts = [],
    municipalities = [],
    parishes = [],
    brands = [],
    sortOptions = [
      { value: 'price', label: 'Preco' },
      { value: 'brand', label: 'Marca' },
    ],
    onSortChange,
  } = $props();

  function handleSortChange(e) {
    sort = e.target.value;
    onSortChange?.(sort);
  }
</script>

<div class="dropdown-filters">
  <select class="premium-select" bind:value={district}>
    <option value="Todos">Todos os Distritos</option>
    {#each districts as d}
      <option value={d}>{d}</option>
    {/each}
  </select>

  <select class="premium-select" bind:value={municipality}>
    <option value="Todos">Todos os Concelhos</option>
    {#each municipalities as m}
      <option value={m}>{m}</option>
    {/each}
  </select>

  <select class="premium-select" bind:value={parish}>
    <option value="Todas">Todas as Freguesias</option>
    {#each parishes as p}
      <option value={p}>{p}</option>
    {/each}
  </select>

  <select class="premium-select" bind:value={brand}>
    <option value="Todas">Todas as Marcas</option>
    {#each brands as b}
      <option value={b}>{b}</option>
    {/each}
  </select>

  <select class="premium-select" value={sort} onchange={handleSortChange}>
    {#each sortOptions as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
</div>

<style>
  .dropdown-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .premium-select {
    appearance: none;
    background: rgba(30, 41, 59, 0.3)
      url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23cbd5e1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")
      no-repeat right 15px top 50%;
    background-size: 10px auto;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 0 35px 0 15px;
    height: 45px;
    color: #cbd5e1;
    font-family: var(--font-family);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    outline: none;
    min-width: 130px;
  }
  .premium-select:focus {
    border-color: rgba(56, 189, 248, 0.5);
  }
  .premium-select option {
    background-color: #1e293b;
    color: var(--text-main);
  }
</style>
