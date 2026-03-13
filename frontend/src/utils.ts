import type { DashboardSummary } from "./types";
import type { Language } from "./i18n";
import { translatePriority } from "./i18n";

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function summarizeText(value: string, limit = 140) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}...`;
}

export function statRows(summary: DashboardSummary | null, language: Language) {
  if (!summary) return [];
  return [
    { label: language === "zh-CN" ? "任务" : "Tasks", value: summary.tasks_total },
    { label: language === "zh-CN" ? "活跃" : "Active", value: summary.tasks_active },
    { label: language === "zh-CN" ? "阻塞" : "Blocked", value: summary.tasks_blocked },
    { label: language === "zh-CN" ? "工作项" : "Work Items", value: summary.work_items_total },
    { label: language === "zh-CN" ? "进行中" : "In Progress", value: summary.work_items_in_progress },
  ];
}

export function formatPriority(language: Language, value: string) {
  return translatePriority(language, value);
}
