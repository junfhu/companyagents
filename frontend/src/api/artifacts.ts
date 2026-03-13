import { apiPost } from "./client";

export function createArtifact(
  taskId: string,
  body: {
    work_item_id: string | null;
    type: string;
    name: string;
    path_or_url: string;
    summary: string;
    version: number;
    created_by_role: string;
    created_by_id: string;
    meta: Record<string, unknown>;
  },
) {
  return apiPost(`/tasks/${taskId}/artifacts`, body);
}
