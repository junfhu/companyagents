import type { Artifact, Intervention, Plan, Review, Task, WorkItem, ActivityEvent } from "../../types";
import { formatDate, summarizeText } from "../../utils";
import type { DetailAction } from "./types";

export function TaskHeroPanel({
  task,
  onAction,
}: {
  task: Task;
  onAction: (action: DetailAction) => void | Promise<void>;
}) {
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
        <button onClick={() => void onAction("approve")}>Approve</button>
        <button onClick={() => void onAction("request-changes")}>Request Changes</button>
        <button onClick={() => void onAction("reject")}>Reject</button>
        <button onClick={() => void onAction("pause")}>Pause</button>
        <button onClick={() => void onAction("resume")}>Resume</button>
        <button onClick={() => void onAction("retry")}>Retry</button>
        <button onClick={() => void onAction("escalate")}>Escalate</button>
        <button onClick={() => void onAction("rollback")}>Rollback</button>
        <button onClick={() => void onAction("replan")}>Replan</button>
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
              <span className="pill subtle">{item.status}</span>
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
          <article key={event.id} className="timeline-row">
            <div className="timeline-bullet" />
            <div>
              <strong>{event.topic}</strong>
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
              <span className="pill subtle">{artifact.type}</span>
            </div>
            <p>{artifact.summary || artifact.path_or_url}</p>
            <small className="mono-line">{artifact.path_or_url}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SupervisorPanel({
  task,
  interventions,
}: {
  task: Task;
  interventions: Intervention[];
}) {
  const recentInterventions = [...interventions].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const lastIntervention = recentInterventions[0] ?? null;
  const actionCounts = recentInterventions.reduce<Record<string, number>>((counts, item) => {
    counts[item.action] = (counts[item.action] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Supervisor</h3>
        <span className="muted">{interventions.length}</span>
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
        {interventions.length === 0 ? <p className="muted">No interventions yet.</p> : null}
        {recentInterventions.map((item) => (
          <article key={item.id} className={`list-card intervention-card action-${item.action}`}>
            <div className="list-card-top">
              <strong>{item.action}</strong>
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
