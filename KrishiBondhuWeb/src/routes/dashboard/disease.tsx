import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { DISEASES, MODEL_CLASS_TO_DISEASE, type Disease } from "@/data/diseases";
import {
  predictDisease,
  getAdvice,
  backendLabel,
  type PredictionResult,
  type Advice,
} from "@/lib/model-api";
import { cn } from "@/lib/utils";
import {
  Camera,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Loader2,
  SearchX,
  ScanSearch,
  Sparkles,
  RefreshCw,
  History,
  Plus,
} from "lucide-react";
import { ScanHistoryPanel } from "@/components/dashboard/scan-history";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  clearScanRecords,
  deleteScanRecord,
  listScans,
  MAX_SCANS,
  newScanId,
  prepareScanImage,
  saveScan,
  type ScanRecord,
} from "@/lib/scan-store";

export const Route = createFileRoute("/dashboard/disease")({
  component: DiseaseDetectionPage,
});

function severityTone(severity: Disease["severity"]) {
  if (severity === "high")
    return {
      icon: "text-red-500 dark:text-red-400",
      badge:
        "bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30",
      label: { en: "High", bn: "বেশি" },
    };
  if (severity === "medium")
    return {
      icon: "text-amber-500 dark:text-amber-400",
      badge:
        "bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
      label: { en: "Medium", bn: "মাঝারি" },
    };
  return {
    icon: "text-sky-500 dark:text-sky-400",
    badge:
      "bg-sky-50 text-sky-600 ring-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30",
    label: { en: "Low", bn: "কম" },
  };
}

function DiseaseDetectionPage() {
  const { t } = useLang();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scanRequestRef = useRef(0);
  const analyzingRef = useRef(false);
  const removedScanIdsRef = useRef<Set<string>>(new Set());
  const clearGenerationRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    listScans()
      .then((rows) => {
        if (!cancelled) setScans(rows);
      })
      .catch(() => {
        if (!cancelled) setHistoryError(true);
      })
      .finally(() => {
        if (!cancelled) setHistoryReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const matchedIdx =
    result?.top && MODEL_CLASS_TO_DISEASE[result.top.class] !== undefined
      ? MODEL_CLASS_TO_DISEASE[result.top.class]
      : null;
  const disease = selectedIdx ?? matchedIdx;
  const diseaseInfo = disease !== null ? DISEASES[disease] : null;
  const tone = diseaseInfo ? severityTone(diseaseInfo.severity) : null;

  async function persistRecord(record: ScanRecord, generation: number) {
    if (generation !== clearGenerationRef.current || removedScanIdsRef.current.has(record.id)) {
      return false;
    }

    try {
      await saveScan(record);

      if (generation !== clearGenerationRef.current || removedScanIdsRef.current.has(record.id)) {
        try {
          await deleteScanRecord(record.id);
        } catch {
          // The record was already removed.
        }
        return false;
      }

      setHistoryError(false);
      setScans((prev) => {
        const exists = prev.some((item) => item.id === record.id);
        const next = exists
          ? prev.map((item) => (item.id === record.id ? record : item))
          : [record, ...prev];
        return next.slice(0, MAX_SCANS);
      });
      return true;
    } catch {
      setHistoryError(true);
      return false;
    }
  }

  const analyze = async (file: File) => {
    if (analyzingRef.current) return;
    analyzingRef.current = true;

    const requestId = ++scanRequestRef.current;
    const historyGeneration = clearGenerationRef.current;
    const scanId = newScanId();
    const startedAt = Date.now();

    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setAnalyzing(true);
    setResult(null);
    setAdvice(null);
    setAdviceLoading(false);
    setError(null);
    setSelectedIdx(null);
    setActiveScanId(null);

    try {
      const [res, media] = await Promise.all([predictDisease(file), prepareScanImage(file)]);
      if (requestId !== scanRequestRef.current) return;

      setResult(res);
      setAnalyzing(false);

      const record: ScanRecord = {
        id: scanId,
        createdAt: startedAt,
        image: media.image,
        thumbnail: media.thumbnail,
        result: res,
        advice: null,
      };
      const saved = await persistRecord(record, historyGeneration);
      if (saved && requestId === scanRequestRef.current) {
        setActiveScanId(scanId);
      }

      if (res.detections.length) {
        setAdviceLoading(true);
        const idx =
          res.top && MODEL_CLASS_TO_DISEASE[res.top.class] !== undefined
            ? MODEL_CLASS_TO_DISEASE[res.top.class]
            : null;
        const nextAdvice = await getAdvice(res, idx !== null ? DISEASES[idx] : null);

        if (requestId === scanRequestRef.current) {
          setAdvice(nextAdvice);
          setAdviceLoading(false);
        }

        if (nextAdvice) {
          await persistRecord({ ...record, advice: nextAdvice }, historyGeneration);
        }
      }
    } catch (e) {
      if (requestId !== scanRequestRef.current) return;
      setAnalyzing(false);
      setAdviceLoading(false);
      const detail = e instanceof Error ? e.message : String(e);
      const cause = detail.length > 140 ? detail.slice(0, 140) + "…" : detail;
      setError(
        t(
          `Could not reach the disease model. Is the ${backendLabel} running? — ${cause}`,
          `রোগ মডেলে পৌঁছানো যায়নি। ${backendLabel} চলছে কিনা দেখুন। — ${cause}`,
        ),
      );
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void analyze(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (analyzingRef.current) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void analyze(file);
  };

  function startNewScan() {
    if (analyzingRef.current) return;
    scanRequestRef.current += 1;
    setPreview(null);
    setDragOver(false);
    setSelectedIdx(null);
    setAnalyzing(false);
    setAdviceLoading(false);
    setResult(null);
    setAdvice(null);
    setError(null);
    setActiveScanId(null);
    setMobileHistoryOpen(false);
  }

  function openScan(scan: ScanRecord) {
    if (analyzingRef.current) return;
    scanRequestRef.current += 1;
    setPreview(URL.createObjectURL(scan.image));
    setDragOver(false);
    setSelectedIdx(null);
    setResult(scan.result);
    setAdvice(scan.advice);
    setAnalyzing(false);
    setAdviceLoading(false);
    setError(null);
    setActiveScanId(scan.id);
    setMobileHistoryOpen(false);
  }

  async function handleDeleteScan(id: string) {
    removedScanIdsRef.current.add(id);
    try {
      await deleteScanRecord(id);
      setScans((prev) => prev.filter((scan) => scan.id !== id));
      if (activeScanId === id) startNewScan();
    } catch {
      setHistoryError(true);
    }
  }

  async function handleClearAllScans() {
    clearGenerationRef.current += 1;
    for (const scan of scans) removedScanIdsRef.current.add(scan.id);
    try {
      await clearScanRecords();
      setScans([]);
      startNewScan();
    } catch {
      setHistoryError(true);
    }
  }

  const top3 = result?.detections.slice(0, 3) ?? [];
  const confPct = result?.top ? Math.round(result.top.conf * 100) : 0;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:max-h-[calc(100vh-3rem)] lg:w-72 lg:shrink-0 lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:bg-card lg:shadow-card lg:ring-1 lg:ring-border">
        <ScanHistoryPanel
          scans={scans}
          activeId={activeScanId}
          ready={historyReady}
          storageError={historyError}
          disabled={analyzing}
          onNew={startNewScan}
          onOpen={openScan}
          onDelete={handleDeleteScan}
          onClearAll={handleClearAllScans}
        />
      </aside>

      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent side="left" className="w-[86vw] p-0 pt-12 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("Scan history", "স্ক্যান ইতিহাস")}</SheetTitle>
            <SheetDescription>
              {t("Saved scans in this browser.", "এই ব্রাউজারে সংরক্ষিত স্ক্যান।")}
            </SheetDescription>
          </SheetHeader>
          <ScanHistoryPanel
            scans={scans}
            activeId={activeScanId}
            ready={historyReady}
            storageError={historyError}
            disabled={analyzing}
            onNew={startNewScan}
            onOpen={openScan}
            onDelete={handleDeleteScan}
            onClearAll={handleClearAllScans}
            onClose={() => setMobileHistoryOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-1 rounded-full bg-gradient-primary shrink-0" />
            <div>
              <h1 className="text-2xl font-bold font-display">
                {t("Disease Detection", "রোগ নির্ণয়")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t(
                  "Upload a photo or browse common diseases",
                  "ছবি আপলোড করুন বা সাধারণ রোগ দেখুন",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={t("Open scan history", "স্ক্যান ইতিহাস খুলুন")}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{t("History", "ইতিহাস")}</span>
            </button>
            <button
              type="button"
              onClick={startNewScan}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              aria-label={t("New scan", "নতুন স্ক্যান")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("New scan", "নতুন স্ক্যান")}</span>
            </button>
          </div>
        </div>

        {historyError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 lg:hidden">
            {t(
              "Scan history couldn't be saved in this browser.",
              "এই ব্রাউজারে স্ক্যান ইতিহাস সংরক্ষণ করা যায়নি।",
            )}
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          aria-label={t(
            "Upload crop photo for disease detection",
            "রোগ নির্ণয়ের জন্য ফসলের ছবি আপলোড করুন",
          )}
          className={cn(
            "group relative rounded-2xl border-2 border-dashed p-5 sm:p-10 text-center transition-all duration-200 cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5 ring-4 ring-primary/10 scale-[1.01]"
              : "border-border bg-card shadow-card hover:border-primary/50 hover:bg-primary/[0.03]",
          )}
          onClick={() => {
            if (!analyzingRef.current) fileRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!analyzingRef.current) fileRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!analyzingRef.current) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label={t("Upload crop photo", "ফসলের ছবি আপলোড করুন")}
            onChange={onFile}
          />
          {preview ? (
            <div className="space-y-4">
              <div className="relative mx-auto max-h-56 overflow-hidden rounded-xl ring-1 ring-border shadow-sm">
                <img
                  src={preview}
                  alt={t("Uploaded crop photo", "আপলোড করা ফসলের ছবি")}
                  className="mx-auto max-h-56 object-contain"
                />
              </div>
              {analyzing ? (
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {t("Analyzing image…", "ছবি বিশ্লেষণ করা হচ্ছে…")}
                </div>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                  <RefreshCw className="h-4 w-4" />
                  {t("Tap to analyze another photo", "আরেকটি ছবি বিশ্লেষণ করতে ট্যাপ করুন")}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary/10 ring-1 ring-inset ring-primary/20 transition-transform duration-200 group-hover:scale-105">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {t("Upload a photo of your crop", "আপনার ফসলের ছবি আপলোড করুন")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("Drag & drop or click to browse", "টেনে আনুন বা ব্রাউজ করতে ক্লিক করুন")}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                {t("Upload photo", "ছবি আপলোড")}
              </span>
            </div>
          )}
        </div>

        {result && (
          <div className="animate-fade-up overflow-hidden rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                  result.top
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30"
                    : "bg-sky-50 text-sky-600 ring-sky-500/20 dark:bg-sky-500/15 dark:text-sky-400 dark:ring-sky-500/30",
                )}
              >
                {result.top ? <ScanSearch className="h-5 w-5" /> : <SearchX className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold font-display">
                    {result.top
                      ? t("Diagnosis result", "নির্ণয়ের ফলাফল")
                      : t("No disease detected", "কোনো রোগ শনাক্ত হয়নি")}
                  </h3>
                  {activeScanId && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {t("Saved scan", "সংরক্ষিত স্ক্যান")}
                    </span>
                  )}
                </div>
                {result.top ? (
                  <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                    {result.top.class}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(
                      "The model found no known disease pattern above the confidence threshold.",
                      "মডেলটি নির্ভরতার মাত্রার উপরে কোনো পরিচিত রোগের ধারা খুঁজে পায়নি।",
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {result.top && (
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30">
                      {confPct}% {t("confidence", "নিশ্চিততা")}
                    </span>
                    <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-emerald-500/15">
                      <div
                        className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                        style={{ width: `${confPct}%` }}
                      />
                    </div>
                  </div>
                )}
                {tone && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      tone.badge,
                    )}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {t(`Severity: ${tone.label.en}`, `তীব্রতা: ${tone.label.bn}`)}
                  </span>
                )}
              </div>
            </div>

            {result.top && (advice || adviceLoading) && (
              <div
                className={cn(
                  "mt-4 rounded-xl border p-4",
                  advice
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                    : "border-border",
                )}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {t("AI Guidance", "এআই পরামর্শ")}
                  </span>
                </div>
                {adviceLoading ? (
                  <div className="space-y-2">
                    <div className="animate-shimmer h-3 w-11/12 rounded-full" />
                    <div className="animate-shimmer h-3 w-full rounded-full" />
                    <div className="animate-shimmer h-3 w-4/5 rounded-full" />
                  </div>
                ) : (
                  advice && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">
                      {t(advice.en, advice.bn)}
                    </p>
                  )
                )}
              </div>
            )}

            {top3.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {top3.map((d) => (
                  <span
                    key={d.class}
                    className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {d.class} · {(d.conf * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <h2 className="font-semibold font-display">
              {t("Common Diseases in Bangladesh", "বাংলাদেশের সাধারণ রোগ")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DISEASES.map((d, i) => {
              const t2 = severityTone(d.severity);
              return (
                <button
                  key={d.name}
                  onClick={() => setSelectedIdx(i)}
                  className={cn(
                    "group rounded-2xl border p-4 text-left transition-all duration-200",
                    selectedIdx === i
                      ? "border-primary bg-primary/5 shadow-glow ring-1 ring-primary/30"
                      : "border-border bg-card shadow-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-4 w-4 shrink-0", t2.icon)} />
                      <span className="font-medium text-sm">{t(d.name, d.nameBn)}</span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                        t2.badge,
                      )}
                    >
                      {t(t2.label.en, t2.label.bn)}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {t(d.crops.join(", "), d.cropsBn.join(", "))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {!diseaseInfo && !result && !analyzing && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t(
                "Upload a photo or select a disease above to see diagnosis details.",
                "রোগ নির্ণয়ের বিস্তারিত দেখতে একটি ছবি আপলোড করুন বা উপরে একটি রোগ নির্বাচন করুন।",
              )}
            </p>
          </div>
        )}

        {!diseaseInfo && result && !result.top && !analyzing && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-card">
            <SearchX className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t(
                "This photo does not match any curated disease. Try a clearer close-up of the affected leaf.",
                "এই ছবিটি কোনো পরিচিত রোগের সাথে মিলছে না। আক্রান্ত পাতার কাছের ছবি তুলে আবার চেষ্টা করুন।",
              )}
            </p>
          </div>
        )}

        {diseaseInfo && tone && (
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                  tone.badge,
                )}
              >
                <AlertTriangle className={cn("h-5 w-5", tone.icon)} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold font-display">
                  {t(diseaseInfo.name, diseaseInfo.nameBn)}
                </h3>
                <span
                  className={cn(
                    "mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                    tone.badge,
                  )}
                >
                  {t(`Severity: ${tone.label.en}`, `তীব্রতা: ${tone.label.bn}`)}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-medium mb-1.5">{t("Symptoms", "উপসর্গ")}</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
                {diseaseInfo.symptoms.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{t(s, diseaseInfo.symptomsBn[i])}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                  <Leaf className="h-4 w-4" /> {t("Organic Treatment", "জৈব চিকিৎসা")}
                </h4>
                <p className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">
                  {t(diseaseInfo.organicTreatment, diseaseInfo.organicTreatmentBn)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200/70 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                  {t("Chemical Treatment", "রাসায়নিক চিকিৎসা")}
                </h4>
                <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                  {t(diseaseInfo.chemicalTreatment, diseaseInfo.chemicalTreatmentBn)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-accent/40 p-4">
              <h4 className="text-sm font-medium mb-1">{t("Prevention", "প্রতিরোধ")}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(diseaseInfo.prevention, diseaseInfo.preventionBn)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
