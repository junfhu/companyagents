import type { ActivityEvent, RuntimeStatus, Task } from "../types";
import { formatDate, summarizeText } from "../utils";
import { translatePriority, translateRole, translateState, useI18n } from "../i18n";

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
  const { language, t } = useI18n();
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
              <span className="pill subtle">
                {variant?.startsWith("priority-")
                  ? translatePriority(language, task.priority)
                  : translateState(language, task.state)}
              </span>
            </div>
            <p>{summarizeText(task.blocked_reason || task.acceptance_summary || task.summary || t("common.noSummary"), 150)}</p>
            <div className="team-metrics">
              <span>{translateRole(language, task.owner_role)}</span>
              {!variant?.startsWith("priority-") ? (
                <span>{translatePriority(language, task.priority)}</span>
              ) : (
                <span>{translateState(language, task.state)}</span>
              )}
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
  const { language } = useI18n();
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
                {translateRole(language, event.actor_role)}
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
  const { language } = useI18n();
  if (!task) return null;

  return (
    <button
      className={`task-row ${variant ?? ""}`.trim()}
      onClick={() => onSelectTask(task.id)}
    >
      <div className="list-card-top">
        <span className="task-row-state">{label}</span>
        <span className="pill subtle">{badge ?? translatePriority(language, task.priority)}</span>
      </div>
      <strong>{task.title}</strong>
      <small>{summarizeText(task.blocked_reason || task.acceptance_summary || task.summary || fallback, 72)}</small>
    </button>
  );
}

export function RuntimeStatusPanel({
  runtime,
  busy,
  onRunNow,
  onPause,
  onResume,
}: {
  runtime: RuntimeStatus | null;
  busy: boolean;
  onRunNow: () => void | Promise<void>;
  onPause: () => void | Promise<void>;
  onResume: () => void | Promise<void>;
}) {
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("common.runtime")}</h3>
        <span className="muted">{runtime?.running ? t("common.active") : t("common.idle")}</span>
      </div>
      {!runtime ? <p className="muted">{t("common.loadingRuntimeStatus")}</p> : null}
      {runtime ? (
        <div className="stack">
          <article className={`list-card ${runtime.running ? "runtime-card-active" : ""}`}>
            <div className="list-card-top">
              <strong>{runtime.configured_enabled ? t("common.workerEnabled") : t("common.workerDisabled")}</strong>
              <span className="pill subtle">{runtime.actor_id}</span>
            </div>
            <div className="team-metrics">
              <span>{t("common.loop")}: {runtime.running ? t("common.active") : t("common.idle")}</span>
              <span>{t("common.poll")}: {runtime.poll_interval_seconds}s</span>
              <span>{t("common.escalateAfter")}: {runtime.blocked_escalation_seconds}s</span>
              <span>{t("common.lastRun")}: {runtime.last_run_at ? formatDate(runtime.last_run_at) : t("common.never")}</span>
            </div>
            <div className="action-row">
              <button type="button" disabled={busy} onClick={() => void onRunNow()}>
                {busy ? t("common.working") : t("common.runNow")}
              </button>
              <button type="button" className="ghost-button" disabled={busy || !runtime.enabled} onClick={() => void onPause()}>
                {t("common.pause")}
              </button>
              <button type="button" className="ghost-button" disabled={busy || runtime.enabled} onClick={() => void onResume()}>
                {t("common.resume")}
              </button>
            </div>
          </article>
          <div className="stats-grid">
            <article className="stat-card">
              <span>{t("common.generated")}</span>
              <strong>{runtime.last_result.generated_work_items}</strong>
            </article>
            <article className="stat-card">
              <span>{t("common.dispatched")}</span>
              <strong>{runtime.last_result.dispatched_tasks}</strong>
            </article>
            <article className="stat-card">
              <span>{t("common.readyToReport")}</span>
              <strong>{runtime.last_result.ready_to_report_tasks}</strong>
            </article>
            <article className="stat-card">
              <span>{t("common.completed")}</span>
              <strong>{runtime.last_result.completed_tasks}</strong>
            </article>
            <article className="stat-card">
              <span>{t("common.escalated")}</span>
              <strong>{runtime.last_result.escalated_tasks}</strong>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function RuntimeAuditPanel({
  activity,
  onSelectTask,
}: {
  activity: ActivityEvent[];
  onSelectTask: (taskId: string) => void;
}) {
  const { t } = useI18n();
  const runtimeEvents = activity.filter(isRuntimeEvent).slice(0, 6);

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("common.runtimeAudit")}</h3>
        <span className="muted">{runtimeEvents.length}</span>
      </div>
      <div className="stack">
        {runtimeEvents.length === 0 ? <p className="muted">{t("common.noRuntimeActions")}</p> : null}
        {runtimeEvents.map((event) => (
          <article
            key={event.id}
            className="list-card runtime-audit-card"
            role={event.task_id ? "button" : undefined}
            tabIndex={event.task_id ? 0 : undefined}
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
            <div className="list-card-top">
              <strong>{event.topic}</strong>
              <span className="pill runtime-pill">{t("common.runtimeBadge")}</span>
            </div>
            <p>{summarizeRuntimeEvent(event)}</p>
            <div className="team-metrics">
              <span>{event.actor_id}</span>
              {event.task_id ? <span>{event.task_id}</span> : null}
              <span>{formatDate(event.created_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function isRuntimeEvent(event: ActivityEvent) {
  const payloadMeta = asRecord(event.payload?.meta);
  return (
    String(event.actor_id ?? "").startsWith("runtime-") ||
    event.meta?.runtime_auto === true ||
    event.payload?.runtime_auto === true ||
    event.payload?.generated_by === "runtime_orchestrator" ||
    payloadMeta?.runtime_auto === true
  );
}

function summarizeRuntimeEvent(event: ActivityEvent) {
  const language = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "zh-CN";
  if (event.payload?.work_item_count) {
    return `${resolveCommonLabel(language, "affectedWorkItems")}: ${String(event.payload.work_item_count)}`;
  }
  if (event.payload?.artifact_id) {
    return `${resolveCommonLabel(language, "completedWithArtifact")} ${String(event.payload.artifact_id)}`;
  }
  if (event.payload?.work_item_id) {
    return `${resolveCommonLabel(language, "affectedWorkItem")} ${String(event.payload.work_item_id)}`;
  }
  return summarizeText(event.topic, 100);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

function resolveCommonLabel(language: "zh-CN" | "en", key: "affectedWorkItems" | "completedWithArtifact" | "affectedWorkItem") {
  if (language === "en") {
    if (key === "affectedWorkItems") return "Affected work items";
    if (key === "completedWithArtifact") return "Completed with artifact";
    return "Affected work item";
  }
  if (key === "affectedWorkItems") return "影响的工作项";
  if (key === "completedWithArtifact") return "已附带 Artifact 完成";
  return "影响的工作项";
}
