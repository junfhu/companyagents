import { apiPost } from "./client";

type PlanPayload = {
  goal: string;
  scope: string[];
  out_of_scope: string[];
  acceptance_criteria: string[];
  required_teams: string[];
  estimated_effort: string;
  risks: string[];
  assumptions: string[];
  notes: string;
  created_by_id: string;
};

export function createPlan(taskId: string, body: PlanPayload) {
  return apiPost<{ task_id: string; version: number; plan_id: string }>(
    `/tasks/${taskId}/plan`,
    body,
  );
}

export function submitForReview(taskId: string, planVersion: number) {
  return apiPost<{ task_id: string; state: string; plan_version: number }>(
    `/tasks/${taskId}/submit-review`,
    {
      actor_id: "pm-ui",
      plan_version: planVersion,
    },
  );
}
