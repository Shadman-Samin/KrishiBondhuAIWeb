import { useMemo, useState } from "react";
import { differenceInCalendarDays, isToday, isYesterday } from "date-fns";
import { Loader2, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { sessionPreview, type ChatSession } from "@/lib/chat-sessions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ChatHistoryProps = {
  sessions: ChatSession[];
  activeId: string | null;
  pendingId: string | null;
  ready: boolean;
  storageError: boolean;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
};

const GROUPS = ["today", "yesterday", "week", "older"] as const;
type GroupKey = (typeof GROUPS)[number];

function groupFor(timestamp: number): GroupKey {
  const date = new Date(timestamp);
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  if (differenceInCalendarDays(new Date(), date) < 7) return "week";
  return "older";
}

function timeLabel(timestamp: number, lang: Lang) {
  const date = new Date(timestamp);
  const locale = lang === "bn" ? "bn-BD" : "en-US";
  if (isToday(date)) {
    return date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function ChatHistoryPanel({
  sessions,
  activeId,
  pendingId,
  ready,
  storageError,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onClearAll,
  onClose,
}: ChatHistoryProps) {
  const { lang, t } = useLang();
  const [search, setSearch] = useState("");
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter(
      (session) =>
        session.title.toLowerCase().includes(query) ||
        session.messages.some((message) => message.content.toLowerCase().includes(query)),
    );
  }, [search, sessions]);

  const grouped = useMemo(() => {
    const buckets = new Map<GroupKey, ChatSession[]>();
    for (const key of GROUPS) buckets.set(key, []);
    for (const session of filtered) buckets.get(groupFor(session.updatedAt))?.push(session);
    return GROUPS.map((key) => ({ key, items: buckets.get(key) ?? [] })).filter(
      (group) => group.items.length > 0,
    );
  }, [filtered]);

  const groupLabels: Record<GroupKey, string> = {
    today: t("Today", "আজ"),
    yesterday: t("Yesterday", "গতকাল"),
    week: t("Previous 7 days", "গত ৭ দিন"),
    older: t("Older", "পুরোনো"),
  };

  function openRename(session: ChatSession) {
    setRenameTarget(session);
    setRenameValue(session.title);
  }

  function submitRename(event: React.FormEvent) {
    event.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    onRename(renameTarget.id, renameValue);
    setRenameTarget(null);
  }

  function selectSession(id: string) {
    onSelect(id);
    onClose?.();
  }

  function startNew() {
    onNew();
    onClose?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-border p-3">
        <Button
          type="button"
          onClick={startNew}
          className="w-full justify-start gap-2 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" />
          {t("New chat", "নতুন চ্যাট")}
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("Search chats", "চ্যাট খুঁজুন")}
            className="h-9 bg-muted/50 pl-9"
            aria-label={t("Search chats", "চ্যাট খুঁজুন")}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {!ready ? (
          <div className="space-y-2 p-2" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-xl bg-muted/60 p-3">
                <div className="h-3 w-3/4 rounded-full bg-muted-foreground/15" />
                <div className="mt-2 h-2.5 w-full rounded-full bg-muted-foreground/10" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium">
              {t("No conversations yet", "এখনো কোনো কথোপকথন নেই")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                "Start a chat and it will appear here.",
                "একটি চ্যাট শুরু করুন, সেটি এখানে দেখা যাবে।",
              )}
            </p>
          </div>
        ) : grouped.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            {t("No chats match your search.", "আপনার খোঁজার সাথে কোনো চ্যাট মেলেনি।")}
          </p>
        ) : (
          grouped.map((group) => (
            <section key={group.key} className="pb-1">
              <h2 className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {groupLabels[group.key]}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((session) => {
                  const active = session.id === activeId;
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative flex items-center rounded-xl transition-colors",
                        active
                          ? "bg-primary/10 ring-1 ring-inset ring-primary/20"
                          : "hover:bg-accent",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => selectSession(session.id)}
                        aria-current={active ? "true" : undefined}
                        title={session.title}
                        className="flex min-w-0 flex-1 items-start gap-2.5 rounded-xl px-2.5 py-2 pr-8 text-left"
                      >
                        <MessageSquare
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "truncate text-sm font-medium",
                                active && "text-primary",
                              )}
                            >
                              {session.title}
                            </span>
                            {pendingId === session.id && (
                              <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {sessionPreview(session) ||
                              t("No messages yet", "এখনো কোনো বার্তা নেই")}
                          </span>
                        </span>
                        <span className="ml-auto shrink-0 pt-0.5 text-[10px] text-muted-foreground">
                          {timeLabel(session.updatedAt, lang)}
                        </span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={t("Chat actions", "চ্যাটের কাজ")}
                            className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-opacity hover:bg-background/80 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/40 data-[state=open]:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onSelect={() => openRename(session)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("Rename", "নাম বদলান")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setDeleteTarget(session)}
                            disabled={pendingId === session.id}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("Delete", "মুছুন")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="border-t border-border px-3 py-3 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between gap-2">
          <span>{t("Saved in this browser", "এই ব্রাউজারে সংরক্ষিত")}</span>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={() => setClearOpen(true)}
              className="shrink-0 font-medium transition-colors hover:text-destructive"
            >
              {t("Clear all", "সব মুছুন")}
            </button>
          )}
        </div>
        {storageError && (
          <p className="mt-1 text-destructive">
            {t("History couldn't be saved.", "ইতিহাস সংরক্ষণ করা যায়নি।")}
          </p>
        )}
      </div>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Rename chat", "চ্যাটের নাম বদলান")}</DialogTitle>
            <DialogDescription>
              {t("Give this conversation a short name.", "এই কথোপকথনের একটি ছোট নাম দিন।")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRename} className="space-y-4">
            <Input
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={80}
              placeholder={t("Chat name", "চ্যাটের নাম")}
              aria-label={t("Chat name", "চ্যাটের নাম")}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={!renameValue.trim()}>
                {t("Save", "সংরক্ষণ")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this chat?", "এই চ্যাটটি মুছবেন?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This removes the conversation from this browser. It can't be undone.",
                "এটি এই ব্রাউজার থেকে কথোপকথনটি সরিয়ে দেবে। এটি ফিরিয়ে আনা যাবে না।",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "বাতিল")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {t("Delete", "মুছুন")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Clear all chats?", "সব চ্যাট মুছবেন?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "All saved conversations in this browser will be deleted. This can't be undone.",
                "এই ব্রাউজারে সংরক্ষিত সব কথোপকথন মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "বাতিল")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                onClearAll();
                onClose?.();
              }}
            >
              {t("Clear all", "সব মুছুন")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
