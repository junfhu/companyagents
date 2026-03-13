import type { FormEvent } from "react";

export type DetailAction =
  | "approve"
  | "request-changes"
  | "reject"
  | "pause"
  | "resume"
  | "retry"
  | "rollback"
  | "escalate"
  | "replan";

export type DetailActionRequest = {
  reason?: string;
  actorId?: string;
};

export type TaskRuntimeAction = "run-once" | "sweep";

export type PlanFormState = {
  goal: string;
  acceptance: string;
  teams: string;
  scope: string;
  risks: string;
  notes: string;
  estimatedEffort: string;
};

export type WorkItemFormState = {
  title: string;
  description: string;
  assignedTeam: string;
  priority: string;
  acceptance: string;
};

export type ProgressFormState = {
  workItemId: string;
  status: string;
  summary: string;
  progressPercent: string;
  blockReason: string;
  actorRole: string;
};

export type ArtifactFormState = {
  workItemId: string;
  type: string;
  name: string;
  path: string;
  summary: string;
  createdByRole: string;
};

export type SupervisorFormState = {
  action: Extract<
    DetailAction,
    "pause" | "resume" | "retry" | "rollback" | "escalate" | "replan"
  >;
  reason: string;
  actorId: string;
};

export type SubmitHandler = (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
