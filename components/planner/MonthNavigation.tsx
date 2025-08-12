"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { getPreviousMonth, getNextMonth, formatMonthYear } from "@/lib/date";

export type MonthNavigationProps = {
  currentMonth: Date;
  onMonthChange: (newMonth: Date) => void;
};

export function MonthNavigation({ currentMonth, onMonthChange }: MonthNavigationProps) {
  const handlePreviousMonth = () => {
    onMonthChange(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    onMonthChange(getNextMonth(currentMonth));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  const isCurrentMonth = new Date().getMonth() === currentMonth.getMonth() && 
                        new Date().getFullYear() === currentMonth.getFullYear();

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        onClick={handlePreviousMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      
      <h2 className="text-xl font-semibold text-gray-800 min-w-[140px] text-center">
        {formatMonthYear(currentMonth)}
      </h2>
      
      <button
        onClick={handleNextMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Next month"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>

      <button
        onClick={handleToday}
        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
          isCurrentMonth 
            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        Today
      </button>
    </div>
  );
} 