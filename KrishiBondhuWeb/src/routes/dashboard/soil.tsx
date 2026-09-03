import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { FlaskConical, Sprout, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/soil")({
  component: SoilPage,
});

function SoilPage() {
  const { t } = useLang();
  const [form, setForm] = useState({
    ph: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    texture: "loam",
    organicMatter: "",
  });
  const [result, setResult] = useState<{
    ph: string;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    texture: string;
    organicMatter: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult({
      ph: form.ph || "6.5",
      nitrogen: form.nitrogen || "Medium",
      phosphorus: form.phosphorus || "Low",
      potassium: form.potassium || "High",
      texture: form.texture,
      organicMatter: form.organicMatter || "2.5%",
    });
  };

  const ph = result ? parseFloat(result.ph) : 7;
  const rec =
    ph < 5.5
      ? {
          crops: ["Potato", "Tea", "Blueberry"],
          cropsBn: ["আলু", "চা", "ব্লুবেরি"],
          advice:
            "Apply agricultural lime (2–3 tons/ha) to raise pH. Add bone meal for phosphorus.",
          adviceBn:
            "pH বাড়াতে কৃষি চুন (২–৩ টন/হেক্টর) প্রয়োগ করুন। ফসফরাসের জন্য হাড়ের গুঁড়ো যোগ করুন।",
        }
      : ph > 7.5
        ? {
            crops: ["Date Palm", "Cotton", "Barley"],
            cropsBn: ["খেজুর", "তুলা", "বার্লি"],
            advice: "Apply sulfur or gypsum (1–2 tons/ha) to lower pH.",
            adviceBn: "pH কমাতে গন্ধক বা জিপসাম (১–২ টন/হেক্টর) প্রয়োগ করুন।",
          }
        : {
            crops: ["Rice", "Wheat", "Jute", "Vegetables"],
            cropsBn: ["ধান", "গম", "পাট", "সবজি"],
            advice:
              "Excellent soil conditions. Maintain with organic compost (2–3 tons/ha annually).",
            adviceBn: "দারুণ মাটির অবস্থা। জৈব খাদ্য (২–৩ টন/হেক্টর/বছর) দিয়ে বজায় রাখুন।",
          };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("Soil Analysis", "মাটি বিশ্লেষণ")}</h1>
        <p className="text-muted-foreground mt-1">
          {t(
            "Enter your soil test results for crop recommendations",
            "ফসলের সুপারিশের জন্য মাটি পরীক্ষার ফলাফল দিন",
          )}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="soil-ph" className="text-sm font-medium">
              {t("Soil pH", "মাটির pH")}
            </label>
            <input
              id="soil-ph"
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={form.ph}
              onChange={(e) => setForm({ ...form, ph: e.target.value })}
              placeholder="5.5 – 7.5"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="soil-nitrogen" className="text-sm font-medium">
              {t("Nitrogen (N)", "নাইট্রোজেন (N)")}
            </label>
            <select
              id="soil-nitrogen"
              value={form.nitrogen}
              onChange={(e) => setForm({ ...form, nitrogen: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">{t("Select...", "নির্বাচন...")}</option>
              <option value="Low">{t("Low", "কম")}</option>
              <option value="Medium">{t("Medium", "মাঝারি")}</option>
              <option value="High">{t("High", "বেশি")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="soil-phosphorus" className="text-sm font-medium">
              {t("Phosphorus (P)", "ফসফরাস (P)")}
            </label>
            <select
              id="soil-phosphorus"
              value={form.phosphorus}
              onChange={(e) => setForm({ ...form, phosphorus: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">{t("Select...", "নির্বাচন...")}</option>
              <option value="Low">{t("Low", "কম")}</option>
              <option value="Medium">{t("Medium", "মাঝারি")}</option>
              <option value="High">{t("High", "বেশি")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="soil-potassium" className="text-sm font-medium">
              {t("Potassium (K)", "পটাশিয়াম (K)")}
            </label>
            <select
              id="soil-potassium"
              value={form.potassium}
              onChange={(e) => setForm({ ...form, potassium: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">{t("Select...", "নির্বাচন...")}</option>
              <option value="Low">{t("Low", "কম")}</option>
              <option value="Medium">{t("Medium", "মাঝারি")}</option>
              <option value="High">{t("High", "বেশি")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="soil-texture" className="text-sm font-medium">
              {t("Soil Texture", "মাটির গঠন")}
            </label>
            <select
              id="soil-texture"
              value={form.texture}
              onChange={(e) => setForm({ ...form, texture: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="sandy">{t("Sandy", "বালুময়")}</option>
              <option value="loam">{t("Loamy", "দোআঁশ")}</option>
              <option value="clay">{t("Clay", "কাদামাটি")}</option>
              <option value="silt">{t("Silt", "পলি")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="soil-organic" className="text-sm font-medium">
              {t("Organic Matter %", "জৈব পদার্থ %")}
            </label>
            <input
              id="soil-organic"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.organicMatter}
              onChange={(e) => setForm({ ...form, organicMatter: e.target.value })}
              placeholder="1.5 – 4.0"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("Analyze Soil", "মাটি বিশ্লেষণ করুন")}
        </button>
      </form>

      {result && (
        <div className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h2 className="font-semibold font-display">
              {t("Analysis Results", "বিশ্লেষণ ফলাফল")}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "pH", value: result.ph },
              { label: t("Nitrogen", "নাইট্রোজেন"), value: result.nitrogen },
              { label: t("Phosphorus", "ফসফরাস"), value: result.phosphorus },
              { label: t("Potassium", "পটাশিয়াম"), value: result.potassium },
              { label: t("Texture", "গঠন"), value: result.texture },
              { label: t("Organic Matter", "জৈব পদার্থ"), value: result.organicMatter },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-accent/50 p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-semibold mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-emerald-50 p-4">
            <h3 className="text-sm font-medium text-emerald-700 flex items-center gap-1 mb-2">
              <Sprout className="h-4 w-4" /> {t("Recommended Crops", "সুপারিশকৃত ফসল")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {rec.crops.map((c, i) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800 font-medium"
                >
                  {t(c, rec.cropsBn[i])}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-accent/50 p-4">
            <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-primary" /> {t("Advice", "পরামর্শ")}
            </h3>
            <p className="text-sm text-muted-foreground">{t(rec.advice, rec.adviceBn)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
