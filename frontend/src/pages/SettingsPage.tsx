import { ACTOR_ROLE_OPTIONS } from "../api/client";
import type { ActorContext } from "../api/client";
import { RuntimeStatusPanel } from "../components/control-plane-panels";
import { translateRole, useI18n } from "../i18n";
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
  const { language, setLanguage, t } = useI18n();
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">{t("settings.eyebrow")}</p>
        <h2>{t("nav.settings")}</h2>
        <p className="summary-copy">{t("settings.summary")}</p>
      </section>

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>{t("settings.actorContext")}</h3>
            <span className="muted">{translateRole(language, actorContext.role)}</span>
          </div>
          <div className="stack">
            <p className="muted">{t("settings.actorContextHelp")}</p>
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
                  {translateRole(language, role)}
                </option>
              ))}
            </select>
            <input
              className="text-input"
              placeholder={t("common.actorId")}
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
                <strong>{t("settings.currentIdentity")}</strong>
                <span className="pill subtle">{actorContext.actorId || t("common.unset")}</span>
              </div>
              <p>{t("settings.identityHelp")}</p>
            </article>
            <article className="list-card">
              <div className="list-card-top">
                <strong>{t("settings.language")}</strong>
                <span className="pill subtle">{language === "zh-CN" ? t("common.chinese") : t("common.english")}</span>
              </div>
              <p>{t("settings.languageHelp")}</p>
              <select className="text-input" value={language} onChange={(event) => setLanguage(event.target.value as "zh-CN" | "en")}>
                <option value="zh-CN">{t("common.chinese")}</option>
                <option value="en">{t("common.english")}</option>
              </select>
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
