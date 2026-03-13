import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { AttentionPage } from "./pages/AttentionPage";
import { BoardPage } from "./pages/BoardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { TeamsPage } from "./pages/TeamsPage";
import { useControlPlane } from "./hooks/useControlPlane";
import { useI18n } from "./i18n";

function RoutedApp() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const controlPlane = useControlPlane(taskId, (nextTaskId) => navigate(`/tasks/${nextTaskId}`));
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <Sidebar
        summary={controlPlane.summary}
        attention={controlPlane.attention}
        tasks={controlPlane.tasks}
        selectedTaskId={taskId ?? ""}
        loading={controlPlane.loading}
        creatingTask={controlPlane.creatingTask}
        taskForm={controlPlane.taskForm}
        actorContext={controlPlane.actorContext}
        onRefresh={controlPlane.loadOverview}
        onSelectTask={(selectedId) => navigate(`/tasks/${selectedId}`)}
        onTaskFormChange={controlPlane.setTaskForm}
        onActorContextChange={controlPlane.setActorContext}
        onCreateTask={controlPlane.handleCreateTask}
      />

      <main className="main-content">
        <header className="main-header">
          <div>
            <p className="eyebrow">companyagents</p>
            <h2>{controlPlane.bundle?.task.title ?? t("app.workflowDashboard")}</h2>
          </div>
          <div className="header-meta">
            <nav className="nav-row">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                {t("nav.board")}
              </NavLink>
              <NavLink to="/attention" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                {t("nav.attention")}
              </NavLink>
              <NavLink to="/teams" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                {t("nav.teams")}
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                {t("nav.settings")}
              </NavLink>
              {taskId ? (
                <NavLink
                  to={`/tasks/${taskId}`}
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                >
                  {t("nav.taskDetail")}
                </NavLink>
              ) : null}
            </nav>
            {controlPlane.notice ? <span className="notice">{controlPlane.notice}</span> : null}
            {controlPlane.error ? <span className="error">{controlPlane.error}</span> : null}
          </div>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <BoardPage
                summary={controlPlane.summary}
                attention={controlPlane.attention}
                tasks={controlPlane.tasks}
                runtime={controlPlane.runtime}
                runtimeBusy={controlPlane.runtimeBusy}
                recentActivity={controlPlane.recentActivity}
                onRunRuntimeControl={controlPlane.runRuntimeControl}
                onSelectTask={(selectedId) => navigate(`/tasks/${selectedId}`)}
              />
            }
          />
          <Route
            path="/attention"
            element={
              <AttentionPage
                attention={controlPlane.attention}
                recentActivity={controlPlane.recentActivity}
                onSelectTask={(selectedId) => navigate(`/tasks/${selectedId}`)}
              />
            }
          />
          <Route
            path="/teams"
            element={
              <TeamsPage
                teams={controlPlane.teams}
                selectedTeam={controlPlane.selectedTeam}
                teamWorkItems={controlPlane.teamWorkItems}
                teamsLoading={controlPlane.teamsLoading}
                onSelectTeam={controlPlane.selectTeam}
                onSelectTask={(selectedId) => navigate(`/tasks/${selectedId}`)}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                actorContext={controlPlane.actorContext}
                runtime={controlPlane.runtime}
                runtimeBusy={controlPlane.runtimeBusy}
                onActorContextChange={controlPlane.setActorContext}
                onRunRuntimeControl={controlPlane.runRuntimeControl}
              />
            }
          />
          <Route
            path="/tasks/:taskId"
            element={
              <TaskDetailPage
                bundle={controlPlane.bundle}
                detailLoading={controlPlane.detailLoading}
                creatingPlan={controlPlane.creatingPlan}
                creatingWorkItems={controlPlane.creatingWorkItems}
                updatingWorkItem={controlPlane.updatingWorkItem}
                creatingArtifact={controlPlane.creatingArtifact}
                taskRuntimeBusy={controlPlane.taskRuntimeBusy}
                planForm={controlPlane.planForm}
                workItemForm={controlPlane.workItemForm}
                progressForm={controlPlane.progressForm}
                artifactForm={controlPlane.artifactForm}
                supervisorForm={controlPlane.supervisorForm}
                runningAction={controlPlane.runningAction}
                onAction={controlPlane.runAction}
                onTaskRuntimeAction={controlPlane.runTaskRuntimeControl}
                onPlanFormChange={controlPlane.setPlanForm}
                onWorkItemFormChange={controlPlane.setWorkItemForm}
                onProgressFormChange={controlPlane.setProgressForm}
                onArtifactFormChange={controlPlane.setArtifactForm}
                onSupervisorFormChange={controlPlane.setSupervisorForm}
                onCreatePlan={controlPlane.handleCreatePlan}
                onCreateWorkItem={controlPlane.handleCreateWorkItem}
                onUpdateWorkItemProgress={controlPlane.handleUpdateWorkItemProgress}
                onCreateArtifact={controlPlane.handleCreateArtifact}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<RoutedApp />} />
      </Routes>
    </BrowserRouter>
  );
}
