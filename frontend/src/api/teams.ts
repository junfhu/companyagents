import type { TeamOverview, TeamWorkItems } from "../types";
import { apiGet } from "./client";

export function fetchTeams() {
  return apiGet<{ items: TeamOverview[] }>("/teams");
}

export function fetchTeamWorkItems(teamName: string) {
  return apiGet<TeamWorkItems>(`/teams/${encodeURIComponent(teamName)}/work-items`);
}
