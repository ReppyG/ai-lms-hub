export interface Course {
  id: number;
  name: string;
  course_code: string;
}

export interface Assignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null;
  points_possible: number;
  course_id: number;
  courseName: string;
  status: 'todo' | 'upcoming' | 'submitted' | 'completed' | 'overdue';
}

export interface StudyPlanStep {
  title: string;
  description: string;
  duration: number;
  completed?: boolean;
}

export interface StudyPlanMilestone {
  title: string;
  date: string;
}

export interface StudyPlan {
  title: string;
  estimatedHours: number;
  steps: StudyPlanStep[];
  milestones: StudyPlanMilestone[];
}

export interface Settings {
  canvasUrl: string;
  apiToken: string;
  sampleDataMode: boolean;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
