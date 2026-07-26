import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { DISEASES } from "@/data/diseases";
import { Camera, AlertTriangle, CheckCircle2, Leaf } from "lucide-react";

export const Route = createFileRoute("/dashboard/disease")({
  component: DiseaseDetectionPage,
});

function DiseaseDetectionPage() {
  const { t } = useLang();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const disease = selectedIdx !== null ? DISEASES[selectedIdx] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("Disease Detection", "রোগ নির্ণয়")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("Upload a photo or browse common diseases", "ছবি আপলোড করুন বা সাধারণ রোগ দেখুন")}
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={t(
          "Upload crop photo for disease detection",
          "রোগ নির্ণয়ের জন্য ফসলের ছবি আপলোড করুন",
        )}
        className={`rounded-xl border-2 border-dashed p-4 sm:p-10 text-center transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        }`}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          setUploaded(true);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label={t("Upload crop photo", "ফসলের ছবি আপলোড করুন")}
          onChange={() => setUploaded(true)}
        />
        {uploaded ? (
          <div className="space-y-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-medium">{t("Photo uploaded!", "ছবি আপলোড হয়েছে!")}</p>
            <p className="text-xs text-muted-foreground">
              {t(
                "Select a disease below to see diagnosis",
                "রোগ নির্ণয় দেখতে নিচে একটি রোগ নির্বাচন করুন",
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">
              {t("Upload a photo of your crop", "আপনার ফসলের ছবি আপলোড করুন")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("Drag & drop or click to browse", "টেনে আনুন বা ব্রাউজ করতে ক্লিক করুন")}
            </p>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold font-display mb-3">
          {t("Common Diseases in Bangladesh", "বাংলাদেশের সাধারণ রোগ")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DISEASES.map((d, i) => (
            <button
              key={d.name}
              onClick={() => setSelectedIdx(i)}
              className={`rounded-xl border p-4 text-left transition-all ${
                selectedIdx === i
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-white/10 bg-[#121E16]/40 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`h-4 w-4 ${
                    d.severity === "high"
                      ? "text-red-500"
                      : d.severity === "medium"
                        ? "text-amber-500"
                        : "text-sky-500"
                  }`}
                />
                <span className="font-medium text-sm">{t(d.name, d.nameBn)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t(d.crops.join(", "), d.cropsBn.join(", "))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {!disease && !uploaded && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t(
              "Upload a photo or select a disease above to see diagnosis details.",
              "রোগ নির্ণয়ের বিস্তারিত দেখতে একটি ছবি আপলোড করুন বা উপরে একটি রোগ নির্বাচন করুন।",
            )}
          </p>
        </div>
      )}

      {disease && (
        <div className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`h-5 w-5 ${
                disease.severity === "high"
                  ? "text-red-500"
                  : disease.severity === "medium"
                    ? "text-amber-500"
                    : "text-sky-500"
              }`}
            />
            <div>
              <h3 className="font-semibold font-display">{t(disease.name, disease.nameBn)}</h3>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  disease.severity === "high"
                    ? "bg-red-50 text-red-600"
                    : disease.severity === "medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-sky-50 text-sky-600"
                }`}
              >
                {t(
                  `Severity: ${disease.severity}`,
                  `তীব্রতা: ${disease.severity === "high" ? "বেশি" : disease.severity === "medium" ? "মাঝারি" : "কম"}`,
                )}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">{t("Symptoms", "উপসর্গ")}</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {disease.symptoms.map((s, i) => (
                <li key={i}>• {t(s, disease.symptomsBn[i])}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-emerald-50 p-4">
              <h4 className="text-sm font-medium text-emerald-700 mb-1 flex items-center gap-1">
                <Leaf className="h-4 w-4" /> {t("Organic Treatment", "জৈব চিকিৎসা")}
              </h4>
              <p className="text-sm text-emerald-800">
                {t(disease.organicTreatment, disease.organicTreatmentBn)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="text-sm font-medium text-blue-700 mb-1">
                {t("Chemical Treatment", "রাসায়নিক চিকিৎসা")}
              </h4>
              <p className="text-sm text-blue-800">
                {t(disease.chemicalTreatment, disease.chemicalTreatmentBn)}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-accent/50 p-4">
            <h4 className="text-sm font-medium mb-1">{t("Prevention", "প্রতিরোধ")}</h4>
            <p className="text-sm text-muted-foreground">
              {t(disease.prevention, disease.preventionBn)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
