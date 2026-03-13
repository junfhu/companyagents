import type { TeamOverview, WorkItem } from "../types";
import { formatDate, summarizeText } from "../utils";
import { translatePriority, translateWorkItemStatus, useI18n } from "../i18n";

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
  const { language, t } = useI18n();
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
        <p className="eyebrow">{t("teams.eyebrow")}</p>
        <h2>{t("nav.teams")}</h2>
        <p className="summary-copy">{t("teams.summary")}</p>
        <div className="stats-grid wide">
          <article className="stat-card">
            <span>{t("teams.teams")}</span>
            <strong>{teams.length}</strong>
          </article>
          <article className="stat-card">
            <span>{t("teams.workItems")}</span>
            <strong>{totals.workItems}</strong>
          </article>
          <article className="stat-card">
            <span>{t("teams.inProgress")}</span>
            <strong>{totals.inProgress}</strong>
          </article>
          <article className="stat-card">
            <span>{t("teams.blocked")}</span>
            <strong>{totals.blocked}</strong>
          </article>
        </div>
      </section>

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>{t("teams.teamLoad")}</h3>
            <span className="muted">{teams.length}</span>
          </div>
          <div className="stack">
            {teams.length === 0 ? <p className="muted">{t("teams.noTeamWorkload")}</p> : null}
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
                  <span className="pill subtle">{team.work_items_total} {t("teams.workItemsSuffix")}</span>
                </div>
                <div className="team-metrics">
                  <span>{t("teams.inProgressLabel")}: {team.work_items_in_progress}</span>
                  <span>{t("teams.blockedLabel")}: {team.work_items_blocked}</span>
                  <span>{t("teams.completedLabel")}: {team.work_items_completed}</span>
                  <span>{t("teams.tasksOwned")}: {team.tasks_owned}</span>
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
                    ? t("teams.teamNeedsAttention")
                    : t("teams.teamNoBlockers")}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>{t("teams.teamWorkQueue")}</h3>
            <span className="muted">{selectedTeam || t("teams.selectTeam")}</span>
          </div>
          <div className="stack">
            <article className="list-card">
              <div className="list-card-top">
                <strong>{t("teams.deliveryReadout")}</strong>
                <span className="pill subtle">{t("teams.snapshot")}</span>
              </div>
              <p>{t("teams.deliveryReadoutCopy")}</p>
            </article>

            <article className="list-card compact-metrics">
              <div className="list-card-top">
                <strong>{t("teams.completionRatio")}</strong>
                <span className="pill subtle">
                  {totals.workItems ? Math.round((totals.completed / totals.workItems) * 100) : 0}%
                </span>
              </div>
              <p>{t("teams.completionRatioCopy")}</p>
            </article>
            <article className="list-card compact-metrics">
              <div className="list-card-top">
                <strong>{t("teams.executionPressure")}</strong>
                <span className="pill subtle">
                  {totals.workItems ? Math.round((totals.inProgress / totals.workItems) * 100) : 0}%
                </span>
              </div>
              <p>{t("teams.executionPressureCopy")}</p>
            </article>
            <article className="list-card compact-metrics">
              <div className="list-card-top">
                <strong>{t("teams.blockerRate")}</strong>
                <span className="pill subtle">
                  {totals.workItems ? Math.round((totals.blocked / totals.workItems) * 100) : 0}%
                </span>
              </div>
              <p>{t("teams.blockerRateCopy")}</p>
            </article>

            {teamsLoading ? <p className="muted">{t("teams.loadingTeamQueue")}</p> : null}
            {!teamsLoading && selectedTeam && teamWorkItems.length === 0 ? (
              <p className="muted">{selectedTeam} {t("teams.noAssignedItems")}</p>
            ) : null}
            {!teamsLoading
              ? teamWorkItems.map((item) => (
                  <TeamWorkItemCard key={item.id} item={item} onSelectTask={onSelectTask} />
                ))
              : null}
            {!selectedTeam && !teamsLoading ? (
              <p className="muted">{t("teams.selectTeamHint")}</p>
            ) : null}
            <article className="list-card">
              <div className="list-card-top">
                <strong>{t("teams.ownedTasks")}</strong>
                <span className="pill subtle">{totals.owned}</span>
              </div>
              <p>{t("teams.ownedTasksCopy")}</p>
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
  const { language, t } = useI18n();
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
        <span className="pill subtle">{translateWorkItemStatus(language, item.status)}</span>
      </div>
      <p>{summarizeText(item.description || t("teams.noDescription"))}</p>
      <div className="team-metrics">
        <span>{t("common.task")}: {item.task_id}</span>
        <span>{t("common.priority")}: {translatePriority(language, item.priority)}</span>
        <span>{t("common.updated")}: {formatDate(item.updated_at)}</span>
      </div>
      {item.block_reason ? <small>{t("common.blocker")}: {item.block_reason}</small> : null}
    </article>
  );
}
