import { addDays, endOfMonth, endOfWeek, isWithinInterval, startOfMonth, startOfWeek } from "date-fns";
import type { Task } from "@/types/task";

export function buildMonthGrid(baseDate: Date) {
  const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

export function taskOverlapsDay(task: Task, day: Date) {
  return isWithinInterval(day, { start: new Date(task.start), end: new Date(task.end) });
}

export function calcDurationDays(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export function clampDateBetween(target: Date, left: Date, right: Date) {
  if (target < left) return left;
  if (target > right) return right;
  return target;
}

