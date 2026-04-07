export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface WorkspaceSummaryDTO {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceMemberRole;
  plan: WorkspacePlan;
}

export type WorkspaceMemberRole = 'owner' | 'admin' | 'viewer';
export type WorkspacePlan = 'free' | 'pro' | 'team';
