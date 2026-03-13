export type AttentionQueues = {
  recent: Task[];
  blocked: Task[];
  stalled: Task[];
  review: Task[];
  priority: Task[];
};

export type RuntimeStatus = {
  enabled: boolean;
  configured_enabled: boolean;
  running: boolean;
  poll_interval_seconds: number;
  blocked_escalation_seconds: number;
  actor_id: string;
  last_run_at: string | null;
  last_result: {
    generated_work_items: number;
    dispatched_tasks: number;
    ready_to_report_tasks: number;
    completed_tasks: number;
    escalated_tasks: number;
  };
};

export type DashboardSummary = {
  tasks_total: number;
  tasks_active: number;
  tasks_blocked: number;
  work_items_total: number;
  work_items_in_progress: number;
  by_state: Record<string, number>;
  by_team: Record<string, number>;
  attention: AttentionQueues;
};

export type DashboardBundle = {
  summary: DashboardSummary;
  attention: AttentionQueues;
  teams: TeamOverview[];
  recent_activity: ActivityEvent[];
};

export type TeamOverview = {
  name: string;
  work_items_total: number;
  work_items_in_progress: number;
  work_items_blocked: number;
  work_items_completed: number;
  tasks_owned: number;
};

export type TeamWorkItems = {
  team_name: string;
  items: WorkItem[];
};

export type Task = {
  id: string;
  title: string;
  summary: string;
  state: string;
  priority: string;
  request_type: string;
  source: string;
  requester: string;
  owner_role: string;
  owner_team: string;
  current_plan_version: number;
  review_round: number;
  blocked_reason: string;
  acceptance_summary: string;
  tags: string[];
  meta: Record<string, unknown>;
  archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Plan = {
  id: string;
  task_id: string;
  version: number;
  goal: string;
  scope: string[];
  out_of_scope: string[];
  acceptance_criteria: string[];
  required_teams: string[];
  estimated_effort: string;
  risks: string[];
  assumptions: string[];
  notes: string;
  created_by_role: string;
  created_by_id: string;
  created_at: string;
};

export type Review = {
  id: string;
  task_id: string;
  plan_version: number;
  review_round: number;
  reviewer_role: string;
  reviewer_id: string;
  result: string;
  comments: string[];
  summary: string;
  created_at: string;
};

export type WorkItem = {
  id: string;
  task_id: string;
  plan_version: number;
  title: string;
  description: string;
  assigned_team: string;
  owner_role: string;
  status: string;
  priority: string;
  acceptance_criteria: string[];
  block_reason: string;
  sort_order: number;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type Artifact = {
  id: string;
  task_id: string;
  work_item_id: string | null;
  type: string;
  name: string;
  path_or_url: string;
  summary: string;
  version?: number;
  created_by_role?: string;
  created_by_id?: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export type ActivityEvent = {
  id: string;
  task_id?: string;
  topic: string;
  entity_type: string;
  entity_id: string;
  actor_role: string;
  actor_id: string;
  payload: Record<string, unknown>;
  meta: Record<string, unknown>;
  created_at: string;
};

export type Intervention = {
  id: string;
  action: string;
  reason: string;
  from_state: string;
  to_state: string;
  triggered_by_role: string;
  triggered_by_id: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export type TaskBundle = {
  task: Task;
  plan: Plan | null;
  reviews: Review[];
  work_items: WorkItem[];
  artifacts: Artifact[];
  interventions: Intervention[];
  activity: ActivityEvent[];
};
