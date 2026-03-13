import type { ActivityEvent, AttentionQueues, DashboardSummary, RuntimeStatus, Task } from "../types";
import { ActivityPanel, RuntimeAuditPanel, RuntimeStatusPanel, TaskQueuePanel } from "../components/control-plane-panels";

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
        <p className="eyebrow">Workflow Overview</p>
        <h2>Board</h2>
        <p className="summary-copy">
          This page is the control-room overview for the modern delivery system. Use the sidebar to
          create new requests and jump into task detail. The cards below highlight what needs
          attention right now.
        </p>
        <div className="stats-grid wide">
          <article className="stat-card">
            <span>Tasks Total</span>
            <strong>{summary?.tasks_total ?? 0}</strong>
          </article>
          <article className="stat-card">
            <span>Active</span>
            <strong>{summary?.tasks_active ?? 0}</strong>
          </article>
          <article className="stat-card">
            <span>Blocked</span>
            <strong>{summary?.tasks_blocked ?? 0}</strong>
          </article>
          <article className="stat-card">
            <span>Teams Active</span>
            <strong>{Object.keys(summary?.by_team ?? {}).length}</strong>
          </article>
          <article className="stat-card">
            <span>Review Queue</span>
            <strong>{reviewQueue.length}</strong>
          </article>
          <article className="stat-card">
            <span>High Priority</span>
            <strong>{criticalQueue.length}</strong>
          </article>
        </div>
      </section>

      <div className="detail-grid">
        <TaskQueuePanel
          title="Recently Active"
          tasks={activeTasks}
          empty="No active tasks yet."
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title="Blocked Now"
          tasks={blockedTasks}
          variant="board-blocked"
          empty="No blocked tasks right now."
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title="Needs Review"
          tasks={reviewQueue}
          variant="board-review"
          empty="No review queue right now."
          onSelectTask={onSelectTask}
        />
        <TaskQueuePanel
          title="Priority Radar"
          tasks={criticalQueue}
          variant="priority-high"
          empty="No high-priority tasks right now."
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
          title="Recent Activity"
          activity={recentActivity}
          empty="No recent system activity yet."
          onSelectTask={onSelectTask}
        />
      </div>
    </div>
  );
}
