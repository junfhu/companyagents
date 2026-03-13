import { apiPost } from "./client";
import type { RuntimeStatus } from "../types";

export function runRuntimeOnce() {
  return apiPost<RuntimeStatus & { triggered_by: string }>("/runtime/run-once", {});
}

export function pauseRuntime() {
  return apiPost<RuntimeStatus & { triggered_by: string }>("/runtime/pause", {});
}

export function resumeRuntime() {
  return apiPost<RuntimeStatus & { triggered_by: string }>("/runtime/resume", {});
}

export function runTaskRuntimeOnce(taskId: string) {
  return apiPost<{ task_id: string; mode: string; triggered_by: string; last_result: RuntimeStatus["last_result"] }>(
    `/runtime/tasks/${taskId}/run-once`,
    {},
  );
}

export function sweepTaskRuntime(taskId: string) {
  return apiPost<{ task_id: string; mode: string; triggered_by: string; last_result: RuntimeStatus["last_result"] }>(
    `/runtime/tasks/${taskId}/sweep`,
    {},
  );
}
