import type { ActivityEvent, AttentionQueues, Task } from "../types";
import { ActivityPanel, TaskQueuePanel } from "../components/control-plane-panels";
import { useI18n } from "../i18n";

export function AttentionPage({
  attention,
  recentActivity,
  onSelectTask,
}: {
  attention: AttentionQueues | null;
  recentActivity: ActivityEvent[];
  onSelectTask: (taskId: string) => void;
}) {
  const { t } = useI18n();
  const queues = attention ?? {
    recent: [],
    blocked: [],
    stalled: [],
    review: [],
    priority: [],
  };

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">{t("attention.eyebrow")}</p>
        <h2>{t("nav.attention")}</h2>
        <p className="summary-copy">{t("attention.summary")}</p>
        <div className="stats-grid wide">
          <article className="stat-card">
            <span>{t("attention.blocked")}</span>
            <strong>{queues.blocked.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("attention.stalled")}</span>
            <strong>{queues.stalled.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("attention.needsReview")}</span>
            <strong>{queues.review.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("attention.priority")}</span>
            <strong>{queues.priority.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("attention.recentlyActive")}</span>
            <strong>{queues.recent.length}</strong>
          </article>
        </div>
      </section>

      <div className="detail-grid">
        <TaskQueuePanel
          title={t("attention.blockedQueue")}
          tasks={queues.blocked}
          variant="board-blocked"
          empty={t("board.noBlockedTasks")}
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title={t("attention.stalledBlockers")}
          tasks={queues.stalled}
          variant="queue-stalled"
          empty={t("attention.noStalled")}
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title={t("attention.reviewQueue")}
          tasks={queues.review}
          variant="board-review"
          empty={t("attention.noReviewWork")}
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title={t("attention.priorityQueue")}
          tasks={queues.priority}
          variant="priority-high"
          empty={t("attention.noPriorityWork")}
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title={t("attention.recentChanges")}
          tasks={queues.recent}
          empty={t("attention.noRecentTaskActivity")}
          onSelectTask={onSelectTask}
        />
        <ActivityPanel
          title={t("common.systemActivity")}
          activity={recentActivity}
          empty={t("common.noRecentSystemActivity")}
          onSelectTask={onSelectTask}
        />
      </div>
    </div>
  );
}
