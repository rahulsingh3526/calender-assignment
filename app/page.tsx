"use client";

import { useMemo, useState, useEffect } from "react";
import { addDays, isWithinInterval } from "date-fns";
import { Filters } from "@/components/planner/Filters";
import { CreateTaskDialog, EditTaskDialog } from "@/components/planner/TaskForms";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { CATEGORIES } from "@/components/planner/constants";
import { buildMonthGrid } from "@/lib/date";
import { computeLanes } from "@/lib/lanes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import type { Category, Task } from "@/types/task";

export default function PlannerPage() {
  const [currentMonth] = useState(new Date());
  const [tasks, setTasks] = useLocalStorageState<Task[]>("tasks", []);
  const [selection, setSelection] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState<Category>("To Do");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dragSelectStart, setDragSelectStart] = useState<Date | null>(null);
  const [dragSelectHover, setDragSelectHover] = useState<Date | null>(null);
  const [resizing, setResizing] = useState<{ taskId: string | null; edge: "left" | "right" | null }>({ taskId: null, edge: null });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const [filterCategories, setFilterCategories] = useState<Category[]>(CATEGORIES);
  const [filterWeeks, setFilterWeeks] = useState<1 | 2 | 3 | null>(null);
  const [search, setSearch] = useState("");

  const days = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  const filteredTasks = useMemo(() => {
    const byCat = tasks.filter((t) => filterCategories.includes(t.category));
    const bySearch = byCat.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
    if (!filterWeeks) return bySearch;
    const now = new Date();
    const horizon = addDays(now, filterWeeks * 7);
    return bySearch.filter(
      (t) =>
        isWithinInterval(new Date(t.start), { start: now, end: horizon }) ||
        isWithinInterval(new Date(t.end), { start: now, end: horizon })
    );
  }, [tasks, filterCategories, filterWeeks, search]);

  const { laneByTaskId, laneCount } = useMemo(() => computeLanes(filteredTasks), [filteredTasks]);

  function startResize(taskId: string, edge: "left" | "right") {
    setResizing({ taskId, edge });
  }

  function openCreateModal(rangeStart: Date, rangeEnd: Date) {
    setDraftName("");
    setDraftCategory("To Do");
    setSelection({ start: rangeStart, end: rangeEnd });
    setIsCreateOpen(true);
  }

  useEffect(() => {
    function handleMouseUp() {
      if (dragSelectStart) {
        const start = dragSelectStart;
        const end = dragSelectHover ?? dragSelectStart;
        openCreateModal(start < end ? start : end, start < end ? end : start);
        setDragSelectStart(null);
        setDragSelectHover(null);
      }
      if (resizing.taskId) setResizing({ taskId: null, edge: null });
    }
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [dragSelectStart, dragSelectHover, resizing.taskId]);

  function createTask() {
    if (!selection.start || !selection.end) return;
    const newTask: Task = {
      id: Math.random().toString(36).slice(2),
      name: draftName || "Untitled Task",
      category: draftCategory,
      start: selection.start.toISOString(),
      end: selection.end.toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
    setIsCreateOpen(false);
  }

  function openEdit(task: Task) {
    setEditTaskId(task.id);
    setDraftName(task.name);
    setDraftCategory(task.category);
    setIsEditOpen(true);
  }

  function saveEdit() {
    if (!editTaskId) return;
    setTasks((prev) => prev.map((t) => (t.id === editTaskId ? { ...t, name: draftName, category: draftCategory } : t)));
    setIsEditOpen(false);
    setEditTaskId(null);
  }

  function resizeTask(taskId: string, edge: "left" | "right", targetDay: Date) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const start = new Date(t.start);
        const end = new Date(t.end);
        if (edge === "left") {
          if (targetDay > start) {
            const nextStart = targetDay <= end ? targetDay : end;
            return { ...t, start: nextStart.toISOString() };
          }
          return t;
        }
        const nextEnd = targetDay >= start ? targetDay : start;
        return { ...t, end: nextEnd.toISOString() };
      })
    );
  }

  function applyDrag(taskId: string, newStart: Date, newEnd: Date) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, start: newStart.toISOString(), end: newEnd.toISOString() } : t)));
  }

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) ?? null : null;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-bold mb-4">Month View Task Planner</h1>

      <Filters
        search={search}
        setSearch={setSearch}
        categories={CATEGORIES}
        selectedCategories={filterCategories}
        setSelectedCategories={setFilterCategories}
        filterWeeks={filterWeeks}
        setFilterWeeks={setFilterWeeks}
      />

      <PlannerGrid
        days={days}
        filteredTasks={filteredTasks}
        laneByTaskId={laneByTaskId}
        laneCount={laneCount}
        activeTask={activeTask}
        setActiveTaskId={setActiveTaskId}
        dragSelectStart={dragSelectStart}
        dragSelectHover={dragSelectHover}
        onMouseDownDay={(d) => {
          setDragSelectStart(d);
          setDragSelectHover(d);
        }}
        onMouseEnterDay={(d) => {
          if (dragSelectStart) setDragSelectHover(d);
          if (resizing.taskId && resizing.edge) resizeTask(resizing.taskId, resizing.edge, d);
        }}
        onStartResize={startResize}
        onEdit={openEdit}
        onDragEndUpdate={applyDrag}
      />

      <CreateTaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        draftName={draftName}
        setDraftName={setDraftName}
        draftCategory={draftCategory}
        setDraftCategory={setDraftCategory}
        categories={CATEGORIES}
        onCreate={createTask}
      />

      <EditTaskDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        draftName={draftName}
        setDraftName={setDraftName}
        draftCategory={draftCategory}
        setDraftCategory={setDraftCategory}
        categories={CATEGORIES}
        onSave={saveEdit}
      />
    </main>
  );
}


