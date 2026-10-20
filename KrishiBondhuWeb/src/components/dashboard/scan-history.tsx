import { useMemo, useState } from "react";
import { isToday, isYesterday } from "date-fns";
import { Leaf, MoreHorizontal, Plus, ScanLine, Trash2 } from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { scanConfidence, scanLabel, type ScanRecord } from "@/lib/scan-store";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type ScanHistoryProps = {
  scans: ScanRecord[];
  activeId: string | null;
  ready: boolean;
  storageError: boolean;
  disabled?: boolean;
  onNew: () => void;
  onOpen: (scan: ScanRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
};

type GroupKey = "today" | "yesterday" | "older";
const GROUPS: GroupKey[] = ["today", "yesterday", "older"];

function groupFor(timestamp: number): GroupKey {
  const date = new Date(timestamp);
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
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

export function ScanHistoryPanel({
  scans,
  activeId,
  ready,
  storageError,
  disabled = false,
  onNew,
  onOpen,
  onDelete,
  onClearAll,
  onClose,
}: ScanHistoryProps) {
  const { lang, t } = useLang();
  const [deleteTarget, setDeleteTarget] = useState<ScanRecord | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const grouped = useMemo(() => {
    const buckets = new Map<GroupKey, ScanRecord[]>();
    for (const key of GROUPS) buckets.set(key, []);
    for (const scan of scans) buckets.get(groupFor(scan.createdAt))?.push(scan);
    return GROUPS.map((key) => ({ key, items: buckets.get(key) ?? [] })).filter(
      (group) => group.items.length > 0,
    );
  }, [scans]);

  const groupLabels: Record<GroupKey, string> = {
    today: t("Today", "আজ"),
    yesterday: t("Yesterday", "গতকাল"),
    older: t("Earlier", "পুরোনো"),
  };

  function startNew() {
    onNew();
    onClose?.();
  }

  function openScan(scan: ScanRecord) {
    if (disabled) return;
    onOpen(scan);
    onClose?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-3">
        <Button
          type="button"
          onClick={startNew}
          disabled={disabled}
          className="w-full justify-start gap-2 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" />
          {t("New scan", "নতুন স্ক্যান")}
        </Button>
        <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>{t("Scan history", "স্ক্যান ইতিহাস")}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
            {scans.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {!ready ? (
          <div className="space-y-2 p-2" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex animate-pulse gap-2 rounded-xl bg-muted/60 p-2">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-muted-foreground/15" />
                <div className="min-w-0 flex-1 py-1">
                  <div className="h-3 w-3/4 rounded-full bg-muted-foreground/15" />
                  <div className="mt-2 h-2.5 w-1/2 rounded-full bg-muted-foreground/10" />
                </div>
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <ScanLine className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium">
              {t("No saved scans yet", "এখনো কোনো স্ক্যান সংরক্ষিত নেই")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                "Your completed diagnoses will appear here.",
                "আপনার সম্পন্ন নির্ণয়গুলো এখানে দেখা যাবে।",
              )}
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <section key={group.key} className="pb-1">
              <h2 className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {groupLabels[group.key]}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((scan) => {
                  const active = scan.id === activeId;
                  const label = scanLabel(scan);
                  const confidence = scanConfidence(scan);

                  return (
                    <div
                      key={scan.id}
                      className={cn(
                        "group relative flex items-center rounded-xl transition-colors",
                        active
                          ? "bg-primary/10 ring-1 ring-inset ring-primary/20"
                          : "hover:bg-accent",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => openScan(scan)}
                        disabled={disabled}
                        aria-current={active ? "true" : undefined}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-2 pr-8 text-left disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted ring-1 ring-inset ring-border">
                          {scan.thumbnail ? (
                            <img
                              src={scan.thumbnail}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Leaf className="h-5 w-5 text-muted-foreground" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-sm font-medium",
                              active && "text-primary",
                            )}
                          >
                            {t(label.en, label.bn)}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {confidence !== null
                              ? `${confidence}% ${t("confidence", "নিশ্চিততা")}`
                              : t("No match", "মিল নেই")}
                            <span className="mx-1.5">·</span>
                            {timeLabel(scan.createdAt, lang)}
                          </span>
                        </span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={t("Scan actions", "স্ক্যানের কাজ")}
                            className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-opacity hover:bg-background/80 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/40 data-[state=open]:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onSelect={() => setDeleteTarget(scan)}
                            disabled={disabled}
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
          {scans.length > 0 && (
            <button
              type="button"
              onClick={() => setClearOpen(true)}
              disabled={disabled}
              className="shrink-0 font-medium transition-colors hover:text-destructive disabled:opacity-50"
            >
              {t("Clear all", "সব মুছুন")}
            </button>
          )}
        </div>
        {storageError && (
          <p className="mt-1 text-destructive">
            {t("Scan history couldn't be saved.", "স্ক্যান ইতিহাস সংরক্ষণ করা যায়নি।")}
          </p>
        )}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this scan?", "এই স্ক্যানটি মুছবেন?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "The photo, result and advice will be removed from this browser. This can't be undone.",
                "ছবি, ফলাফল ও পরামর্শ এই ব্রাউজার থেকে মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।",
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
            <AlertDialogTitle>{t("Clear all scans?", "সব স্ক্যান মুছবেন?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "All saved scan photos and results in this browser will be deleted. This can't be undone.",
                "এই ব্রাউজারে সংরক্ষিত সব স্ক্যানের ছবি ও ফলাফল মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।",
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
