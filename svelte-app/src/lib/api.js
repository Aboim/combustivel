export async function fetchFuelStations() {
  const res = await fetch('/api/stations/fuel');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchEVStations() {
  const res = await fetch('/api/stations/ev');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchEVLive() {
  const res = await fetch('/api/stations/ev/live');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
