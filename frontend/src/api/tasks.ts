import { apiGet, apiPost } from "./client";
import type { Task, TaskBundle } from "../types";

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

export function approveTask(taskId: string, planVersion: number) {
  return apiPost(`/tasks/${taskId}/approve`, {
    plan_version: planVersion,
    reviewer_id: "reviewer-ui",
    comments: ["Approved from dashboard"],
    summary: "Approved in Task Detail",
  });
}

export function requestChanges(taskId: string, planVersion: number) {
  return apiPost(`/tasks/${taskId}/request-changes`, {
    plan_version: planVersion,
    reviewer_id: "reviewer-ui",
    comments: ["Needs another planning pass"],
    summary: "Returned for revision in Task Detail",
  });
}

export function rejectTask(taskId: string, planVersion: number) {
  return apiPost(`/tasks/${taskId}/reject`, {
    plan_version: planVersion,
    reviewer_id: "reviewer-ui",
    comments: ["Rejected from dashboard"],
    summary: "Rejected in Task Detail",
  });
}

export function pauseTask(taskId: string) {
  return apiPost(`/tasks/${taskId}/pause`, {
    reason: "Paused from dashboard",
    actor_id: "supervisor-ui",
    actor_role: "WorkflowSupervisor",
    meta: {},
  });
}

export function resumeTask(taskId: string) {
  return apiPost(`/tasks/${taskId}/resume`, {
    reason: "Resumed from dashboard",
    actor_id: "supervisor-ui",
    actor_role: "WorkflowSupervisor",
    meta: {},
  });
}

export function retryTask(taskId: string) {
  return apiPost(`/tasks/${taskId}/retry`, {
    reason: "Retry requested from dashboard",
    actor_id: "supervisor-ui",
    actor_role: "WorkflowSupervisor",
    meta: {},
  });
}

export function rollbackTask(taskId: string) {
  return apiPost(`/tasks/${taskId}/rollback`, {
    reason: "Rollback requested from dashboard",
    actor_id: "supervisor-ui",
    actor_role: "WorkflowSupervisor",
    meta: {},
  });
}

export function escalateTask(taskId: string) {
  return apiPost(`/tasks/${taskId}/escalate`, {
    reason: "Escalated from dashboard",
    actor_id: "supervisor-ui",
    actor_role: "WorkflowSupervisor",
    meta: {},
  });
}

export function replanTask(taskId: string) {
  return apiPost(`/tasks/${taskId}/replan`, {
    reason: "Replan requested from dashboard",
    actor_id: "supervisor-ui",
    actor_role: "WorkflowSupervisor",
    meta: {},
  });
}
