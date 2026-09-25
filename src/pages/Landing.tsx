import { Link } from "react-router";
import { motion } from "framer-motion";
import { SignalDot } from "@/components/sif/ui";
import { TOTAL_REPORTS, precursorRanking } from "@/lib/sif/analytics";

const top = precursorRanking().slice(0, 5);

const NAV = [
  { to: "/command-center", emoji: "🛰", label: "Command Center" },
  { to: "/investigator", emoji: "🔍", label: "Report Investigator" },
  { to: "/network", emoji: "🧬", label: "Precursor Network" },
  { to: "/sites", emoji: "📍", label: "Site Intelligence" },
];

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
    >
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-3.5 md:px-6">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-[5px] bg-primary text-[13px] font-bold text-primary-foreground">
              S
            </span>
            <div>
              <span className="block text-[13.5px] font-bold leading-tight tracking-tight">SIF SENTINEL</span>
              <span className="block font-mono-tech text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Precursor Intelligence
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <SignalDot tone="controlled" />
            <span className="hidden sm:inline">Intelligence engine online</span>
            <span className="font-mono-tech uppercase tracking-widest">● Demo • OIL HSSE</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 md:px-6">
        {/* Hero */}
        <section className="bg-grid-faint mt-5 rounded-md border border-border px-5 py-10 md:px-10 md:py-14">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-primary">
            Serious Injury & Fatality Precursor Intelligence
          </p>
          <h1 className="mt-3 max-w-3xl text-[30px] font-bold leading-[1.12] tracking-tight md:text-[40px]">
            Safety signals hiding inside everyday reports.
          </h1>
          <p className="mt-3.5 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Every shift produces hundreds of UA/UC observations, near-misses and incident
            narratives. SIF SENTINEL runs them through a deterministic classification pipeline,
            surfaces the ones carrying <span className="font-medium text-foreground">SIF potential</span>,
            and traces the recurring barrier failures behind them — so HSE attention lands where
            exposure is real.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link
              to="/command-center"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              🛰 Enter Command Center <span aria-hidden>→</span>
            </Link>
            <Link
              to="/investigator"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-muted"
            >
              ⚡ Try the Report Investigator
            </Link>
          </div>
        </section>

        {/* Journey strip */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 font-mono-tech text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            {[
              "Raw report",
              "NLP analysis",
              "SIF potential",
              "Life-Saving Rule",
              "Precursor",
              "Barrier failure",
              "Recurring pattern",
              "HSE intervention",
            ].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-border bg-card px-2.5 py-1">{step}</span>
                {i < arr.length - 1 && <span aria-hidden className="text-border">→</span>}
              </span>
            ))}
          </div>
        </section>

        {/* Screens */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NAV.map((n, i) => (
            <motion.div
              key={n.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3 }}
            >
              <Link
                to={n.to}
                className="group block rounded-md border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
              >
                <span className="text-[18px]">{n.emoji}</span>
                <p className="mt-2 text-[13.5px] font-semibold tracking-tight">{n.label}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  {
                    [
                      "Ranked precursor alerts, review queue, density trend.",
                      "Narrative in, structured risk JSON out — precursor chain included.",
                      "Activity → hazard → barrier, sized by observation volume.",
                      "Site × activity matrix of SIF-weighted signal load.",
                    ][i]
                  }
                </p>
                <span className="mt-3 inline-block text-[12px] font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                  Open →
                </span>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* Numbers band */}
        <section className="mt-8 rounded-md border border-border px-5 py-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-[22px] font-semibold tabular-nums leading-none">
                {TOTAL_REPORTS.toLocaleString("en-IN")}
              </p>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                synthetic reports analysed in this demo corpus
              </p>
            </div>
            <div>
              <p className="text-[22px] font-semibold tabular-nums leading-none">{top.length}</p>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                precursor families tracked, from Energy Isolation to Hot Work
              </p>
            </div>
            <div>
              <p className="text-[22px] font-semibold tabular-nums leading-none">100%</p>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                explainable — every flag cites the barrier failure behind it
              </p>
            </div>
          </div>
        </section>

        {/* Precursor teaser */}
        <section className="mt-8 mb-8">
          <h2 className="text-[15px] font-semibold tracking-tight">What the engine watches for</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((p) => (
              <li key={p.key} className="rounded-[5px] border border-border px-3.5 py-2.5">
                <span className="text-[12.5px] font-medium">
                  {p.emoji} {p.label}
                </span>
                <span className="ml-2 font-mono-tech text-[11px] tabular-nums text-muted-foreground">
                  {p.count} obs
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[11.5px] leading-relaxed text-muted-foreground">
            ⚠️ Prototype — AI-assisted prioritization support, not a fatality predictor. Flags read
            “SIF potential” and remain advisory until a qualified HSE professional reviews them.{" "}
            <span className="font-mono-tech uppercase tracking-widest">
              DEMO MODE • Synthetic / representative data
            </span>
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1180px] px-4 py-3.5 md:px-6">
          <p className="text-[11px] text-muted-foreground">
            Prototype • Synthetic demonstration data • AI-assisted HSE decision support
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
