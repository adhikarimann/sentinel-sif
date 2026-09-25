import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, SectionLabel, RiskPill } from "@/components/sif/ui";
import {
  TOTAL_REPORTS,
  HIGH_PRIORITY_COUNT,
  sifShare,
  precursorRanking,
  densityTrend,
  attentionAlerts,
  reviewQueue,
  whatChanged,
  riskStory,
  SITES,
  siteTotals,
} from "@/lib/sif/analytics";
import { SIF_LEVEL_META } from "@/lib/sif/rules";
import { cn } from "@/lib/utils";

const ranking = precursorRanking();
const trend = densityTrend();
const alerts = attentionAlerts();
const queue = reviewQueue();
const changes = whatChanged();
const story = riskStory();

function StatusStrip() {
  const cells = [
    { label: "Reports analysed", value: TOTAL_REPORTS.toLocaleString("en-IN") },
    { label: "SIF potential", value: `${(sifShare() * 100).toFixed(1)}%` },
    { label: "High-priority signals", value: String(HIGH_PRIORITY_COUNT) },
    { label: "Sites monitored", value: String(SITES.length) },
  ];
  return (
    <Panel
      bodyClassName="py-0"
      right={
        <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
          DEMO MODE • Synthetic / representative data
        </span>
      }
    >
      <dl className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
        {cells.map((c, i) => (
          <div key={c.label} className={cn("px-4 py-3.5", i < 2 && "border-b border-border md:border-b-0")}>
            <dt className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {c.label}
            </dt>
            <dd className="mt-1 text-[22px] font-semibold tabular-nums leading-none tracking-tight">
              {c.value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

const SEV_STYLE = {
  critical: { pill: "critical" as const, pillText: "Critical" },
  high: { pill: "attention" as const, pillText: "Attention" },
};

function AlertCard({ a, index }: { a: (typeof alerts)[number]; index: number }) {
  const sev = SEV_STYLE[a.severity];
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28 }}
      className="group flex flex-col justify-between rounded-md border border-border bg-card p-4 transition-shadow hover:shadow-[0_2px_10px_rgba(15,18,25,0.07)]"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold tracking-tight">
            {a.emoji} {a.precursor.toUpperCase()}
          </span>
          <RiskPill tone={sev.pill}>{sev.pillText}</RiskPill>
        </div>
        <p className="mt-1 font-mono-tech text-[11px] font-medium text-critical tabular-nums">{a.delta}</p>
        <p className="mt-2.5 text-[12px] text-muted-foreground">
          {a.activityLabel} • {a.site}
        </p>
        <p className="mt-0.5 text-[12px] text-foreground/85">{a.observationCount} high-potential observations</p>
        <div className="mt-3 rounded-[5px] border border-dashed border-border px-2.5 py-2">
          <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
            Recurring barrier failure
          </span>
          <p className="mt-0.5 text-[12px] font-medium">🛑 {a.pattern}</p>
        </div>
      </div>
      <Link
        to="/investigator"
        className="mt-3.5 inline-flex items-center gap-1 text-[12px] font-semibold text-primary transition-colors hover:text-primary/80"
      >
        Investigate <span aria-hidden>→</span>
      </Link>
    </motion.article>
  );
}

function TrendChart() {
  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trend} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="sifArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.645 0.208 47)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="oklch(0.645 0.208 47)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="oklch(0.915 0.004 90)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "oklch(0.517 0.01 260)" }}
            tickLine={false}
            axisLine={{ stroke: "oklch(0.915 0.004 90)" }}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "oklch(0.517 0.01 260)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <ReTooltip
            contentStyle={{
              borderRadius: 6,
              border: "1px solid oklch(0.915 0.004 90)",
              fontSize: 11,
              boxShadow: "0 2px 10px rgba(15,18,25,0.08)",
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="high"
            name="High SIF potential"
            stroke="oklch(0.55 0.205 26)"
            strokeWidth={1.5}
            fill="url(#sifArea)"
          />
          <Area
            type="monotone"
            dataKey="medium"
            name="Medium"
            stroke="oklch(0.68 0.16 48)"
            strokeWidth={1.5}
            fillOpacity={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CommandCenter() {
  const [tab, setTab] = useState<"queue" | "changed" | "story">("queue");
  return (
    <div className="mx-auto max-w-[1180px] space-y-4 px-4 py-5 md:px-6">
      {/* Hero */}
      <section className="bg-grid-faint relative overflow-hidden rounded-md border border-border">
        <div className="px-5 py-7 md:px-8 md:py-9">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-primary">
            ⚠ Safety operations • last 90 days
          </p>
          <h1 className="mt-2 max-w-2xl text-[26px] font-bold leading-[1.15] tracking-tight md:text-[31px]">
            Safety signals hiding inside everyday reports.
          </h1>
          <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
            AI-assisted prioritization of reports with potential for serious injury or fatality —
            so HSE attention lands where exposure is real.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              to="/investigator"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              ⚡ Analyse a report
            </Link>
            <Link
              to="/network"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-muted"
            >
              🧬 Explore precursor network
            </Link>
          </div>
        </div>
      </section>

      <StatusStrip />

      {/* Attention required */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <SectionLabel>⚠ Attention required</SectionLabel>
          <span className="text-[11px] text-muted-foreground">Signals worth investigating</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {alerts.slice(0, 5).map((a, i) => (
            <AlertCard key={a.id} a={a} index={i} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Precursor ranking */}
        <Panel
          className="lg:col-span-3"
          title="What keeps appearing?"
          sub="Precursor families ranked by observation volume"
          right={
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
              90 days
            </span>
          }
        >
          <ul className="space-y-3.5">
            {ranking.map((p) => (
              <li key={p.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-medium">
                    {p.emoji} {p.label}
                  </span>
                  <span className="font-mono-tech text-[11px] tabular-nums text-muted-foreground">
                    {p.count} obs · {p.sifCount} SIF-potential
                  </span>
                </div>
                <div className="mt-1.5 h-[7px] w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(p.share * 100, 4)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary/85"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Density trend */}
        <Panel
          className="lg:col-span-2"
          title="SIF-potential density"
          sub="Flagged reports per week"
          right={
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-critical" />
              <span className="inline-block size-1.5 rounded-full bg-attention" />
              <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                high / med
              </span>
            </span>
          }
        >
          <TrendChart />
        </Panel>
      </div>

      {/* Queue / changed / story with tabs */}
      <Panel
        title="HSE attention desk"
        sub="Where review capacity should go next"
        right={
          <div className="flex rounded-md border border-border p-0.5">
            {(
              [
                ["queue", "Review queue"],
                ["changed", "What changed?"],
                ["story", "Risk story"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={cn(
                  "rounded-[4px] px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                  tab === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {tab === "queue" && (
          <div className="grid gap-3 sm:grid-cols-3">
            {queue.map((q) => (
              <div key={q.level} className="rounded-[5px] border border-border px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold">
                    {q.dot} {q.label}
                  </span>
                  <span className="text-[20px] font-semibold tabular-nums leading-none">{q.count}</span>
                </div>
                <p className="mt-1.5 text-[11.5px] text-muted-foreground">{q.caption}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "changed" && (
          <ul className="divide-y divide-border/70">
            {changes.map((c) => (
              <li key={c.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className="text-[12.5px] font-medium">{c.label}</span>
                <span
                  className={cn(
                    "font-mono-tech text-[12px] font-semibold tabular-nums",
                    c.direction === "up" && c.tone === "critical" && "text-critical",
                    c.direction === "up" && c.tone === "attention" && "text-attention",
                    c.direction === "down" && "text-controlled",
                    c.direction === "flat" && "text-muted-foreground",
                  )}
                >
                  {c.glyph} {c.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
        {tab === "story" && (
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <div>
              <p className="text-[14px] font-semibold tracking-tight">📖 {story.headline}</p>
              <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
                {story.body}
              </p>
            </div>
            <div className="rounded-[5px] border border-dashed border-border px-3.5 py-3">
              <SectionLabel>Source reports</SectionLabel>
              <ul className="mt-2 space-y-1.5">
                {story.sources.map((id) => (
                  <li key={id} className="font-mono-tech text-[11px] text-muted-foreground">
                    {id}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-[11px] text-muted-foreground">
                Sites: {[...new Set(story.sites)].join(", ")}
              </p>
            </div>
          </div>
        )}
      </Panel>

      {/* site chips */}
      <Panel title="Sites monitored" sub="Signal volume by location" bodyClassName="py-3">
        <div className="flex flex-wrap gap-2">
          {SITES.map((s) => {
            const t = siteTotals(s);
            const meta = SIF_LEVEL_META.HIGH;
            return (
              <Link
                key={s}
                to="/sites"
                className="group rounded-[5px] border border-border px-3 py-2 transition-colors hover:bg-muted"
              >
                <span className="text-[12.5px] font-semibold">{s}</span>
                <span className="ml-2 font-mono-tech text-[11px] tabular-nums text-muted-foreground">
                  {t.reports} reports
                </span>
                <span className={cn("ml-2 font-mono-tech text-[11px] font-semibold tabular-nums", meta.text)}>
                  {t.sif} SIF-potential
                </span>
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
