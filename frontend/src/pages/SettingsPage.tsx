import { ACTOR_ROLE_OPTIONS } from "../api/client";
import type { ActorContext } from "../api/client";
import { RuntimeStatusPanel } from "../components/control-plane-panels";
import type { RuntimeStatus } from "../types";

type ActorRole = (typeof ACTOR_ROLE_OPTIONS)[number];

export function SettingsPage({
  actorContext,
  runtime,
  runtimeBusy,
  onActorContextChange,
  onRunRuntimeControl,
}: {
  actorContext: ActorContext;
  runtime: RuntimeStatus | null;
  runtimeBusy: boolean;
  onActorContextChange: (value: ActorContext | ((current: ActorContext) => ActorContext)) => void;
  onRunRuntimeControl: (action: "run-once" | "pause" | "resume") => void | Promise<void>;
}) {
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Configuration</p>
        <h2>Settings</h2>
        <p className="summary-copy">
          Use this page to switch operator identity, inspect runtime behavior, and control the
          orchestration loop without leaving the control plane.
        </p>
      </section>

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Actor Context</h3>
            <span className="muted">{actorContext.role}</span>
          </div>
          <div className="stack">
            <p className="muted">
              All write actions use this identity through request headers, and the backend enforces
              role-based permissions against it.
            </p>
            <select
              className="text-input"
              value={actorContext.role}
              onChange={(event) =>
                onActorContextChange((current) => ({
                  ...current,
                  role: event.target.value as ActorRole,
                }))
              }
            >
              {ACTOR_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <input
              className="text-input"
              placeholder="Actor ID"
              value={actorContext.actorId}
              onChange={(event) =>
                onActorContextChange((current) => ({
                  ...current,
                  actorId: event.target.value,
                }))
              }
            />
            <article className="list-card">
              <div className="list-card-top">
                <strong>Current Identity</strong>
                <span className="pill subtle">{actorContext.actorId || "unset"}</span>
              </div>
              <p>
                Switch roles here when you want to test planner, reviewer, delivery, supervisor, or
                runtime control paths without editing code.
              </p>
            </article>
          </div>
        </section>

        <RuntimeStatusPanel
          runtime={runtime}
          busy={runtimeBusy}
          onRunNow={() => onRunRuntimeControl("run-once")}
          onPause={() => onRunRuntimeControl("pause")}
          onResume={() => onRunRuntimeControl("resume")}
        />
      </div>
    </div>
  );
}
