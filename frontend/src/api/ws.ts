import { API_BASE } from "./client";

function toWsBase() {
  const normalized = API_BASE.replace(/\/api$/, "");
  if (normalized.startsWith("https://")) {
    return normalized.replace("https://", "wss://");
  }
  if (normalized.startsWith("http://")) {
    return normalized.replace("http://", "ws://");
  }
  return normalized;
}

export function openChannelsSocket(channels: string[], onMessage: (payload: unknown) => void) {
  const encoded = encodeURIComponent(channels.join(","));
  const socket = new WebSocket(`${toWsBase()}/ws?channels=${encoded}`);
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      onMessage(event.data);
    }
  };
  return socket;
}

export function openTaskSocket(taskId: string, onMessage: (payload: unknown) => void) {
  const channels = [`global`, `task:${taskId}`];
  return openChannelsSocket(channels, onMessage);
}

export function openGlobalSocket(onMessage: (payload: unknown) => void) {
  return openChannelsSocket(["global"], onMessage);
}
