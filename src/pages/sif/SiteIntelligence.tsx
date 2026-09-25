import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/sif/AppShell";
import { Panel, SectionLabel, HeatSquare } from "@/components/sif/ui";
import { heatCell, siteTotals, SITES, HEAT_ACTIVITIES } from "@/lib/sif/analytics";
import { rule } from "@/lib/sif/rules";
import { cn } from "@/lib/utils";

export default function SiteIntelligence() {
  const [sel, setSel] = useState<{ site: string; activity: string } | null>({
    site: "Site C",
    activity: "Confined Space",
  });

  const cells = useMemo(() => {
    const m = new Map<string, ReturnType<typeof heatCell>>();
    for (const s of SITES) {
      for (const a of HEAT_ACTIVITIES) {
        m.set(`${s}|${a}`, heatCell(s, a));
      }
    }
    return m;
  }, []);

  const selCell = sel ? cells.get(`${sel.site}|${sel.activity}`) ?? null : null;
  const selRule = selCell ? rule(selCell.dominantRuleId) : null;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="📍 Site Intelligence"
        subtitle="Where are precursor signals concentrating?"
      />
      <div className="grid gap-4 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Panel
          title="Site × activity heatmap"
          sub="Click a cell to investigate. Intensity = SIF-weighted observation load."
          right={
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
              🔴 high 🟠 med 🟢 low
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-x-1.5 border-spacing-y-1.5">
              <thead>
                <tr>
                  <th className="w-[96px]"></th>
                  {HEAT_ACTIVITIES.map((a) => (
                    <th
                      key={a}
                      className="pb-0.5 text-center font-mono-tech text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SITES.map((s) => (
                  <tr key={s}>
                    <th
                      scope="row"
                      className="pr-1 text-left align-middle text-[12px] font-semibold tracking-tight"
                    >
                      {s}
                      <span className="mt-0.5 block font-mono-tech text-[9px] font-normal text-muted-foreground">
                        {siteTotals(s).reports} reports
                      </span>
                    </th>
                    {HEAT_ACTIVITIES.map((a) => {
                      const cell = cells.get(`${s}|${a}`)!;
                      const selected = sel?.site === s && sel?.activity === a;
                      return (
                        <td key={a} className="px-0">
                          <HeatSquare
                            level={cell.level}
                            selected={selected}
                            onClick={() => setSel({ site: s, activity: a })}
                            ariaLabel={`${s} ${a}: ${cell.reports} reports, ${cell.sif} SIF-potential`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Cell intensity = SIF-weighted observation load (synthetic).
            </p>
            <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
              DEMO MODE • Synthetic / representative data
            </span>
          </div>
        </Panel>

        {/* Cell detail */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {selCell && sel ? (
              <motion.aside
                key={`${sel.site}|${sel.activity}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-md border border-border bg-card shadow-[0_1px_2px_rgba(15,18,25,0.04)]"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    Cell investigation
                  </p>
                  <h2 className="mt-1 text-[17px] font-bold tracking-tight">
                    {sel.site} · {sel.activity}
                  </h2>
                </div>
                <div className="space-y-4 px-4 py-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[5px] border border-border px-3 py-2.5">
                      <SectionLabel>Reports</SectionLabel>
                      <p className="mt-0.5 text-[20px] font-semibold tabular-nums leading-none">
                        {selCell.reports}
                      </p>
                    </div>
                    <div className="rounded-[5px] border border-border px-3 py-2.5">
                      <SectionLabel>SIF-potential</SectionLabel>
                      <p className="mt-0.5 text-[20px] font-semibold tabular-nums leading-none text-critical">
                        {selCell.sif}
                      </p>
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Common precursor</SectionLabel>
                    <p className="mt-1 rounded-[5px] border border-dashed border-border px-2.5 py-1.5 text-[12.5px] font-medium">
                      ⚠️ {selCell.commonPrecursor}
                    </p>
                  </div>

                  <div>
                    <SectionLabel>Related Life-Saving Rule</SectionLabel>
                    <p className="mt-1 text-[13px] font-semibold">
                      {selRule?.emoji} {selRule?.label}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                      {selRule?.description}
                    </p>
                  </div>

                  <div className="rounded-[5px] bg-muted/60 px-3 py-2.5">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Dominant precursor family in this cell: {selCell.dominantEmoji}{" "}
                      <span className="font-medium text-foreground">{selCell.dominantRuleLabel}</span>
                    </p>
                  </div>
                </div>
              </motion.aside>
            ) : (
              <Panel title="Cell investigation" sub="Select a cell">
                <p className="text-[12.5px] text-muted-foreground">
                  Click any site × activity cell to see reports, SIF-potential count, common
                  precursor and the related Life-Saving Rule.
                </p>
              </Panel>
            )}
          </AnimatePresence>

          <div className="mt-3 rounded-md border border-border bg-muted/50 px-4 py-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              For the demo walkthrough: Site C × Confined Space carries the strongest signal —
              vessel-entry reports where atmospheric testing was not verified before entry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
