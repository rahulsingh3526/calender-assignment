"use client";

import type { Category, Task } from "@/types/task";

const categoryColorClass: Record<Category, string> = {
  "To Do": "bg-slate-300",
  "In Progress": "bg-blue-300",
  Review: "bg-amber-300",
  Completed: "bg-emerald-300",
};

export function OverlayTask({ task }: { task: Task }) {
  return <div className={`h-6 rounded-md flex items-center ${categoryColorClass[task.category]} px-2 text-xs`}>{task.name}</div>;
}

