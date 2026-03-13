import type { ActivityEvent, AttentionQueues, Task } from "../types";
import { ActivityPanel, TaskQueuePanel } from "../components/control-plane-panels";

export function AttentionPage({
  attention,
  recentActivity,
  onSelectTask,
}: {
  attention: AttentionQueues | null;
  recentActivity: ActivityEvent[];
  onSelectTask: (taskId: string) => void;
}) {
  const queues = attention ?? {
    recent: [],
    blocked: [],
    review: [],
    priority: [],
  };

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Operations</p>
        <h2>Attention</h2>
        <p className="summary-copy">
          This page isolates the queues that usually need human attention first: blocked work,
          review backlog, priority items, and the most recently changing tasks.
        </p>
        <div className="stats-grid wide">
          <article className="stat-card">
            <span>Blocked</span>
            <strong>{queues.blocked.length}</strong>
          </article>
          <article className="stat-card">
            <span>Needs Review</span>
            <strong>{queues.review.length}</strong>
          </article>
          <article className="stat-card">
            <span>Priority</span>
            <strong>{queues.priority.length}</strong>
          </article>
          <article className="stat-card">
            <span>Recently Active</span>
            <strong>{queues.recent.length}</strong>
          </article>
        </div>
      </section>

      <div className="detail-grid">
        <TaskQueuePanel
          title="Blocked Queue"
          tasks={queues.blocked}
          variant="board-blocked"
          empty="No blocked tasks right now."
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title="Review Queue"
          tasks={queues.review}
          variant="board-review"
          empty="No review work waiting."
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title="Priority Queue"
          tasks={queues.priority}
          variant="priority-high"
          empty="No high-priority tasks queued."
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title="Recent Changes"
          tasks={queues.recent}
          empty="No recent task activity."
          onSelectTask={onSelectTask}
        />
        <ActivityPanel
          title="System Activity"
          activity={recentActivity}
          empty="No recent system activity yet."
          onSelectTask={onSelectTask}
        />
      </div>
    </div>
  );
}
