import type { TeamOverview, WorkItem } from "../types";
import { formatDate, summarizeText } from "../utils";

export function TeamsPage({
  teams,
  selectedTeam,
  teamWorkItems,
  teamsLoading,
  onSelectTeam,
  onSelectTask,
}: {
  teams: TeamOverview[];
  selectedTeam: string;
  teamWorkItems: WorkItem[];
  teamsLoading: boolean;
  onSelectTeam: (teamName: string) => void;
  onSelectTask: (taskId: string) => void;
}) {
  const totals = teams.reduce(
    (acc, team) => {
      acc.workItems += team.work_items_total;
      acc.inProgress += team.work_items_in_progress;
      acc.blocked += team.work_items_blocked;
      acc.completed += team.work_items_completed;
      acc.owned += team.tasks_owned;
      return acc;
    },
    { workItems: 0, inProgress: 0, blocked: 0, completed: 0, owned: 0 },
  );

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Operations</p>
        <h2>Teams</h2>
        <p className="summary-copy">
          Team workload is now backed by a real API. This view shows how execution is distributed
          across teams and where blockers are starting to accumulate.
        </p>
        <div className="stats-grid wide">
          <article className="stat-card">
            <span>Teams</span>
            <strong>{teams.length}</strong>
          </article>
          <article className="stat-card">
            <span>Work Items</span>
            <strong>{totals.workItems}</strong>
          </article>
          <article className="stat-card">
            <span>In Progress</span>
            <strong>{totals.inProgress}</strong>
          </article>
          <article className="stat-card">
            <span>Blocked</span>
            <strong>{totals.blocked}</strong>
          </article>
        </div>
      </section>

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Team Load</h3>
            <span className="muted">{teams.length}</span>
          </div>
          <div className="stack">
            {teams.length === 0 ? <p className="muted">No team workload yet.</p> : null}
            {teams.map((team) => (
              <article
                key={team.name}
                className={`list-card team-card ${team.work_items_blocked > 0 ? "team-card-alert" : ""} ${
                  selectedTeam === team.name ? "team-card-selected" : ""
                }`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTeam(team.name)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectTeam(team.name);
                  }
                }}
              >
                <div className="list-card-top">
                  <strong>{team.name}</strong>
                  <span className="pill subtle">{team.work_items_total} work items</span>
                </div>
                <div className="team-metrics">
                  <span>In progress: {team.work_items_in_progress}</span>
                  <span>Blocked: {team.work_items_blocked}</span>
                  <span>Completed: {team.work_items_completed}</span>
                  <span>Tasks owned: {team.tasks_owned}</span>
                </div>
                <div className="team-bar">
                  <span
                    className="team-bar-segment team-bar-progress"
                    style={{
                      width: `${team.work_items_total ? (team.work_items_in_progress / team.work_items_total) * 100 : 0}%`,
                    }}
                  />
                  <span
                    className="team-bar-segment team-bar-blocked"
                    style={{
                      width: `${team.work_items_total ? (team.work_items_blocked / team.work_items_total) * 100 : 0}%`,
                    }}
                  />
                  <span
                    className="team-bar-segment team-bar-completed"
                    style={{
                      width: `${team.work_items_total ? (team.work_items_completed / team.work_items_total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <small>
                  {team.work_items_blocked > 0
                    ? "Needs attention: this team currently has blocked work."
                    : "No current blockers recorded for this team."}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Team Work Queue</h3>
            <span className="muted">{selectedTeam || "Select a team"}</span>
          </div>
          <div className="stack">
            <article className="list-card">
              <div className="list-card-top">
                <strong>Delivery Readout</strong>
                <span className="pill subtle">Snapshot</span>
              </div>
              <p>
                Pick a team card to inspect its current work queue. This makes the teams view usable
                as an execution drill-down instead of just a summary board.
              </p>
            </article>

            <article className="list-card compact-metrics">
              <div className="list-card-top">
                <strong>Completion Ratio</strong>
                <span className="pill subtle">
                  {totals.workItems ? Math.round((totals.completed / totals.workItems) * 100) : 0}%
                </span>
              </div>
              <p>Share of work items already marked complete across all teams.</p>
            </article>
            <article className="list-card compact-metrics">
              <div className="list-card-top">
                <strong>Execution Pressure</strong>
                <span className="pill subtle">
                  {totals.workItems ? Math.round((totals.inProgress / totals.workItems) * 100) : 0}%
                </span>
              </div>
              <p>Share of workload currently active and moving through execution.</p>
            </article>
            <article className="list-card compact-metrics">
              <div className="list-card-top">
                <strong>Blocker Rate</strong>
                <span className="pill subtle">
                  {totals.workItems ? Math.round((totals.blocked / totals.workItems) * 100) : 0}%
                </span>
              </div>
              <p>Share of workload that is currently stalled and likely needs intervention.</p>
            </article>

            {teamsLoading ? <p className="muted">Loading team work queue...</p> : null}
            {!teamsLoading && selectedTeam && teamWorkItems.length === 0 ? (
              <p className="muted">No work items assigned to {selectedTeam} yet.</p>
            ) : null}
            {!teamsLoading
              ? teamWorkItems.map((item) => (
                  <TeamWorkItemCard key={item.id} item={item} onSelectTask={onSelectTask} />
                ))
              : null}
            {!selectedTeam && !teamsLoading ? (
              <p className="muted">Select a team to inspect assigned work items.</p>
            ) : null}
            <article className="list-card">
              <div className="list-card-top">
                <strong>Owned Tasks</strong>
                <span className="pill subtle">{totals.owned}</span>
              </div>
              <p>Tasks currently attributed to explicit teams in the control plane.</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}

function TeamWorkItemCard({
  item,
  onSelectTask,
}: {
  item: WorkItem;
  onSelectTask: (taskId: string) => void;
}) {
  return (
    <article
      className={`list-card queue-card queue-${item.status.toLowerCase()}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelectTask(item.task_id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectTask(item.task_id);
        }
      }}
    >
      <div className="list-card-top">
        <strong>{item.title}</strong>
        <span className="pill subtle">{item.status}</span>
      </div>
      <p>{summarizeText(item.description || "No description recorded yet.")}</p>
      <div className="team-metrics">
        <span>Task: {item.task_id}</span>
        <span>Priority: {item.priority}</span>
        <span>Updated: {formatDate(item.updated_at)}</span>
      </div>
      {item.block_reason ? <small>Blocker: {item.block_reason}</small> : null}
    </article>
  );
}
