import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Phone, Mail, ArrowLeft, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useLang, LangProvider } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

type Step = "choose" | "phone" | "verify";

function RouteComponent() {
  return (
    <LangProvider>
      <LoginPage />
    </LangProvider>
  );
}

function LoginPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const handleGoogle = async () => {
    setLoading("google");
    setError("");
    try {
      await authClient.signIn.social({ provider: "google" });
      navigate({ to: "/dashboard" });
    } catch (e) {
      setError("Google sign-in failed. Try again.");
    }
    setLoading("");
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError("Enter phone number");
      return;
    }
    setLoading("otp");
    setError("");
    try {
      const { error: err } = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone.startsWith("+") ? phone : `+88${phone}`,
      });
      if (err) throw new Error(err.message || "Failed to send OTP");
      setStep("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    }
    setLoading("");
  };

  const handleVerifyOtp = async () => {
    if (!code.trim()) {
      setError("Enter verification code");
      return;
    }
    setLoading("verify");
    setError("");
    try {
      const { error: err } = await authClient.phoneNumber.verify({
        phoneNumber: phone.startsWith("+") ? phone : `+88${phone}`,
        code: code.trim(),
      });
      if (err) throw new Error(err.message || "Invalid code");
      setVerified(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    }
    setLoading("");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-[#0A110D] dark:via-[#0F1812] dark:to-[#0A110D] flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 hero-grid opacity-30 dark:opacity-20 pointer-events-none"
      />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back to home", "হোমে ফিরুন")}
        </Link>

        <div className="glass rounded-3xl p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold">
                {t("KrishiBondhu", "কৃষিবন্ধু")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("AI Farming Assistant", "এআই কৃষি সহকারী")}
              </div>
            </div>
          </div>

          {verified ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">{t("Signed in!", "সাইন ইন হয়েছে!")}</p>
              <p className="text-sm text-muted-foreground">
                {t("Redirecting…", "রিডাইরেক্ট হচ্ছে…")}
              </p>
            </div>
          ) : step === "choose" ? (
            <>
              <h1 className="text-2xl font-bold font-display mb-2">
                {t("Welcome back", "স্বাগতম")}
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                {t("Sign in to your farming dashboard", "আপনার কৃষি ড্যাশবোর্ডে সাইন ইন করুন")}
              </p>

              {error && (
                <p className="text-sm text-red-500 mb-4 bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleGoogle}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors px-5 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {loading === "google" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {t("Continue with Google", "গুগল দিয়ে চালিয়ে যান")}
                </button>

                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                  <span className="text-xs text-muted-foreground">{t("or", "অথবা")}</span>
                  <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                </div>

                <button
                  onClick={() => setStep("phone")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors px-5 py-3 text-sm font-medium disabled:opacity-50"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  {t("Continue with Phone", "ফোন দিয়ে চালিয়ে যান")}
                </button>
              </div>

              <p className="mt-8 text-xs text-center text-muted-foreground">
                {t("By signing in, you agree to our", "সাইন ইন করার মাধ্যমে, আপনি আমাদের")}{" "}
                <span className="underline underline-offset-2 hover:text-foreground cursor-pointer">
                  {t("Terms", "শর্তাবলী")}
                </span>
              </p>
            </>
          ) : step === "phone" ? (
            <>
              <button
                onClick={() => {
                  setStep("choose");
                  setError("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("Back", "পিছনে")}
              </button>

              <h1 className="text-2xl font-bold font-display mb-2">
                {t("Phone sign in", "ফোন সাইন ইন")}
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                {t("Enter your phone number to receive a code", "কোড পেতে আপনার ফোন নম্বর দিন")}
              </p>

              {error && (
                <p className="text-sm text-red-500 mb-4 bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {t("Phone Number", "ফোন নম্বর")}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801XXXXXXXXX"
                    className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  />
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading === "otp" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {t("Send Code", "কোড পাঠান")}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setStep("phone");
                  setError("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("Back", "পিছনে")}
              </button>

              <h1 className="text-2xl font-bold font-display mb-2">{t("Enter code", "কোড দিন")}</h1>
              <p className="text-sm text-muted-foreground mb-2">
                {t("Code sent to", "কোড পাঠানো হয়েছে")}{" "}
                <span className="font-medium text-foreground">
                  {phone.startsWith("+88") ? phone : `+88${phone}`}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mb-8">
                {t("(Check console in dev mode)", "(ডেভ মোডে কনসোল চেক করুন)")}
              </p>

              {error && (
                <p className="text-sm text-red-500 mb-4 bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {t("6-digit code", "৬-সংখ্যার কোড")}
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary/40 transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={!!loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading === "verify" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {t("Verify", "নিশ্চিত করুন")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
