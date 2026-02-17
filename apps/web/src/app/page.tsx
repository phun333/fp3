"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlass,
  UsersThree,
  Lightbulb,
  GraduationCap,
  ArrowRight,
  Atom,
  Brain,
  User,
  FileText,
  Tag,
  CheckCircle,
  ArrowsClockwise,
  Handshake,
  UserCirclePlus,
  Binoculars,
  Link as LinkIcon,
} from "@phosphor-icons/react";

/* ------------------------------------------------------------------ */
/*  Scroll-reveal                                                      */
/* ------------------------------------------------------------------ */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: MagnifyingGlass,
    title: "Akıllı Eşleştirme",
    desc: "Tag tabanlı algoritma ile araştırma alanlarınıza en uygun akademisyen ve projeleri anında keşfedin.",
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    icon: UsersThree,
    title: "Proje Ortaklığı",
    desc: "Açık projelere tek tıkla başvurun. Kendi projeniz için uygun ekip arkadaşlarını bulun.",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    icon: Lightbulb,
    title: "AI Tag Önerisi",
    desc: "KeyBERT destekli yapay zeka, yayın ve profillerinizden otomatik araştırma etiketleri çıkarır.",
    color: "#DB2777",
    bg: "#FDF2F8",
  },
  {
    icon: GraduationCap,
    title: "Akademik Ağ",
    desc: "Yayınlarınızı paylaşın, bağlantılar kurun ve araştırma ağınızı genişletin.",
    color: "#0891B2",
    bg: "#ECFEFF",
  },
];

const stats = [
  { value: "35+", label: "Araştırma Alanı" },
  { value: "AI", label: "Akıllı Eşleştirme" },
  { value: "∞", label: "Olasılık" },
];

const steps = [
  { step: "01", title: "Profil Oluştur", desc: "Üniversite mailinle kayıt ol, rolünü seç ve araştırma alanlarını etiketle.", icon: UserCirclePlus },
  { step: "02", title: "Keşfet", desc: "AI destekli eşleştirme motoru sana en uygun akademisyenleri ve projeleri önerir.", icon: Binoculars },
  { step: "03", title: "Bağlan", desc: "Projelere başvur, ekip kur ve akademik ortaklıklarını başlat.", icon: LinkIcon },
];

/* ------------------------------------------------------------------ */
/*  Hero matching visual                                               */
/* ------------------------------------------------------------------ */
function MatchingVisual() {
  const [activeMatch, setActiveMatch] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveMatch((p) => (p + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  const professors = [
    { name: "Prof. Dr. Ayşe Kara", dept: "Bilgisayar Müh.", tags: ["NLP", "Deep Learning"], initials: "AK" },
    { name: "Doç. Dr. Mehmet Yılmaz", dept: "Yazılım Müh.", tags: ["IoT", "Gömülü Sistem"], initials: "MY" },
    { name: "Dr. Elif Demir", dept: "Veri Bilimi", tags: ["Machine Learning", "CV"], initials: "ED" },
  ];

  const students = [
    { name: "Duygu Analizi ile Sosyal Medya", tags: ["NLP", "Sentiment"], type: "Makale" },
    { name: "Akıllı Sera Otomasyon Sistemi", tags: ["IoT", "Sensör"], type: "Proje" },
    { name: "Medikal Görüntü Sınıflandırma", tags: ["CV", "CNN"], type: "Bitirme" },
  ];

  const matchScores = [94, 87, 91];

  return (
    <div className="relative w-full" style={{ minHeight: 420 }}>
      {/* SVG connection lines */}
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="matchLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1="35%"
            y1={`${18 + i * 32}%`}
            x2="65%"
            y2={`${18 + i * 32}%`}
            stroke={activeMatch === i ? "#4F46E5" : "#CBD5E1"}
            strokeWidth={activeMatch === i ? 2 : 1}
            strokeDasharray={activeMatch === i ? "none" : "4 4"}
            className="transition-all duration-700"
            style={{ opacity: activeMatch === i ? 0.6 : 0.2 }}
          />
        ))}
      </svg>

      {/* Match score badges */}
      {[0, 1, 2].map((i) => (
        <div
          key={`score-${i}`}
          className="absolute left-1/2 z-20 -translate-x-1/2 transition-all duration-700"
          style={{
            top: `${14 + i * 32}%`,
            opacity: activeMatch === i ? 1 : 0,
            transform: `translateX(-50%) scale(${activeMatch === i ? 1 : 0.8})`,
          }}
        >
          <div className="flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg shadow-indigo-500/30">
            <CheckCircle size={12} weight="fill" />
            %{matchScores[i]}
          </div>
        </div>
      ))}

      <div className="relative z-10 grid grid-cols-2 gap-6">
        {/* Professors column */}
        <div className="space-y-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            <User size={14} weight="bold" />
            Akademisyenler
          </div>
          {professors.map((prof, i) => (
            <div
              key={prof.name}
              className="rounded-xl border bg-white p-3.5 transition-all duration-500"
              style={{
                borderColor: activeMatch === i ? "#C7D2FE" : "#F1F5F9",
                boxShadow: activeMatch === i ? "0 4px 24px rgba(79,70,229,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-colors duration-500"
                  style={{ backgroundColor: activeMatch === i ? "#4F46E5" : "#94A3B8" }}
                >
                  {prof.initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-slate-800">{prof.name}</div>
                  <div className="text-[11px] text-slate-400">{prof.dept}</div>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {prof.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors duration-500"
                    style={{
                      backgroundColor: activeMatch === i ? "#EEF2FF" : "#F8FAFC",
                      color: activeMatch === i ? "#4338CA" : "#94A3B8",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Student projects column */}
        <div className="space-y-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            <FileText size={14} weight="bold" />
            Öğrenci Projeleri
          </div>
          {students.map((proj, i) => (
            <div
              key={proj.name}
              className="rounded-xl border bg-white p-3.5 transition-all duration-500"
              style={{
                borderColor: activeMatch === i ? "#C7D2FE" : "#F1F5F9",
                boxShadow: activeMatch === i ? "0 4px 24px rgba(79,70,229,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase transition-colors duration-500"
                  style={{
                    backgroundColor: activeMatch === i ? "#EEF2FF" : "#F8FAFC",
                    color: activeMatch === i ? "#4338CA" : "#94A3B8",
                  }}
                >
                  {proj.type}
                </span>
              </div>
              <div className="mt-1.5 text-[13px] font-semibold leading-snug text-slate-800">{proj.name}</div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {proj.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors duration-500"
                    style={{
                      backgroundColor: activeMatch === i ? "#EEF2FF" : "#F8FAFC",
                      color: activeMatch === i ? "#4338CA" : "#94A3B8",
                    }}
                  >
                    <Tag size={9} weight="bold" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Animated cycling indicator */}
      <div className="mt-5 flex items-center justify-center gap-2">
        <ArrowsClockwise
          size={14}
          weight="bold"
          className="animate-[spin_3s_linear_infinite] text-indigo-400"
        />
        <span className="text-[11px] font-medium text-slate-400">
          Eşleştirme yapılıyor...
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature card                                                       */
/* ------------------------------------------------------------------ */
function FeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  return (
    <Reveal delay={index * 0.08}>
      <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 transition-all duration-500 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50">
        {/* Hover accent */}
        <div
          className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 transition-transform duration-500 group-hover:scale-y-100"
          style={{ backgroundColor: feature.color }}
        />

        <div
          className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundColor: feature.bg }}
        >
          <feature.icon size={22} weight="duotone" style={{ color: feature.color }} />
        </div>
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-slate-800">
          {feature.title}
        </h3>
        <p className="text-[15px] leading-relaxed text-slate-500">
          {feature.desc}
        </p>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-white text-slate-900 selection:bg-indigo-200">
      {/* Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        @keyframes heroIn {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes beamSlide {
          0% { left: -30%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        html { scroll-behavior: smooth; }
      `}</style>

      {/* Subtle background texture */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(circle, #CBD5E1 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Top gradient wash */}
        <div
          className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2"
          style={{
            background: "radial-gradient(ellipse, rgba(79,70,229,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ---- Navbar ---- */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-400 ${
          scrolled
            ? "border-b border-slate-100 bg-white/85 shadow-sm shadow-slate-200/30 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 transition-transform duration-300 group-hover:scale-105">
              <GraduationCap size={16} weight="fill" className="text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              FP3
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] font-medium text-slate-400 md:flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <a href="#features" className="transition-colors duration-200 hover:text-slate-700">Özellikler</a>
            <a href="#how" className="transition-colors duration-200 hover:text-slate-700">Nasıl Çalışır</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full px-4 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800">
                Giriş Yap
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full border-0 bg-indigo-600 px-5 text-[13px] font-medium text-white shadow-md shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30">
                Kayıt Ol
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16">
        <div className="grid min-h-[calc(100svh-64px)] items-center gap-16 py-20 lg:grid-cols-[1fr_1.1fr]">
          {/* Left — Copy */}
          <div style={{ animation: "heroIn 0.9s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/60 px-3.5 py-1.5 text-[12px] font-medium text-indigo-600 backdrop-blur-sm">
              <Atom size={14} weight="duotone" />
              Ostim Teknik Üniversitesi için tasarlandı
            </div>

            <h1
              className="mb-6 text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.1] tracking-tight text-slate-900"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Araştırma{" "}
              <span
                className="text-indigo-600"
                style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontWeight: 500 }}
              >
                ortağını
              </span>
              <br />
              burada keşfet.
            </h1>

            <p
              className="mb-8 max-w-md text-[16px] leading-[1.7] text-slate-500"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Tag tabanlı akıllı eşleştirme ile sana en uygun akademisyenleri,
              projeleri ve araştırma alanlarını bul. Yapay zeka destekli profil
              analizi ile doğru bağlantıları kur.
            </p>

            <div className="mb-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="group h-11 rounded-full border-0 bg-indigo-600 px-7 text-[14px] font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30"
                >
                  Hemen Başla
                  <ArrowRight size={16} className="ml-1.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full border-slate-200 bg-white px-7 text-[14px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                >
                  Giriş Yap
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  style={{ animation: `heroIn 0.7s cubic-bezier(0.16,1,0.3,1) ${0.4 + i * 0.1}s both` }}
                >
                  <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[12px] font-medium text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Matching Visual */}
          <div
            className="hidden lg:block"
            style={{ animation: "heroInRight 1s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
          >
            <MatchingVisual />
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section id="features" className="relative z-10 border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <div className="mb-16 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3.5 py-1.5 text-[12px] font-medium text-slate-500">
                <Brain size={14} weight="duotone" className="text-indigo-500" />
                Platform Özellikleri
              </div>
              <h2
                className="mb-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Araştırmanı{" "}
                <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontWeight: 500, color: "#4F46E5" }}>
                  hızlandır
                </span>
              </h2>
              <p className="mx-auto max-w-md text-[16px] text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Doğru insanları bulmak artık saatler değil, saniyeler sürüyor.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {features.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section id="how" className="relative z-10 border-t border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <div className="mb-16 text-center">
              <h2
                className="mb-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                3 adımda{" "}
                <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontWeight: 500, color: "#4F46E5" }}>
                  başla
                </span>
              </h2>
            </div>
          </Reveal>

          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
            {/* Connecting line */}
            <div className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-[52px] hidden md:block">
              <div className="h-[1px] w-full bg-slate-200" />
              <div
                className="absolute top-0 h-[1px] w-1/4 bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ animation: "beamSlide 3.5s ease-in-out infinite" }}
              />
            </div>

            {steps.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.12}>
                <div className="group relative text-center">
                  {/* Step circle */}
                  <div className="relative z-10 mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl border border-slate-200 bg-white transition-all duration-500 group-hover:border-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-500/10" />
                    <item.icon
                      size={28}
                      weight="duotone"
                      className="relative z-10 text-slate-400 transition-colors duration-500 group-hover:text-indigo-600"
                    />
                  </div>

                  <div className="mb-2 text-[11px] font-bold tracking-[0.15em] text-indigo-500/60 uppercase">
                    Adım {item.step}
                  </div>
                  <h3
                    className="mb-2 text-lg font-semibold text-slate-800"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mx-auto max-w-[260px] text-[14px] leading-relaxed text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="relative z-10 border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-12 text-center md:p-20">
              {/* Decorative elements */}
              <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-[200px] w-[200px] rounded-full bg-indigo-100/50 blur-3xl" />
              <div className="pointer-events-none absolute bottom-[-40px] left-[-40px] h-[200px] w-[200px] rounded-full bg-violet-100/50 blur-3xl" />

              <div className="relative z-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
                  <Handshake size={28} weight="duotone" className="text-indigo-600" />
                </div>
                <h2
                  className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Akademik yolculuğunu
                  <br />
                  <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontWeight: 500, color: "#4F46E5" }}>
                    bugün başlat
                  </span>
                </h2>
                <p className="mx-auto mb-8 max-w-md text-[16px] leading-relaxed text-slate-500">
                  Ücretsiz kaydol, profilini oluştur ve sana en uygun araştırma
                  ortaklarını keşfet.
                </p>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="group h-12 rounded-full border-0 bg-indigo-600 px-8 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30"
                  >
                    Ücretsiz Kayıt Ol
                    <ArrowRight size={16} className="ml-1.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="relative z-10 border-t border-slate-100 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
              <GraduationCap size={12} weight="fill" className="text-white" />
            </div>
            <span className="text-[13px] font-medium text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              FP3 — Finding Publication Project Partner
            </span>
          </div>
          <p className="text-[12px] text-slate-300">
            © 2026 Ostim Teknik Üniversitesi
          </p>
        </div>
      </footer>
    </div>
  );
}
