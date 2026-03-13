import { apiGet, apiPost } from "./client";
import type { Task, TaskBundle } from "../types";

type ReviewRequestOverrides = {
  reviewer_id?: string;
  comments?: string[];
  summary?: string;
};

type SupervisorRequestOverrides = {
  reason?: string;
  actor_id?: string;
  actor_role?: string;
  meta?: Record<string, unknown>;
};

export function fetchTasks() {
  return apiGet<{ items: Task[] }>("/tasks");
}

export function createTask(body: {
  title: string;
  summary: string;
  priority: string;
  request_type: string;
  source: string;
  requester: string;
  tags: string[];
  meta: Record<string, unknown>;
}) {
  return apiPost<{ task_id: string; state: string }>("/tasks", body);
}

export function fetchTaskBundle(taskId: string) {
  return apiGet<TaskBundle>(`/tasks/${taskId}/bundle`);
}

export function qualifyTask(taskId: string, summary?: string) {
  return apiPost<{ task_id: string; state: string }>(`/tasks/${taskId}/qualify`, {
    owner_id: "intake-ui",
    summary,
  });
}

export function approveTask(taskId: string, planVersion: number, overrides?: ReviewRequestOverrides) {
  return apiPost(`/tasks/${taskId}/approve`, {
    plan_version: planVersion,
    reviewer_id: overrides?.reviewer_id ?? "reviewer-ui",
    comments: overrides?.comments ?? ["Approved from dashboard"],
    summary: overrides?.summary ?? "Approved in Task Detail",
  });
}

export function requestChanges(taskId: string, planVersion: number, overrides?: ReviewRequestOverrides) {
  return apiPost(`/tasks/${taskId}/request-changes`, {
    plan_version: planVersion,
    reviewer_id: overrides?.reviewer_id ?? "reviewer-ui",
    comments: overrides?.comments ?? ["Needs another planning pass"],
    summary: overrides?.summary ?? "Returned for revision in Task Detail",
  });
}

export function rejectTask(taskId: string, planVersion: number, overrides?: ReviewRequestOverrides) {
  return apiPost(`/tasks/${taskId}/reject`, {
    plan_version: planVersion,
    reviewer_id: overrides?.reviewer_id ?? "reviewer-ui",
    comments: overrides?.comments ?? ["Rejected from dashboard"],
    summary: overrides?.summary ?? "Rejected in Task Detail",
  });
}

function supervisorPayload(overrides?: SupervisorRequestOverrides, fallbackReason?: string) {
  return {
    reason: overrides?.reason ?? fallbackReason ?? "",
    actor_id: overrides?.actor_id ?? "supervisor-ui",
    actor_role: overrides?.actor_role ?? "WorkflowSupervisor",
    meta: overrides?.meta ?? {},
  };
}

export function pauseTask(taskId: string, overrides?: SupervisorRequestOverrides) {
  return apiPost(`/tasks/${taskId}/pause`, {
    ...supervisorPayload(overrides, "Paused from dashboard"),
  });
}

export function resumeTask(taskId: string, overrides?: SupervisorRequestOverrides) {
  return apiPost(`/tasks/${taskId}/resume`, {
    ...supervisorPayload(overrides, "Resumed from dashboard"),
  });
}

export function retryTask(taskId: string, overrides?: SupervisorRequestOverrides) {
  return apiPost(`/tasks/${taskId}/retry`, {
    ...supervisorPayload(overrides, "Retry requested from dashboard"),
  });
}

export function rollbackTask(taskId: string, overrides?: SupervisorRequestOverrides) {
  return apiPost(`/tasks/${taskId}/rollback`, {
    ...supervisorPayload(overrides, "Rollback requested from dashboard"),
  });
}

export function escalateTask(taskId: string, overrides?: SupervisorRequestOverrides) {
  return apiPost(`/tasks/${taskId}/escalate`, {
    ...supervisorPayload(overrides, "Escalated from dashboard"),
  });
}

export function replanTask(taskId: string, overrides?: SupervisorRequestOverrides) {
  return apiPost(`/tasks/${taskId}/replan`, {
    ...supervisorPayload(overrides, "Replan requested from dashboard"),
  });
}
