import type { Task } from "@/types/task";

export function computeLanes(tasks: Task[]) {
  const sorted = [...tasks].sort((a, b) => {
    const as = new Date(a.start).getTime();
    const bs = new Date(b.start).getTime();
    if (as !== bs) return as - bs;
    return new Date(a.end).getTime() - new Date(b.end).getTime();
  });
  const laneEndTime: number[] = [];
  const map: Record<string, number> = {};
  for (const t of sorted) {
    const startMs = new Date(t.start).getTime();
    const endMs = new Date(t.end).getTime();
    let placedLane = 0;
    while (placedLane < laneEndTime.length && startMs <= laneEndTime[placedLane]) {
      placedLane += 1;
    }
    map[t.id] = placedLane;
    if (placedLane === laneEndTime.length) laneEndTime.push(endMs);
    else laneEndTime[placedLane] = Math.max(laneEndTime[placedLane], endMs);
  }
  return { laneByTaskId: map, laneCount: laneEndTime.length } as const;
}

