<script>
  import { createEventDispatcher } from 'svelte';

  let inputValue = $state('');
  const dispatch = createEventDispatcher();

  let timeout;

  function handleInput(e) {
    clearTimeout(timeout);
    inputValue = e.target.value;
    timeout = setTimeout(() => {
      dispatch('change', { search: inputValue });
    }, 300);
  }
</script>

<div class="search-section">
  <span class="search-icon">&#x1F50D;</span>
  <input
    type="text"
    placeholder="Pesquisar posto, marca ou localidade..."
    value={inputValue}
    oninput={handleInput}
  />
</div>

<style>
  .search-section {
    position: relative;
    width: 350px;
  }

  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dark);
    font-size: 16px;
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 50px;
    background: rgba(30, 41, 59, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 0 20px 0 45px;
    color: var(--text-main);
    font-family: var(--font-family);
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
  }

  input:focus {
    border-color: rgba(56, 189, 248, 0.5);
    background: rgba(30, 41, 59, 0.5);
  }

  input::placeholder {
    color: var(--text-dark);
  }

  @media (max-width: 768px) {
    .search-section {
      width: 100%;
    }
  }
</style>
