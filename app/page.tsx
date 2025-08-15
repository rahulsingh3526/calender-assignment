"use client";

import { useMemo, useState, useEffect } from "react";
import { addDays, isWithinInterval } from "date-fns";
import { Filters } from "@/components/planner/Filters";
import { CreateTaskDialog, EditTaskDialog } from "@/components/planner/TaskForms";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { CategoryBoard } from "@/components/planner/CategoryBoard";
import { MonthNavigation } from "@/components/planner/MonthNavigation";
import { TaskTooltip } from "@/components/planner/TaskTooltip";
import { CATEGORIES } from "@/components/planner/constants";
import { buildMonthGrid } from "@/lib/date";
import { computeLanes } from "@/lib/lanes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import type { Category, Task } from "@/types/task";

export default function PlannerPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useLocalStorageState<Task[]>("tasks", []);
  const [selection, setSelection] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [focusedDay, setFocusedDay] = useState<Date>(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState<Category>("To Do");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dragSelectStart, setDragSelectStart] = useState<Date | null>(null);
  const [dragSelectHover, setDragSelectHover] = useState<Date | null>(null);
  const [resizing, setResizing] = useState<{ taskId: string | null; edge: "left" | "right" | null }>({ taskId: null, edge: null });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Tooltip state
  const [tooltipTask, setTooltipTask] = useState<Task | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

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

  // Tooltip handlers
  const handleShowTooltip = (task: Task, position: { x: number; y: number }) => {
    setTooltipTask(task);
    setTooltipPosition(position);
    setIsTooltipVisible(true);
  };

  const handleHideTooltip = () => {
    setIsTooltipVisible(false);
  };

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
    // Prepend so it appears on top in the CategoryBoard list for that day
    setTasks((prev) => [newTask, ...prev]);
    // Now that the task is actually created, align the focused day to its start so the top board reflects it
    setFocusedDay(selection.start);
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
          const nextStart = targetDay <= end ? targetDay : end;
          return { ...t, start: nextStart.toISOString() };
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
    <main className="min-h-screen p-4 sm:p-6 md:p-10">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center sm:text-left">Month View Task Planner</h1>

      <MonthNavigation 
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      <Filters
        search={search}
        setSearch={setSearch}
        categories={CATEGORIES}
        selectedCategories={filterCategories}
        setSelectedCategories={setFilterCategories}
        filterWeeks={filterWeeks}
        setFilterWeeks={setFilterWeeks}
      />

      {/* Top category board for the focused day */}
      <CategoryBoard
        day={focusedDay}
        onChangeDay={(d) => {
          setFocusedDay(d);
          setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        }}
        tasks={filteredTasks.filter(
          (t) =>
            (new Date(t.start).toDateString() <= focusedDay.toDateString() &&
              new Date(t.end).toDateString() >= focusedDay.toDateString())
        )}
        idOrder={tasks.reduce((acc, t, idx) => {
          acc[t.id] = idx; // after createTask we unshift, so lower idx means newer; we invert in CategoryBoard
          return acc;
        }, {} as Record<string, number>)}
        onEdit={openEdit}
        onMoveCategory={(taskId, newCategory, insertBeforeTaskId) =>
          setTasks((prev) => {
            const list = [...prev];
            const fromIdx = list.findIndex((t) => t.id === taskId);
            if (fromIdx === -1) return prev;
            const moved = { ...list[fromIdx], category: newCategory };
            list.splice(fromIdx, 1);
            if (insertBeforeTaskId) {
              const toIdx = list.findIndex((t) => t.id === insertBeforeTaskId);
              const targetIdx = toIdx === -1 ? list.length : toIdx;
              list.splice(targetIdx, 0, moved);
            } else {
              list.push(moved);
            }
            return list;
          })
        }
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
        onShowTooltip={handleShowTooltip}
        onHideTooltip={handleHideTooltip}
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

      <TaskTooltip
        task={tooltipTask!}
        isVisible={isTooltipVisible && !!tooltipTask}
        position={tooltipPosition}
      />
    </main>
  );
}


