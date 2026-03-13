import { apiPost } from "./client";

export function updateWorkItemProgress(
  workItemId: string,
  body: {
    status: string;
    summary: string;
    progress_percent: number | null;
    block_reason: string;
    actor_id: string;
    actor_role: string;
    meta: Record<string, unknown>;
  },
) {
  return apiPost(`/work-items/${workItemId}/progress`, body);
}
