import { useMemo, useState } from "react";

import type { Artifact, Intervention, Plan, Review, Task, WorkItem, ActivityEvent } from "../../types";
import { formatDate, summarizeText } from "../../utils";
import type { DetailAction, DetailActionRequest, SupervisorFormState, TaskRuntimeAction } from "./types";
import {
  translateArtifactType,
  translatePriority,
  translateReviewResult,
  translateRole,
  translateState,
  translateSupervisorAction,
  translateWorkItemStatus,
  useI18n,
} from "../../i18n";

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
  const { language, t } = useI18n();
  const inReview = task.state === "InReview";

  return (
    <section className="panel hero-panel">
      <div className="task-meta">
        <div>
          <span className="pill">{translateState(language, task.state)}</span>
          <h3>{task.id}</h3>
        </div>
        <div className="meta-lines">
          <span>{t("common.owner")}: {translateRole(language, task.owner_role)}</span>
          <span>{t("common.priority")}: {translatePriority(language, task.priority)}</span>
          <span>{t("common.updated")}: {formatDate(task.updated_at)}</span>
        </div>
      </div>
      <p className="summary-copy">{task.summary || t("common.noSummary")}</p>
      <div className="action-row">
        <button disabled={!inReview} onClick={() => void onAction("approve")}>
          {t("taskDetail.approve")}
        </button>
        <button disabled={!inReview} onClick={() => void onAction("request-changes")}>
          {t("taskDetail.requestChanges")}
        </button>
        <button disabled={!inReview} onClick={() => void onAction("reject")}>
          {t("taskDetail.reject")}
        </button>
        <button className="ghost-button" disabled={taskRuntimeBusy} onClick={() => void onTaskRuntimeAction("run-once")}>
          {taskRuntimeBusy ? t("common.running") : t("taskDetail.runtimeRun")}
        </button>
        <button className="ghost-button" disabled={taskRuntimeBusy} onClick={() => void onTaskRuntimeAction("sweep")}>
          {t("taskDetail.supervisorSweep")}
        </button>
      </div>
    </section>
  );
}

export function PlanPanel({ task, plan }: { task: Task; plan: Plan | null }) {
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("taskDetail.plan")}</h3>
        <span className="muted">v{(plan?.version ?? task.current_plan_version) || 0}</span>
      </div>
      {plan ? (
        <div className="stack">
          <p>{plan.goal}</p>
          {plan.scope.length > 0 ? (
            <div>
              <h4>{t("taskDetail.scope")}</h4>
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
            <h4>{t("taskDetail.acceptance")}</h4>
            <ul>
              {plan.acceptance_criteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{t("teams.teams")}</h4>
            <div className="chip-row">
              {plan.required_teams.map((team) => (
                <span key={team} className="chip">
                  {translateRole(language, team)}
                </span>
              ))}
            </div>
          </div>
          {plan.risks.length > 0 ? (
            <div>
              <h4>{t("taskDetail.risks")}</h4>
              <ul>
                {plan.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="muted">{t("common.noPlanYet")}</p>
      )}
    </section>
  );
}

export function WorkItemsPanel({ workItems }: { workItems: WorkItem[] }) {
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("teams.workItems")}</h3>
        <span className="muted">{workItems.length}</span>
      </div>
      <div className="stack">
        {workItems.length === 0 ? <p className="muted">{t("common.noWorkItemsYet")}</p> : null}
        {workItems.map((item) => (
          <article key={item.id} className={`list-card work-item-card status-${item.status.toLowerCase()}`}>
            <div className="list-card-top">
              <strong>{item.title}</strong>
              <div className="chip-row">
                {isRuntimeGenerated(item) ? <span className="pill runtime-pill">{t("common.runtimeBadge")}</span> : null}
                <span className="pill subtle">{translateWorkItemStatus(language, item.status)}</span>
              </div>
            </div>
            <p>{summarizeText(item.description || t("teams.noDescription"), 180)}</p>
            <div className="team-metrics">
              <span>{t("common.team")}: {translateRole(language, item.assigned_team || "-")}</span>
              <span>{t("common.priority")}: {translatePriority(language, item.priority)}</span>
              <span>{t("common.updated")}: {formatDate(item.updated_at)}</span>
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
            {item.block_reason ? <small>{t("common.blocker")}: {item.block_reason}</small> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ReviewsPanel({ reviews }: { reviews: Review[] }) {
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("taskDetail.reviews")}</h3>
        <span className="muted">{reviews.length}</span>
      </div>
      <div className="stack">
        {reviews.length === 0 ? <p className="muted">{t("common.noReviewsYet")}</p> : null}
        {reviews.map((review) => (
          <article key={review.id} className={`list-card review-card review-${review.result.toLowerCase()}`}>
            <div className="list-card-top">
              <strong>{translateReviewResult(language, review.result)}</strong>
              <div className="chip-row">
                <span className="pill subtle">{t("taskDetail.reviewRound")} {review.review_round}</span>
                <span className="pill subtle">{translateRole(language, review.reviewer_role)}</span>
              </div>
            </div>
            <p>{review.summary || t("common.noSummary")}</p>
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
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("taskDetail.timeline")}</h3>
        <span className="muted">{detailLoading ? t("taskDetail.refreshing") : activity.length}</span>
      </div>
      <div className="stack timeline">
        {activity.length === 0 ? <p className="muted">{t("common.noEventsYet")}</p> : null}
        {activity.map((event) => (
          <article key={event.id} className={`timeline-row ${isRuntimeEvent(event) ? "runtime-event-row" : ""}`}>
            <div className="timeline-bullet" />
            <div>
              <div className="list-card-top">
                <strong>{event.topic}</strong>
                {isRuntimeEvent(event) ? <span className="pill runtime-pill">{t("common.runtimeBadge")}</span> : null}
              </div>
              <p>
                {translateRole(language, event.actor_role)}
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
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("taskDetail.artifacts")}</h3>
        <span className="muted">{artifacts.length}</span>
      </div>
      <div className="stack">
        {artifacts.length === 0 ? <p className="muted">{t("common.noArtifactsYet")}</p> : null}
        {artifacts.map((artifact) => (
          <article key={artifact.id} className="list-card">
            <div className="list-card-top">
              <strong>{artifact.name}</strong>
              <div className="chip-row">
                {isRuntimeArtifact(artifact) ? <span className="pill runtime-pill">{t("common.runtimeBadge")}</span> : null}
                <span className="pill subtle">{translateArtifactType(language, artifact.type)}</span>
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
  const { t } = useI18n();
  const runtimeEvents = activity.filter(isRuntimeEvent).slice(-6).reverse();
  const runtimeWorkItems = workItems.filter(isRuntimeGenerated);
  const runtimeArtifacts = artifacts.filter(isRuntimeArtifact);
  const runtimeInterventions = interventions.filter(isRuntimeIntervention);

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("common.runtimeAudit")}</h3>
        <span className="muted">{runtimeEvents.length}</span>
      </div>
      <div className="stack">
        <div className="stats-grid">
          <article className="stat-card">
            <span>{t("common.runtimeEvents")}</span>
            <strong>{runtimeEvents.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("common.generatedItems")}</span>
            <strong>{runtimeWorkItems.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("common.runtimeArtifacts")}</span>
            <strong>{runtimeArtifacts.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("common.escalations")}</span>
            <strong>{runtimeInterventions.length}</strong>
          </article>
        </div>
        {runtimeEvents.length === 0 ? <p className="muted">{t("common.noRuntimeActions")}</p> : null}
        {runtimeEvents.map((event) => (
          <article key={event.id} className="list-card runtime-audit-card">
            <div className="list-card-top">
              <strong>{event.topic}</strong>
              <span className="pill runtime-pill">{t("common.runtimeBadge")}</span>
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
  const { language, t } = useI18n();
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
        <h3>{t("taskDetail.supervisor")}</h3>
        <span className="muted">{filteredInterventions.length}</span>
      </div>
      <div className="stack">
        <article className={`list-card supervisor-summary ${task.state === "Blocked" ? "is-blocked" : ""}`}>
          <div className="list-card-top">
            <strong>{task.state === "Blocked" ? t("taskDetail.taskBlocked") : t("taskDetail.taskActive")}</strong>
            <span className="pill subtle">{translateState(language, task.state)}</span>
          </div>
          <p>{task.blocked_reason || t("taskDetail.noActiveBlocker")}</p>
          <div className="team-metrics">
            <span>{t("common.owner")}: {translateRole(language, task.owner_role)}</span>
            <span>{t("taskDetail.reviewRound")}: {task.review_round}</span>
            <span>{t("taskDetail.plan")} v{task.current_plan_version}</span>
          </div>
          {Object.keys(actionCounts).length > 0 ? (
            <div className="chip-row">
              {Object.entries(actionCounts).map(([action, count]) => (
                <span key={action} className="chip">
                  {translateSupervisorAction(language, action)}: {count}
                </span>
              ))}
            </div>
          ) : null}
          {lastIntervention ? (
            <small>
              {t("taskDetail.lastIntervention")}: {translateSupervisorAction(language, lastIntervention.action)} by {translateRole(language, lastIntervention.triggered_by_role)} at{" "}
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
            <h4>{t("taskDetail.intervene")}</h4>
            <span className="muted">{t("common.policyAwareControls")}</span>
          </div>
          <div className="chip-row">
            {SUPERVISOR_ACTIONS.map((action) => (
              <span
                key={action.value}
                className={`chip action-chip ${action.available(task) ? "" : "is-disabled"}`}
              >
                {translateSupervisorAction(language, action.value)}
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
                  {translateSupervisorAction(language, action.value)}
                </option>
              ))}
            </select>
            <input
              className="text-input"
              placeholder={t("common.actorId")}
              value={value.actorId}
              onChange={(event) => onChange((current) => ({ ...current, actorId: event.target.value }))}
            />
          </div>
          <p className="muted inline-banner">{language === "zh-CN" ? helperTextZh(selectedAction.value) : selectedAction.helper}</p>
          <textarea
            className="text-input textarea-input"
            placeholder={t("taskDetail.reasonForIntervention")}
            value={value.reason}
            onChange={(event) => onChange((current) => ({ ...current, reason: event.target.value }))}
          />
          <button type="submit" disabled={!canSubmit}>
            {runningAction === value.action ? t("common.running") : `${t("common.runNow")} ${translateSupervisorAction(language, selectedAction.value)}`}
          </button>
          {availableActions.length === 0 ? (
            <small>{t("taskDetail.noSupervisorActions")}</small>
          ) : null}
        </form>
        {Object.keys(actionCounts).length > 0 ? (
          <div className="form-grid">
            <select
              className="text-input"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">{t("common.allInterventions")}</option>
              {Object.keys(actionCounts).map((action) => (
                <option key={action} value={action}>
                  {translateSupervisorAction(language, action)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {interventions.length === 0 ? <p className="muted">{t("common.noInterventionsYet")}</p> : null}
        {filteredInterventions.map((item) => (
          <article key={item.id} className={`list-card intervention-card action-${item.action}`}>
            <div className="list-card-top">
              <div className="chip-row">
                <strong>{translateSupervisorAction(language, item.action)}</strong>
                {isRuntimeIntervention(item) ? <span className="pill runtime-pill">{t("common.runtimeBadge")}</span> : null}
              </div>
              <span className="muted">
                {translateState(language, item.from_state)} {" -> "} {translateState(language, item.to_state)}
              </span>
            </div>
            <p>{item.reason || t("taskDetail.noReasonProvided")}</p>
            <div className="team-metrics">
              <span>{translateRole(language, item.triggered_by_role)}</span>
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
  const lang = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "zh-CN";
  if (event.payload?.work_item_count) {
    return `${lang === "zh-CN" ? "影响的工作项" : "Affected work items"}: ${String(event.payload.work_item_count)}`;
  }
  if (event.payload?.artifact_id) {
    return `${lang === "zh-CN" ? "已附带 Artifact 完成" : "Completed with artifact"} ${String(event.payload.artifact_id)}`;
  }
  if (event.payload?.work_item_id) {
    return `${lang === "zh-CN" ? "影响的工作项" : "Affected work item"} ${String(event.payload.work_item_id)}`;
  }
  return summarizeText(event.topic, 100);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

function helperTextZh(action: SupervisorFormState["action"]) {
  if (action === "pause") return "把活跃任务置为阻塞，并记录原因。";
  if (action === "resume") return "根据上一次暂停上下文，把阻塞任务恢复到合适状态。";
  if (action === "retry") return "在任务保持阻塞时记录一次重试。";
  if (action === "escalate") return "记录一次升级，不直接改变任务状态。";
  if (action === "rollback") return "把任务退回到规划或确认阶段，取决于当前历史。";
  return "把任务退回到 Planned，重新进行一轮协调。";
}
