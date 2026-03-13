import { apiGet } from "./client";
import type { AttentionQueues, DashboardBundle, DashboardSummary, RuntimeStatus } from "../types";

export function fetchDashboardSummary() {
  return apiGet<DashboardSummary>("/dashboard/summary");
}

export function fetchDashboardAttention() {
  return apiGet<AttentionQueues>("/dashboard/attention");
}

export function fetchDashboardBundle() {
  return apiGet<DashboardBundle>("/dashboard/bundle");
}

export function fetchRuntimeStatus() {
  return apiGet<RuntimeStatus>("/runtime/status");
}
