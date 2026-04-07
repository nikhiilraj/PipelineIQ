CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"avatar_url" text,
	"google_id" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verify_token" text,
	"email_verify_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" uuid,
	"metadata" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"invited_by" uuid,
	"invite_token" text,
	"invite_expires_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_workspace_members" UNIQUE("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" text DEFAULT 'active',
	"current_period_end" timestamp with time zone,
	"repo_limit" integer DEFAULT 3 NOT NULL,
	"history_retention_days" integer DEFAULT 30 NOT NULL,
	"ml_predictions_enabled" boolean DEFAULT false NOT NULL,
	"postmortems_enabled" boolean DEFAULT false NOT NULL,
	"dora_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "github_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"installation_id" bigint NOT NULL,
	"account_login" text NOT NULL,
	"account_type" text NOT NULL,
	"account_avatar_url" text,
	"permissions" text DEFAULT '{}' NOT NULL,
	"events" text DEFAULT '[]' NOT NULL,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_installations_installation_id_unique" UNIQUE("installation_id")
);
--> statement-breakpoint
CREATE TABLE "author_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"repo_id" uuid NOT NULL,
	"author_login" text NOT NULL,
	"total_prs_90d" integer DEFAULT 0 NOT NULL,
	"failed_prs_90d" integer DEFAULT 0 NOT NULL,
	"failure_rate_90d" real,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_author_stats_repo_author" UNIQUE("repo_id","author_login")
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"installation_id" uuid NOT NULL,
	"github_repo_id" bigint NOT NULL,
	"full_name" text NOT NULL,
	"name" text NOT NULL,
	"owner" text NOT NULL,
	"default_branch" text DEFAULT 'main' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"language" text,
	"deploy_branch_pattern" text DEFAULT 'main|master|production',
	"deploy_workflow_pattern" text DEFAULT '.*deploy.*|.*release.*|.*prod.*',
	"dora_deployment_frequency_30d" real,
	"dora_lead_time_p50_seconds" integer,
	"dora_mttr_p50_seconds" integer,
	"dora_change_failure_rate_30d" real,
	"dora_classification" text,
	"dora_last_computed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "repositories_github_repo_id_unique" UNIQUE("github_repo_id"),
	CONSTRAINT "uq_workspace_github_repo" UNIQUE("workspace_id","github_repo_id")
);
--> statement-breakpoint
CREATE TABLE "pipeline_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"github_job_id" bigint NOT NULL,
	"name" text NOT NULL,
	"status" text,
	"conclusion" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_seconds" integer,
	"runner_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pipeline_jobs_github_job_id_unique" UNIQUE("github_job_id")
);
--> statement-breakpoint
CREATE TABLE "pipeline_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"repo_id" uuid NOT NULL,
	"github_run_id" bigint NOT NULL,
	"workflow_id" bigint,
	"workflow_name" text NOT NULL,
	"head_sha" text NOT NULL,
	"head_branch" text,
	"event" text,
	"status" text,
	"conclusion" text,
	"github_created_at" timestamp with time zone NOT NULL,
	"github_updated_at" timestamp with time zone,
	"run_started_at" timestamp with time zone,
	"run_duration_seconds" integer,
	"is_deployment" boolean DEFAULT false NOT NULL,
	"lead_time_seconds" integer,
	"recovery_time_seconds" integer,
	"fail_probability" real,
	"prediction_features" text,
	"postmortem" text,
	"postmortem_generated_at" timestamp with time zone,
	"pull_request_number" integer,
	"pull_request_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"github_pr_id" bigint NOT NULL,
	"pr_number" integer NOT NULL,
	"title" text,
	"author_login" text NOT NULL,
	"base_branch" text NOT NULL,
	"head_branch" text NOT NULL,
	"head_sha" text,
	"state" text,
	"merged_at" timestamp with time zone,
	"additions" integer,
	"deletions" integer,
	"changed_files" integer,
	"file_paths" text,
	"has_test_files" boolean,
	"has_config_files" boolean,
	"has_migration_files" boolean,
	"pr_opened_at" timestamp with time zone NOT NULL,
	"pr_closed_at" timestamp with time zone,
	"first_commit_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dora_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"repo_id" uuid,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"period_type" text NOT NULL,
	"deployment_frequency" real,
	"lead_time_p50_seconds" integer,
	"lead_time_p75_seconds" integer,
	"lead_time_p95_seconds" integer,
	"mttr_p50_seconds" integer,
	"change_failure_rate" real,
	"total_deployments" integer,
	"failed_deployments" integer,
	"total_prs" integer,
	"df_class" text,
	"lt_class" text,
	"mttr_class" text,
	"cfr_class" text,
	"overall_class" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_dora_snapshots_repo_period" UNIQUE("repo_id","period_start","period_type")
);
--> statement-breakpoint
CREATE TABLE "alert_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_test_status" text DEFAULT 'never',
	"last_tested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"repo_id" uuid,
	"name" text NOT NULL,
	"metric" text NOT NULL,
	"condition" text NOT NULL,
	"threshold_value" real,
	"threshold_class" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_hash" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_google_id" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_workspace" ON "audit_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_repos_workspace" ON "repositories" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_repos_full_name" ON "repositories" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "idx_pipeline_jobs_run_id" ON "pipeline_jobs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_runs_repo_created" ON "pipeline_runs" USING btree ("repo_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pipeline_runs_github_run_id" ON "pipeline_runs" USING btree ("github_run_id");--> statement-breakpoint
CREATE INDEX "idx_pipeline_runs_workspace_created" ON "pipeline_runs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pipeline_runs_is_deployment" ON "pipeline_runs" USING btree ("repo_id","is_deployment","created_at");--> statement-breakpoint
CREATE INDEX "idx_pull_requests_repo" ON "pull_requests" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "idx_dora_snapshots_repo_period" ON "dora_snapshots" USING btree ("repo_id","period_start");