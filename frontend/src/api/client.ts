const API_BASE =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE ??
  "http://127.0.0.1:8100/api";
const ACTOR_STORAGE_KEY = "companyagents.actor";

export const ACTOR_ROLE_OPTIONS = [
  "Human",
  "IntakeCoordinator",
  "ProjectManager",
  "SolutionReviewer",
  "DeliveryManager",
  "EngineeringTeam",
  "DataTeam",
  "ContentTeam",
  "OperationsTeam",
  "SecurityTeam",
  "ReportingSpecialist",
  "WorkflowSupervisor",
  "System",
] as const;

export type ActorContext = {
  role: (typeof ACTOR_ROLE_OPTIONS)[number];
  actorId: string;
};

const DEFAULT_ACTOR: ActorContext = {
  role: "IntakeCoordinator",
  actorId: "intake-ui",
};

let currentActor = loadActorContext();

type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
};

function loadActorContext(): ActorContext {
  if (typeof window === "undefined") {
    return DEFAULT_ACTOR;
  }

  try {
    const raw = window.localStorage.getItem(ACTOR_STORAGE_KEY);
    if (!raw) return DEFAULT_ACTOR;
    const parsed = JSON.parse(raw) as Partial<ActorContext>;
    if (!parsed.role || !parsed.actorId) return DEFAULT_ACTOR;
    if (!ACTOR_ROLE_OPTIONS.includes(parsed.role)) return DEFAULT_ACTOR;
    return {
      role: parsed.role,
      actorId: parsed.actorId,
    };
  } catch {
    return DEFAULT_ACTOR;
  }
}

export function getActorContext(): ActorContext {
  return currentActor;
}

export function setActorContext(nextActor: ActorContext): void {
  currentActor = nextActor;
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ACTOR_STORAGE_KEY, JSON.stringify(nextActor));
}

function actorHeaders() {
  return {
    "X-Actor-Role": currentActor.role,
    "X-Actor-Id": currentActor.actorId,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T> | { detail?: string };
  if (!response.ok) {
    const detail = typeof payload === "object" && payload && "detail" in payload ? payload.detail : undefined;
    throw new Error(detail ?? "Request failed");
  }
  if (!("ok" in payload) || !payload.ok) {
    const errorMessage = "error" in payload ? payload.error?.message : undefined;
    throw new Error(errorMessage ?? "Request failed");
  }
  return payload.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: actorHeaders(),
  });
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...actorHeaders(),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}
