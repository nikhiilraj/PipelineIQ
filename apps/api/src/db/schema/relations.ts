import { relations } from 'drizzle-orm';
import { users, refreshTokens } from './users.js';
import { workspaces, workspaceMembers } from './workspaces.js';
import { githubInstallations } from './github.js';
import { repositories } from './repositories.js';
import { pipelineRuns, pipelineJobs, pullRequests } from './pipeline.js';

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  workspaceMembers: many(workspaceMembers),
  ownedWorkspaces: many(workspaces, { relationName: 'owner' }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id], relationName: 'owner' }),
  members: many(workspaceMembers),
  installations: many(githubInstallations),
  repositories: many(repositories),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const githubInstallationsRelations = relations(githubInstallations, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [githubInstallations.workspaceId], references: [workspaces.id] }),
  repositories: many(repositories),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [repositories.workspaceId], references: [workspaces.id] }),
  installation: one(githubInstallations, { fields: [repositories.installationId], references: [githubInstallations.id] }),
  pipelineRuns: many(pipelineRuns),
  pullRequests: many(pullRequests),
}));

export const pipelineRunsRelations = relations(pipelineRuns, ({ one, many }) => ({
  repository: one(repositories, { fields: [pipelineRuns.repoId], references: [repositories.id] }),
  jobs: many(pipelineJobs),
}));

export const pipelineJobsRelations = relations(pipelineJobs, ({ one }) => ({
  run: one(pipelineRuns, { fields: [pipelineJobs.runId], references: [pipelineRuns.id] }),
}));

export const pullRequestsRelations = relations(pullRequests, ({ one }) => ({
  repository: one(repositories, { fields: [pullRequests.repoId], references: [repositories.id] }),
}));
