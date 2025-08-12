"use client";

import { format } from "date-fns";
import type { CSSProperties } from "react";
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
      style={computePosition(position)}
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

function computePosition(position: { x: number; y: number }): CSSProperties {
  const OFFSET_X = 12;
  const OFFSET_Y = 16;
  const PADDING = 8; // keep away from screen edges
  const TOOLTIP_WIDTH = 280; // approximate max width in px
  const TOOLTIP_HEIGHT = 120; // approximate height; will vary with content

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  let left = position.x + OFFSET_X;
  let top = position.y + OFFSET_Y;

  // If overflowing on the right, flip to left side of pointer
  if (left + TOOLTIP_WIDTH + PADDING > viewportWidth) {
    left = Math.max(PADDING, position.x - TOOLTIP_WIDTH - OFFSET_X);
  }

  // If overflowing bottom, try placing above pointer
  if (top + TOOLTIP_HEIGHT + PADDING > viewportHeight) {
    top = Math.max(PADDING, position.y - TOOLTIP_HEIGHT - OFFSET_Y);
  }

  // Clamp to viewport padding, ensuring upper bound is at least padding
  const maxLeft = Math.max(PADDING, viewportWidth - PADDING - TOOLTIP_WIDTH);
  const maxTop = Math.max(PADDING, viewportHeight - PADDING - TOOLTIP_HEIGHT);
  left = Math.min(Math.max(left, PADDING), maxLeft);
  top = Math.min(Math.max(top, PADDING), maxTop);

  // Ensure tooltip width does not exceed viewport width
  const maxWidth = Math.min(TOOLTIP_WIDTH, viewportWidth - 2 * PADDING);

  return { left, top, maxWidth };
}