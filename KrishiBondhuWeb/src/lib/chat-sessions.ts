import type { ChatMessage } from "@/lib/model-api";

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

type ChatStore = {
  version: 1;
  sessions: ChatSession[];
};

export const CHAT_SESSIONS_KEY = "kb_chat_sessions_v1";
export const CHAT_ACTIVE_KEY = "kb_chat_active_v1";
export const LEGACY_CHAT_KEY = "kb_chat_history";
export const MAX_CHAT_SESSIONS = 40;
export const MAX_CHAT_MESSAGES = 80;

export function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function titleFromText(text: string) {
  const clean = text
    .replace(/[#*_>`[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "New chat";
  return clean.length > 52 ? `${clean.slice(0, 52).trim()}…` : clean;
}

export function sessionPreview(session: ChatSession) {
  const last = session.messages[session.messages.length - 1];
  if (!last) return "";
  const clean = last.content
    .replace(/[#*_>`[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 90 ? `${clean.slice(0, 90).trim()}…` : clean;
}

export function capMessages(messages: ChatMessage[]) {
  return messages.slice(-MAX_CHAT_MESSAGES);
}

export function capSessions(sessions: ChatSession[]) {
  return [...sessions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CHAT_SESSIONS)
    .map((session) => ({ ...session, messages: capMessages(session.messages) }));
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    (message.role === "user" || message.role === "assistant") && typeof message.content === "string"
  );
}

function normalizeSession(value: unknown): ChatSession | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ChatSession>;
  if (typeof raw.id !== "string" || !raw.id) return null;
  const messages = Array.isArray(raw.messages) ? raw.messages.filter(isChatMessage) : [];
  if (!messages.length) return null;
  const now = Date.now();
  const createdAt = typeof raw.createdAt === "number" && raw.createdAt > 0 ? raw.createdAt : now;
  const updatedAt =
    typeof raw.updatedAt === "number" && raw.updatedAt > 0 ? raw.updatedAt : createdAt;
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : titleFromText(messages.find((message) => message.role === "user")?.content ?? "");
  return { id: raw.id, title, createdAt, updatedAt, messages: capMessages(messages) };
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function loadChatStore(): { sessions: ChatSession[]; activeId: string | null } {
  const raw = readStorage(CHAT_SESSIONS_KEY);
  let hadStore = false;
  let sessions: ChatSession[] = [];

  if (raw) {
    hadStore = true;
    try {
      const parsed = JSON.parse(raw) as Partial<ChatStore>;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.sessions)) {
        sessions = parsed.sessions
          .map(normalizeSession)
          .filter((session): session is ChatSession => session !== null);
      }
    } catch {
      sessions = [];
    }
  }

  if (!hadStore) {
    const legacy = readStorage(LEGACY_CHAT_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) {
          const messages = parsed.filter(isChatMessage);
          if (messages.length) {
            const now = Date.now();
            const firstUser = messages.find((message) => message.role === "user");
            const session: ChatSession = {
              id: newSessionId(),
              title: titleFromText(firstUser?.content ?? ""),
              createdAt: now,
              updatedAt: now,
              messages: capMessages(messages),
            };
            sessions = [session];
            if (saveChatStore(sessions)) {
              try {
                localStorage.removeItem(LEGACY_CHAT_KEY);
              } catch {
                // leave the legacy copy if storage is unavailable
              }
            }
          }
        }
      } catch {
        sessions = [];
      }
    }
  }

  sessions = capSessions(sessions);
  const savedActive = readStorage(CHAT_ACTIVE_KEY);
  const activeId =
    savedActive && sessions.some((session) => session.id === savedActive)
      ? savedActive
      : (sessions[0]?.id ?? null);

  return { sessions, activeId };
}

export function saveChatStore(sessions: ChatSession[]) {
  try {
    const store: ChatStore = { version: 1, sessions: capSessions(sessions) };
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function saveActiveChatId(id: string | null) {
  try {
    if (id) localStorage.setItem(CHAT_ACTIVE_KEY, id);
    else localStorage.removeItem(CHAT_ACTIVE_KEY);
  } catch {
    // active selection is best-effort
  }
}
