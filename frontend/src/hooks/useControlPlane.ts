import { useEffect, useRef, useState } from "react";

import { createArtifact } from "../api/artifacts";
import { fetchDashboardAttention, fetchDashboardBundle } from "../api/dashboard";
import { createPlan, submitForReview } from "../api/plans";
import { fetchTeamWorkItems } from "../api/teams";
import {
  approveTask,
  createTask,
  escalateTask,
  fetchTaskBundle,
  fetchTasks,
  pauseTask,
  qualifyTask,
  rejectTask,
  replanTask,
  requestChanges,
  resumeTask,
  retryTask,
  rollbackTask,
} from "../api/tasks";
import { updateWorkItemProgress } from "../api/workItemProgress";
import { createWorkItems } from "../api/workItems";
import { openGlobalSocket, openTaskSocket } from "../api/ws";
import type {
  ActivityEvent,
  AttentionQueues,
  DashboardSummary,
  Task,
  TaskBundle,
  TeamOverview,
  WorkItem,
} from "../types";
import type { DetailAction } from "../components/TaskDetailPanels";

export type TaskFormState = {
  title: string;
  summary: string;
  priority: string;
  requester: string;
  tags: string;
};

export type PlanFormState = {
  goal: string;
  acceptance: string;
  teams: string;
  scope: string;
  risks: string;
  notes: string;
  estimatedEffort: string;
};

export type WorkItemFormState = {
  title: string;
  description: string;
  assignedTeam: string;
  priority: string;
  acceptance: string;
};

export type ProgressFormState = {
  workItemId: string;
  status: string;
  summary: string;
  progressPercent: string;
  blockReason: string;
  actorRole: string;
};

export type ArtifactFormState = {
  workItemId: string;
  type: string;
  name: string;
  path: string;
  summary: string;
  createdByRole: string;
};

export function useControlPlane(taskId: string | undefined, navigateToTask: (taskId: string) => void) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attention, setAttention] = useState<AttentionQueues | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bundle, setBundle] = useState<TaskBundle | null>(null);
  const [teams, setTeams] = useState<TeamOverview[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamWorkItems, setTeamWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [creatingWorkItems, setCreatingWorkItems] = useState(false);
  const [updatingWorkItem, setUpdatingWorkItem] = useState(false);
  const [creatingArtifact, setCreatingArtifact] = useState(false);
  const selectedTeamRef = useRef("");
  const overviewRefreshTimer = useRef<number | null>(null);
  const bundleRefreshTimer = useRef<number | null>(null);
  const teamRefreshTimer = useRef<number | null>(null);

  const [taskForm, setTaskForm] = useState<TaskFormState>({
    title: "",
    summary: "",
    priority: "normal",
    requester: "",
    tags: "",
  });
  const [planForm, setPlanForm] = useState<PlanFormState>({
    goal: "",
    acceptance: "",
    teams: "",
    scope: "",
    risks: "",
    notes: "",
    estimatedEffort: "",
  });
  const [workItemForm, setWorkItemForm] = useState<WorkItemFormState>({
    title: "",
    description: "",
    assignedTeam: "Engineering",
    priority: "normal",
    acceptance: "",
  });
  const [progressForm, setProgressForm] = useState<ProgressFormState>({
    workItemId: "",
    status: "InProgress",
    summary: "",
    progressPercent: "50",
    blockReason: "",
    actorRole: "EngineeringTeam",
  });
  const [artifactForm, setArtifactForm] = useState<ArtifactFormState>({
    workItemId: "",
    type: "document",
    name: "",
    path: "",
    summary: "",
    createdByRole: "EngineeringTeam",
  });

  async function loadOverview(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
    }
    setError("");
    try {
      const [dashboardData, taskData] = await Promise.all([fetchDashboardBundle(), fetchTasks()]);
      setSummary(dashboardData.summary);
      setTasks(taskData.items);
      setAttention(dashboardData.attention);
      setRecentActivity(dashboardData.recent_activity);
      void fetchDashboardAttention().then(setAttention).catch(() => {});
      setTeams(dashboardData.teams);
      const nextTeam =
        dashboardData.teams.find((team) => team.name === selectedTeam)?.name ??
        dashboardData.teams[0]?.name ??
        "";
      setSelectedTeam(nextTeam);
      if (nextTeam) {
        const workload = await fetchTeamWorkItems(nextTeam);
        setTeamWorkItems(workload.items);
      } else {
        setTeamWorkItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  async function selectTeam(teamName: string) {
    setSelectedTeam(teamName);
    if (!teamName) {
      setTeamWorkItems([]);
      return;
    }
    setTeamsLoading(true);
    setError("");
    try {
      const workload = await fetchTeamWorkItems(teamName);
      setTeamWorkItems(workload.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team work items");
    } finally {
      setTeamsLoading(false);
    }
  }

  async function loadBundle(currentTaskId: string, options?: { silent?: boolean }) {
    if (!currentTaskId) {
      setBundle(null);
      return;
    }
    if (!options?.silent) {
      setDetailLoading(true);
    }
    try {
      const data = await fetchTaskBundle(currentTaskId);
      setBundle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task detail");
    } finally {
      if (!options?.silent) {
        setDetailLoading(false);
      }
    }
  }

  function scheduleOverviewRefresh() {
    if (overviewRefreshTimer.current !== null) {
      window.clearTimeout(overviewRefreshTimer.current);
    }
    overviewRefreshTimer.current = window.setTimeout(() => {
      overviewRefreshTimer.current = null;
      void loadOverview({ silent: true });
    }, 250);
  }

  function scheduleBundleRefresh(currentTaskId: string) {
    if (bundleRefreshTimer.current !== null) {
      window.clearTimeout(bundleRefreshTimer.current);
    }
    bundleRefreshTimer.current = window.setTimeout(() => {
      bundleRefreshTimer.current = null;
      void loadBundle(currentTaskId, { silent: true });
    }, 200);
  }

  function scheduleSelectedTeamRefresh() {
    const currentTeam = selectedTeamRef.current;
    if (!currentTeam) return;
    if (teamRefreshTimer.current !== null) {
      window.clearTimeout(teamRefreshTimer.current);
    }
    teamRefreshTimer.current = window.setTimeout(() => {
      teamRefreshTimer.current = null;
      void selectTeam(currentTeam);
    }, 300);
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    const socket = openGlobalSocket(() => {
      scheduleOverviewRefresh();
      scheduleSelectedTeamRefresh();
    });
    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (taskId) {
      void loadBundle(taskId);
    } else {
      setBundle(null);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    const socket = openTaskSocket(taskId, () => {
      scheduleBundleRefresh(taskId);
      scheduleOverviewRefresh();
    });
    return () => {
      socket.close();
    };
  }, [taskId]);

  useEffect(() => {
    selectedTeamRef.current = selectedTeam;
  }, [selectedTeam]);

  useEffect(() => {
    return () => {
      if (overviewRefreshTimer.current !== null) {
        window.clearTimeout(overviewRefreshTimer.current);
      }
      if (bundleRefreshTimer.current !== null) {
        window.clearTimeout(bundleRefreshTimer.current);
      }
      if (teamRefreshTimer.current !== null) {
        window.clearTimeout(teamRefreshTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    setProgressForm((current) => ({
      ...current,
      workItemId: bundle?.work_items[0]?.id ?? "",
    }));
    setArtifactForm((current) => ({
      ...current,
      workItemId: bundle?.work_items[0]?.id ?? "",
    }));
  }, [bundle?.task.id, bundle?.work_items]);

  async function runAction(action: DetailAction) {
    if (!bundle?.task) return;
    setNotice("");
    setError("");
    const currentTaskId = bundle.task.id;
    const planVersion = bundle.plan?.version ?? bundle.task.current_plan_version;
    try {
      if (action === "approve") await approveTask(currentTaskId, planVersion);
      if (action === "request-changes") await requestChanges(currentTaskId, planVersion);
      if (action === "reject") await rejectTask(currentTaskId, planVersion);
      if (action === "pause") await pauseTask(currentTaskId);
      if (action === "resume") await resumeTask(currentTaskId);
      if (action === "retry") await retryTask(currentTaskId);
      if (action === "rollback") await rollbackTask(currentTaskId);
      if (action === "escalate") await escalateTask(currentTaskId);
      if (action === "replan") await replanTask(currentTaskId);
      setNotice(`Action completed: ${action}`);
      await loadOverview();
      await loadBundle(currentTaskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    }
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskForm.title.trim()) {
      setError("Task title is required");
      return;
    }
    setCreatingTask(true);
    setError("");
    setNotice("");
    try {
      const created = await createTask({
        title: taskForm.title.trim(),
        summary: taskForm.summary.trim(),
        priority: taskForm.priority,
        request_type: "project_request",
        source: "dashboard",
        requester: taskForm.requester.trim(),
        tags: taskForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
        meta: {},
      });
      await qualifyTask(created.task_id, taskForm.summary.trim() || undefined);
      setTaskForm({
        title: "",
        summary: "",
        priority: "normal",
        requester: "",
        tags: "",
      });
      setNotice(`Created and qualified ${created.task_id}`);
      await loadOverview();
      navigateToTask(created.task_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleCreatePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bundle?.task) return;
    if (!planForm.goal.trim()) {
      setError("Plan goal is required");
      return;
    }
    setCreatingPlan(true);
    setError("");
    setNotice("");
    try {
      const created = await createPlan(bundle.task.id, {
        goal: planForm.goal.trim(),
        scope: planForm.scope.split("\n").map((item) => item.trim()).filter(Boolean),
        out_of_scope: [],
        acceptance_criteria: planForm.acceptance
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        required_teams: planForm.teams.split(",").map((item) => item.trim()).filter(Boolean),
        estimated_effort: planForm.estimatedEffort.trim(),
        risks: planForm.risks.split("\n").map((item) => item.trim()).filter(Boolean),
        assumptions: [],
        notes: planForm.notes.trim(),
        created_by_id: "pm-ui",
      });
      await submitForReview(bundle.task.id, created.version);
      setPlanForm({
        goal: "",
        acceptance: "",
        teams: "",
        scope: "",
        risks: "",
        notes: "",
        estimatedEffort: "",
      });
      setNotice(`Plan v${created.version} created and submitted for review`);
      await loadOverview();
      await loadBundle(bundle.task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setCreatingPlan(false);
    }
  }

  async function handleCreateWorkItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bundle?.task || !bundle.plan?.version) {
      setError("Create a plan before adding work items");
      return;
    }
    if (!workItemForm.title.trim()) {
      setError("Work item title is required");
      return;
    }
    setCreatingWorkItems(true);
    setError("");
    setNotice("");
    try {
      await createWorkItems(bundle.task.id, {
        plan_version: bundle.plan.version,
        created_by_id: "delivery-ui",
        items: [
          {
            title: workItemForm.title.trim(),
            description: workItemForm.description.trim(),
            assigned_team: workItemForm.assignedTeam,
            priority: workItemForm.priority,
            acceptance_criteria: workItemForm.acceptance
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
            sort_order: bundle.work_items.length + 1,
            meta: {},
          },
        ],
      });
      setWorkItemForm({
        title: "",
        description: "",
        assignedTeam: "Engineering",
        priority: "normal",
        acceptance: "",
      });
      setNotice("Work item created and dispatched");
      await loadOverview();
      await loadBundle(bundle.task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create work item");
    } finally {
      setCreatingWorkItems(false);
    }
  }

  async function handleUpdateWorkItemProgress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bundle?.task || !progressForm.workItemId) {
      setError("Select a work item first");
      return;
    }
    setUpdatingWorkItem(true);
    setError("");
    setNotice("");
    try {
      await updateWorkItemProgress(progressForm.workItemId, {
        status: progressForm.status,
        summary: progressForm.summary.trim(),
        progress_percent: progressForm.progressPercent.trim() === "" ? null : Number(progressForm.progressPercent),
        block_reason: progressForm.blockReason.trim(),
        actor_id: "execution-ui",
        actor_role: progressForm.actorRole,
        meta: {},
      });
      setNotice(`Updated ${progressForm.workItemId} to ${progressForm.status}`);
      setProgressForm((current) => ({ ...current, summary: "", blockReason: "" }));
      await loadOverview();
      await loadBundle(bundle.task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update work item progress");
    } finally {
      setUpdatingWorkItem(false);
    }
  }

  async function handleCreateArtifact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bundle?.task) return;
    if (!artifactForm.name.trim() || !artifactForm.path.trim()) {
      setError("Artifact name and path are required");
      return;
    }
    setCreatingArtifact(true);
    setError("");
    setNotice("");
    try {
      await createArtifact(bundle.task.id, {
        work_item_id: artifactForm.workItemId || null,
        type: artifactForm.type,
        name: artifactForm.name.trim(),
        path_or_url: artifactForm.path.trim(),
        summary: artifactForm.summary.trim(),
        version: 1,
        created_by_role: artifactForm.createdByRole,
        created_by_id: "artifact-ui",
        meta: {},
      });
      setArtifactForm((current) => ({ ...current, name: "", path: "", summary: "" }));
      setNotice("Artifact created");
      await loadOverview();
      await loadBundle(bundle.task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create artifact");
    } finally {
      setCreatingArtifact(false);
    }
  }

  return {
    summary,
    attention,
    tasks,
    bundle,
    teams,
    recentActivity,
    selectedTeam,
    teamWorkItems,
    loading,
    detailLoading,
    teamsLoading,
    error,
    notice,
    creatingTask,
    creatingPlan,
    creatingWorkItems,
    updatingWorkItem,
    creatingArtifact,
    taskForm,
    planForm,
    workItemForm,
    progressForm,
    artifactForm,
    setTaskForm,
    setPlanForm,
    setWorkItemForm,
    setProgressForm,
    setArtifactForm,
    loadOverview,
    selectTeam,
    runAction,
    handleCreateTask,
    handleCreatePlan,
    handleCreateWorkItem,
    handleUpdateWorkItemProgress,
    handleCreateArtifact,
  };
}
