from collections.abc import Callable
from dataclasses import dataclass

from fastapi import Header, HTTPException

from .models.enums import RoleType


@dataclass(frozen=True)
class ActorContext:
    role: RoleType
    actor_id: str


def require_actor(*allowed_roles: RoleType) -> Callable[..., ActorContext]:
    async def dependency(
        x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
        x_actor_id: str | None = Header(default=None, alias="X-Actor-Id"),
    ) -> ActorContext:
        if not x_actor_role or not x_actor_id:
            raise HTTPException(status_code=401, detail="actor headers are required")

        try:
            role = RoleType(x_actor_role)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail="invalid actor role") from exc

        if allowed_roles and role not in allowed_roles:
            allowed_text = ", ".join(sorted(item.value for item in allowed_roles))
            raise HTTPException(
                status_code=403,
                detail=f"role {role.value} cannot perform this action. allowed: {allowed_text}",
            )

        return ActorContext(role=role, actor_id=x_actor_id)

    return dependency
