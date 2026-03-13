import { useMemo, useState } from "react";

import type { Artifact, Intervention, Plan, Review, Task, WorkItem, ActivityEvent } from "../../types";
import { formatDate, summarizeText } from "../../utils";
import type { DetailAction, DetailActionRequest, SupervisorFormState, TaskRuntimeAction } from "./types";

const TERMINAL_STATES = new Set(["Cancelled", "Archived"]);

const SUPERVISOR_ACTIONS: Array<{
  value: SupervisorFormState["action"];
  label: string;
  helper: string;
  available: (task: Task) => boolean;
}> = [
  {
    value: "pause",
    label: "Pause",
    helper: "Move an active task into Blocked with a recorded reason.",
    available: (task) => ["Approved", "Dispatched", "InExecution", "InIntegration"].includes(task.state),
  },
  {
    value: "resume",
    label: "Resume",
    helper: "Return a blocked task to execution or planning based on its last pause.",
    available: (task) => task.state === "Blocked",
  },
  {
    value: "retry",
    label: "Retry",
    helper: "Record a retry attempt while the task remains blocked.",
    available: (task) => task.state === "Blocked",
  },
  {
    value: "escalate",
    label: "Escalate",
    helper: "Capture an escalation without changing task state.",
    available: (task) => !TERMINAL_STATES.has(task.state),
  },
  {
    value: "rollback",
    label: "Rollback",
    helper: "Send the task back to planning or qualification, depending on plan history.",
    available: (task) => ["InReview", "InExecution", "Blocked", "Rejected", "Done"].includes(task.state),
  },
  {
    value: "replan",
    label: "Replan",
    helper: "Return the task to Planned for another coordination pass.",
    available: (task) => ["InReview", "InExecution", "Blocked", "Rejected", "Done"].includes(task.state),
  },
];

export function TaskHeroPanel({
  task,
  onAction,
  taskRuntimeBusy,
  onTaskRuntimeAction,
}: {
  task: Task;
  onAction: (action: DetailAction, request?: DetailActionRequest) => void | Promise<void>;
  taskRuntimeBusy: boolean;
  onTaskRuntimeAction: (action: TaskRuntimeAction) => void | Promise<void>;
}) {
  const inReview = task.state === "InReview";

  return (
    <section className="panel hero-panel">
      <div className="task-meta">
        <div>
          <span className="pill">{task.state}</span>
          <h3>{task.id}</h3>
        </div>
        <div className="meta-lines">
          <span>Owner: {task.owner_role}</span>
          <span>Priority: {task.priority}</span>
          <span>Updated: {formatDate(task.updated_at)}</span>
        </div>
      </div>
      <p className="summary-copy">{task.summary || "No summary yet."}</p>
      <div className="action-row">
        <button disabled={!inReview} onClick={() => void onAction("approve")}>
          Approve
        </button>
        <button disabled={!inReview} onClick={() => void onAction("request-changes")}>
          Request Changes
        </button>
        <button disabled={!inReview} onClick={() => void onAction("reject")}>
          Reject
        </button>
        <button className="ghost-button" disabled={taskRuntimeBusy} onClick={() => void onTaskRuntimeAction("run-once")}>
          {taskRuntimeBusy ? "Running..." : "Runtime Run"}
        </button>
        <button className="ghost-button" disabled={taskRuntimeBusy} onClick={() => void onTaskRuntimeAction("sweep")}>
          Supervisor Sweep
        </button>
      </div>
    </section>
  );
}

export function PlanPanel({ task, plan }: { task: Task; plan: Plan | null }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Plan</h3>
        <span className="muted">v{(plan?.version ?? task.current_plan_version) || 0}</span>
      </div>
      {plan ? (
        <div className="stack">
          <p>{plan.goal}</p>
          {plan.scope.length > 0 ? (
            <div>
              <h4>Scope</h4>
              <div className="chip-row">
                {plan.scope.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <h4>Acceptance</h4>
            <ul>
              {plan.acceptance_criteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Teams</h4>
            <div className="chip-row">
              {plan.required_teams.map((team) => (
                <span key={team} className="chip">
                  {team}
                </span>
              ))}
            </div>
          </div>
          {plan.risks.length > 0 ? (
            <div>
              <h4>Risks</h4>
              <ul>
                {plan.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="muted">No plan yet.</p>
      )}
    </section>
  );
}

export function WorkItemsPanel({ workItems }: { workItems: WorkItem[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Work Items</h3>
        <span className="muted">{workItems.length}</span>
      </div>
      <div className="stack">
        {workItems.length === 0 ? <p className="muted">No work items yet.</p> : null}
        {workItems.map((item) => (
          <article key={item.id} className={`list-card work-item-card status-${item.status.toLowerCase()}`}>
            <div className="list-card-top">
              <strong>{item.title}</strong>
              <div className="chip-row">
                {isRuntimeGenerated(item) ? <span className="pill runtime-pill">Runtime</span> : null}
                <span className="pill subtle">{item.status}</span>
              </div>
            </div>
            <p>{summarizeText(item.description || "No description.", 180)}</p>
            <div className="team-metrics">
              <span>Team: {item.assigned_team || "-"}</span>
              <span>Priority: {item.priority}</span>
              <span>Updated: {formatDate(item.updated_at)}</span>
            </div>
            {item.acceptance_criteria.length > 0 ? (
              <div className="chip-row">
                {item.acceptance_criteria.slice(0, 3).map((criteria) => (
                  <span key={criteria} className="chip">
                    {criteria}
                  </span>
                ))}
              </div>
            ) : null}
            {item.block_reason ? <small>Blocker: {item.block_reason}</small> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ReviewsPanel({ reviews }: { reviews: Review[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Reviews</h3>
        <span className="muted">{reviews.length}</span>
      </div>
      <div className="stack">
        {reviews.length === 0 ? <p className="muted">No reviews yet.</p> : null}
        {reviews.map((review) => (
          <article key={review.id} className={`list-card review-card review-${review.result.toLowerCase()}`}>
            <div className="list-card-top">
              <strong>{review.result}</strong>
              <div className="chip-row">
                <span className="pill subtle">Round {review.review_round}</span>
                <span className="pill subtle">{review.reviewer_role}</span>
              </div>
            </div>
            <p>{review.summary || "No summary."}</p>
            <ul>
              {review.comments.map((comment) => (
                <li key={comment}>{comment}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TimelinePanel({
  activity,
  detailLoading,
}: {
  activity: ActivityEvent[];
  detailLoading: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Timeline</h3>
        <span className="muted">{detailLoading ? "Refreshing..." : activity.length}</span>
      </div>
      <div className="stack timeline">
        {activity.length === 0 ? <p className="muted">No events yet.</p> : null}
        {activity.map((event) => (
          <article key={event.id} className={`timeline-row ${isRuntimeEvent(event) ? "runtime-event-row" : ""}`}>
            <div className="timeline-bullet" />
            <div>
              <div className="list-card-top">
                <strong>{event.topic}</strong>
                {isRuntimeEvent(event) ? <span className="pill runtime-pill">Runtime</span> : null}
              </div>
              <p>
                {event.actor_role}
                {event.entity_type ? ` · ${event.entity_type}` : ""}
              </p>
              {renderEventPayload(event)}
              <small>{formatDate(event.created_at)}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ArtifactsPanel({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Artifacts</h3>
        <span className="muted">{artifacts.length}</span>
      </div>
      <div className="stack">
        {artifacts.length === 0 ? <p className="muted">No artifacts yet.</p> : null}
        {artifacts.map((artifact) => (
          <article key={artifact.id} className="list-card">
            <div className="list-card-top">
              <strong>{artifact.name}</strong>
              <div className="chip-row">
                {isRuntimeArtifact(artifact) ? <span className="pill runtime-pill">Runtime</span> : null}
                <span className="pill subtle">{artifact.type}</span>
              </div>
            </div>
            <p>{artifact.summary || artifact.path_or_url}</p>
            <small className="mono-line">{artifact.path_or_url}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RuntimeTaskAuditPanel({
  activity,
  workItems,
  artifacts,
  interventions,
}: {
  activity: ActivityEvent[];
  workItems: WorkItem[];
  artifacts: Artifact[];
  interventions: Intervention[];
}) {
  const runtimeEvents = activity.filter(isRuntimeEvent).slice(-6).reverse();
  const runtimeWorkItems = workItems.filter(isRuntimeGenerated);
  const runtimeArtifacts = artifacts.filter(isRuntimeArtifact);
  const runtimeInterventions = interventions.filter(isRuntimeIntervention);

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Runtime Audit</h3>
        <span className="muted">{runtimeEvents.length}</span>
      </div>
      <div className="stack">
        <div className="stats-grid">
          <article className="stat-card">
            <span>Runtime Events</span>
            <strong>{runtimeEvents.length}</strong>
          </article>
          <article className="stat-card">
            <span>Generated Items</span>
            <strong>{runtimeWorkItems.length}</strong>
          </article>
          <article className="stat-card">
            <span>Runtime Artifacts</span>
            <strong>{runtimeArtifacts.length}</strong>
          </article>
          <article className="stat-card">
            <span>Escalations</span>
            <strong>{runtimeInterventions.length}</strong>
          </article>
        </div>
        {runtimeEvents.length === 0 ? <p className="muted">No runtime actions recorded for this task yet.</p> : null}
        {runtimeEvents.map((event) => (
          <article key={event.id} className="list-card runtime-audit-card">
            <div className="list-card-top">
              <strong>{event.topic}</strong>
              <span className="pill runtime-pill">Runtime</span>
            </div>
            <p>{summarizeRuntimeEvent(event)}</p>
            <div className="team-metrics">
              <span>{event.actor_id}</span>
              <span>{event.entity_type}</span>
              <span>{formatDate(event.created_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SupervisorPanel({
  task,
  interventions,
  value,
  runningAction,
  onChange,
  onAction,
}: {
  task: Task;
  interventions: Intervention[];
  value: SupervisorFormState;
  runningAction: DetailAction | "";
  onChange: (updater: (current: SupervisorFormState) => SupervisorFormState) => void;
  onAction: (action: DetailAction, request?: DetailActionRequest) => void | Promise<void>;
}) {
  const [filter, setFilter] = useState("all");
  const recentInterventions = useMemo(
    () => [...interventions].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [interventions],
  );
  const availableActions = SUPERVISOR_ACTIONS.filter((action) => action.available(task));
  const filteredInterventions = useMemo(() => {
    if (filter === "all") return recentInterventions;
    return recentInterventions.filter((item) => item.action === filter);
  }, [filter, recentInterventions]);
  const lastIntervention = recentInterventions[0] ?? null;
  const actionCounts = recentInterventions.reduce<Record<string, number>>((counts, item) => {
    counts[item.action] = (counts[item.action] ?? 0) + 1;
    return counts;
  }, {});
  const selectedAction = SUPERVISOR_ACTIONS.find((action) => action.value === value.action) ?? SUPERVISOR_ACTIONS[0];
  const canSubmit = selectedAction.available(task) && value.reason.trim().length > 0 && runningAction === "";

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Supervisor</h3>
        <span className="muted">{filteredInterventions.length}</span>
      </div>
      <div className="stack">
        <article className={`list-card supervisor-summary ${task.state === "Blocked" ? "is-blocked" : ""}`}>
          <div className="list-card-top">
            <strong>{task.state === "Blocked" ? "Task blocked" : "Task active"}</strong>
            <span className="pill subtle">{task.state}</span>
          </div>
          <p>{task.blocked_reason || "No active blocker recorded."}</p>
          <div className="team-metrics">
            <span>Owner: {task.owner_role}</span>
            <span>Review round: {task.review_round}</span>
            <span>Plan v{task.current_plan_version}</span>
          </div>
          {Object.keys(actionCounts).length > 0 ? (
            <div className="chip-row">
              {Object.entries(actionCounts).map(([action, count]) => (
                <span key={action} className="chip">
                  {action}: {count}
                </span>
              ))}
            </div>
          ) : null}
          {lastIntervention ? (
            <small>
              Last intervention: {lastIntervention.action} by {lastIntervention.triggered_by_role} at{" "}
              {formatDate(lastIntervention.created_at)}
            </small>
          ) : null}
        </article>
        <form
          className="stack supervisor-control-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selectedAction.available(task) || !value.reason.trim()) return;
            void onAction(value.action, {
              reason: value.reason.trim(),
              actorId: value.actorId.trim(),
            });
          }}
        >
          <div className="panel-header">
            <h4>Intervene</h4>
            <span className="muted">Policy-aware controls</span>
          </div>
          <div className="chip-row">
            {SUPERVISOR_ACTIONS.map((action) => (
              <span
                key={action.value}
                className={`chip action-chip ${action.available(task) ? "" : "is-disabled"}`}
              >
                {action.label}
              </span>
            ))}
          </div>
          <div className="form-grid">
            <select
              className="text-input"
              value={value.action}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  action: event.target.value as SupervisorFormState["action"],
                }))
              }
            >
              {SUPERVISOR_ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
            <input
              className="text-input"
              placeholder="Actor ID"
              value={value.actorId}
              onChange={(event) => onChange((current) => ({ ...current, actorId: event.target.value }))}
            />
          </div>
          <p className="muted inline-banner">{selectedAction.helper}</p>
          <textarea
            className="text-input textarea-input"
            placeholder="Reason for intervention"
            value={value.reason}
            onChange={(event) => onChange((current) => ({ ...current, reason: event.target.value }))}
          />
          <button type="submit" disabled={!canSubmit}>
            {runningAction === value.action ? "Running..." : `Run ${selectedAction.label}`}
          </button>
          {availableActions.length === 0 ? (
            <small>No supervisor actions are currently available for this task state.</small>
          ) : null}
        </form>
        {Object.keys(actionCounts).length > 0 ? (
          <div className="form-grid">
            <select
              className="text-input"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All interventions</option>
              {Object.keys(actionCounts).map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {interventions.length === 0 ? <p className="muted">No interventions yet.</p> : null}
        {filteredInterventions.map((item) => (
          <article key={item.id} className={`list-card intervention-card action-${item.action}`}>
            <div className="list-card-top">
              <div className="chip-row">
                <strong>{item.action}</strong>
                {isRuntimeIntervention(item) ? <span className="pill runtime-pill">Runtime</span> : null}
              </div>
              <span className="muted">
                {item.from_state} {" -> "} {item.to_state}
              </span>
            </div>
            <p>{item.reason || "No reason provided."}</p>
            <div className="team-metrics">
              <span>{item.triggered_by_role}</span>
              <span>{item.triggered_by_id}</span>
            </div>
            <small>{formatDate(item.created_at)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderEventPayload(event: ActivityEvent) {
  const entries = Object.entries(event.payload ?? {}).filter(([, value]) => {
    if (value === null || value === undefined || value === "") return false;
    return true;
  });
  if (entries.length === 0) return null;

  return (
    <div className="timeline-payload">
      {entries.slice(0, 3).map(([key, value]) => (
        <span key={key} className="chip">
          {key}: {summarizeText(String(value), 48)}
        </span>
      ))}
    </div>
  );
}

function isRuntimeGenerated(item: WorkItem) {
  return item.meta?.auto_generated === true || item.meta?.generated_by === "runtime_orchestrator";
}

function isRuntimeArtifact(artifact: Artifact) {
  return artifact.meta?.runtime_auto === true || String(artifact.created_by_id ?? "").startsWith("runtime-");
}

function isRuntimeIntervention(item: Intervention) {
  return item.meta?.runtime_auto === true || String(item.triggered_by_id ?? "").startsWith("runtime-");
}

function isRuntimeEvent(event: ActivityEvent) {
  if (String(event.actor_id ?? "").startsWith("runtime-")) return true;
  const payloadMeta = asRecord(event.payload?.meta);
  return (
    event.meta?.runtime_auto === true ||
    event.payload?.runtime_auto === true ||
    event.payload?.generated_by === "runtime_orchestrator" ||
    payloadMeta?.runtime_auto === true
  );
}

function summarizeRuntimeEvent(event: ActivityEvent) {
  if (event.payload?.work_item_count) {
    return `Affected work items: ${String(event.payload.work_item_count)}`;
  }
  if (event.payload?.artifact_id) {
    return `Completed with artifact ${String(event.payload.artifact_id)}`;
  }
  if (event.payload?.work_item_id) {
    return `Affected work item ${String(event.payload.work_item_id)}`;
  }
  return summarizeText(event.topic, 100);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}
