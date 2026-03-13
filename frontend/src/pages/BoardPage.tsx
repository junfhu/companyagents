import type { ActivityEvent, AttentionQueues, DashboardSummary, RuntimeStatus, Task } from "../types";
import { ActivityPanel, RuntimeAuditPanel, RuntimeStatusPanel, TaskQueuePanel } from "../components/control-plane-panels";
import { useI18n } from "../i18n";

export function BoardPage({
  summary,
  attention,
  tasks,
  runtime,
  runtimeBusy,
  recentActivity,
  onRunRuntimeControl,
  onSelectTask,
}: {
  summary: DashboardSummary | null;
  attention: AttentionQueues | null;
  tasks: Task[];
  runtime: RuntimeStatus | null;
  runtimeBusy: boolean;
  recentActivity: ActivityEvent[];
  onRunRuntimeControl: (action: "run-once" | "pause" | "resume") => void | Promise<void>;
  onSelectTask: (taskId: string) => void;
}) {
  const { t } = useI18n();
  const sortedTasks = [...tasks].sort((left, right) => right.updated_at.localeCompare(left.updated_at));
  const activeTasks = attention?.recent ?? summary?.attention?.recent ?? sortedTasks.filter((task) => !task.archived).slice(0, 5);
  const blockedTasks = attention?.blocked ?? summary?.attention?.blocked ?? sortedTasks.filter((task) => task.state === "Blocked").slice(0, 5);
  const reviewQueue =
    attention?.review ??
    summary?.attention?.review ??
    sortedTasks.filter((task) => task.state === "InReview" || task.state === "Approved").slice(0, 5);
  const criticalQueue =
    attention?.priority ??
    summary?.attention?.priority ??
    sortedTasks.filter((task) => task.priority === "critical" || task.priority === "high").slice(0, 5);

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">{t("board.eyebrow")}</p>
        <h2>{t("nav.board")}</h2>
        <p className="summary-copy">
          {t("board.summary")}
        </p>
        <div className="stats-grid wide">
          <article className="stat-card">
            <span>{t("board.tasksTotal")}</span>
            <strong>{summary?.tasks_total ?? 0}</strong>
          </article>
          <article className="stat-card">
            <span>{t("board.active")}</span>
            <strong>{summary?.tasks_active ?? 0}</strong>
          </article>
          <article className="stat-card">
            <span>{t("board.blocked")}</span>
            <strong>{summary?.tasks_blocked ?? 0}</strong>
          </article>
          <article className="stat-card">
            <span>{t("board.teamsActive")}</span>
            <strong>{Object.keys(summary?.by_team ?? {}).length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("board.reviewQueue")}</span>
            <strong>{reviewQueue.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("board.highPriority")}</span>
            <strong>{criticalQueue.length}</strong>
          </article>
        </div>
      </section>

      <div className="detail-grid">
        <TaskQueuePanel
          title={t("board.recentlyActive")}
          tasks={activeTasks}
          empty={t("board.noActiveTasks")}
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title={t("board.blockedNow")}
          tasks={blockedTasks}
          variant="board-blocked"
          empty={t("board.noBlockedTasks")}
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title={t("board.needsReview")}
          tasks={reviewQueue}
          variant="board-review"
          empty={t("board.noReviewQueue")}
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title={t("board.priorityRadar")}
          tasks={criticalQueue}
          variant="priority-high"
          empty={t("board.noPriorityTasks")}
          onSelectTask={onSelectTask}
        />
        <RuntimeStatusPanel
          runtime={runtime}
          busy={runtimeBusy}
          onRunNow={() => onRunRuntimeControl("run-once")}
          onPause={() => onRunRuntimeControl("pause")}
          onResume={() => onRunRuntimeControl("resume")}
        />
        <RuntimeAuditPanel activity={recentActivity} onSelectTask={onSelectTask} />
        <ActivityPanel
          title={t("common.recentActivity")}
          activity={recentActivity}
          empty={t("common.noRecentSystemActivity")}
          onSelectTask={onSelectTask}
        />
      </div>
    </div>
  );
}
