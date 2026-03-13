import type { DashboardSummary } from "./types";

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function summarizeText(value: string, limit = 140) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}...`;
}

export function statRows(summary: DashboardSummary | null) {
  if (!summary) return [];
  return [
    { label: "Tasks", value: summary.tasks_total },
    { label: "Active", value: summary.tasks_active },
    { label: "Blocked", value: summary.tasks_blocked },
    { label: "Work Items", value: summary.work_items_total },
    { label: "In Progress", value: summary.work_items_in_progress },
  ];
}
