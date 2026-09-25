import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/sif/AppShell";
import { Panel, SectionLabel } from "@/components/sif/ui";
import {
  precursorNetwork,
  nodeDetail,
  type NetNode,
  type NetLink,
} from "@/lib/sif/analytics";
import { cn } from "@/lib/utils";

const data = precursorNetwork();

const W = 920;
const H = 560;
const PAD_X = 90;
const PAD_Y = 56;

const KIND_STYLE: Record<
  NetNode["kind"],
  { ring: string; fill: string; text: string; label: string }
> = {
  ACTIVITY: { ring: "stroke-primary", fill: "fill-primary/10", text: "text-foreground", label: "Activity" },
  HAZARD: { ring: "stroke-critical/60", fill: "fill-critical/10", text: "text-foreground", label: "Hazard" },
  BARRIER: { ring: "stroke-controlled/70", fill: "fill-controlled/10", text: "text-foreground", label: "Barrier" },
  PRECURSOR: { ring: "stroke-critical", fill: "fill-critical", text: "text-white", label: "Precursor" },
};

function radius(weight: number, max: number) {
  return 26 + (weight / Math.max(max, 1)) * 26; // 26..52
}

function NodeChip({ n, active, dimmed, onSelect, maxWeight }: { n: NetNode; active: boolean; dimmed: boolean; onSelect: () => void; maxWeight: number }) {
  const r = radius(n.weight, maxWeight);
  const style = KIND_STYLE[n.kind];
  return (
    <g
      transform={`translate(${n.x} ${n.y})`}
      onClick={onSelect}
      className={cn("cursor-pointer transition-opacity duration-200", dimmed && "opacity-25")}
      role="button"
      aria-label={n.label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {active && (
        <circle r={r + 8} className="fill-none stroke-primary/50" strokeWidth={1.5} strokeDasharray="3 4" />
      )}
      <circle
        r={r}
        className={cn(style.fill, style.ring)}
        strokeWidth={n.kind === "PRECURSOR" ? 0 : 1.5}
      />
      <text textAnchor="middle" y={r + 14} className={cn("fill-foreground text-[10px] font-medium")}>
        {n.label}
      </text>
      <text textAnchor="middle" y={r + 26} className="fill-muted-foreground text-[8.5px]">
        {n.weight} reports
      </text>
      <text textAnchor="middle" dominantBaseline="central" className="text-[15px]">
        {n.emoji}
      </text>
    </g>
  );
}

const { nodes, links, max: maxWeight } = (() => {
  const max = Math.max(...data.nodes.map((n) => n.weight));
  const nodes = data.nodes.map((n) => ({
    ...n,
    x: PAD_X + n.x * (W - PAD_X * 2),
    y: PAD_Y + n.y * (H - PAD_Y * 2),
  }));
  return { nodes, links: data.links, max };
})();

export default function Network() {
  const [selectedId, setSelectedId] = useState<string | null>("b-isolation");
  const [hoverId, setHoverId] = useState<string | null>(null);

  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of links) {
      if (!m.has(l.source)) m.set(l.source, new Set());
      if (!m.has(l.target)) m.set(l.target, new Set());
      m.get(l.source)!.add(l.target);
      m.get(l.target)!.add(l.source);
    }
    return m;
  }, [links]);

  const focusId = hoverId ?? selectedId;
  const focusSet = useMemo(() => {
    if (!focusId) return null;
    const s = new Set<string>([focusId]);
    for (const t of adjacency.get(focusId) ?? []) s.add(t);
    return s;
  }, [focusId, adjacency]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const detail = selected ? nodeDetail(selected) : null;

  const onSelect = (id: string) => {
    setSelectedId(id);
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        title="🧬 Precursor Network"
        subtitle="See how activities, hazards and barrier failures connect."
      />
      <div className="grid gap-4 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Panel
          title="Relationship graph"
          sub="Click a node to investigate. Node size = observation volume."
          right={
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
              ● synthetic corpus
            </span>
          }
          bodyClassName="p-0"
        >
          <div className="px-4 pt-3">
            <div className="flex flex-wrap items-center gap-4 text-[10.5px] text-muted-foreground">
              {(["ACTIVITY", "HAZARD", "BARRIER", "PRECURSOR"] as const).map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block size-2.5 rounded-full",
                      k === "ACTIVITY" && "bg-primary/40 ring-1 ring-primary",
                      k === "HAZARD" && "bg-critical/30 ring-1 ring-critical/60",
                      k === "BARRIER" && "bg-controlled/30 ring-1 ring-controlled/70",
                      k === "PRECURSOR" && "bg-critical",
                    )}
                  />
                  {KIND_STYLE[k].label}
                </span>
              ))}
              <span className="ml-auto hidden sm:inline">Node size = observation volume</span>
            </div>
          </div>
          <div className="px-2 pb-3 pt-1">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label="Precursor network graph">
              {/* links */}
              {links.map((l, i) => {
                const a = nodes.find((n) => n.id === l.source);
                const b = nodes.find((n) => n.id === l.target);
                if (!a || !b) return null;
                const dim = focusSet ? !(focusSet.has(l.source) && focusSet.has(l.target)) : false;
                return (
                  <line
                    key={`${l.source}-${l.target}-${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className={cn(
                      "stroke-border transition-opacity duration-200",
                      dim && "opacity-20",
                      !dim && "stroke-foreground/25",
                    )}
                    strokeWidth={1.25}
                  />
                );
              })}
              {/* nodes */}
              {nodes.map((n) => (
                <NodeChip
                  key={n.id}
                  n={n}
                  active={n.id === selectedId}
                  dimmed={focusSet ? !focusSet.has(n.id) : false}
                  onSelect={() => onSelect(n.id)}
                  maxWeight={maxWeight}
                />
              ))}
            </svg>
          </div>
        </Panel>

        {/* Detail panel */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {detail && selected ? (
              <motion.aside
                key={selected.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-md border border-border bg-card shadow-[0_1px_2px_rgba(15,18,25,0.04)]"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    Node investigation
                  </p>
                  <h2 className="mt-1 text-[17px] font-bold tracking-tight">
                    {detail.emoji} {detail.label}
                  </h2>
                </div>
                <div className="space-y-4 px-4 py-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[5px] border border-border px-3 py-2.5">
                      <SectionLabel>Reports</SectionLabel>
                      <p className="mt-0.5 text-[20px] font-semibold tabular-nums leading-none">
                        {detail.reports}
                      </p>
                    </div>
                    <div className="rounded-[5px] border border-border px-3 py-2.5">
                      <SectionLabel>SIF-potential</SectionLabel>
                      <p className="mt-0.5 text-[20px] font-semibold tabular-nums leading-none text-critical">
                        {detail.sifReports}
                      </p>
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Most common activities</SectionLabel>
                    <ul className="mt-1.5 space-y-1">
                      {detail.activities.map((a) => (
                        <li key={a} className="text-[12.5px] text-foreground/85">
                          • {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <SectionLabel>Most frequent barrier issue</SectionLabel>
                    <p className="mt-1 rounded-[5px] border border-dashed border-border px-2.5 py-1.5 text-[12.5px] font-medium">
                      🛑 {detail.barrierIssue}
                    </p>
                  </div>

                  <div>
                    <SectionLabel>Sites</SectionLabel>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {detail.sites.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionLabel>Life-Saving Rule</SectionLabel>
                    <p className="mt-1 text-[12.5px] font-medium text-foreground/85">{detail.ruleLabel}</p>
                  </div>
                </div>
              </motion.aside>
            ) : (
              <Panel title="Node investigation" sub="Select a node to see detail">
                <p className="text-[12.5px] text-muted-foreground">
                  Click any activity, hazard or barrier to pull the connected reports, SIF counts and
                  recurring barrier issue.
                </p>
              </Panel>
            )}
          </AnimatePresence>

          <div className="mt-3 rounded-md border border-border bg-muted/50 px-4 py-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Reading the graph: an activity connects to the hazard it releases, which connects to
              the barrier designed to stop it. When a barrier fails repeatedly across sites, the
              terminal node — 🔴 SIF potential — is where the pattern lands.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
