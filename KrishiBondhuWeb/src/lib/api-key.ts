import { useEffect, useState } from "react";

const API_KEY_STORAGE = "kb_api_key";

export function useApiKey(): [string, (key: string) => void, () => void] {
  const [apiKey, setApiKeyState] = useState<string>("");

  useEffect(() => {
    try {
      setApiKeyState(localStorage.getItem(API_KEY_STORAGE) ?? "");
    } catch {
      setApiKeyState("");
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    try {
      localStorage.setItem(API_KEY_STORAGE, key);
    } catch {
      /* ignore */
    }
  };

  const clearApiKey = () => {
    setApiKeyState("");
    try {
      localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      /* ignore */
    }
  };

  return [apiKey, setApiKey, clearApiKey];
}

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}
