import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "@/lib/model-api";
import {
  capMessages,
  capSessions,
  loadChatStore,
  newSessionId,
  saveActiveChatId,
  saveChatStore,
  titleFromText,
  type ChatSession,
} from "@/lib/chat-sessions";

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const loaded = loadChatStore();
    setSessions(loaded.sessions);
    setActiveId(loaded.activeId);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setStorageError(!saveChatStore(sessions));
  }, [sessions, ready]);

  useEffect(() => {
    if (!ready) return;
    saveActiveChatId(activeId);
  }, [activeId, ready]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeId) ?? null,
    [activeId, sessions],
  );

  const createSession = useCallback((firstMessage: ChatMessage) => {
    const now = Date.now();
    const session: ChatSession = {
      id: newSessionId(),
      title: titleFromText(firstMessage.content),
      createdAt: now,
      updatedAt: now,
      messages: [firstMessage],
    };
    setSessions((prev) => capSessions([session, ...prev]));
    setActiveId(session.id);
    return session.id;
  }, []);

  const appendMessage = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions((prev) =>
      capSessions(
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: capMessages([...session.messages, message]),
                updatedAt: Date.now(),
              }
            : session,
        ),
      ),
    );
  }, []);

  const renameSession = useCallback((sessionId: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, title: nextTitle.slice(0, 80) } : session,
      ),
    );
  }, []);

  const deleteSession = useCallback(
    (sessionId: string) => {
      const next = sessions.filter((session) => session.id !== sessionId);
      setSessions(next);
      setActiveId((current) => (current === sessionId ? (next[0]?.id ?? null) : current));
    },
    [sessions],
  );

  const clearAll = useCallback(() => {
    setSessions([]);
    setActiveId(null);
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setActiveId(sessionId);
  }, []);

  const newChat = useCallback(() => {
    setActiveId(null);
  }, []);

  return {
    sessions,
    activeId,
    activeSession,
    messages: activeSession?.messages ?? [],
    ready,
    storageError,
    createSession,
    appendMessage,
    renameSession,
    deleteSession,
    clearAll,
    selectSession,
    newChat,
  };
}
