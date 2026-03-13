import type { ActivityEvent, Task } from "../types";
import { formatDate, summarizeText } from "../utils";

export function TaskQueuePanel({
  title,
  tasks,
  variant,
  empty,
  onSelectTask,
}: {
  title: string;
  tasks: Task[];
  variant?: string;
  empty: string;
  onSelectTask: (taskId: string) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
        <span className="muted">{tasks.length}</span>
      </div>
      <div className="stack">
        {tasks.length === 0 ? <p className="muted">{empty}</p> : null}
        {tasks.map((task) => (
          <article
            key={task.id}
            className={`list-card board-task-card ${variant ?? ""}`.trim()}
            role="button"
            tabIndex={0}
            onClick={() => onSelectTask(task.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectTask(task.id);
              }
            }}
          >
            <div className="list-card-top">
              <strong>{task.title}</strong>
              <span className="pill subtle">{variant?.startsWith("priority-") ? task.priority : task.state}</span>
            </div>
            <p>{summarizeText(task.blocked_reason || task.acceptance_summary || task.summary || "No summary.", 150)}</p>
            <div className="team-metrics">
              <span>{task.owner_role}</span>
              {!variant?.startsWith("priority-") ? <span>{task.priority}</span> : <span>{task.state}</span>}
              <span>{formatDate(task.updated_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ActivityPanel({
  title,
  activity,
  empty,
  onSelectTask,
}: {
  title: string;
  activity: ActivityEvent[];
  empty: string;
  onSelectTask: (taskId: string) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
        <span className="muted">{activity.length}</span>
      </div>
      <div className="stack timeline">
        {activity.length === 0 ? <p className="muted">{empty}</p> : null}
        {activity.map((event) => (
          <article
            key={event.id}
            className="timeline-row board-task-card"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (event.task_id) onSelectTask(event.task_id);
            }}
            onKeyDown={(detailEvent) => {
              if ((detailEvent.key === "Enter" || detailEvent.key === " ") && event.task_id) {
                detailEvent.preventDefault();
                onSelectTask(event.task_id);
              }
            }}
          >
            <div className="timeline-bullet" />
            <div>
              <strong>{event.topic}</strong>
              <p>
                {event.actor_role}
                {event.task_id ? ` · ${event.task_id}` : ""}
              </p>
              <small>{formatDate(event.created_at)}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CompactAttentionCard({
  label,
  task,
  variant,
  badge,
  fallback,
  onSelectTask,
}: {
  label: string;
  task: Task | null | undefined;
  variant?: string;
  badge?: string;
  fallback: string;
  onSelectTask: (taskId: string) => void;
}) {
  if (!task) return null;

  return (
    <button
      className={`task-row ${variant ?? ""}`.trim()}
      onClick={() => onSelectTask(task.id)}
    >
      <div className="list-card-top">
        <span className="task-row-state">{label}</span>
        <span className="pill subtle">{badge ?? task.priority}</span>
      </div>
      <strong>{task.title}</strong>
      <small>{summarizeText(task.blocked_reason || task.acceptance_summary || task.summary || fallback, 72)}</small>
    </button>
  );
}
