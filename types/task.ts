export type Category = "To Do" | "In Progress" | "Review" | "Completed";

export type Task = {
  id: string;
  name: string;
  category: Category;
  start: string; // ISO date
  end: string; // ISO date
};

