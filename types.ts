
export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum Status {
  Reported = 'Reported',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
}

export enum Role {
  Admin = 'Admin',
  User = 'User',
  IssueInspector = 'Issue Inspector',
}

export interface User {
  username: string;
  role: Role;
  phone?: string;
}

export interface Recipient {
  name: string;
  email: string;
  phone: string;
}

export interface Inspector {
    name: string;
    phone: string;
}

export interface AnalysisReport {
  id: string;
  status: Status;
  createdAt: number;
  problem: string;
  report: string;
  priority: Priority;
  recipient: Recipient;
  inspector: Inspector;
  remediationSteps: string;
  problemCategory: string;
  reportedBy: string;
  inspectorReview?: string;
  inspectorPhotoUrl?: string;
  inspectorUpdateAt?: number;
  imageUrl?: string;
  assignedInspectorUsername?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}