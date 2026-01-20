export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export type SubmissionType = 'github' | 'image';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export interface Feedback {
  id: string;
  teacherComment: string;
  rubricScore?: number;
  createdAt: number;
}

export interface Submission {
  id: string;
  type: SubmissionType;
  url: string; // URL for github or base64/url for image
  status: SubmissionStatus;
  feedback?: Feedback;
  submittedAt: number;
  reviewedAt?: number;
  revisionCount?: number;
}

export interface MasteryScores {
  math: number;
  science: number;
  creativity: number;
  leadership: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  action: 'task_started' | 'task_completed' | 'submission_made' | 'phase_unlocked';
  taskId?: string;
  phaseId?: string;
  details?: string;
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  scores: MasteryScores;
  averageScore: number;
  personalXP: number;
  personalBadges: Badge[];
  activityLog: ActivityLog[];
  joinedAt: number;
}

export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
}

export interface Rubric {
  id: string;
  criteria: RubricCriteria[];
  maxScore: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  submission?: Submission;
  deadline?: number;
  isOverdue?: boolean;
  rubric?: Rubric;
}

export interface ProjectPhase {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  status: 'locked' | 'active' | 'completed';
  deadline?: number;
}

export interface Resource {
  title: string;
  uri: string;
}

export interface Project {
  topic: string;
  drivingQuestion: string;
  description: string;
  phases: ProjectPhase[];
  resources?: Resource[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  members: Student[];
  project?: Project;
  projectStatus: 'pending_topic' | 'active';
  progress: number; // 0-100
  xp: number;
  badges: Badge[];
}

export interface StudentAnalytics {
  studentId: string;
  groupId: string;
  tasksCompleted: number;
  timeSpent: number; // minutes
  submissionQuality: number; // 0-100 average based on rubric scores
  contributionScore: number; // 0-100 relative to group
  lastActive: number; // timestamp
  pendingTasks: number;
  overdueTasksCount: number;
}

export enum AppView {
  LOGIN = 'LOGIN',
  SETUP = 'SETUP',
  TEACHER_DASHBOARD = 'TEACHER_DASHBOARD',
  STUDENT_DASHBOARD = 'STUDENT_DASHBOARD',
  ANALYTICS = 'ANALYTICS',
}