import type { FormEvent } from "react";

import type { ActorContext } from "../api/client";
import { ACTOR_ROLE_OPTIONS } from "../api/client";
import { CompactAttentionCard } from "./control-plane-panels";
import { useI18n, translatePriority, translateRole, translateState } from "../i18n";
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
  const { language, t } = useI18n();
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
        <h1>{t("sidebar.controlPlane")}</h1>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>{t("sidebar.operator")}</h2>
          <span className="muted">{translateRole(language, actorContext.role)}</span>
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
                {translateRole(language, role)}
              </option>
            ))}
          </select>
          <input
            className="text-input"
            placeholder={t("common.actorId")}
            value={actorContext.actorId}
            onChange={(event) =>
              onActorContextChange((current) => ({
                ...current,
                actorId: event.target.value,
              }))
            }
          />
          <small>{t("sidebar.writeActionHint")}</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t("sidebar.summary")}</h2>
          <button className="ghost-button" onClick={() => void onRefresh()}>
            {t("common.refresh")}
          </button>
        </div>
        <div className="stats-grid">
          {statRows(summary, language).map((item) => (
            <article key={item.label} className="stat-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t("sidebar.newTask")}</h2>
          <span className="muted">{t("sidebar.intake")}</span>
        </div>
        <form className="stack" onSubmit={onCreateTask}>
          <input
            className="text-input"
            placeholder={t("sidebar.taskTitle")}
            value={taskForm.title}
            onChange={(event) =>
              onTaskFormChange((current) => ({ ...current, title: event.target.value }))
            }
          />
          <textarea
            className="text-input textarea-input"
            placeholder={t("sidebar.taskSummary")}
            value={taskForm.summary}
            onChange={(event) =>
              onTaskFormChange((current) => ({ ...current, summary: event.target.value }))
            }
          />
          <div className="form-grid">
            <input
              className="text-input"
              placeholder={t("sidebar.requester")}
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
              <option value="low">{translatePriority(language, "low")}</option>
              <option value="normal">{translatePriority(language, "normal")}</option>
              <option value="high">{translatePriority(language, "high")}</option>
              <option value="critical">{translatePriority(language, "critical")}</option>
            </select>
          </div>
          <input
            className="text-input"
            placeholder={t("sidebar.tags")}
            value={taskForm.tags}
            onChange={(event) =>
              onTaskFormChange((current) => ({ ...current, tags: event.target.value }))
            }
          />
          <button type="submit" disabled={creatingTask}>
            {creatingTask ? t("sidebar.creatingTask") : t("sidebar.createTask")}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t("sidebar.attention")}</h2>
          <span className="muted">
            {(attentionSource?.blocked.length ?? 0) +
              (attentionSource?.review.length ?? 0) +
              (attentionSource?.priority.length ?? 0)}
          </span>
        </div>
        <div className="stack">
          <CompactAttentionCard
            label={t("attention.blocked")}
            task={attentionSource?.blocked[0]}
            variant="task-row-blocked"
            fallback={t("sidebar.blockedFallback")}
            onSelectTask={onSelectTask}
          />
          <CompactAttentionCard
            label={t("attention.needsReview")}
            task={attentionSource?.review[0]}
            variant="task-row-review"
            badge={attentionSource?.review[0] ? `${t("taskDetail.reviewRound")} ${attentionSource.review[0].review_round || 0}` : undefined}
            fallback={t("sidebar.reviewFallback")}
            onSelectTask={onSelectTask}
          />
          <CompactAttentionCard
            label={t("attention.priority")}
            task={attentionSource?.priority[0]}
            variant="task-row-critical"
            fallback={t("sidebar.priorityFallback")}
            onSelectTask={onSelectTask}
          />
          {!attentionSource ? <p className="muted">{t("sidebar.loadingAttention")}</p> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{t("sidebar.tasks")}</h2>
          <span className="muted">{tasks.length}</span>
        </div>
        <div className="task-list">
          {loading ? <p className="muted">{t("sidebar.loadingTasks")}</p> : null}
          {!loading && tasks.length === 0 ? <p className="muted">{t("sidebar.noTasks")}</p> : null}
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
                <span className="task-row-state">{translateState(language, task.state)}</span>
                <span className="pill subtle">{translatePriority(language, task.priority)}</span>
              </div>
              <strong>{task.title}</strong>
              <small>{summarizeText(task.summary || t("common.noSummary"), 84)}</small>
              <div className="task-row-meta">
                <span>{translateRole(language, task.owner_role)}</span>
                <span>{formatDate(task.updated_at)}</span>
              </div>
              {task.blocked_reason ? <small>{t("common.blocker")}: {summarizeText(task.blocked_reason, 72)}</small> : null}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
