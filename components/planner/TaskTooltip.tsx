"use client";

import { format } from "date-fns";
import type { Task } from "@/types/task";

export type TaskTooltipProps = {
  task: Task;
  isVisible: boolean;
  position: { x: number; y: number };
};

export function TaskTooltip({ task, isVisible, position }: TaskTooltipProps) {
  if (!isVisible) return null;

  const startDate = new Date(task.start);
  const endDate = new Date(task.end);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div
      className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg max-w-xs pointer-events-none"
      style={{
        left: position.x + 12,
        top: position.y + 16,
      }}
    >
      <div className="font-semibold mb-2">{task.name}</div>
      <div className="space-y-1 text-gray-300">
        <div>Category: {task.category}</div>
        <div>Start: {format(startDate, "MMM d, yyyy")}</div>
        <div>End: {format(endDate, "MMM d, yyyy")}</div>
        <div>Duration: {duration} day{duration > 1 ? 's' : ''}</div>
      </div>
    </div>
  );
} 