import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Leaf,
  Mic,
  ScanLine,
  Satellite,
  Sprout,
  CloudSun,
  Store,
  ArrowRight,
  Play,
  Check,
  Github,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  ChevronDown,
  Sparkles,
  Bot,
  Brain,
  Eye,
  Globe,
  Cpu,
  Database,
  Layers,
  Zap,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Users,
  Award,
  Clock,
  Target,
  Languages,
  Moon,
  Sun,
} from "lucide-react";
import heroImg from "@/assets/hero-farmer.jpg";
import satImg from "@/assets/satellite-ndvi.jpg";
import diseaseImg from "@/assets/disease-detection.jpg";
import { LangProvider, useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/")({
  component: LandingWithProvider,
});

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
      {children}
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref as React.Ref<HTMLElement>}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Comp>
  );
}

function RotatingWord({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const t = setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words, interval]);
  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  return (
    <span className="relative inline-flex align-baseline" style={{ perspective: "800px" }}>
      <span aria-hidden className="invisible whitespace-nowrap">
        {widest}
      </span>
      <span
        key={i}
        className="word-flip absolute inset-0 text-gradient animate-gradient whitespace-nowrap"
      >
        {words[i]}
      </span>
      <span
        aria-hidden
        className="ml-1 inline-block w-[3px] h-[0.9em] translate-y-[0.15em] bg-primary animate-caret rounded-sm"
      />
    </span>
  );
}

function MagneticButton({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline";
  size?: "md" | "lg";
  href?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const rafRef = useRef(0);
  const handleMove = (e: React.MouseEvent) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
  };
  const handleLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0,0)";
  };
  const base =
    "magnetic inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 whitespace-nowrap relative overflow-hidden";
  const sizes = { md: "px-5 py-2.5 text-sm", lg: "px-7 py-3.5 text-base" };
  const variants = {
    primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-elevated",
    outline:
      "border border-border bg-card/50 text-foreground hover:bg-accent hover:border-primary/40",
    ghost: "text-foreground hover:bg-accent",
  };
  const cls = `${base} ${sizes[size]} ${variants[variant]}`;
  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/25 blur-md animate-beam"
        />
      )}
    </>
  );
  if (href)
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={cls}
      >
        {inner}
      </a>
    );
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      className={cls}
    >
      {inner}
    </button>
  );
}

function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline";
  size?: "md" | "lg";
  href?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 whitespace-nowrap";
  const sizes = { md: "px-5 py-2.5 text-sm", lg: "px-7 py-3.5 text-base" };
  const variants = {
    primary:
      "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.03] hover:shadow-elevated",
    outline:
      "border border-border bg-card/50 text-foreground hover:bg-accent hover:border-primary/40",
    ghost: "text-foreground hover:bg-accent",
  };
  const cls = `${base} ${sizes[size]} ${variants[variant]}`;
  if (href)
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "bn" : "en")}
      aria-label="Toggle language"
      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition"
    >
      <Languages className="h-3.5 w-3.5" />
      <span className={lang === "en" ? "text-primary font-semibold" : "text-muted-foreground"}>
        EN
      </span>
      <span className="text-muted-foreground">/</span>
      <span
        className={lang === "bn" ? "text-primary font-semibold" : "text-muted-foreground"}
        style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
      >
        বাং
      </span>
    </button>
  );
}

const NAV_SECTIONS = [
  { id: "modules", en: "Modules", bn: "মডিউল" },
  { id: "how", en: "How it works", bn: "কিভাবে কাজ করে" },
  { id: "tech", en: "Technology", bn: "প্রযুক্তি" },
  { id: "roadmap", en: "Roadmap", bn: "রোডম্যাপ" },
  { id: "faq", en: "FAQ", bn: "প্রশ্নোত্তর" },
] as const;

function Nav() {
  const { t } = useLang();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const navRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(e.target.id);
            break;
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!navRef.current || !active) return;
    const btn = navRef.current.querySelector(`[data-section="${active}"]`) as HTMLElement | null;
    if (!btn) return;
    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPillStyle({
      left: btnRect.left - navRect.left,
      width: btnRect.width,
    });
  }, [active]);

  function scrollTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-5"}`}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`flex items-center justify-between rounded-full px-5 py-2.5 transition-all duration-300 bg-white/80 dark:bg-[#0B150F]/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.5)] ${scrolled ? "shadow-elevated" : ""}`}
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-semibold">
                {t("KrishiBondhu", "কৃষিবন্ধু")}
              </div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">{t("AI", "এআই")}</div>
            </div>
          </a>

          <nav ref={navRef} className="hidden md:flex relative items-center gap-1 text-sm">
            <div
              className="absolute top-1/2 -translate-y-1/2 h-9 rounded-full bg-black/[0.06] dark:bg-white/[0.08] backdrop-blur-md border border-black/10 dark:border-white/10 transition-all duration-300 ease-out"
              style={{
                left: pillStyle.left,
                width: pillStyle.width || 0,
                opacity: active ? 1 : 0,
              }}
            />
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.id}
                data-section={s.id}
                onClick={() => scrollTo(s.id)}
                className={`relative z-10 px-3 py-1.5 rounded-full transition-colors duration-200 ${
                  active === s.id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(s.en, s.bn)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LangToggle />
            <button
              onClick={toggle}
              className="inline-flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-2 text-foreground hover:border-primary/40 hover:text-primary transition"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/dashboard"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground"
            >
              {t("Sign in", "সাইন ইন")}
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.03] hover:shadow-elevated transition-all duration-300 px-5 py-2.5 text-sm font-medium"
            >
              {t("Get Started", "শুরু করুন")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t, lang } = useLang();
  const sectionRef = useRef<HTMLElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const tiltRafRef = useRef(0);

  const onSectionMove = (e: React.MouseEvent) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", `${mx}%`);
      el.style.setProperty("--my", `${my}%`);
    });
  };

  const onTiltMove = (e: React.MouseEvent) => {
    if (tiltRafRef.current) return;
    tiltRafRef.current = requestAnimationFrame(() => {
      tiltRafRef.current = 0;
      const el = tiltRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--ry", `${x * 10}deg`);
      el.style.setProperty("--rx", `${-y * 10}deg`);
    });
  };
  const onTiltLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--ry", `0deg`);
    el.style.setProperty("--rx", `0deg`);
  };

  const words =
    lang === "bn"
      ? ["এআই-চালিত", "ভয়েস-ফার্স্ট", "ডেটা-চালিত", "বাংলা-নেটিভ"]
      : ["AI-Powered", "Voice-First", "Data-Driven", "Bangla-Native"];

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tiltRafRef.current) cancelAnimationFrame(tiltRafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={onSectionMove}
      className="relative overflow-hidden pt-32 pb-24 bg-gradient-hero contain-section"
    >
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div aria-hidden className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-0 spotlight" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-blob"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-primary-glow/25 blur-3xl animate-blob"
        style={{ animationDelay: "4s" }}
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div className="animate-fade-up">
            <SectionLabel>{t("Your AI Farming Companion", "আপনার এআই কৃষি সহচর")}</SectionLabel>
            <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              {lang === "bn" ? "বাংলাদেশের " : "Bangladesh's "}
              <RotatingWord words={words} /> <br className="hidden sm:block" />
              {t("Farming Assistant", "কৃষি সহকারী")}
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              {t(
                "An intelligent agriculture platform that helps farmers make better decisions using voice conversations, crop disease detection, satellite imagery, soil intelligence, weather forecasting, and localized agricultural knowledge.",
                "একটি বুদ্ধিমান কৃষি প্ল্যাটফর্ম যা কণ্ঠস্বর কথোপকথন, ফসলের রোগ শনাক্তকরণ, স্যাটেলাইট চিত্র, মাটির তথ্য, আবহাওয়ার পূর্বাভাস এবং স্থানীয় কৃষি জ্ঞান ব্যবহার করে কৃষকদের সঠিক সিদ্ধান্ত নিতে সাহায্য করে।",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <MagneticButton size="lg">
                {t("Get Started", "শুরু করুন")} <ArrowRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton size="lg" variant="outline">
                <Play className="h-4 w-4" /> {t("Watch Demo", "ডেমো দেখুন")}
              </MagneticButton>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />{" "}
                {t("Bangla voice-first", "বাংলা ভয়েস-ফার্স্ট")}
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />{" "}
                {t("Works on low-end phones", "সাধারণ ফোনেও চলে")}
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />{" "}
                {t("Trusted by NGOs", "এনজিও দ্বারা বিশ্বস্ত")}
              </div>
            </div>
          </div>

          <div
            className="relative animate-fade-up"
            style={{ animationDelay: "150ms" }}
            onMouseMove={onTiltMove}
            onMouseLeave={onTiltLeave}
          >
            <div
              ref={tiltRef}
              className="tilt-3d relative rounded-3xl overflow-hidden shadow-elevated border border-border/50"
            >
              <img
                src={heroImg}
                alt="Bangladeshi farmer using AI farming assistant"
                width={1536}
                height={1152}
                loading="lazy"
                decoding="async"
                className="w-full h-auto"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/20 blur-lg animate-beam"
              />
            </div>
            <div className="hidden md:block absolute -left-6 top-10 glass rounded-2xl p-4 shadow-card animate-float w-56">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Leaf className="h-3.5 w-3.5 text-primary" /> {t("Crop Health", "ফসলের স্বাস্থ্য")}
              </div>
              <div className="mt-2 font-display text-2xl font-semibold">
                92%{" "}
                <span className="text-xs font-normal text-primary">{t("Excellent", "চমৎকার")}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden relative">
                <div className="h-full w-[92%] bg-gradient-primary" />
                <div aria-hidden className="absolute inset-0 animate-shimmer opacity-70" />
              </div>
            </div>
            <div
              className="hidden md:block absolute -right-4 bottom-16 glass rounded-2xl p-4 shadow-card animate-float w-60"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-primary" />{" "}
                {t("Disease Detected", "রোগ শনাক্ত")}
              </div>
              <div className="mt-1 font-display text-base font-semibold">
                {t("Rice Blast · 87%", "রাইস ব্লাস্ট · ৮৭%")}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {t("Apply Tricyclazole within 3 days", "৩ দিনের মধ্যে ট্রাইসাইক্লাজল প্রয়োগ করুন")}
              </div>
            </div>
            <div
              className="hidden lg:block absolute -bottom-6 left-8 glass rounded-2xl p-3 shadow-card animate-float w-52"
              style={{ animationDelay: "2s" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11">
                  <div className="absolute inset-0 animate-spin-slow">
                    <span
                      className="absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full bg-primary"
                      style={{ transform: "translateX(22px)" }}
                    />
                  </div>
                  <div className="absolute inset-0 animate-spin-reverse">
                    <span
                      className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-primary-glow"
                      style={{ transform: "translateX(-18px)" }}
                    />
                  </div>
                  <div className="absolute inset-1 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-ring">
                    <Mic className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium">{t("Listening…", "শুনছি…")}</div>
                  <div
                    className="text-[10px] text-muted-foreground"
                    style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                  >
                    বাংলায় বলুন
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CountUp({
  end,
  suffix = "",
  duration = 1600,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (t: number) => {
              const p = Math.min(1, (t - start) / duration);
              setVal(Math.floor(end * (1 - Math.pow(1 - p, 3))));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

function Stats() {
  const { t } = useLang();
  const stats = [
    { label: t("Future Farmers", "ভবিষ্যৎ কৃষক"), value: 100000, suffix: "+", static: false },
    { label: t("District Coverage", "জেলা কভারেজ"), value: 64, suffix: "", static: false },
    { label: t("Supported Crops", "সমর্থিত ফসল"), value: 50, suffix: "+", static: false },
    { label: t("AI Assistant", "এআই সহকারী"), value: 24, suffix: "/7", static: true },
    {
      label: t("Detection Accuracy", "শনাক্তকরণ নির্ভুলতা"),
      value: 95,
      suffix: "%",
      static: false,
    },
  ];
  return (
    <section className="py-20 border-y border-border/60 bg-card/40 contain-section skip-visibility">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl md:text-5xl font-bold text-gradient">
                {s.static ? (
                  <>
                    {s.value}
                    {s.suffix}
                  </>
                ) : (
                  <CountUp end={s.value} suffix={s.suffix} />
                )}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const { t } = useLang();
  const items = [
    `🌾 ${t("Rice", "ধান")}`,
    `🌽 ${t("Maize", "ভুট্টা")}`,
    `🥔 ${t("Potato", "আলু")}`,
    `🍅 ${t("Tomato", "টমেটো")}`,
    `🥬 ${t("Cabbage", "বাঁধাকপি")}`,
    `🌶️ ${t("Chili", "মরিচ")}`,
    `🧅 ${t("Onion", "পেঁয়াজ")}`,
    `🥒 ${t("Cucumber", "শসা")}`,
    `🍆 ${t("Eggplant", "বেগুন")}`,
    `🫛 ${t("Lentil", "ডাল")}`,
    `🌱 ${t("Jute", "পাট")}`,
    `🍌 ${t("Banana", "কলা")}`,
    `🥭 ${t("Mango", "আম")}`,
    `🫘 ${t("Mustard", "সরিষা")}`,
    `🍉 ${t("Watermelon", "তরমুজ")}`,
    `🌰 ${t("Groundnut", "বাদাম")}`,
  ];
  const row = [...items, ...items];
  return (
    <section
      aria-label="Supported crops"
      className="relative py-10 border-y border-border/60 bg-card/40 overflow-hidden contain-section skip-visibility"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10"
      />
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((c, i) => (
          <span
            key={i}
            className="text-lg font-display font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  const { t } = useLang();
  const problems = [
    {
      icon: ScanLine,
      text: t(
        "Farmers cannot quickly identify crop diseases",
        "কৃষকরা দ্রুত ফসলের রোগ শনাক্ত করতে পারেন না",
      ),
    },
    {
      icon: CloudSun,
      text: t("Weather changes are unpredictable", "আবহাওয়ার পরিবর্তন অপ্রত্যাশিত"),
    },
    {
      icon: Sprout,
      text: t("Fertilizer misuse reduces crop yield", "সার অপব্যবহারে ফলন কমে যায়"),
    },
    {
      icon: AlertTriangle,
      text: t("Pest outbreaks spread rapidly", "পোকামাকড়ের প্রাদুর্ভাব দ্রুত ছড়ায়"),
    },
    {
      icon: Brain,
      text: t("Agricultural knowledge is difficult to access", "কৃষি জ্ঞানে প্রবেশ করা কঠিন"),
    },
    {
      icon: Satellite,
      text: t(
        "Satellite data is rarely accessible to farmers",
        "স্যাটেলাইট তথ্য সাধারণত কৃষকের নাগালের বাইরে",
      ),
    },
  ];
  return (
    <section className="py-28 contain-section skip-visibility">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <SectionLabel>{t("The Problem", "সমস্যা")}</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">
            {t("Agriculture faces many challenges", "কৃষি অনেক চ্যালেঞ্জের মুখোমুখি")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(
              "Every season, farmers across Bangladesh lose yield to preventable problems. We built KrishiBondhu to close that gap.",
              "প্রতি মৌসুমে বাংলাদেশের কৃষকরা প্রতিরোধযোগ্য সমস্যায় ফলন হারান। এই ঘাটতি পূরণ করতেই আমরা কৃষিবন্ধু তৈরি করেছি।",
            )}
          </p>
        </div>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <Reveal key={p.text} delay={i * 80}>
              <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated hover:border-primary/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <p.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-medium leading-relaxed">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  const { t } = useLang();
  const tags = [
    t("Voice-first", "ভয়েস-ফার্স্ট"),
    t("Bangla-native", "বাংলা-নেটিভ"),
    t("Offline-capable", "অফলাইন-সক্ষম"),
    t("Satellite-aware", "স্যাটেলাইট-সচেতন"),
    t("Government-ready", "সরকার-প্রস্তুত"),
  ];
  return (
    <section className="py-28 bg-gradient-hero relative overflow-hidden contain-section skip-visibility">
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <SectionLabel>{t("The Solution", "সমাধান")}</SectionLabel>
        <h2 className="mt-4 text-4xl md:text-6xl font-bold leading-tight">
          {t("One AI platform.", "একটি এআই প্ল্যাটফর্ম।")}
          <br />
          <span className="text-gradient">
            {t("Complete farming intelligence.", "সম্পূর্ণ কৃষি বুদ্ধিমত্তা।")}
          </span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t(
            "KrishiBondhu combines large language models, computer vision, satellite intelligence, and localized agricultural knowledge into one voice-first assistant — specialized for Bangladesh's farms, seasons, and soil.",
            "কৃষিবন্ধু বৃহৎ ভাষা মডেল, কম্পিউটার ভিশন, স্যাটেলাইট বুদ্ধিমত্তা এবং স্থানীয় কৃষি জ্ঞানকে একটি ভয়েস-ফার্স্ট সহকারীতে একত্র করে — বাংলাদেশের জমি, মৌসুম ও মাটির জন্য বিশেষায়িত।",
          )}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function useModules() {
  const { t } = useLang();
  return [
    {
      icon: Mic,
      tag: "Module 01",
      title: t("AI Voice Assistant", "এআই ভয়েস সহকারী"),
      desc: t(
        "Farmers speak in Bangla instead of typing. Natural conversations with memory and personalized recommendations.",
        "কৃষকরা টাইপ না করে বাংলায় কথা বলেন। স্মৃতিসহ প্রাকৃতিক কথোপকথন ও ব্যক্তিগত পরামর্শ।",
      ),
      features: [
        t("Bangla speech recognition", "বাংলা স্পিচ রিকগনিশন"),
        t("Bangla voice replies", "বাংলা ভয়েস উত্তর"),
        t("Natural conversations", "প্রাকৃতিক কথোপকথন"),
        t("Conversation memory", "কথোপকথনের স্মৃতি"),
        t("Voice-first interface", "ভয়েস-ফার্স্ট ইন্টারফেস"),
      ],
      demo: "voice",
    },
    {
      icon: ScanLine,
      tag: "Module 02",
      title: t("Crop Disease Detection", "ফসলের রোগ শনাক্তকরণ"),
      desc: t(
        "Upload a photo. AI identifies the disease, severity, and treatment — organic and chemical — plus the nearest agricultural office.",
        "একটি ছবি আপলোড করুন। এআই রোগ, তীব্রতা, চিকিৎসা — জৈব ও রাসায়নিক — এবং নিকটতম কৃষি অফিস জানায়।",
      ),
      features: [
        t("Disease name & confidence", "রোগের নাম ও নিশ্চয়তা"),
        t("Severity assessment", "তীব্রতা মূল্যায়ন"),
        t("Organic + chemical treatment", "জৈব ও রাসায়নিক চিকিৎসা"),
        t("Prevention guidance", "প্রতিরোধমূলক পরামর্শ"),
      ],
      demo: "disease",
    },
    {
      icon: Satellite,
      tag: "Module 03",
      title: t("Satellite Intelligence", "স্যাটেলাইট বুদ্ধিমত্তা"),
      desc: t(
        "NDVI, water stress, flood mapping, yield estimation — powered by Sentinel-2, Landsat, and Google Earth Engine.",
        "এনডিভিআই, পানির চাপ, বন্যা মানচিত্র, ফলনের পূর্বাভাস — সেন্টিনেল-২, ল্যান্ডস্যাট ও গুগল আর্থ ইঞ্জিন দ্বারা চালিত।",
      ),
      features: [
        t("Crop health monitoring", "ফসল স্বাস্থ্য পর্যবেক্ষণ"),
        t("Water stress detection", "পানির চাপ শনাক্তকরণ"),
        t("Flood mapping", "বন্যা মানচিত্র"),
        t("Disease hotspot identification", "রোগের হটস্পট শনাক্ত"),
        t("Yield estimation", "ফলন পূর্বাভাস"),
      ],
      demo: "satellite",
    },
    {
      icon: Sprout,
      tag: "Module 04",
      title: t("Soil Intelligence", "মাটির বুদ্ধিমত্তা"),
      desc: t(
        "Enter GPS or upload a soil report. AI predicts suitable crops, NPK, pH, fertilizer needs, and expected yield.",
        "জিপিএস দিন বা মাটির রিপোর্ট আপলোড করুন। এআই উপযোগী ফসল, এনপিকে, পিএইচ, সারের চাহিদা ও প্রত্যাশিত ফলন অনুমান করে।",
      ),
      features: [
        t("Suitable crops", "উপযোগী ফসল"),
        t("pH & organic matter", "পিএইচ ও জৈব উপাদান"),
        t("Nitrogen, Phosphorus, Potassium", "নাইট্রোজেন, ফসফরাস, পটাশিয়াম"),
        t("Fertilizer recommendation", "সার পরামর্শ"),
        t("Yield forecast", "ফলনের পূর্বাভাস"),
      ],
      demo: "soil",
    },
    {
      icon: CloudSun,
      tag: "Module 05",
      title: t("Weather Intelligence", "আবহাওয়া বুদ্ধিমত্তা"),
      desc: t(
        "BMD, NASA, and OpenWeather combined — explained in simple Bangla, not just numbers.",
        "বিএমডি, নাসা ও ওপেনওয়েদার একসাথে — শুধু সংখ্যা নয়, সহজ বাংলায় ব্যাখ্যা।",
      ),
      features: [
        t("Rain forecast & humidity", "বৃষ্টির পূর্বাভাস ও আর্দ্রতা"),
        t("Cyclone alerts", "ঘূর্ণিঝড় সতর্কতা"),
        t("Flood warnings", "বন্যা সতর্কতা"),
        t("Heat stress", "তাপ চাপ"),
        t("Bangla explanations", "বাংলা ব্যাখ্যা"),
      ],
      demo: "weather",
    },
    {
      icon: Store,
      tag: "Module 06",
      title: t("Marketplace", "মার্কেটপ্লেস"),
      desc: t(
        "A digital marketplace connecting farmers with verified buyers, sellers, and machinery — with daily market prices.",
        "একটি ডিজিটাল মার্কেটপ্লেস যা কৃষকদের যাচাইকৃত ক্রেতা, বিক্রেতা ও যন্ত্রপাতির সাথে যুক্ত করে — দৈনিক বাজারদরসহ।",
      ),
      features: [
        t("Seeds, fertilizers, pesticides", "বীজ, সার, কীটনাশক"),
        t("Machinery rental", "যন্ত্রপাতি ভাড়া"),
        t("Sell harvested crops", "ফসল বিক্রি"),
        t("Daily market prices", "দৈনিক বাজারদর"),
        t("Digital payments", "ডিজিটাল পেমেন্ট"),
      ],
      demo: "market",
    },
  ];
}

function ModuleDemo({ kind }: { kind: string }) {
  const { t } = useLang();
  if (kind === "voice") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
            কৃ
          </div>
          <div
            className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm"
            style={{ fontFamily: "Noto Sans Bengali, sans-serif" }}
          >
            আমার ধানের পাতায় দাগ পড়েছে
          </div>
        </div>
        <div className="mt-3 flex items-start gap-3 flex-row-reverse">
          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div
            className="rounded-2xl rounded-tr-sm bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm"
            style={{ fontFamily: "Noto Sans Bengali, sans-serif" }}
          >
            ছবিটি আপলোড করুন। এটি ব্লাস্ট রোগ হতে পারে। আমি নিশ্চিত করে চিকিৎসা জানাচ্ছি।
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />{" "}
          {t("Listening in Bangla…", "বাংলায় শুনছি…")}
        </div>
      </div>
    );
  }
  if (kind === "disease") {
    return (
      <div className="rounded-2xl overflow-hidden border border-border shadow-card">
        <img
          src={diseaseImg}
          alt="Disease detection"
          width={1200}
          height={900}
          loading="lazy"
          className="w-full h-56 object-cover"
        />
        <div className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{t("Detected", "শনাক্ত")}</div>
              <div className="font-semibold">
                {t("Rice Blast (Magnaporthe oryzae)", "রাইস ব্লাস্ট (Magnaporthe oryzae)")}
              </div>
            </div>
            <div className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
              {t("95% confidence", "৯৫% নিশ্চয়তা")}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-muted p-2">
              <div className="text-muted-foreground">{t("Severity", "তীব্রতা")}</div>
              <div className="font-semibold">{t("Moderate", "মাঝারি")}</div>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <div className="text-muted-foreground">{t("Organic", "জৈব")}</div>
              <div className="font-semibold">{t("Neem oil", "নিম তেল")}</div>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <div className="text-muted-foreground">{t("Chemical", "রাসায়নিক")}</div>
              <div className="font-semibold">{t("Tricyclazole", "ট্রাইসাইক্লাজল")}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "satellite") {
    return (
      <div className="rounded-2xl overflow-hidden border border-border shadow-card relative">
        <img
          src={satImg}
          alt="Satellite NDVI"
          width={1200}
          height={900}
          loading="lazy"
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-3 left-3 glass rounded-lg px-3 py-1.5 text-xs">
          <div className="text-muted-foreground">NDVI</div>
          <div className="font-semibold">0.74 · {t("Healthy", "সুস্থ")}</div>
        </div>
        <div className="absolute bottom-3 right-3 glass rounded-lg px-3 py-1.5 text-xs">
          <MapPin className="h-3 w-3 inline mr-1" /> {t("Rangpur District", "রংপুর জেলা")}
        </div>
      </div>
    );
  }
  if (kind === "soil") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="text-xs text-muted-foreground mb-3">
          {t("Soil Report · Bogura", "মাটির রিপোর্ট · বগুড়া")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { k: t("pH", "পিএইচ"), v: "6.4" },
            { k: t("Nitrogen", "নাইট্রোজেন"), v: t("Med", "মাঝারি") },
            { k: t("Phosphorus", "ফসফরাস"), v: t("High", "বেশি") },
            { k: t("Potassium", "পটাশিয়াম"), v: t("Low", "কম") },
          ].map((x) => (
            <div key={x.k} className="rounded-lg bg-muted p-3">
              <div className="text-xs text-muted-foreground">{x.k}</div>
              <div className="font-display text-xl font-semibold">{x.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-primary/10 text-primary p-3 text-sm">
          <div className="font-semibold">
            {t("Recommended crop: Rice (BRRI dhan29)", "সুপারিশকৃত ফসল: ধান (ব্রি ধান২৯)")}
          </div>
          <div className="text-xs opacity-80">
            {t("Expected yield: 6.2 t/ha", "প্রত্যাশিত ফলন: ৬.২ টন/হেক্টর")}
          </div>
        </div>
      </div>
    );
  }
  if (kind === "weather") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">
              {t("Dhaka Division · Tomorrow", "ঢাকা বিভাগ · আগামীকাল")}
            </div>
            <div className="font-display text-3xl font-semibold">28° / 24°</div>
          </div>
          <CloudSun className="h-12 w-12 text-primary" />
        </div>
        <div
          className="mt-3 rounded-xl bg-primary/10 text-primary p-3 text-sm"
          style={{ fontFamily: "Noto Sans Bengali, sans-serif" }}
        >
          আগামীকাল ভারী বৃষ্টির সম্ভাবনা রয়েছে। আজকে সেচ না দিলেও চলবে।
        </div>
        <div className="mt-3 flex gap-2 text-xs">
          {[t("Mon", "সোম"), t("Tue", "মঙ্গল"), t("Wed", "বুধ"), t("Thu", "বৃহঃ")].map((d) => (
            <div key={d} className="flex-1 rounded-lg bg-muted p-2 text-center">
              <div className="text-muted-foreground">{d}</div>
              <div className="font-semibold">29°</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="text-xs text-muted-foreground mb-3">
        {t("Today's Market Prices", "আজকের বাজারদর")}
      </div>
      <div className="space-y-2">
        {[
          { c: t("Rice", "ধান"), p: t("৳ 32.50/kg", "৳ ৩২.৫০/কেজি"), t: "+1.4%" },
          { c: t("Potato", "আলু"), p: t("৳ 22.00/kg", "৳ ২২.০০/কেজি"), t: "-0.8%" },
          { c: t("Jute", "পাট"), p: t("৳ 65.00/kg", "৳ ৬৫.০০/কেজি"), t: "+2.1%" },
        ].map((x) => (
          <div key={x.c} className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="font-medium">{x.c}</div>
            <div className="flex items-center gap-3">
              <div className="text-sm">{x.p}</div>
              <div
                className={`text-xs font-semibold ${x.t.startsWith("+") ? "text-primary" : "text-destructive"}`}
              >
                {x.t}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Modules() {
  const { t } = useLang();
  const modules = useModules();
  const crops = [
    t("Rice", "ধান"),
    t("Potato", "আলু"),
    t("Tomato", "টমেটো"),
    t("Jute", "পাট"),
    t("Mustard", "সরিষা"),
    t("Wheat", "গম"),
    t("Banana", "কলা"),
    t("Mango", "আম"),
    t("Corn", "ভুট্টা"),
    t("Vegetables", "শাকসবজি"),
    t("Onion", "পেঁয়াজ"),
    t("Chili", "মরিচ"),
    t("Lentil", "ডাল"),
    t("Sugarcane", "আখ"),
  ];
  return (
    <section id="modules" className="py-28 contain-section skip-visibility">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <SectionLabel>{t("Core Modules", "মূল মডিউল")}</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">
            {t("Six AI systems, one companion", "ছয়টি এআই সিস্টেম, এক সহচর")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(
              "Every module is trained on Bangladesh's crops, weather, and farming realities.",
              "প্রতিটি মডিউল বাংলাদেশের ফসল, আবহাওয়া ও কৃষি বাস্তবতার উপর প্রশিক্ষিত।",
            )}
          </p>
        </div>

        <div className="mt-16 space-y-24">
          {modules.map((m, i) => (
            <div
              key={m.title}
              className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <Reveal className={i % 2 === 1 ? "animate-fade-in-right" : "animate-fade-in-left"}>
                <div className="text-xs font-mono text-primary tracking-widest">{m.tag}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow transition-transform hover:scale-110 hover:rotate-6">
                    <m.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-3xl md:text-4xl font-bold">{m.title}</h3>
                </div>
                <p className="mt-4 text-lg text-muted-foreground max-w-lg">{m.desc}</p>
                <ul className="mt-6 grid sm:grid-cols-2 gap-2 max-w-lg">
                  {m.features.map((f, fi) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm reveal reveal-visible"
                      style={{
                        animation: `fade-up 0.5s ease-out both`,
                        animationDelay: `${200 + fi * 60}ms`,
                      }}
                    >
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={150}>
                <ModuleDemo kind={m.demo} />
              </Reveal>
            </div>
          ))}
        </div>

        <div className="mt-24 rounded-3xl border border-border bg-card p-8 md:p-12 shadow-card">
          <h3 className="font-display text-2xl font-semibold">
            {t("Supported crops", "সমর্থিত ফসল")}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {t(
              "Over 50 crops with expanding coverage every season.",
              "প্রতিটি মৌসুমে সম্প্রসারিত ৫০টিরও বেশি ফসল।",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {crops.map((c, i) => (
              <span
                key={c}
                style={{ animationDelay: `${i * 40}ms` }}
                className="animate-zoom-in rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-primary/40 hover:text-primary hover:scale-105 transition"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Localized() {
  const { t } = useLang();
  const items = [
    t("Bangladesh weather", "বাংলাদেশের আবহাওয়া"),
    t("Bangladesh crops", "বাংলাদেশের ফসল"),
    t("Local diseases", "স্থানীয় রোগ"),
    t("Local pests", "স্থানীয় পোকামাকড়"),
    t("Seasonal farming", "মৌসুমি চাষাবাদ"),
    t("Government policies", "সরকারি নীতি"),
    t("Fertilizer recommendations", "সার পরামর্শ"),
    t("Market prices", "বাজারদর"),
    t("Best practices", "সর্বোত্তম চর্চা"),
    t("Soil conditions", "মাটির অবস্থা"),
    t("Satellite imagery", "স্যাটেলাইট চিত্র"),
    t("Flood risks", "বন্যার ঝুঁকি"),
  ];
  return (
    <section className="py-28 bg-card/40 border-y border-border/60 contain-section skip-visibility">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <SectionLabel>{t("Localized AI Knowledge", "স্থানীয়ায়িত এআই জ্ঞান")}</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">
            {t("Built for Bangladesh —", "বাংলাদেশের জন্য তৈরি —")}{" "}
            <span className="text-gradient">{t("not translated to it", "শুধু অনুবাদ নয়")}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(
              "Our models are trained on Bangladeshi crops, soil types, weather patterns, and government policies — so answers actually match the field.",
              "আমাদের মডেল বাংলাদেশের ফসল, মাটি, আবহাওয়া ও সরকারি নীতির উপর প্রশিক্ষিত — যাতে উত্তরগুলো মাঠের সঙ্গে মেলে।",
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((it) => (
            <div
              key={it}
              className="rounded-xl border border-border bg-background p-4 text-sm font-medium hover:border-primary/40 hover:shadow-card transition"
            >
              <Check className="h-4 w-4 text-primary mb-2" />
              {it}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function How() {
  const { t } = useLang();
  const steps = [
    {
      n: "01",
      icon: Mic,
      title: t("Speak or upload", "কথা বলুন বা আপলোড করুন"),
      desc: t(
        "Ask a question in Bangla or upload a photo of your crop.",
        "বাংলায় প্রশ্ন করুন বা আপনার ফসলের ছবি আপলোড করুন।",
      ),
    },
    {
      n: "02",
      icon: Brain,
      title: t("AI understands", "এআই বোঝে"),
      desc: t(
        "Analyzes weather, soil, satellite and agricultural knowledge for your farm.",
        "আপনার জমির জন্য আবহাওয়া, মাটি, স্যাটেলাইট ও কৃষি জ্ঞান বিশ্লেষণ করে।",
      ),
    },
    {
      n: "03",
      icon: Sparkles,
      title: t("Get recommendations", "পরামর্শ পান"),
      desc: t(
        "Personalized guidance in Bangla — organic or chemical, whatever works.",
        "বাংলায় ব্যক্তিগত পরামর্শ — জৈব বা রাসায়নিক, যা কাজ করে।",
      ),
    },
  ];
  return (
    <section id="how" className="py-28 contain-section skip-visibility">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <SectionLabel>{t("How it works", "কিভাবে কাজ করে")}</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">
            {t("Three steps. Any farm.", "তিনটি ধাপ। যেকোনো জমি।")}
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="relative rounded-3xl border border-border bg-card p-8 shadow-card"
            >
              <div className="text-6xl font-display font-bold text-primary/10">{s.n}</div>
              <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                <s.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-5 top-1/2 h-8 w-8 text-primary/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tech() {
  const { t } = useLang();
  const tech = [
    { icon: Brain, name: t("LLMs", "এলএলএম") },
    { icon: Eye, name: t("Computer Vision", "কম্পিউটার ভিশন") },
    { icon: Satellite, name: t("Satellite Intelligence", "স্যাটেলাইট বুদ্ধিমত্তা") },
    { icon: Globe, name: t("GIS", "জিআইএস") },
    { icon: Layers, name: t("Earth Engine", "আর্থ ইঞ্জিন") },
    { icon: Cpu, name: "PyTorch" },
    { icon: Zap, name: "FastAPI" },
    { icon: Bot, name: "Flutter" },
    { icon: Database, name: "PostgreSQL" },
    { icon: Database, name: "Redis" },
    { icon: Database, name: "Qdrant" },
    { icon: Mic, name: "Whisper" },
  ];
  return (
    <section
      id="tech"
      className="py-28 bg-card/40 border-y border-border/60 contain-section skip-visibility"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <SectionLabel>{t("Technology", "প্রযুক্তি")}</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">
            {t("Built on modern AI infrastructure", "আধুনিক এআই অবকাঠামোতে নির্মিত")}
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tech.map((tt, i) => (
            <Reveal key={tt.name} delay={i * 50}>
              <div className="group rounded-2xl border border-border bg-background p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card">
                <tt.icon className="h-6 w-6 mx-auto text-primary transition-transform group-hover:scale-125 group-hover:rotate-6" />
                <div className="mt-2 text-sm font-medium">{tt.name}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const { t } = useLang();
  const items = [
    t("Drone crop monitoring", "ড্রোন ফসল পর্যবেক্ষণ"),
    t("IoT soil sensors", "আইওটি মাটি সেন্সর"),
    t("Smart irrigation", "স্মার্ট সেচ"),
    t("Livestock assistant", "গবাদি পশু সহকারী"),
    t("Pest outbreak prediction", "পোকা প্রাদুর্ভাব পূর্বাভাস"),
    t("Yield prediction", "ফলন পূর্বাভাস"),
    t("Climate adaptation", "জলবায়ু অভিযোজন"),
    t("Agricultural insurance", "কৃষি বীমা"),
    t("Carbon footprint monitoring", "কার্বন পদচিহ্ন পর্যবেক্ষণ"),
  ];
  return (
    <section id="roadmap" className="py-28 contain-section skip-visibility">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <SectionLabel>{t("Roadmap", "রোডম্যাপ")}</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">{t("What's next", "পরবর্তী কী")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(
              "We're expanding beyond the phone — into the sky, the soil, and the marketplace.",
              "আমরা ফোনের বাইরে যাচ্ছি — আকাশ, মাটি ও বাজারে।",
            )}
          </p>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <Reveal key={it} delay={i * 80}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card hover:border-primary/40 hover:-translate-y-1 transition">
                <div className="text-xs font-mono text-primary">
                  Q{Math.floor(i / 3) + 1} · {t("Coming", "আসছে")}
                </div>
                <div className="mt-2 font-display text-lg font-semibold">{it}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const { t } = useLang();
  const list = [
    {
      name: t("Rahim Uddin", "রহিম উদ্দিন"),
      role: t("Farmer, Rangpur", "কৃষক, রংপুর"),
      quote:
        "আমি বাংলায় প্রশ্ন করি, AI বাংলায় উত্তর দেয়। এই প্রথম প্রযুক্তি আমার জন্য কাজ করছে।",
      icon: Users,
      bn: true,
    },
    {
      name: t("Dr. Fatima Rahman", "ড. ফাতিমা রহমান"),
      role: t("Agricultural Researcher, BARI", "কৃষি গবেষক, বারি"),
      quote: t(
        "The disease detection accuracy on rice varieties is remarkable. It's a genuine research-grade tool put in every farmer's pocket.",
        "ধানের জাতের রোগ শনাক্তকরণের নির্ভুলতা অসাধারণ। এটি প্রতিটি কৃষকের পকেটে থাকা প্রকৃত গবেষণা-মানের টুল।",
      ),
      icon: Award,
      bn: false,
    },
    {
      name: t("Nasir Ahmed", "নাসির আহমেদ"),
      role: t("Upazila Agriculture Officer", "উপজেলা কৃষি কর্মকর্তা"),
      quote: t(
        "For the first time, my farmers reach me with a diagnosis already in hand. My job is faster and much more effective.",
        "প্রথমবারের মতো, আমার কৃষকরা রোগ নির্ণয় হাতে নিয়ে আমার কাছে আসেন। আমার কাজ দ্রুত ও কার্যকর হয়েছে।",
      ),
      icon: ShieldCheck,
      bn: false,
    },
    {
      name: t("Green Delta NGO", "গ্রিন ডেল্টা এনজিও"),
      role: t("Field Operations Lead", "ফিল্ড অপারেশন প্রধান"),
      quote: t(
        "We deployed KrishiBondhu across 12 districts. Yields improved measurably in one season.",
        "আমরা ১২টি জেলায় কৃষিবন্ধু প্রয়োগ করেছি। এক মৌসুমেই ফলন উল্লেখযোগ্যভাবে বেড়েছে।",
      ),
      icon: TrendingUp,
      bn: false,
    },
  ];
  return (
    <section className="py-28 bg-card/40 border-y border-border/60 contain-section skip-visibility">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <SectionLabel>{t("Testimonials", "প্রশংসাপত্র")}</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">
            {t("Trusted across the field", "মাঠজুড়ে বিশ্বস্ত")}
          </h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {list.map((tst, i) => (
            <Reveal key={tst.name} delay={i * 100}>
              <div className="rounded-3xl border border-border bg-background p-8 shadow-card hover:-translate-y-1 hover:shadow-elevated transition-all">
                <p
                  className="text-lg leading-relaxed"
                  style={tst.bn ? { fontFamily: "Noto Sans Bengali, sans-serif" } : {}}
                >
                  "{tst.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-primary flex items-center justify-center">
                    <tst.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{tst.name}</div>
                    <div className="text-sm text-muted-foreground">{tst.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const { t } = useLang();
  const faqs = [
    {
      q: t("How accurate is disease detection?", "রোগ শনাক্তকরণ কতটা নির্ভুল?"),
      a: t(
        "Our vision models achieve 95% accuracy on Bangladesh's top 10 crops, validated against BARI-labeled datasets.",
        "আমাদের ভিশন মডেল বাংলাদেশের শীর্ষ ১০টি ফসলে ৯৫% নির্ভুলতা অর্জন করে, বারি-লেবেলযুক্ত ডেটাসেটে যাচাইকৃত।",
      ),
    },
    {
      q: t("Can I use Bangla voice?", "আমি কি বাংলা ভয়েস ব্যবহার করতে পারি?"),
      a: t(
        "Yes — Bangla is our primary interface. Speech recognition and replies are fully Bangla-native.",
        "হ্যাঁ — বাংলা আমাদের প্রধান ইন্টারফেস। স্পিচ রিকগনিশন ও উত্তর সম্পূর্ণ বাংলা-নেটিভ।",
      ),
    },
    {
      q: t("Does it work offline?", "এটি কি অফলাইনে কাজ করে?"),
      a: t(
        "Core disease detection and cached weather/soil data work offline. Voice and satellite features need a connection.",
        "মূল রোগ শনাক্তকরণ ও ক্যাশ করা আবহাওয়া/মাটির ডেটা অফলাইনে কাজ করে। ভয়েস ও স্যাটেলাইট ফিচারের জন্য সংযোগ প্রয়োজন।",
      ),
    },
    {
      q: t("How are recommendations generated?", "পরামর্শ কীভাবে তৈরি হয়?"),
      a: t(
        "By combining your farm's satellite imagery, soil report, local weather, and BARI/DAE agronomic guidelines.",
        "আপনার জমির স্যাটেলাইট চিত্র, মাটির রিপোর্ট, স্থানীয় আবহাওয়া ও বারি/ডিএই কৃষি নির্দেশিকা মিলিয়ে।",
      ),
    },
    {
      q: t("Which crops are supported?", "কোন ফসলগুলো সমর্থিত?"),
      a: t(
        "Over 50 crops today — rice, jute, potato, tomato, wheat, mustard, banana, mango, corn, and more.",
        "৫০টিরও বেশি ফসল — ধান, পাট, আলু, টমেটো, গম, সরিষা, কলা, আম, ভুট্টা ইত্যাদি।",
      ),
    },
    {
      q: t("Is satellite monitoring free?", "স্যাটেলাইট পর্যবেক্ষণ কি বিনামূল্যে?"),
      a: t(
        "Yes, for individual farmers on the free tier. NGOs and government partners get expanded analytics.",
        "হ্যাঁ, ফ্রি টায়ারে ব্যক্তিগত কৃষকদের জন্য। এনজিও ও সরকারি অংশীদাররা সম্প্রসারিত অ্যানালিটিক্স পান।",
      ),
    },
  ];
  const [open, setOpen] = useState<number>(0);
  return (
    <section id="faq" className="py-28 contain-section skip-visibility">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <SectionLabel>{t("FAQ", "প্রশ্নোত্তর")}</SectionLabel>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold">
            {t("Questions, answered", "প্রশ্নের উত্তর")}
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <div
              key={f.q}
              className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-muted-foreground animate-fade-up">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { t } = useLang();
  return (
    <section className="py-28 contain-section skip-visibility">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 md:p-20 shadow-elevated text-center">
          <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground">
              {t("Empower your farm with AI", "এআই দিয়ে আপনার জমিকে ক্ষমতায়ন করুন")}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              {t(
                "Join farmers, researchers, and organizations building the future of Bangladesh's agriculture.",
                "বাংলাদেশের কৃষির ভবিষ্যৎ গড়তে কৃষক, গবেষক ও প্রতিষ্ঠানের সাথে যোগ দিন।",
              )}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-7 py-3.5 text-base font-medium hover:scale-[1.03] transition-transform"
              >
                {t("Get Started", "শুরু করুন")} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 text-primary-foreground px-7 py-3.5 text-base font-medium hover:bg-primary-foreground/10 transition"
              >
                <Play className="h-4 w-4" /> {t("Watch Demo", "ডেমো দেখুন")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLang();
  const cols = [
    {
      title: t("Product", "পণ্য"),
      links: [
        t("Modules", "মডিউল"),
        t("How it works", "কিভাবে কাজ করে"),
        t("Roadmap", "রোডম্যাপ"),
        t("Technology", "প্রযুক্তি"),
      ],
    },
    {
      title: t("Resources", "রিসোর্স"),
      links: [t("Documentation", "ডকুমেন্টেশন"), t("Research", "গবেষণা"), "GitHub", "API"],
    },
    {
      title: t("Company", "কোম্পানি"),
      links: [
        t("About", "সম্পর্কে"),
        t("Contact", "যোগাযোগ"),
        t("Privacy Policy", "গোপনীয়তা নীতি"),
        t("Terms", "শর্তাবলী"),
      ],
    },
  ];
  return (
    <footer className="border-t border-border/60 py-16 bg-card/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display font-semibold">{t("KrishiBondhu", "কৃষিবন্ধু")}</div>
                <div className="text-xs text-muted-foreground -mt-0.5">
                  {t("KrishiBondhu AI", "কৃষিবন্ধু এআই")}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              {t(
                "Empowering Bangladesh's agriculture through localized AI, satellite intelligence, and voice-first interaction.",
                "স্থানীয়ায়িত এআই, স্যাটেলাইট বুদ্ধিমত্তা ও ভয়েস-ফার্স্ট ইন্টারঅ্যাকশনের মাধ্যমে বাংলাদেশের কৃষিকে ক্ষমতায়ন।",
              )}
            </p>
            <div className="mt-5 flex gap-3">
              {[Github, Twitter, Facebook, Linkedin, Mail].map((I, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:border-primary/40 hover:text-primary transition"
                >
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="font-semibold text-sm">{col.title}</div>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            {t(
              "© 2026 KrishiBondhu AI · Made for Bangladesh 🇧🇩",
              "© ২০২৬ কৃষিবন্ধু এআই · বাংলাদেশের জন্য তৈরি 🇧🇩",
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {t("24/7 AI", "২৪/৭ এআই")}
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" /> {t("95% accuracy", "৯৫% নির্ভুলতা")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Marquee />
        <Problem />
        <Solution />
        <Modules />
        <Localized />
        <How />
        <Tech />
        <Roadmap />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function LandingWithProvider() {
  return (
    <LangProvider>
      <Landing />
    </LangProvider>
  );
}
