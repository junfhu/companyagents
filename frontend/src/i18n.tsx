import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "zh-CN" | "en";

const STORAGE_KEY = "companyagents.language";

const dictionaries = {
  "zh-CN": {
    common: {
      refresh: "刷新",
      loading: "加载中...",
      noSummary: "暂无摘要。",
      runtime: "Runtime",
      runtimeBadge: "Runtime",
      active: "运行中",
      idle: "空闲",
      runNow: "立即执行",
      pause: "暂停",
      resume: "恢复",
      running: "运行中...",
      workerEnabled: "Worker 已启用",
      workerDisabled: "Worker 已停用",
      loop: "循环",
      poll: "轮询",
      escalateAfter: "升级阈值",
      lastRun: "最近运行",
      never: "从未",
      working: "处理中...",
      generated: "生成",
      dispatched: "派发",
      readyToReport: "待出报告",
      completed: "已完成",
      escalated: "已升级",
      runtimeAudit: "Runtime 审计",
      runtimeEvents: "Runtime 事件",
      generatedItems: "自动生成项",
      runtimeArtifacts: "Runtime Artifact",
      escalations: "升级次数",
      noRuntimeActions: "暂未记录 runtime 动作。",
      affectedWorkItems: "影响的工作项",
      completedWithArtifact: "已附带 Artifact 完成",
      affectedWorkItem: "影响的工作项",
      loadingRuntimeStatus: "正在加载 runtime 状态...",
      actorId: "Actor ID",
      unset: "未设置",
      create: "创建",
      submit: "提交",
      update: "更新",
      noEventsYet: "暂无事件。",
      noArtifactsYet: "暂无 Artifact。",
      noReviewsYet: "暂无评审。",
      noWorkItemsYet: "暂无工作项。",
      noPlanYet: "暂无计划。",
      noInterventionsYet: "暂无干预记录。",
      policyAwareControls: "策略感知控制",
      allInterventions: "全部干预",
      owner: "负责人",
      priority: "优先级",
      updated: "更新时间",
      team: "团队",
      blocker: "阻塞原因",
      task: "任务",
      state: "状态",
      role: "角色",
      language: "语言",
      chinese: "中文",
      english: "English",
      systemActivity: "系统活动",
      recentActivity: "最近活动",
      noRecentSystemActivity: "暂无系统活动。",
    },
    nav: {
      board: "看板",
      attention: "关注",
      teams: "团队",
      settings: "设置",
      taskDetail: "任务详情",
    },
    app: {
      workflowDashboard: "工作流控制台",
      companyagents: "companyagents",
    },
    sidebar: {
      controlPlane: "控制面",
      operator: "操作身份",
      summary: "概览",
      newTask: "新建任务",
      intake: "需求入口",
      writeActionHint: "所有写操作都会带上这些请求头，后端会据此执行角色权限校验。",
      taskTitle: "任务标题",
      taskSummary: "任务摘要",
      requester: "请求人",
      tags: "标签，逗号分隔",
      createTask: "创建任务",
      creatingTask: "创建中...",
      attention: "关注队列",
      tasks: "任务列表",
      loadingAttention: "正在加载关注队列...",
      loadingTasks: "正在加载任务...",
      noTasks: "暂无任务。",
      blockedFallback: "需要解除阻塞。",
      reviewFallback: "待评审任务。",
      priorityFallback: "高优先级任务。",
    },
    board: {
      eyebrow: "工作流总览",
      title: "看板",
      summary:
        "这里是交付系统的总控视图。你可以通过侧栏创建任务、跳转任务详情，并在下面的卡片里快速看到当前最需要关注的事项。",
      tasksTotal: "任务总数",
      active: "活跃任务",
      blocked: "阻塞任务",
      teamsActive: "活跃团队",
      reviewQueue: "评审队列",
      highPriority: "高优先级",
      recentlyActive: "最近活跃",
      blockedNow: "当前阻塞",
      needsReview: "待评审",
      priorityRadar: "优先级雷达",
      noActiveTasks: "暂无活跃任务。",
      noBlockedTasks: "当前没有阻塞任务。",
      noReviewQueue: "当前没有评审排队。",
      noPriorityTasks: "当前没有高优先级任务。",
    },
    attention: {
      eyebrow: "运营关注",
      title: "关注",
      summary: "这里聚焦通常需要人工先处理的队列：阻塞任务、评审积压、高优先级项，以及最近变化的任务。",
      blocked: "阻塞",
      stalled: "停滞",
      needsReview: "待评审",
      priority: "优先级",
      recentlyActive: "最近活跃",
      blockedQueue: "阻塞队列",
      stalledBlockers: "停滞阻塞",
      reviewQueue: "评审队列",
      priorityQueue: "优先级队列",
      recentChanges: "最近变化",
      noReviewWork: "暂无待评审工作。",
      noPriorityWork: "暂无高优先级任务。",
      noRecentTaskActivity: "暂无最近任务活动。",
      noStalled: "当前没有长时间阻塞的任务。",
    },
    teams: {
      eyebrow: "运营视图",
      title: "团队",
      summary: "这个视图用来观察执行如何分布到各个团队，以及哪些地方开始出现阻塞。",
      teams: "团队数",
      workItems: "工作项",
      inProgress: "进行中",
      blocked: "阻塞中",
      teamLoad: "团队负载",
      noTeamWorkload: "暂无团队负载数据。",
      workItemsSuffix: "个工作项",
      inProgressLabel: "进行中",
      blockedLabel: "阻塞中",
      completedLabel: "已完成",
      tasksOwned: "所属任务",
      teamNeedsAttention: "需要关注：该团队当前存在阻塞工作。",
      teamNoBlockers: "该团队当前没有记录中的阻塞项。",
      teamWorkQueue: "团队工作队列",
      selectTeam: "请选择一个团队",
      deliveryReadout: "交付读数",
      snapshot: "快照",
      deliveryReadoutCopy: "点击团队卡片查看该团队当前工作队列，让团队页从总览延伸到执行排查。",
      completionRatio: "完成率",
      completionRatioCopy: "所有团队中已标记完成的工作项占比。",
      executionPressure: "执行压力",
      executionPressureCopy: "当前正在推进执行的工作占比。",
      blockerRate: "阻塞率",
      blockerRateCopy: "当前停滞且可能需要干预的工作占比。",
      loadingTeamQueue: "正在加载团队工作队列...",
      noAssignedItems: "该团队目前还没有分配的工作项。",
      selectTeamHint: "选择一个团队以查看其分配的工作项。",
      ownedTasks: "归属任务",
      ownedTasksCopy: "当前控制面中明确归属到某个团队的任务数量。",
      noDescription: "暂无描述。",
    },
    settings: {
      eyebrow: "配置",
      title: "设置",
      summary: "在这里切换操作身份、查看 runtime 状态，并在不离开控制面的情况下控制 orchestration 循环。",
      actorContext: "Actor 上下文",
      actorContextHelp: "所有写操作都会使用这个身份通过请求头发送，后端会按它执行角色权限校验。",
      currentIdentity: "当前身份",
      identityHelp: "当你想测试规划、评审、交付、监督或 runtime 控制路径时，可以在这里切换角色。",
      language: "界面语言",
      languageHelp: "默认语言为中文，你可以随时切换到英文。",
    },
    taskDetail: {
      noTaskSelected: "尚未选择任务",
      noTaskSelectedCopy: "从侧栏选择一个任务，以查看它的计划、执行和输出。",
      approve: "批准",
      requestChanges: "请求修改",
      reject: "拒绝",
      runtimeRun: "执行 Runtime",
      supervisorSweep: "执行 Supervisor Sweep",
      plan: "计划",
      scope: "范围",
      acceptance: "验收标准",
      risks: "风险",
      reviews: "评审",
      timeline: "时间线",
      artifacts: "Artifacts",
      supervisor: "Supervisor",
      reviewRound: "评审轮次",
      taskBlocked: "任务已阻塞",
      taskActive: "任务正常",
      noActiveBlocker: "当前没有记录的阻塞原因。",
      lastIntervention: "最近一次干预",
      intervene: "执行干预",
      reasonForIntervention: "干预原因",
      noSupervisorActions: "当前任务状态下没有可用的 supervisor 动作。",
      noReasonProvided: "未提供原因。",
      refreshing: "刷新中...",
      attachToTaskOnly: "仅挂在任务上",
      deliveryOutput: "交付输出",
      createPlan: "创建计划",
      createPlanSubmitReview: "创建计划并提交评审",
      createWorkItem: "创建工作项",
      updateProgress: "更新进度",
      execution: "执行",
      createArtifact: "创建 Artifact",
      submitting: "提交中...",
      creating: "创建中...",
      updating: "更新中...",
      progressPercent: "进度百分比",
      progressSummary: "进度摘要",
      blockReason: "阻塞原因",
      goal: "目标",
      acceptanceCriteriaLine: "验收标准，每行一条",
      scopeItemsLine: "范围项，每行一条",
      teamsCommaSeparated: "团队，逗号分隔",
      estimatedEffort: "预计工作量",
      risksLine: "风险，每行一条",
      notes: "备注",
      workItemTitle: "工作项标题",
      description: "描述",
      selectWorkItem: "选择工作项",
      artifactName: "Artifact 名称",
      pathOrUrl: "路径或 URL",
      artifactSummary: "Artifact 摘要",
    },
  },
  en: {
    common: {
      refresh: "Refresh",
      loading: "Loading...",
      noSummary: "No summary.",
      runtime: "Runtime",
      runtimeBadge: "Runtime",
      active: "Active",
      idle: "Idle",
      runNow: "Run Now",
      pause: "Pause",
      resume: "Resume",
      running: "Running...",
      workerEnabled: "Worker enabled",
      workerDisabled: "Worker disabled",
      loop: "Loop",
      poll: "Poll",
      escalateAfter: "Escalate after",
      lastRun: "Last run",
      never: "Never",
      working: "Working...",
      generated: "Generated",
      dispatched: "Dispatched",
      readyToReport: "Ready To Report",
      completed: "Completed",
      escalated: "Escalated",
      runtimeAudit: "Runtime Audit",
      runtimeEvents: "Runtime Events",
      generatedItems: "Generated Items",
      runtimeArtifacts: "Runtime Artifacts",
      escalations: "Escalations",
      noRuntimeActions: "No runtime actions recorded yet.",
      affectedWorkItems: "Affected work items",
      completedWithArtifact: "Completed with artifact",
      affectedWorkItem: "Affected work item",
      loadingRuntimeStatus: "Loading runtime status...",
      actorId: "Actor ID",
      unset: "unset",
      create: "Create",
      submit: "Submit",
      update: "Update",
      noEventsYet: "No events yet.",
      noArtifactsYet: "No artifacts yet.",
      noReviewsYet: "No reviews yet.",
      noWorkItemsYet: "No work items yet.",
      noPlanYet: "No plan yet.",
      noInterventionsYet: "No interventions yet.",
      policyAwareControls: "Policy-aware controls",
      allInterventions: "All interventions",
      owner: "Owner",
      priority: "Priority",
      updated: "Updated",
      team: "Team",
      blocker: "Blocker",
      task: "Task",
      state: "State",
      role: "Role",
      language: "Language",
      chinese: "中文",
      english: "English",
      systemActivity: "System Activity",
      recentActivity: "Recent Activity",
      noRecentSystemActivity: "No recent system activity yet.",
    },
    nav: {
      board: "Board",
      attention: "Attention",
      teams: "Teams",
      settings: "Settings",
      taskDetail: "Task Detail",
    },
    app: {
      workflowDashboard: "Workflow Dashboard",
      companyagents: "companyagents",
    },
    sidebar: {
      controlPlane: "Control Plane",
      operator: "Operator",
      summary: "Summary",
      newTask: "New Task",
      intake: "Intake",
      writeActionHint: "Write actions use these headers, and the backend enforces role-based permissions.",
      taskTitle: "Task title",
      taskSummary: "Task summary",
      requester: "Requester",
      tags: "Tags, comma separated",
      createTask: "Create Task",
      creatingTask: "Creating...",
      attention: "Attention",
      tasks: "Tasks",
      loadingAttention: "Loading attention queues...",
      loadingTasks: "Loading tasks...",
      noTasks: "No tasks yet.",
      blockedFallback: "Needs unblock action.",
      reviewFallback: "Review queue item.",
      priorityFallback: "High-priority task.",
    },
    board: {
      eyebrow: "Workflow Overview",
      title: "Board",
      summary:
        "This page is the control-room overview for the delivery system. Use the sidebar to create requests and jump into task detail. The cards below highlight what needs attention right now.",
      tasksTotal: "Tasks Total",
      active: "Active",
      blocked: "Blocked",
      teamsActive: "Teams Active",
      reviewQueue: "Review Queue",
      highPriority: "High Priority",
      recentlyActive: "Recently Active",
      blockedNow: "Blocked Now",
      needsReview: "Needs Review",
      priorityRadar: "Priority Radar",
      noActiveTasks: "No active tasks yet.",
      noBlockedTasks: "No blocked tasks right now.",
      noReviewQueue: "No review queue right now.",
      noPriorityTasks: "No high-priority tasks right now.",
    },
    attention: {
      eyebrow: "Operations",
      title: "Attention",
      summary: "This page isolates the queues that usually need human attention first.",
      blocked: "Blocked",
      stalled: "Stalled",
      needsReview: "Needs Review",
      priority: "Priority",
      recentlyActive: "Recently Active",
      blockedQueue: "Blocked Queue",
      stalledBlockers: "Stalled Blockers",
      reviewQueue: "Review Queue",
      priorityQueue: "Priority Queue",
      recentChanges: "Recent Changes",
      noReviewWork: "No review work waiting.",
      noPriorityWork: "No high-priority tasks queued.",
      noRecentTaskActivity: "No recent task activity.",
      noStalled: "No stale blocked tasks right now.",
    },
    teams: {
      eyebrow: "Operations",
      title: "Teams",
      summary: "This view shows how execution is distributed across teams and where blockers are accumulating.",
      teams: "Teams",
      workItems: "Work Items",
      inProgress: "In Progress",
      blocked: "Blocked",
      teamLoad: "Team Load",
      noTeamWorkload: "No team workload yet.",
      workItemsSuffix: "work items",
      inProgressLabel: "In progress",
      blockedLabel: "Blocked",
      completedLabel: "Completed",
      tasksOwned: "Tasks owned",
      teamNeedsAttention: "Needs attention: this team currently has blocked work.",
      teamNoBlockers: "No current blockers recorded for this team.",
      teamWorkQueue: "Team Work Queue",
      selectTeam: "Select a team",
      deliveryReadout: "Delivery Readout",
      snapshot: "Snapshot",
      deliveryReadoutCopy: "Pick a team card to inspect its current work queue.",
      completionRatio: "Completion Ratio",
      completionRatioCopy: "Share of work items already marked complete across all teams.",
      executionPressure: "Execution Pressure",
      executionPressureCopy: "Share of workload currently active and moving through execution.",
      blockerRate: "Blocker Rate",
      blockerRateCopy: "Share of workload currently stalled and likely needing intervention.",
      loadingTeamQueue: "Loading team work queue...",
      noAssignedItems: "No work items assigned to this team yet.",
      selectTeamHint: "Select a team to inspect assigned work items.",
      ownedTasks: "Owned Tasks",
      ownedTasksCopy: "Tasks currently attributed to explicit teams in the control plane.",
      noDescription: "No description recorded yet.",
    },
    settings: {
      eyebrow: "Configuration",
      title: "Settings",
      summary:
        "Use this page to switch operator identity, inspect runtime behavior, and control the orchestration loop.",
      actorContext: "Actor Context",
      actorContextHelp:
        "All write actions use this identity through request headers, and the backend enforces role-based permissions against it.",
      currentIdentity: "Current Identity",
      identityHelp:
        "Switch roles here when you want to test planner, reviewer, delivery, supervisor, or runtime control paths.",
      language: "Language",
      languageHelp: "Chinese is the default language. You can switch to English at any time.",
    },
    taskDetail: {
      noTaskSelected: "No task selected",
      noTaskSelectedCopy: "Choose a task from the sidebar to inspect its plan, execution, and outputs.",
      approve: "Approve",
      requestChanges: "Request Changes",
      reject: "Reject",
      runtimeRun: "Runtime Run",
      supervisorSweep: "Supervisor Sweep",
      plan: "Plan",
      scope: "Scope",
      acceptance: "Acceptance",
      risks: "Risks",
      reviews: "Reviews",
      timeline: "Timeline",
      artifacts: "Artifacts",
      supervisor: "Supervisor",
      reviewRound: "Review round",
      taskBlocked: "Task blocked",
      taskActive: "Task active",
      noActiveBlocker: "No active blocker recorded.",
      lastIntervention: "Last intervention",
      intervene: "Intervene",
      reasonForIntervention: "Reason for intervention",
      noSupervisorActions: "No supervisor actions are currently available for this task state.",
      noReasonProvided: "No reason provided.",
      refreshing: "Refreshing...",
      attachToTaskOnly: "Attach to task only",
      deliveryOutput: "Delivery Output",
      createPlan: "Create Plan",
      createPlanSubmitReview: "Create Plan + Submit Review",
      createWorkItem: "Create Work Item",
      updateProgress: "Update Progress",
      execution: "Execution",
      createArtifact: "Create Artifact",
      submitting: "Submitting...",
      creating: "Creating...",
      updating: "Updating...",
      progressPercent: "Progress percent",
      progressSummary: "Progress summary",
      blockReason: "Block reason",
      goal: "Goal",
      acceptanceCriteriaLine: "Acceptance criteria, one per line",
      scopeItemsLine: "Scope items, one per line",
      teamsCommaSeparated: "Teams, comma separated",
      estimatedEffort: "Estimated effort",
      risksLine: "Risks, one per line",
      notes: "Notes",
      workItemTitle: "Work item title",
      description: "Description",
      selectWorkItem: "Select work item",
      artifactName: "Artifact name",
      pathOrUrl: "Path or URL",
      artifactSummary: "Artifact summary",
    },
  },
} as const;

type Dictionary = (typeof dictionaries)["zh-CN"];
type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveTranslation(language: Language, key: string) {
  const parts = key.split(".");
  let value: unknown = dictionaries[language];
  for (const part of parts) {
    if (typeof value !== "object" || value === null || !(part in value)) {
      value = undefined;
      break;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : key;
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "zh-CN";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "zh-CN" || stored === "en") return stored;
  return "zh-CN";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "zh-CN" ? "zh-CN" : "en";
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => resolveTranslation(language, key),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

function pickLabel(language: Language, value: string, map: Record<string, { "zh-CN": string; en: string }>) {
  return map[value]?.[language] ?? value;
}

const roleLabels = {
  Human: { "zh-CN": "人工", en: "Human" },
  IntakeCoordinator: { "zh-CN": "需求协调", en: "IntakeCoordinator" },
  ProjectManager: { "zh-CN": "项目经理", en: "ProjectManager" },
  SolutionReviewer: { "zh-CN": "方案评审", en: "SolutionReviewer" },
  DeliveryManager: { "zh-CN": "交付经理", en: "DeliveryManager" },
  EngineeringTeam: { "zh-CN": "工程团队", en: "EngineeringTeam" },
  DataTeam: { "zh-CN": "数据团队", en: "DataTeam" },
  ContentTeam: { "zh-CN": "内容团队", en: "ContentTeam" },
  OperationsTeam: { "zh-CN": "运营团队", en: "OperationsTeam" },
  SecurityTeam: { "zh-CN": "安全团队", en: "SecurityTeam" },
  ReportingSpecialist: { "zh-CN": "报告专员", en: "ReportingSpecialist" },
  WorkflowSupervisor: { "zh-CN": "流程监督", en: "WorkflowSupervisor" },
  System: { "zh-CN": "系统", en: "System" },
  Engineering: { "zh-CN": "工程", en: "Engineering" },
  Data: { "zh-CN": "数据", en: "Data" },
  Content: { "zh-CN": "内容", en: "Content" },
  Operations: { "zh-CN": "运营", en: "Operations" },
  Security: { "zh-CN": "安全", en: "Security" },
} as const;

const stateLabels = {
  New: { "zh-CN": "新建", en: "New" },
  NeedsClarification: { "zh-CN": "待澄清", en: "NeedsClarification" },
  Qualified: { "zh-CN": "已确认", en: "Qualified" },
  Planned: { "zh-CN": "已规划", en: "Planned" },
  InReview: { "zh-CN": "评审中", en: "InReview" },
  Approved: { "zh-CN": "已批准", en: "Approved" },
  Rejected: { "zh-CN": "已拒绝", en: "Rejected" },
  Dispatched: { "zh-CN": "已派发", en: "Dispatched" },
  InExecution: { "zh-CN": "执行中", en: "InExecution" },
  InIntegration: { "zh-CN": "集成中", en: "InIntegration" },
  ReadyToReport: { "zh-CN": "待出报告", en: "ReadyToReport" },
  Blocked: { "zh-CN": "已阻塞", en: "Blocked" },
  Done: { "zh-CN": "已完成", en: "Done" },
  Cancelled: { "zh-CN": "已取消", en: "Cancelled" },
  Archived: { "zh-CN": "已归档", en: "Archived" },
} as const;

const priorityLabels = {
  low: { "zh-CN": "低", en: "low" },
  normal: { "zh-CN": "普通", en: "normal" },
  high: { "zh-CN": "高", en: "high" },
  critical: { "zh-CN": "关键", en: "critical" },
} as const;

const workItemStatusLabels = {
  Assigned: { "zh-CN": "已分配", en: "Assigned" },
  InProgress: { "zh-CN": "进行中", en: "InProgress" },
  Blocked: { "zh-CN": "已阻塞", en: "Blocked" },
  Completed: { "zh-CN": "已完成", en: "Completed" },
} as const;

const reviewResultLabels = {
  Approved: { "zh-CN": "已批准", en: "Approved" },
  Rejected: { "zh-CN": "已拒绝", en: "Rejected" },
  ChangesRequested: { "zh-CN": "要求修改", en: "ChangesRequested" },
  RequestChanges: { "zh-CN": "要求修改", en: "RequestChanges" },
} as const;

const supervisorActionLabels = {
  pause: { "zh-CN": "暂停", en: "Pause" },
  resume: { "zh-CN": "恢复", en: "Resume" },
  retry: { "zh-CN": "重试", en: "Retry" },
  escalate: { "zh-CN": "升级", en: "Escalate" },
  rollback: { "zh-CN": "回滚", en: "Rollback" },
  replan: { "zh-CN": "重新规划", en: "Replan" },
  approve: { "zh-CN": "批准", en: "Approve" },
  "request-changes": { "zh-CN": "请求修改", en: "Request Changes" },
  reject: { "zh-CN": "拒绝", en: "Reject" },
} as const;

const artifactTypeLabels = {
  document: { "zh-CN": "文档", en: "document" },
  report: { "zh-CN": "报告", en: "report" },
  repo_diff: { "zh-CN": "代码差异", en: "repo_diff" },
  test_report: { "zh-CN": "测试报告", en: "test_report" },
  design: { "zh-CN": "设计", en: "design" },
  dataset: { "zh-CN": "数据集", en: "dataset" },
  chart: { "zh-CN": "图表", en: "chart" },
  plan: { "zh-CN": "计划", en: "plan" },
  summary: { "zh-CN": "摘要", en: "summary" },
  customer_response: { "zh-CN": "客户回复", en: "customer_response" },
  runbook: { "zh-CN": "运行手册", en: "runbook" },
  other: { "zh-CN": "其他", en: "other" },
} as const;

export function translateRole(language: Language, value: string) {
  return pickLabel(language, value, roleLabels);
}

export function translateState(language: Language, value: string) {
  return pickLabel(language, value, stateLabels);
}

export function translatePriority(language: Language, value: string) {
  return pickLabel(language, value, priorityLabels);
}

export function translateWorkItemStatus(language: Language, value: string) {
  return pickLabel(language, value, workItemStatusLabels);
}

export function translateReviewResult(language: Language, value: string) {
  return pickLabel(language, value, reviewResultLabels);
}

export function translateSupervisorAction(language: Language, value: string) {
  return pickLabel(language, value, supervisorActionLabels);
}

export function translateArtifactType(language: Language, value: string) {
  return pickLabel(language, value, artifactTypeLabels);
}
