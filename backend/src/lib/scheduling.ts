export function assignStartPositions(
  entries: { id: string; riderId: string }[]
): { id: string; startPosition: number }[] {
  const N = entries.length;
  if (N === 0) return [];

  // Group entries by riderId
  const riderMap = new Map<string, { id: string; riderId: string }[]>();
  for (const entry of entries) {
    const group = riderMap.get(entry.riderId) ?? [];
    group.push(entry);
    riderMap.set(entry.riderId, group);
  }

  // Sort riders by entry count descending (most entries first)
  const riders = [...riderMap.values()].sort((a, b) => b.length - a.length);

  // Init schedule array of size N, all null
  const schedule: (string | null)[] = new Array(N).fill(null);

  for (const riderEntries of riders) {
    const k = riderEntries.length;
    const gap = Math.max(1, Math.floor(N / k));

    // Try offsets 0..gap-1; pick the one where most proposed slots are free
    let bestOffset = 0;
    let bestFreeCount = -1;

    for (let offset = 0; offset < gap; offset++) {
      let freeCount = 0;
      for (let i = 0; i < k; i++) {
        const slot = (offset + i * gap) % N;
        if (schedule[slot] === null) freeCount++;
      }
      if (freeCount > bestFreeCount) {
        bestFreeCount = freeCount;
        bestOffset = offset;
      }
    }

    // Place entries using best offset; linear probe +1 if slot taken
    for (let i = 0; i < k; i++) {
      let slot = (bestOffset + i * gap) % N;
      // Linear probe if slot is taken
      while (schedule[slot] !== null) {
        slot = (slot + 1) % N;
      }
      schedule[slot] = riderEntries[i].id;
    }
  }

  // Build result: schedule[i] is the entry id at 0-indexed position i
  return (schedule as string[]).map((id, i) => ({
    id,
    startPosition: i + 1,
  }));
}
