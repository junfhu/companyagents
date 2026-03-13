import type { FormEvent } from "react";

import type { TaskBundle } from "../types";
import {
  ArtifactFormPanel,
  ArtifactsPanel,
  DetailAction,
  PlanFormPanel,
  PlanPanel,
  ReviewsPanel,
  RuntimeTaskAuditPanel,
  SupervisorPanel,
  TaskRuntimeAction,
  TaskHeroPanel,
  TimelinePanel,
  WorkItemFormPanel,
  WorkItemProgressPanel,
  WorkItemsPanel,
} from "../components/TaskDetailPanels";
import type {
  ArtifactFormState,
  PlanFormState,
  ProgressFormState,
  SupervisorFormState,
  WorkItemFormState,
} from "../hooks/useControlPlane";
import { useI18n } from "../i18n";

export function TaskDetailPage({
  bundle,
  detailLoading,
  creatingPlan,
  creatingWorkItems,
  updatingWorkItem,
  creatingArtifact,
  taskRuntimeBusy,
  planForm,
  workItemForm,
  progressForm,
  artifactForm,
  supervisorForm,
  runningAction,
  onAction,
  onTaskRuntimeAction,
  onPlanFormChange,
  onWorkItemFormChange,
  onProgressFormChange,
  onArtifactFormChange,
  onSupervisorFormChange,
  onCreatePlan,
  onCreateWorkItem,
  onUpdateWorkItemProgress,
  onCreateArtifact,
}: {
  bundle: TaskBundle | null;
  detailLoading: boolean;
  creatingPlan: boolean;
  creatingWorkItems: boolean;
  updatingWorkItem: boolean;
  creatingArtifact: boolean;
  taskRuntimeBusy: boolean;
  planForm: PlanFormState;
  workItemForm: WorkItemFormState;
  progressForm: ProgressFormState;
  artifactForm: ArtifactFormState;
  supervisorForm: SupervisorFormState;
  runningAction: DetailAction | "";
  onAction: (action: DetailAction, request?: { reason?: string; actorId?: string }) => void | Promise<void>;
  onTaskRuntimeAction: (action: TaskRuntimeAction) => void | Promise<void>;
  onPlanFormChange: (updater: (current: PlanFormState) => PlanFormState) => void;
  onWorkItemFormChange: (updater: (current: WorkItemFormState) => WorkItemFormState) => void;
  onProgressFormChange: (updater: (current: ProgressFormState) => ProgressFormState) => void;
  onArtifactFormChange: (updater: (current: ArtifactFormState) => ArtifactFormState) => void;
  onSupervisorFormChange: (updater: (current: SupervisorFormState) => SupervisorFormState) => void;
  onCreatePlan: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCreateWorkItem: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onUpdateWorkItemProgress: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCreateArtifact: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  const { t } = useI18n();
  if (!bundle) {
    return (
      <section className="empty-state panel">
        <h3>{t("taskDetail.noTaskSelected")}</h3>
        <p>{t("taskDetail.noTaskSelectedCopy")}</p>
      </section>
    );
  }

  return (
    <div className="detail-grid">
      <TaskHeroPanel
        task={bundle.task}
        onAction={onAction}
        taskRuntimeBusy={taskRuntimeBusy}
        onTaskRuntimeAction={onTaskRuntimeAction}
      />
      <PlanPanel task={bundle.task} plan={bundle.plan} />
      <PlanFormPanel
        value={planForm}
        creating={creatingPlan}
        hasTask={Boolean(bundle.task)}
        onChange={onPlanFormChange}
        onSubmit={onCreatePlan}
      />
      <WorkItemsPanel workItems={bundle.work_items} />
      <WorkItemFormPanel
        value={workItemForm}
        creating={creatingWorkItems}
        hasPlan={Boolean(bundle.plan)}
        onChange={onWorkItemFormChange}
        onSubmit={onCreateWorkItem}
      />
      <WorkItemProgressPanel
        workItems={bundle.work_items}
        value={progressForm}
        updating={updatingWorkItem}
        onChange={onProgressFormChange}
        onSubmit={onUpdateWorkItemProgress}
      />
      <ReviewsPanel reviews={bundle.reviews} />
      <RuntimeTaskAuditPanel
        activity={bundle.activity}
        workItems={bundle.work_items}
        artifacts={bundle.artifacts}
        interventions={bundle.interventions}
      />
      <TimelinePanel activity={bundle.activity} detailLoading={detailLoading} />
      <ArtifactsPanel artifacts={bundle.artifacts} />
      <ArtifactFormPanel
        workItems={bundle.work_items}
        value={artifactForm}
        creating={creatingArtifact}
        onChange={onArtifactFormChange}
        onSubmit={onCreateArtifact}
      />
      <SupervisorPanel
        task={bundle.task}
        interventions={bundle.interventions}
        value={supervisorForm}
        runningAction={runningAction}
        onChange={onSupervisorFormChange}
        onAction={onAction}
      />
    </div>
  );
}
