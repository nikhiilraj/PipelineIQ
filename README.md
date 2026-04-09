# PipelineIQ

PipelineIQ is an engineering metrics and analytics platform designed to calculate and visualize **DORA (DevOps Research and Assessment)** metrics for engineering teams. By integrating deeply with GitHub through webhooks and background processing, it provides insights into team performance related to CI/CD flows, recovery times, and deployment frequencies.

## Architecture & Tech Stack

PipelineIQ is organized as a monorepo utilizing **Turborepo** with NPM workspaces, ensuring that internal packages and applications can easily share types and logic.

### 1. `apps/api` (Backend Service)
The backend is a robust RESTful API built to handle incoming webhooks, manage workspace configurations, authenticate users, and process background jobs.
- **Framework:** Fastify
- **Database / ORM:** Drizzle ORM connecting to Neon Database (Serverless PostgreSQL)
- **Job Queue:** BullMQ with Redis (`ioredis`) is used to handle asynchronous tasks like parsing GitHub webhooks and calculating metrics across multiple queues.
- **Authentication:** Features JWT-based authentication and secure OAuth integration flows for GitHub Apps.
- **Integrations:** `@octokit/rest` & `@octokit/app` for GitHub interactions, and `stripe` for payment processing.

### 2. `apps/web` (Frontend Interface)
The user-facing web dashboard that will display analytics, workspaces, and system configurations.
- **Framework:** Next.js 15 (React 19)
- **State Management & Data Fetching:** Zustand and TanStack React Query.
- **Styling:** Tailwind CSS.

### 3. `packages/shared` (Core Logic & DORA Engine)
A shared package containing business logic, types, and the core metrics engine, ensuring consistency between the API and the web frontend.
- **DORA Engine:** Houses scripts for classifying events and calculating key metrics (`changeFailureRate`, `changeLeadTime`, `deploymentFrequency`, `mttr`).
- **Database Schemas & Routes Structure:** Holds the structural logic for easy cross-app access.

## Current Development Status

The project is driven by a phased development approach. Current metrics point to active scaling:
- **Phase 1 & Phase 2** focus on API stability, User/Workspace authentication, securing webhook tunnels (HMAC validations), and initializing BullMQ worker infrastructure. These are functioning based on the provided integration tests.
- **Phase 3 (DORA Engine)** focuses on the heavy-lifting logic: actively consuming continuous streams of GitHub data payloads to compute and store DORA metrics natively within the application.

## Local Development
To set up the workspace locally:
```bash
# Install all workspace dependencies
npm install

# Run services concurrently (API, Web hook listeners, etc)
npm run dev
```

Ensure standard environmental dependencies (Redis for Queues, PostgreSQL/Neon for the primary DB, and GitHub App credentials) are established.
