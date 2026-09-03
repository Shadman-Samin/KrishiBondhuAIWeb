import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Loader2, MapPin, MessageCircle, Send, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useDistrict } from "@/lib/district";
import { DISTRICTS } from "@/lib/weather-api";
import { buildContext, sendChat, type ChatLang, type ChatMessage } from "@/lib/model-api";

export const Route = createFileRoute("/dashboard/chat")({
  component: ChatPage,
});

const STORAGE_KEY = "kb_chat_history";
const HISTORY_CAP = 50;

const QUICK_PROMPTS: { en: string; bn: string; words: string[] }[] = [
  {
    en: "Which crop should I plant this season?",
    bn: "এই মৌসুমে কোন ফসল চাষ করব?",
    words: ["crop", "plant", "season", "rice", "wheat", "lentil", "maize", "sow", "harvest"],
  },
  {
    en: "My rice leaves are turning yellow. What do I do?",
    bn: "আমার ধানের পাতা হলুদ হয়ে যাচ্ছে। কী করব?",
    words: ["yellow", "leaf", "leafs", "disease", "pest", "insect", "fungus", "rot", "blight"],
  },
  {
    en: "Is today good weather for spraying fertilizer?",
    bn: "আজ সার ছিটানোর জন্য আবহাওয়া কি ভালো?",
    words: [
      "weather",
      "rain",
      "rainy",
      "spray",
      "fertilizer",
      "fertiliser",
      "humidity",
      "temperature",
    ],
  },
  {
    en: "Where should I sell my vegetables for a better price?",
    bn: "ভালো দামে সবজি বিক্রি করব কোথায়?",
    words: ["sell", "sale", "price", "market", "bazar", "bazaar", "buyer", "rate"],
  },
];

const GREETINGS = {
  en: "Hi! I'm your AI field assistant. Ask me anything about crops, pests, weather or selling — I'll use your location and this season's conditions to answer.",
  bn: "হ্যালো! আমি আপনার এআই সহকারী। ফসল, পোকা, আবহাওয়া বা বিক্রি নিয়ে প্রশ্ন করুন — আপনার এলাকা ও এই মৌসুমের অবস্থা দেখে উত্তর দেব।",
};

function ChatPage() {
  const { lang } = useLang();
  const t = (en: string, bn: string) => (lang === "bn" ? bn : en);
  const chatLang = (lang === "bn" ? "bn" : "en") as ChatLang;
  const [district, setDistrict] = useDistrict();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      // ignore corrupt localStorage
    }
  }, []);

  useEffect(() => {
    try {
      if (sending) return;
      const trimmed = messages.slice(-HISTORY_CAP);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore quota errors
    }
  }, [messages, sending]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || sending) return;
    setInput("");
    setError(null);

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setSending(true);
    try {
      const context = await buildContext(district, chatLang);
      const reply = await sendChat(next, chatLang, context);
      if (reply) {
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: t(
              "The offline AI is unavailable right now. Please try again in a moment.",
              "অফলাইন এআই এই মুহূর্তে অনুপলব্ধ। একটু পরে আবার চেষ্টা করুন।",
            ),
          },
        ]);
      }
    } catch {
      setError(
        t("Connection error. Check the server.", "সংযোগ সমস্যা। সার্ভার ঠিক আছে কিনা দেখুন।"),
      );
    } finally {
      setSending(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setInput("");
    setError(null);
  }

  const suggested = messages.length === 0 && !input.trim() ? QUICK_PROMPTS : [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-1 rounded-full bg-gradient-primary shrink-0" />
          <div>
            <h1 className="text-2xl font-bold font-display">{t("AI Advisor", "এআই পরামর্শ")}</h1>
            <p className="text-muted-foreground mt-1">
              {t(
                "Get practical advice from your AI field assistant",
                "আপনার এআই সহকারীর কাছ থেকে ব্যবহারিক পরামর্শ নিন",
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-card pl-9 pr-8 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              aria-label={t("District", "জেলা")}
            >
              {DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {t(d.name, d.nameBn)}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              ▾
            </span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {t("Clear", "মুছুন")}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex-1 min-h-0 rounded-2xl bg-card shadow-card ring-1 ring-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="max-w-xl mx-auto text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary/10 ring-1 ring-inset ring-primary/20">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-4 text-muted-foreground">{t(GREETINGS.en, GREETINGS.bn)}</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 animate-fade-up",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role === "assistant" && (
                <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center mt-1">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
                    : "bg-muted text-foreground rounded-bl-md [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_p]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:font-display [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs dark:[&_code]:bg-white/10",
                )}
              >
                {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center mt-1">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-2xl rounded-bl-md bg-muted text-foreground px-4 py-2.5 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%]">
                <span className="flex items-center gap-1.5 py-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 text-center">{error}</div>
          )}
          <div ref={endRef} />
        </div>

        {suggested.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 sm:px-6 pt-3">
            {suggested.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q.en)}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t(q.en, q.bn)}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 sm:p-6 border-t border-border mt-3">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(
                "Ask about crops, pests, weather…",
                "ফসল, পোকা, আবহাওয়া নিয়ে প্রশ্ন করুন…",
              )}
              className="flex-1 rounded-xl bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
              aria-label={t("Send message", "বার্তা পাঠান")}
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
