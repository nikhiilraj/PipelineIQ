import type { WorkspacePlan } from './user.js';

export interface WorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  repoLimit: number;
  mlPredictionsEnabled: boolean;
  postmortemsEnabled: boolean;
  createdAt: string;
}

export interface WorkspaceMemberDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'viewer';
  acceptedAt: string | null;
  createdAt: string;
}
