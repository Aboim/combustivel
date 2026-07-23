const SOCKET_NAMES = {
  type2: 'Type 2',
  type2_cable: 'Type 2 (Cabo)',
  type2_combo: 'CCS Combo',
  chademo: 'CHAdeMO',
  schuko: 'Schuko',
  tesla_destination: 'Tesla Dest.',
  cee_blue: 'CEE Azul',
  cee_red_16a: 'CEE Verm.',
  bosch_3pin: 'Bosch 3P',
  shimano_steps_5pin: 'Shimano 5P',
};

export function getSocketLabels(socketTypes) {
  if (!socketTypes) return null;
  const labels = [];
  for (const [type, details] of Object.entries(socketTypes)) {
    const name = SOCKET_NAMES[type] || type;
    const count = details.count || details.output || Object.values(details)[0] || '?';
    const output = details.output || '';
    const label = output ? `${name}: ${output}` : `${name}: ${count}`;
    labels.push(label);
  }
  return labels;
}
