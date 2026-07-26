import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, bn: string) => string;
};

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "bn" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  };

  const t = (en: string, bn: string) => (lang === "bn" ? bn : en);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <div
        lang={lang}
        style={lang === "bn" ? { fontFamily: '"Noto Sans Bengali", Inter, sans-serif' } : undefined}
      >
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
