import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-client";
import { User, MapPin, Globe, LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { lang, setLang, t } = useLang();
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("Settings", "সেটিংস")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("Manage your profile and preferences", "আপনার প্রোফাইল ও পছন্দ পরিচালনা করুন")}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-6 space-y-6">
        <h2 className="font-semibold font-display">{t("Profile", "প্রোফাইল")}</h2>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
            {user
              ? user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "?"}
          </div>
          <div>
            <div className="font-medium">{user?.name ?? t("Guest", "অতিথি")}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5">
              <User className="h-4 w-4" /> {t("Name", "নাম")}
            </label>
            <input
              type="text"
              defaultValue={user?.name}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              readOnly
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {t("District", "জেলা")}
            </label>
            <input
              type="text"
              defaultValue={user?.district}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-6 space-y-4">
        <h2 className="font-semibold font-display">{t("Preferences", "পছন্দ")}</h2>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{t("Language", "ভাষা")}</span>
          </div>
          <div className="flex gap-1 bg-accent rounded-lg p-1">
            <button
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                lang === "en" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("bn")}
              aria-pressed={lang === "bn"}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                lang === "bn" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-6">
        <h2 className="font-semibold font-display mb-4">{t("Account", "অ্যাকাউন্ট")}</h2>
        <button
          onClick={async () => {
            await signOut();
          }}
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t("Sign out", "সাইন আউট")}
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          {t(
            "This will sign you out and redirect to the home page.",
            "এটি আপনাকে সাইন আউট করবে এবং হোম পেজে পুনঃনির্দেশ করবে।",
          )}
        </p>
      </div>
    </div>
  );
}
