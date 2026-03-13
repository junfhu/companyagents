import type { FormEvent } from "react";

import type { ActorContext } from "../api/client";
import { ACTOR_ROLE_OPTIONS } from "../api/client";
import { CompactAttentionCard } from "./control-plane-panels";
import type { AttentionQueues, DashboardSummary, Task } from "../types";
import { formatDate, statRows, summarizeText } from "../utils";

type TaskFormState = {
  title: string;
  summary: string;
  priority: string;
  requester: string;
  tags: string;
};

type SidebarProps = {
  summary: DashboardSummary | null;
  attention: AttentionQueues | null;
  tasks: Task[];
  selectedTaskId: string;
  loading: boolean;
  creatingTask: boolean;
  taskForm: TaskFormState;
  actorContext: ActorContext;
  onRefresh: () => void | Promise<void>;
  onSelectTask: (taskId: string) => void;
  onTaskFormChange: (value: TaskFormState | ((current: TaskFormState) => TaskFormState)) => void;
  onActorContextChange: (value: ActorContext | ((current: ActorContext) => ActorContext)) => void;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function Sidebar({
  summary,
  attention,
  tasks,
  selectedTaskId,
  loading,
  creatingTask,
  taskForm,
  actorContext,
  onRefresh,
  onSelectTask,
  onTaskFormChange,
  onActorContextChange,
  onCreateTask,
}: SidebarProps) {
  const attentionSource = attention ?? summary?.attention ?? null;
  const sortedTasks = [...tasks].sort((left, right) => {
    const priorityScore = (value: string) => {
      if (value === "critical") return 4;
      if (value === "high") return 3;
      if (value === "normal") return 2;
      return 1;
    };

    const blockedDelta = Number(right.state === "Blocked") - Number(left.state === "Blocked");
    if (blockedDelta !== 0) return blockedDelta;

    const reviewDelta = Number(right.state === "InReview") - Number(left.state === "InReview");
    if (reviewDelta !== 0) return reviewDelta;

    const priorityDelta = priorityScore(right.priority) - priorityScore(left.priority);
    if (priorityDelta !== 0) return priorityDelta;

    return right.updated_at.localeCompare(left.updated_at);
  });

  return (
    <aside className="sidebar">
      <div className="brand">
        <p className="eyebrow">AI Delivery Operating System</p>
        <h1>Control Plane</h1>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Operator</h2>
          <span className="muted">{actorContext.role}</span>
        </div>
        <div className="stack">
          <select
            className="text-input"
            value={actorContext.role}
            onChange={(event) =>
              onActorContextChange((current) => ({
                ...current,
                role: event.target.value as ActorContext["role"],
              }))
            }
          >
            {ACTOR_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <input
            className="text-input"
            placeholder="Actor ID"
            value={actorContext.actorId}
            onChange={(event) =>
              onActorContextChange((current) => ({
                ...current,
                actorId: event.target.value,
              }))
            }
          />
          <small>Write actions use these headers, and the backend now enforces role-based permissions.</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Summary</h2>
          <button className="ghost-button" onClick={() => void onRefresh()}>
            Refresh
          </button>
        </div>
        <div className="stats-grid">
          {statRows(summary).map((item) => (
            <article key={item.label} className="stat-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>New Task</h2>
          <span className="muted">Intake</span>
        </div>
        <form className="stack" onSubmit={onCreateTask}>
          <input
            className="text-input"
            placeholder="Task title"
            value={taskForm.title}
            onChange={(event) =>
              onTaskFormChange((current) => ({ ...current, title: event.target.value }))
            }
          />
          <textarea
            className="text-input textarea-input"
            placeholder="Task summary"
            value={taskForm.summary}
            onChange={(event) =>
              onTaskFormChange((current) => ({ ...current, summary: event.target.value }))
            }
          />
          <div className="form-grid">
            <input
              className="text-input"
              placeholder="Requester"
              value={taskForm.requester}
              onChange={(event) =>
                onTaskFormChange((current) => ({ ...current, requester: event.target.value }))
              }
            />
            <select
              className="text-input"
              value={taskForm.priority}
              onChange={(event) =>
                onTaskFormChange((current) => ({ ...current, priority: event.target.value }))
              }
            >
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <input
            className="text-input"
            placeholder="Tags, comma separated"
            value={taskForm.tags}
            onChange={(event) =>
              onTaskFormChange((current) => ({ ...current, tags: event.target.value }))
            }
          />
          <button type="submit" disabled={creatingTask}>
            {creatingTask ? "Creating..." : "Create Task"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Attention</h2>
          <span className="muted">
            {(attentionSource?.blocked.length ?? 0) +
              (attentionSource?.review.length ?? 0) +
              (attentionSource?.priority.length ?? 0)}
          </span>
        </div>
        <div className="stack">
          <CompactAttentionCard
            label="Blocked"
            task={attentionSource?.blocked[0]}
            variant="task-row-blocked"
            fallback="Needs unblock action."
            onSelectTask={onSelectTask}
          />
          <CompactAttentionCard
            label="Needs Review"
            task={attentionSource?.review[0]}
            variant="task-row-review"
            badge={attentionSource?.review[0] ? `Round ${attentionSource.review[0].review_round || 0}` : undefined}
            fallback="Review queue item."
            onSelectTask={onSelectTask}
          />
          <CompactAttentionCard
            label="Priority"
            task={attentionSource?.priority[0]}
            variant="task-row-critical"
            fallback="High-priority task."
            onSelectTask={onSelectTask}
          />
          {!attentionSource ? <p className="muted">Loading attention queues...</p> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Tasks</h2>
          <span className="muted">{tasks.length}</span>
        </div>
        <div className="task-list">
          {loading ? <p className="muted">Loading tasks...</p> : null}
          {!loading && tasks.length === 0 ? <p className="muted">No tasks yet.</p> : null}
          {sortedTasks.map((task) => (
            <button
              key={task.id}
              className={`task-row ${
                task.id === selectedTaskId ? "active" : ""
              } ${task.state === "Blocked" ? "task-row-blocked" : ""} ${
                task.state === "InReview" ? "task-row-review" : ""
              } ${task.priority === "critical" ? "task-row-critical" : ""}`}
              onClick={() => onSelectTask(task.id)}
            >
              <div className="list-card-top">
                <span className="task-row-state">{task.state}</span>
                <span className="pill subtle">{task.priority}</span>
              </div>
              <strong>{task.title}</strong>
              <small>{summarizeText(task.summary || "No summary.", 84)}</small>
              <div className="task-row-meta">
                <span>{task.owner_role}</span>
                <span>{formatDate(task.updated_at)}</span>
              </div>
              {task.blocked_reason ? <small>Blocker: {summarizeText(task.blocked_reason, 72)}</small> : null}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
