import type { WorkItem } from "../../types";
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
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Create Plan</h3>
        <span className="muted">PM</span>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <textarea
          className="text-input textarea-input"
          placeholder="Goal"
          value={value.goal}
          onChange={(event) => onChange((current) => ({ ...current, goal: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder="Acceptance criteria, one per line"
          value={value.acceptance}
          onChange={(event) =>
            onChange((current) => ({ ...current, acceptance: event.target.value }))
          }
        />
        <textarea
          className="text-input textarea-input"
          placeholder="Scope items, one per line"
          value={value.scope}
          onChange={(event) => onChange((current) => ({ ...current, scope: event.target.value }))}
        />
        <div className="form-grid">
          <input
            className="text-input"
            placeholder="Teams, comma separated"
            value={value.teams}
            onChange={(event) => onChange((current) => ({ ...current, teams: event.target.value }))}
          />
          <input
            className="text-input"
            placeholder="Estimated effort"
            value={value.estimatedEffort}
            onChange={(event) =>
              onChange((current) => ({ ...current, estimatedEffort: event.target.value }))
            }
          />
        </div>
        <textarea
          className="text-input textarea-input"
          placeholder="Risks, one per line"
          value={value.risks}
          onChange={(event) => onChange((current) => ({ ...current, risks: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder="Notes"
          value={value.notes}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
        />
        <button type="submit" disabled={creating || !hasTask}>
          {creating ? "Submitting..." : "Create Plan + Submit Review"}
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
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Create Work Item</h3>
        <span className="muted">Delivery</span>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <input
          className="text-input"
          placeholder="Work item title"
          value={value.title}
          onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder="Description"
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
            <option value="Engineering">Engineering</option>
            <option value="Data">Data</option>
            <option value="Content">Content</option>
            <option value="Operations">Operations</option>
            <option value="Security">Security</option>
          </select>
          <select
            className="text-input"
            value={value.priority}
            onChange={(event) =>
              onChange((current) => ({ ...current, priority: event.target.value }))
            }
          >
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </div>
        <textarea
          className="text-input textarea-input"
          placeholder="Acceptance criteria, one per line"
          value={value.acceptance}
          onChange={(event) =>
            onChange((current) => ({ ...current, acceptance: event.target.value }))
          }
        />
        <button type="submit" disabled={creating || !hasPlan}>
          {creating ? "Creating..." : "Create Work Item"}
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
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Update Progress</h3>
        <span className="muted">Execution</span>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <select
          className="text-input"
          value={value.workItemId}
          onChange={(event) =>
            onChange((current) => ({ ...current, workItemId: event.target.value }))
          }
        >
          <option value="">Select work item</option>
          {workItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} ({item.status})
            </option>
          ))}
        </select>
        <div className="form-grid">
          <select
            className="text-input"
            value={value.status}
            onChange={(event) => onChange((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="Assigned">Assigned</option>
            <option value="InProgress">InProgress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="text-input"
            value={value.actorRole}
            onChange={(event) =>
              onChange((current) => ({ ...current, actorRole: event.target.value }))
            }
          >
            <option value="EngineeringTeam">EngineeringTeam</option>
            <option value="DataTeam">DataTeam</option>
            <option value="ContentTeam">ContentTeam</option>
            <option value="OperationsTeam">OperationsTeam</option>
            <option value="SecurityTeam">SecurityTeam</option>
          </select>
        </div>
        <input
          className="text-input"
          placeholder="Progress percent"
          value={value.progressPercent}
          onChange={(event) =>
            onChange((current) => ({ ...current, progressPercent: event.target.value }))
          }
        />
        <textarea
          className="text-input textarea-input"
          placeholder="Progress summary"
          value={value.summary}
          onChange={(event) => onChange((current) => ({ ...current, summary: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder="Block reason"
          value={value.blockReason}
          onChange={(event) =>
            onChange((current) => ({ ...current, blockReason: event.target.value }))
          }
        />
        <button type="submit" disabled={updating || workItems.length === 0}>
          {updating ? "Updating..." : "Update Work Item"}
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
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Create Artifact</h3>
        <span className="muted">Delivery Output</span>
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
            <option value="">Attach to task only</option>
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
            <option value="document">document</option>
            <option value="report">report</option>
            <option value="repo_diff">repo_diff</option>
            <option value="test_report">test_report</option>
            <option value="design">design</option>
            <option value="dataset">dataset</option>
            <option value="chart">chart</option>
            <option value="plan">plan</option>
            <option value="summary">summary</option>
            <option value="customer_response">customer_response</option>
            <option value="runbook">runbook</option>
            <option value="other">other</option>
          </select>
        </div>
        <input
          className="text-input"
          placeholder="Artifact name"
          value={value.name}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
        />
        <input
          className="text-input"
          placeholder="Path or URL"
          value={value.path}
          onChange={(event) => onChange((current) => ({ ...current, path: event.target.value }))}
        />
        <textarea
          className="text-input textarea-input"
          placeholder="Artifact summary"
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
          <option value="EngineeringTeam">EngineeringTeam</option>
          <option value="DataTeam">DataTeam</option>
          <option value="ContentTeam">ContentTeam</option>
          <option value="OperationsTeam">OperationsTeam</option>
          <option value="SecurityTeam">SecurityTeam</option>
          <option value="DeliveryManager">DeliveryManager</option>
          <option value="ReportingSpecialist">ReportingSpecialist</option>
        </select>
        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create Artifact"}
        </button>
      </form>
    </section>
  );
}
