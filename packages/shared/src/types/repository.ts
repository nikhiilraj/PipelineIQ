import type { DORAMetricsDTO } from './dora.js';

export interface RepositoryDTO {
  id: string;
  workspaceId: string;
  fullName: string;
  name: string;
  owner: string;
  defaultBranch: string;
  isPrivate: boolean;
  language: string | null;
  deployBranchPattern: string;
  deployWorkflowPattern: string;
  dora: DORAMetricsDTO | null;
  createdAt: string;
}
