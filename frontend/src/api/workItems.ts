import { apiPost } from "./client";

type WorkItemInput = {
  title: string;
  description: string;
  assigned_team: string;
  priority: string;
  acceptance_criteria: string[];
  sort_order: number;
  meta: Record<string, unknown>;
};

export function createWorkItems(
  taskId: string,
  body: {
    plan_version: number;
    created_by_id: string;
    items: WorkItemInput[];
  },
) {
  return apiPost(`/tasks/${taskId}/work-items`, body);
}
