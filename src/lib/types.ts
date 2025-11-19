
export type Task = {
  id: string;
  projectId: string;
  userId: string; // Added userId for collection group queries
  name: string;
  description: string;
  completed: boolean;
  deadline: string | null;
  priority: 'high' | 'medium' | 'low';
  status: string; // Corresponds to a column id
  order: number;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

export type Column = {
    id: string;
    title: string;
    order: number;
}
