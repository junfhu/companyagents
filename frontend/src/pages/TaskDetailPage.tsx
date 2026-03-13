import type { FormEvent } from "react";

import type { TaskBundle } from "../types";
import {
  ArtifactFormPanel,
  ArtifactsPanel,
  DetailAction,
  PlanFormPanel,
  PlanPanel,
  ReviewsPanel,
  SupervisorPanel,
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
  WorkItemFormState,
} from "../hooks/useControlPlane";

export function TaskDetailPage({
  bundle,
  detailLoading,
  creatingPlan,
  creatingWorkItems,
  updatingWorkItem,
  creatingArtifact,
  planForm,
  workItemForm,
  progressForm,
  artifactForm,
  onAction,
  onPlanFormChange,
  onWorkItemFormChange,
  onProgressFormChange,
  onArtifactFormChange,
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
  planForm: PlanFormState;
  workItemForm: WorkItemFormState;
  progressForm: ProgressFormState;
  artifactForm: ArtifactFormState;
  onAction: (action: DetailAction) => void | Promise<void>;
  onPlanFormChange: (updater: (current: PlanFormState) => PlanFormState) => void;
  onWorkItemFormChange: (updater: (current: WorkItemFormState) => WorkItemFormState) => void;
  onProgressFormChange: (updater: (current: ProgressFormState) => ProgressFormState) => void;
  onArtifactFormChange: (updater: (current: ArtifactFormState) => ArtifactFormState) => void;
  onCreatePlan: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCreateWorkItem: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onUpdateWorkItemProgress: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCreateArtifact: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  if (!bundle) {
    return (
      <section className="empty-state panel">
        <h3>No task selected</h3>
        <p>Choose a task from the sidebar to inspect its plan, execution, and outputs.</p>
      </section>
    );
  }

  return (
    <div className="detail-grid">
      <TaskHeroPanel task={bundle.task} onAction={onAction} />
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
      <TimelinePanel activity={bundle.activity} detailLoading={detailLoading} />
      <ArtifactsPanel artifacts={bundle.artifacts} />
      <ArtifactFormPanel
        workItems={bundle.work_items}
        value={artifactForm}
        creating={creatingArtifact}
        onChange={onArtifactFormChange}
        onSubmit={onCreateArtifact}
      />
      <SupervisorPanel task={bundle.task} interventions={bundle.interventions} />
    </div>
  );
}
