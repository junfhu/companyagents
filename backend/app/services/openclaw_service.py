import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ..models import ActivityEvent, Artifact, Task
from ..models.enums import ArtifactType, RoleType
from ..schemas.artifact import ArtifactCreate
from .artifact_service import ArtifactService
from .task_service import TaskService


TEAM_AGENT_MAP = {
    "Engineering": "gongbu",
    "Data": "hubu",
    "Content": "libu",
    "Operations": "bingbu",
    "Security": "xingbu",
}


@dataclass
class OpenClawSettings:
    enabled: bool
    command: str
    command_timeout_seconds: int
    agents_root: Path
    default_dispatch_agent: str
    agent_map: dict[str, str]


@dataclass
class OpenClawSessionEntry:
    key: str
    timestamp: str
    kind: str
    payload: dict[str, Any]
    session_file: str
    agent_id: str


class OpenClawService:
    def __init__(self, settings: OpenClawSettings):
        self.settings = settings

    def resolve_agent_id(self, task: Task, teams: list[str] | None = None) -> str:
        task_meta = task.meta or {}
        explicit = task_meta.get("openclaw_agent_id")
        if isinstance(explicit, str) and explicit.strip():
            return explicit.strip()

        for team in teams or []:
            mapped = self.settings.agent_map.get(team)
            if mapped:
                return mapped
            mapped = TEAM_AGENT_MAP.get(team)
            if mapped:
                return mapped
        return self.settings.default_dispatch_agent

    def dispatch_task(self, task: Task, agent_id: str, message: str) -> dict[str, Any]:
        if not self.settings.enabled:
            return {
                "ok": False,
                "agent_id": agent_id,
                "message": "OpenClaw dispatch is disabled.",
            }

        cmd = [
            self.settings.command,
            "agent",
            "--agent",
            agent_id,
            "-m",
            message,
            "--timeout",
            str(self.settings.command_timeout_seconds),
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=self.settings.command_timeout_seconds + 10,
            check=False,
        )
        output = (result.stdout or result.stderr or "").strip()
        return {
            "ok": result.returncode == 0,
            "agent_id": agent_id,
            "command": cmd,
            "returncode": result.returncode,
            "output": output[:500],
        }

    def load_task_session_entries(self, agent_id: str, task_id: str, limit: int = 24) -> list[OpenClawSessionEntry]:
        sessions_dir = self.settings.agents_root / agent_id / "sessions"
        if not sessions_dir.exists():
            return []

        entries: list[OpenClawSessionEntry] = []
        jsonl_files = sorted(sessions_dir.glob("*.jsonl"), key=lambda item: item.stat().st_mtime, reverse=True)
        for session_file in jsonl_files[:3]:
            try:
                lines = session_file.read_text(errors="ignore").splitlines()
            except OSError:
                continue

            for line_number, line in enumerate(lines, start=1):
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue
                message = item.get("message") or {}
                all_text = self._collect_message_text(message)
                if task_id not in all_text:
                    continue
                parsed = self._parse_activity_entry(item)
                if not parsed:
                    continue
                entries.append(
                    OpenClawSessionEntry(
                        key=f"{session_file.name}:{line_number}:{parsed['kind']}",
                        timestamp=str(item.get("timestamp", "")),
                        kind=parsed["kind"],
                        payload=parsed,
                        session_file=session_file.name,
                        agent_id=agent_id,
                    )
                )
                if len(entries) >= limit:
                    return entries
        return entries

    @staticmethod
    def build_dispatch_message(task: Task, goal: str | None, teams: list[str], work_item_titles: list[str]) -> str:
        suggested_teams = ", ".join(teams) if teams else "Engineering"
        work_preview = "\n".join(f"- {title}" for title in work_item_titles[:6]) if work_item_titles else "- 请先拆解执行项"
        return (
            "你是嵌入在 companyagents 控制面里的 OpenClaw Agent。\n"
            "请不要重复创建任务记录，而是围绕既有任务继续推进。\n\n"
            f"任务ID: {task.id}\n"
            f"标题: {task.title}\n"
            f"摘要: {task.summary or '(无摘要)'}\n"
            f"目标: {goal or '(未提供目标)'}\n"
            f"建议团队: {suggested_teams}\n"
            "当前执行项:\n"
            f"{work_preview}\n\n"
            "请基于你的职责继续处理，并在输出中保留任务ID，方便控制面回读 session。"
        )

    @staticmethod
    def _collect_message_text(message: dict[str, Any]) -> str:
        parts: list[str] = []
        for content in message.get("content", []) or []:
            content_type = content.get("type")
            if content_type == "text" and content.get("text"):
                parts.append(str(content.get("text", "")))
            elif content_type == "thinking" and content.get("thinking"):
                parts.append(str(content.get("thinking", "")))
            elif content_type == "tool_use":
                parts.append(json.dumps(content.get("input", {}), ensure_ascii=False))
        details = message.get("details") or {}
        for key in ("output", "stdout", "stderr", "message"):
            value = details.get(key)
            if isinstance(value, str) and value:
                parts.append(value)
        return "".join(parts)

    @staticmethod
    def _parse_activity_entry(item: dict[str, Any]) -> dict[str, Any] | None:
        message = item.get("message") or {}
        role = str(message.get("role", "")).strip().lower()

        if role == "assistant":
            text = ""
            thinking = ""
            tools = []
            for content in message.get("content", []) or []:
                content_type = content.get("type")
                if content_type == "text" and content.get("text") and not text:
                    text = str(content.get("text", "")).strip()
                elif content_type == "thinking" and content.get("thinking") and not thinking:
                    thinking = str(content.get("thinking", "")).strip()[:300]
                elif content_type == "tool_use":
                    tools.append(
                        {
                            "name": content.get("name", ""),
                            "input_preview": json.dumps(content.get("input", {}), ensure_ascii=False)[:200],
                        }
                    )
            if not (text or thinking or tools):
                return None
            payload: dict[str, Any] = {"kind": "assistant"}
            if text:
                payload["text"] = text[:800]
            if thinking:
                payload["thinking"] = thinking
            if tools:
                payload["tools"] = tools
            return payload

        if role in {"toolresult", "tool_result"}:
            details = message.get("details") or {}
            output = ""
            for content in message.get("content", []) or []:
                if content.get("type") == "text" and content.get("text"):
                    output = str(content.get("text", "")).strip()[:400]
                    break
            if not output:
                for key in ("output", "stdout", "stderr", "message"):
                    value = details.get(key)
                    if isinstance(value, str) and value.strip():
                        output = value.strip()[:400]
                        break
            payload = {
                "kind": "tool_result",
                "tool": message.get("toolName", message.get("name", "")),
                "output": output,
                "exit_code": details.get("exitCode", details.get("code", details.get("status"))),
            }
            duration_ms = details.get("durationMs")
            if isinstance(duration_ms, (int, float)):
                payload["duration_ms"] = int(duration_ms)
            return payload

        return None


class OpenClawSyncService:
    def __init__(self, task_service: TaskService, artifact_service: ArtifactService, openclaw_service: OpenClawService):
        self.task_service = task_service
        self.artifact_service = artifact_service
        self.openclaw_service = openclaw_service

    async def ingest_entries(
        self,
        task: Task,
        agent_id: str,
        existing_events: list[ActivityEvent],
        existing_artifacts: list[Artifact],
    ) -> int:
        entries = self.openclaw_service.load_task_session_entries(agent_id, task.id)
        seen_event_keys = {str((item.meta or {}).get("openclaw_entry_key")) for item in existing_events}
        seen_artifact_keys = {str((item.meta or {}).get("openclaw_entry_key")) for item in existing_artifacts}
        imported_count = 0

        for entry in entries:
            if entry.key not in seen_event_keys:
                await self.task_service._add_event(
                    task_id=task.id,
                    topic=f"openclaw.{entry.kind}",
                    actor_role=RoleType.System,
                    actor_id=agent_id,
                    payload=entry.payload,
                    entity_type="openclaw_session",
                    entity_id=entry.key,
                )
                latest_event = {
                    "key": entry.key,
                    "kind": entry.kind,
                    "timestamp": entry.timestamp,
                }
                task.meta = {
                    **(task.meta or {}),
                    "openclaw_last_entry": latest_event,
                }
                imported_count += 1

            if entry.kind == "assistant" and entry.key not in seen_artifact_keys and entry.payload.get("text"):
                await self.artifact_service.create(
                    task.id,
                    ArtifactCreate(
                        type=ArtifactType.summary.value,
                        name=f"OpenClaw {agent_id} output",
                        path_or_url=f"openclaw://{agent_id}/{entry.session_file}#{entry.key}",
                        summary=str(entry.payload.get("text", ""))[:800],
                        created_by_role=RoleType.System.value,
                        created_by_id=agent_id,
                        meta={
                            "runtime_auto": True,
                            "openclaw_auto": True,
                            "openclaw_entry_key": entry.key,
                            "openclaw_agent_id": agent_id,
                            "openclaw_session_file": entry.session_file,
                        },
                    ),
                )
                seen_artifact_keys.add(entry.key)

            seen_event_keys.add(entry.key)

        return imported_count
