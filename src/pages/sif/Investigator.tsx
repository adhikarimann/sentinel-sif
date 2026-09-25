import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/sif/AppShell";
import { Panel, SectionLabel } from "@/components/sif/ui";
import { DEMO_REPORTS } from "@/lib/sif/data";
import { classifyReport, type Analysis } from "@/lib/sif/classifier";
import { rule, SIF_LEVEL_META, type SifLevel } from "@/lib/sif/rules";
import { cn } from "@/lib/utils";

const STAGES = [
  "Reading report...",
  "Identifying hazards...",
  "Checking precursor signals...",
  "Mapping Life-Saving Rule...",
  "Building risk story...",
];

const SAMPLE_PROMPTS = [
  "During pipeline maintenance, the technician began loosening the flange before confirming that the line had been fully depressurized. The isolation status was not verified.",
  "Rigger walked under a suspended load carrying taglines to guide it into place. The exclusion zone had not been enforced and personnel entered while the crane was moving.",
  "Operator entered a storage tank through the manway to inspect the internal coating before gas testing was completed. No standby person was positioned at the entry point.",
  "Grinding was carried out near an open drain with hydrocarbon vapor reported the previous shift. No fire watch had been assigned and flammables were not cleared from the area.",
  "Crew completed the isolation certificate, applied personal locks and verified zero energy at the flange before opening the line. Job well executed.",
];

type Phase = "idle" | "analysing" | "done";

const LEVEL_TONE: Record<SifLevel, "critical" | "attention" | "watch" | "controlled"> = {
  HIGH: "critical",
  MEDIUM: "attention",
  LOW: "watch",
  MINIMAL: "controlled",
};

function StructuredCard({ a }: { a: Analysis }) {
  const r = rule(a.life_saving_rule);
  const meta = SIF_LEVEL_META[a.sif_potential];
  const pct = Math.round(a.risk_score * 100);
  const failed = a.barrier_failure !== "Barrier held — no failure identified";

  return (
    <div className="space-y-4">
      {/* Verdict */}
      <div className={cn("rounded-md border px-4 py-4", meta.bg, meta.border)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionLabel className="text-foreground/60">SIF potential</SectionLabel>
            <p className="mt-1 text-[22px] font-bold tracking-tight">
              {a.sif_potential} {meta.dot}
            </p>
          </div>
          <div className="text-right">
            <SectionLabel className="text-foreground/60">Risk signal</SectionLabel>
            <p className="mt-1 text-[22px] font-semibold tabular-nums leading-none tracking-tight">
              {pct}%
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              a.sif_potential === "HIGH"
                ? "bg-critical"
                : a.sif_potential === "MEDIUM"
                  ? "bg-attention"
                  : a.sif_potential === "LOW"
                    ? "bg-watch"
                    : "bg-controlled",
            )}
          />
        </div>
        <p className="mt-2 text-[11px] text-foreground/65">
          {SIF_LEVEL_META[a.sif_potential].label} — flagged for HSE review, not a prediction.
        </p>
      </div>

      {/* LSR mapping grid */}
      <div className="grid gap-x-6 gap-y-3 rounded-md border border-border px-4 py-4 sm:grid-cols-2">
        <div>
          <SectionLabel>IOGP Life-Saving Rule</SectionLabel>
          <p className="mt-1 text-[14px] font-semibold">
            {r?.emoji} {r?.label}
          </p>
        </div>
        <div>
          <SectionLabel>Activity</SectionLabel>
          <p className="mt-1 text-[13px] font-medium">{a.activity}</p>
        </div>
        <div>
          <SectionLabel>Hazard</SectionLabel>
          <p className="mt-1 text-[13px] font-medium">{a.hazard}</p>
        </div>
        <div>
          <SectionLabel>Barrier</SectionLabel>
          <p className="mt-1 text-[13px] font-medium">{a.barrier}</p>
        </div>
        <div>
          <SectionLabel>Barrier failure</SectionLabel>
          <p className={cn("mt-1 text-[13px] font-medium", failed ? "text-critical" : "text-controlled")}>
            🛑 {a.barrier_failure}
          </p>
        </div>
        <div>
          <SectionLabel>Potential consequence</SectionLabel>
          <p className="mt-1 text-[13px] font-medium">{a.potential_consequence}</p>
        </div>
      </div>

      {/* Why flagged */}
      <div className="rounded-md border border-border px-4 py-4">
        <SectionLabel>🧠 Why was this flagged?</SectionLabel>
        <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-foreground/85">{a.reason}</p>
        {a.matched_terms.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {a.matched_terms.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono-tech text-[10px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
          Engine: {a.engine} · deterministic · executes in-browser · no external API
        </p>
      </div>
    </div>
  );
}

function PrecursorChain({ a }: { a: Analysis }) {
  const r = rule(a.life_saving_rule);
  const steps = [
    a.activity,
    a.hazard,
    r?.label ?? a.barrier,
    a.barrier_failure,
    a.potential_consequence.split("→")[0]?.trim() || a.potential_consequence,
    "🔴 SIF Potential",
  ];
  return (
    <div className="rounded-md border border-border px-4 py-4">
      <SectionLabel>Preview</SectionLabel>
      <ol className="mt-2.5 space-y-0">
        {steps.map((s, i) => (
          <motion.li
            key={`${s}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.14, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="flex w-5 flex-col items-center self-stretch">
              <span
                className={cn(
                  "size-[7px] shrink-0 rounded-full",
                  i === steps.length - 1 ? "bg-critical" : "bg-primary/70",
                )}
              />
              {i < steps.length - 1 && <span className="min-h-[18px] w-px flex-1 bg-border" />}
            </div>
            <div className={cn("py-1.5", i === steps.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "text-[12.5px] leading-snug",
                  i === 0
                    ? "font-semibold text-foreground"
                    : i === steps.length - 1
                      ? "font-bold text-critical"
                      : "font-medium text-foreground/80",
                )}
              >
                {s}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

export default function Investigator() {
  const [text, setText] = useState(SAMPLE_PROMPTS[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState<Analysis | null>(null);
  const timers = useRef<number[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const analyse = () => {
    const value = text.trim();
    if (!value || phase === "analysing") return;
    clearTimers();
    setPhase("analysing");
    setResult(null);
    setStageIdx(0);
    const analysis = classifyReport(value);
    const perStage = 190;
    STAGES.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStageIdx(i + 1), perStage * (i + 1)));
    });
    timers.current.push(
      window.setTimeout(() => {
        setResult(analysis);
        setPhase("done");
        if (analysis.sif_potential === "HIGH") {
          toast("🔴 Signal detected — high SIF potential", {
            description: "Flagged for HSE review. Feedback refines the demo model.",
          });
        } else if (analysis.sif_potential === "MEDIUM") {
          toast("🟠 Attention-level signal", {
            description: "Barrier language suggests exposure — review recommended.",
          });
        } else {
          toast("🟢 No significant SIF signal", {
            description: "Report stored for trend analysis.",
          });
        }
      }, perStage * STAGES.length + 80),
    );
  };

  const jumpToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  void jumpToResults;

  const selectSample = (s: string) => {
    setText(s);
    setResult(null);
    setPhase("idle");
  };

  const review = (action: string) => {
    toast(`Feedback recorded for model improvement (${action}).`, {
      description: "Demo only — no data leaves this browser.",
    });
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="🔍 Report Investigator"
        subtitle="Paste a safety observation and let SIF Sentinel unpack the risk."
      />
      <div className="grid gap-4 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Input column */}
        <div className="space-y-4">
          <Panel
            title="Report workspace"
            sub="Preloaded examples cover each precursor family"
            bodyClassName="p-0"
          >
            <div className="px-4 pt-3.5">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                className="min-h-[150px] resize-y border-border font-mono-tech text-[12.5px] leading-relaxed"
                placeholder="Paste a UA/UC observation, near-miss or incident narrative…"
              />
              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={analyse}
                  disabled={phase === "analysing" || !text.trim()}
                  className="gap-2 font-semibold"
                >
                  {phase === "analysing" ? (
                    <>
                      <span className="inline-block size-1.5 animate-blink-dot rounded-full bg-background" />
                      Analysing…
                    </>
                  ) : (
                    <>⚡ Analyse report</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setText("");
                    setResult(null);
                    setPhase("idle");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-4 border-t border-border/70 px-4 py-3.5">
              <SectionLabel>Preloaded demo reports</SectionLabel>
              <div className="mt-2 space-y-1">
                {DEMO_REPORTS.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => selectSample(d.text)}
                    className="flex w-full items-center justify-between gap-2 rounded-[5px] px-2.5 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium">{d.label}</span>
                      <span className="block text-[10.5px] text-muted-foreground">
                        {d.site} • {d.activity}
                      </span>
                    </span>
                    <span aria-hidden className="text-muted-foreground">
                      ›
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {/* How it works */}
          <Panel title="Pipeline" sub="INPUT → NLP ENGINE → CLASSIFICATION → RULE MAPPING → PRECURSOR EXTRACTION">
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              A deterministic keyword + term-similarity engine scores narratives locally in the
              browser — no API key, no telemetry. <span className="font-mono-tech text-[11.5px]">classifyReport()</span>{" "}
              is the single seam: an LLM engine returning the same JSON contract drops in without
              touching a single screen. Every score is explainable and reproducible.
            </p>
          </Panel>
        </div>

        {/* Results column */}
        <div ref={resultsRef} className="min-w-0 space-y-4 scroll-mt-4">
          <AnimatePresence mode="wait">
            {phase === "analysing" && (
              <motion.div
                key="analysing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <Panel
                  title="NLP engine"
                  sub="Deterministic classifier · executing locally"
                  className="relative overflow-hidden"
                >
                  <div
                    aria-hidden
                    className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-primary/10 to-transparent"
                  />
                  <ul className="space-y-2.5">
                    {STAGES.map((s, i) => (
                      <li key={s} className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-full border text-[9px] font-bold",
                            i < stageIdx
                              ? "border-controlled bg-controlled text-background"
                              : i === stageIdx
                                ? "border-primary text-primary"
                                : "border-border text-muted-foreground",
                          )}
                        >
                          {i < stageIdx ? "✓" : i + 1}
                        </span>
                        <span
                          className={cn(
                            "font-mono-tech text-[12px]",
                            i < stageIdx
                              ? "text-muted-foreground"
                              : i === stageIdx
                                ? "font-medium text-foreground"
                                : "text-muted-foreground/60",
                          )}
                        >
                          {s}
                        </span>
                        {i === stageIdx && (
                          <span className="ml-auto inline-block size-1.5 animate-blink-dot rounded-full bg-primary" />
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary/80"
                      initial={{ width: "5%" }}
                      animate={{ width: `${Math.min((stageIdx / STAGES.length) * 100, 100)}%` }}
                      transition={{ duration: 0.18 }}
                    />
                  </div>
                </Panel>
              </motion.div>
            )}

            {phase === "done" && result && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <StructuredCard a={result} />
                <PrecursorChain a={result} />

                {/* HSE review */}
                <Panel title="👷 HSE review" sub="Human judgement closes the loop">
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                    AI flag is a prioritization signal. Final assessment remains with qualified HSE
                    personnel.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => review("Confirm flag")}>
                      ✓ Confirm flag
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => review("Review")}>
                      ✎ Review
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => review("Mark non-SIF")}>
                      ↩ Mark non-SIF
                    </Button>
                  </div>
                </Panel>
              </motion.div>
            )}

            {phase === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>                  <Panel title="Awaiting input" sub="Pick a preloaded demo report or paste your own narrative">
                  <div className="space-y-2.5">
                    <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                      SIF Sentinel reads the narrative, maps it to an IOGP Life-Saving Rule, extracts
                      the failing barrier and builds the precursor chain — then hands the decision to
                      an HSE professional.
                    </p>
                    <div className="rounded-[5px] border border-dashed border-border px-3 py-2.5">
                      <p className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Expected output
                      </p>
                      <ul className="mt-1.5 space-y-1 text-[12px] text-muted-foreground">
                        <li>· SIF potential & risk signal %</li>
                        <li>· Life-Saving Rule mapping</li>
                        <li>· Barrier failure identification</li>
                        <li>· Precursor chain & risk story</li>
                      </ul>
                    </div>
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
