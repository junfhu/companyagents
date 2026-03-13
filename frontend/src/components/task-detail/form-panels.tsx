import type { WorkItem } from "../../types";
import {
  translateArtifactType,
  translatePriority,
  translateRole,
  translateWorkItemStatus,
  useI18n,
} from "../../i18n";
import type {
  ArtifactFormState,
  PlanFormState,
  ProgressFormState,
  SubmitHandler,
  WorkItemFormState,
} from "./types";

export function PlanFormPanel({
  value,
  creating,
  hasTask,
  onChange,
  onSubmit,
}: {
  value: PlanFormState;
  creating: boolean;
  hasTask: boolean;
  onChange: (updater: (current: PlanFormState) => PlanFormState) => void;
  onSubmit: SubmitHandler;
}) {
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("taskDetail.createPlan")}</h3>
        <span className="muted">PM</span>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.goal")}
          value={value.goal}
          onChange={(event) => onChange((current) => ({ ...current, goal: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.acceptanceCriteriaLine")}
          value={value.acceptance}
          onChange={(event) =>
            onChange((current) => ({ ...current, acceptance: event.target.value }))
          }
        />
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.scopeItemsLine")}
          value={value.scope}
          onChange={(event) => onChange((current) => ({ ...current, scope: event.target.value }))}
        />
        <div className="form-grid">
          <input
            className="text-input"
            placeholder={t("taskDetail.teamsCommaSeparated")}
            value={value.teams}
            onChange={(event) => onChange((current) => ({ ...current, teams: event.target.value }))}
          />
          <input
            className="text-input"
            placeholder={t("taskDetail.estimatedEffort")}
            value={value.estimatedEffort}
            onChange={(event) =>
              onChange((current) => ({ ...current, estimatedEffort: event.target.value }))
            }
          />
        </div>
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.risksLine")}
          value={value.risks}
          onChange={(event) => onChange((current) => ({ ...current, risks: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.notes")}
          value={value.notes}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
        />
        <button type="submit" disabled={creating || !hasTask}>
          {creating ? t("taskDetail.submitting") : t("taskDetail.createPlanSubmitReview")}
        </button>
      </form>
    </section>
  );
}

export function WorkItemFormPanel({
  value,
  creating,
  hasPlan,
  onChange,
  onSubmit,
}: {
  value: WorkItemFormState;
  creating: boolean;
  hasPlan: boolean;
  onChange: (updater: (current: WorkItemFormState) => WorkItemFormState) => void;
  onSubmit: SubmitHandler;
}) {
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("taskDetail.createWorkItem")}</h3>
        <span className="muted">{translateRole(language, "DeliveryManager")}</span>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <input
          className="text-input"
          placeholder={t("taskDetail.workItemTitle")}
          value={value.title}
          onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.description")}
          value={value.description}
          onChange={(event) =>
            onChange((current) => ({ ...current, description: event.target.value }))
          }
        />
        <div className="form-grid">
          <select
            className="text-input"
            value={value.assignedTeam}
            onChange={(event) =>
              onChange((current) => ({ ...current, assignedTeam: event.target.value }))
            }
          >
            <option value="Engineering">{translateRole(language, "Engineering")}</option>
            <option value="Data">{translateRole(language, "Data")}</option>
            <option value="Content">{translateRole(language, "Content")}</option>
            <option value="Operations">{translateRole(language, "Operations")}</option>
            <option value="Security">{translateRole(language, "Security")}</option>
          </select>
          <select
            className="text-input"
            value={value.priority}
            onChange={(event) =>
              onChange((current) => ({ ...current, priority: event.target.value }))
            }
          >
            <option value="low">{translatePriority(language, "low")}</option>
            <option value="normal">{translatePriority(language, "normal")}</option>
            <option value="high">{translatePriority(language, "high")}</option>
            <option value="critical">{translatePriority(language, "critical")}</option>
          </select>
        </div>
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.acceptanceCriteriaLine")}
          value={value.acceptance}
          onChange={(event) =>
            onChange((current) => ({ ...current, acceptance: event.target.value }))
          }
        />
        <button type="submit" disabled={creating || !hasPlan}>
          {creating ? t("taskDetail.creating") : t("taskDetail.createWorkItem")}
        </button>
      </form>
    </section>
  );
}

export function WorkItemProgressPanel({
  workItems,
  value,
  updating,
  onChange,
  onSubmit,
}: {
  workItems: WorkItem[];
  value: ProgressFormState;
  updating: boolean;
  onChange: (updater: (current: ProgressFormState) => ProgressFormState) => void;
  onSubmit: SubmitHandler;
}) {
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("taskDetail.updateProgress")}</h3>
        <span className="muted">{t("taskDetail.execution")}</span>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <select
          className="text-input"
          value={value.workItemId}
          onChange={(event) =>
            onChange((current) => ({ ...current, workItemId: event.target.value }))
          }
        >
          <option value="">{t("taskDetail.selectWorkItem")}</option>
          {workItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} ({translateWorkItemStatus(language, item.status)})
            </option>
          ))}
        </select>
        <div className="form-grid">
          <select
            className="text-input"
            value={value.status}
            onChange={(event) => onChange((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="Assigned">{translateWorkItemStatus(language, "Assigned")}</option>
            <option value="InProgress">{translateWorkItemStatus(language, "InProgress")}</option>
            <option value="Blocked">{translateWorkItemStatus(language, "Blocked")}</option>
            <option value="Completed">{translateWorkItemStatus(language, "Completed")}</option>
          </select>
          <select
            className="text-input"
            value={value.actorRole}
            onChange={(event) =>
              onChange((current) => ({ ...current, actorRole: event.target.value }))
            }
          >
            <option value="EngineeringTeam">{translateRole(language, "EngineeringTeam")}</option>
            <option value="DataTeam">{translateRole(language, "DataTeam")}</option>
            <option value="ContentTeam">{translateRole(language, "ContentTeam")}</option>
            <option value="OperationsTeam">{translateRole(language, "OperationsTeam")}</option>
            <option value="SecurityTeam">{translateRole(language, "SecurityTeam")}</option>
          </select>
        </div>
        <input
          className="text-input"
          placeholder={t("taskDetail.progressPercent")}
          value={value.progressPercent}
          onChange={(event) =>
            onChange((current) => ({ ...current, progressPercent: event.target.value }))
          }
        />
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.progressSummary")}
          value={value.summary}
          onChange={(event) => onChange((current) => ({ ...current, summary: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.blockReason")}
          value={value.blockReason}
          onChange={(event) =>
            onChange((current) => ({ ...current, blockReason: event.target.value }))
          }
        />
        <button type="submit" disabled={updating || workItems.length === 0}>
          {updating ? t("taskDetail.updating") : t("taskDetail.updateProgress")}
        </button>
      </form>
    </section>
  );
}

export function ArtifactFormPanel({
  workItems,
  value,
  creating,
  onChange,
  onSubmit,
}: {
  workItems: WorkItem[];
  value: ArtifactFormState;
  creating: boolean;
  onChange: (updater: (current: ArtifactFormState) => ArtifactFormState) => void;
  onSubmit: SubmitHandler;
}) {
  const { language, t } = useI18n();
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{t("taskDetail.createArtifact")}</h3>
        <span className="muted">{t("taskDetail.deliveryOutput")}</span>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <div className="form-grid">
          <select
            className="text-input"
            value={value.workItemId}
            onChange={(event) =>
              onChange((current) => ({ ...current, workItemId: event.target.value }))
            }
          >
            <option value="">{t("taskDetail.attachToTaskOnly")}</option>
            {workItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <select
            className="text-input"
            value={value.type}
            onChange={(event) => onChange((current) => ({ ...current, type: event.target.value }))}
          >
            <option value="document">{translateArtifactType(language, "document")}</option>
            <option value="report">{translateArtifactType(language, "report")}</option>
            <option value="repo_diff">{translateArtifactType(language, "repo_diff")}</option>
            <option value="test_report">{translateArtifactType(language, "test_report")}</option>
            <option value="design">{translateArtifactType(language, "design")}</option>
            <option value="dataset">{translateArtifactType(language, "dataset")}</option>
            <option value="chart">{translateArtifactType(language, "chart")}</option>
            <option value="plan">{translateArtifactType(language, "plan")}</option>
            <option value="summary">{translateArtifactType(language, "summary")}</option>
            <option value="customer_response">{translateArtifactType(language, "customer_response")}</option>
            <option value="runbook">{translateArtifactType(language, "runbook")}</option>
            <option value="other">{translateArtifactType(language, "other")}</option>
          </select>
        </div>
        <input
          className="text-input"
          placeholder={t("taskDetail.artifactName")}
          value={value.name}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
        />
        <input
          className="text-input"
          placeholder={t("taskDetail.pathOrUrl")}
          value={value.path}
          onChange={(event) => onChange((current) => ({ ...current, path: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder={t("taskDetail.artifactSummary")}
          value={value.summary}
          onChange={(event) => onChange((current) => ({ ...current, summary: event.target.value }))}
        />
        <select
          className="text-input"
          value={value.createdByRole}
          onChange={(event) =>
            onChange((current) => ({ ...current, createdByRole: event.target.value }))
          }
        >
          <option value="EngineeringTeam">{translateRole(language, "EngineeringTeam")}</option>
          <option value="DataTeam">{translateRole(language, "DataTeam")}</option>
          <option value="ContentTeam">{translateRole(language, "ContentTeam")}</option>
          <option value="OperationsTeam">{translateRole(language, "OperationsTeam")}</option>
          <option value="SecurityTeam">{translateRole(language, "SecurityTeam")}</option>
          <option value="DeliveryManager">{translateRole(language, "DeliveryManager")}</option>
          <option value="ReportingSpecialist">{translateRole(language, "ReportingSpecialist")}</option>
        </select>
        <button type="submit" disabled={creating}>
          {creating ? t("taskDetail.creating") : t("taskDetail.createArtifact")}
        </button>
      </form>
    </section>
  );
}
