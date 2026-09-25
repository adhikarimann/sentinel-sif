/**
 * SIF SENTINEL — PRECURSOR ENGINE + dashboard aggregation layer.
 *
 * Pure functions over the synthetic corpus. The dashboard consumes these
 * pre-computed series — no ad-hoc aggregation in components.
 */

import { SYNTHETIC_REPORTS, SITES, type SafetyReport } from "./data";
import { rule } from "./rules";

export type Band = "HIGH" | "MEDIUM" | "LOW" | "MINIMAL";

/* ------------------------------ status strip ------------------------------ */

export const TOTAL_REPORTS = SYNTHETIC_REPORTS.length;

export function sifShare(): number {
  const sif = SYNTHETIC_REPORTS.filter((r) => r.sif_potential === "HIGH" || r.sif_potential === "MEDIUM").length;
  return sif / TOTAL_REPORTS;
}

export const HIGH_PRIORITY_COUNT = SYNTHETIC_REPORTS.filter(
  (r) => r.risk_score >= 0.7,
).length;

/* --------------------------- precursor ranking ---------------------------- */

export interface PrecursorRank {
  key: string; // rule id
  label: string;
  emoji: string;
  count: number;
  sifCount: number;
  share: number; // 0..1 relative to top
}

export function precursorRanking(): PrecursorRank[] {
  const map = new Map<string, { count: number; sif: number }>();
  for (const r of SYNTHETIC_REPORTS) {
    const cur = map.get(r.life_saving_rule) ?? { count: 0, sif: 0 };
    cur.count += 1;
    if (r.sif_potential === "HIGH" || r.sif_potential === "MEDIUM") cur.sif += 1;
    map.set(r.life_saving_rule, cur);
  }
  const rows: PrecursorRank[] = [];
  for (const [key, v] of map) {
    const meta = rule(key);
    if (!meta || key === "work_authorisation") continue;
    rows.push({ key, label: meta.label, emoji: meta.emoji, count: v.count, sifCount: v.sif, share: 0 });
  }
  const top = Math.max(...rows.map((r) => r.count), 1);
  for (const r of rows) r.share = r.count / top;
  return rows.sort((a, b) => b.count - a.count);
}

/* -------------------------------- trend ----------------------------------- */

export interface TrendPoint {
  week: string;
  label: string;
  total: number;
  high: number;
  medium: number;
}

/** Weekly SIF-potential density over the last ~13 weeks. */
export function densityTrend(weeks = 13): TrendPoint[] {
  const now = new Date(2026, 8, 24);
  const buckets: TrendPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const inBucket = SYNTHETIC_REPORTS.filter((r) => {
      const d = new Date(r.date);
      return d >= start && d <= end;
    });
    buckets.push({
      week: start.toISOString().slice(0, 10),
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      total: inBucket.length,
      high: inBucket.filter((r) => r.sif_potential === "HIGH").length,
      medium: inBucket.filter((r) => r.sif_potential === "MEDIUM").length,
    });
  }
  return buckets;
}

/* --------------------------- attention alerts ----------------------------- */

export interface AttentionAlert {
  id: string;
  severity: "critical" | "high";
  emoji: string;
  precursor: string; // rule label
  delta: string;
  activityLabel: string;
  site: string;
  observationCount: number;
  pattern: string;
  ruleId: string;
}

/** Deterministic "period-over-period" deltas computed from the corpus (older vs newer half). */
function ruleDeltas(): Map<string, number> {
  const mid = new Date(2026, 8, 24);
  mid.setDate(mid.getDate() - 45);
  const deltas = new Map<string, number>();
  for (const rid of new Set(SYNTHETIC_REPORTS.map((r) => r.life_saving_rule))) {
    const old = SYNTHETIC_REPORTS.filter((r) => r.life_saving_rule === rid && new Date(r.date) < mid).length;
    const recent = SYNTHETIC_REPORTS.filter((r) => r.life_saving_rule === rid && new Date(r.date) >= mid).length;
    deltas.set(rid, old === 0 ? (recent > 0 ? 0.45 : 0) : (recent - old) / old);
  }
  return deltas;
}

export function attentionAlerts(): AttentionAlert[] {
  const deltas = ruleDeltas();
  const ranking = precursorRanking();
  const chosen: Array<{ rid: string; sev: "critical" | "high"; site: string; act: string; pattern: string }> = [
    { rid: "energy_isolation", sev: "critical", site: "Site A", act: "Maintenance", pattern: "Zero-energy verification" },
    { rid: "line_of_fire", sev: "high", site: "Site C", act: "Lifting", pattern: "Personnel entering exclusion zone" },
    { rid: "confined_space", sev: "critical", site: "Site F", act: "Inspection", pattern: "Atmospheric testing not verified" },
    { rid: "hot_work", sev: "high", site: "Site B", act: "Welding", pattern: "Fire watch absent at hot work front" },
    { rid: "safety_controls", sev: "high", site: "Site B", act: "Instrument Testing", pattern: "Unapproved bypass left in place" },
  ];
  const alerts: AttentionAlert[] = [];
  for (const c of chosen) {
    const meta = rule(c.rid);
    if (!meta) continue;
    const rows = SYNTHETIC_REPORTS.filter(
      (r) => r.life_saving_rule === c.rid && (r.sif_potential === "HIGH" || r.sif_potential === "MEDIUM"),
    );
    const rank = ranking.find((r) => r.key === c.rid);
    const d = deltas.get(c.rid) ?? 0;
    alerts.push({
      id: c.rid,
      severity: c.sev,
      emoji: meta.emoji,
      precursor: meta.label,
      delta: `${d >= 0 ? "+" : "−"}${Math.abs(Math.round(d * 100))}% this period`,
      activityLabel: c.act,
      site: c.site,
      observationCount: rows.length,
      pattern: c.pattern,
      ruleId: c.rid,
    });
  }
  return alerts;
}

/* ------------------------------ review queue ------------------------------ */

export interface QueueRow {
  level: Band;
  label: string;
  dot: string;
  count: number;
  caption: string;
}

export function reviewQueue(): QueueRow[] {
  const count = (b: Band) => SYNTHETIC_REPORTS.filter((r) => r.sif_potential === b).length;
  return [
    { level: "HIGH", label: "Urgent", dot: "🔴", count: count("HIGH"), caption: "Investigate within 24h" },
    { level: "MEDIUM", label: "Investigate", dot: "🟠", count: count("MEDIUM"), caption: "Assign HSE review this week" },
    { level: "LOW", label: "Monitor", dot: "🟡", count: count("LOW"), caption: "Trend watch, no action yet" },
  ];
}

/* ------------------------------ what changed ------------------------------ */

export interface ChangeRow {
  direction: "up" | "flat" | "down";
  glyph: string;
  label: string;
  delta: string;
  tone: "critical" | "attention" | "watch" | "controlled";
}

export function whatChanged(): ChangeRow[] {
  const deltas = ruleDeltas();
  const meta = (rid: string) => rule(rid)!;
  const pct = (rid: string) => `${deltas.get(rid)! >= 0 ? "+" : "−"}${Math.abs(Math.round((deltas.get(rid) ?? 0) * 100))}%`;
  const pickRow = (rid: string, direction: ChangeRow["direction"], tone: ChangeRow["tone"], glyph: string): ChangeRow => ({
    direction, glyph, label: meta(rid).label, delta: pct(rid), tone,
  });
  const d = (rid: string) => deltas.get(rid) ?? 0;
  return [
    pickRow("energy_isolation", d("energy_isolation") >= 0 ? "up" : "down", "critical", d("energy_isolation") >= 0 ? "↑" : "↓"),
    pickRow("line_of_fire", d("line_of_fire") >= 0 ? "up" : "down", "attention", d("line_of_fire") >= 0 ? "↑" : "↓"),
    pickRow("hot_work", Math.abs(d("hot_work")) < 0.1 ? "flat" : d("hot_work") > 0 ? "up" : "down", "watch", Math.abs(d("hot_work")) < 0.1 ? "→" : d("hot_work") > 0 ? "↑" : "↓"),
    pickRow("working_at_height", d("working_at_height") >= 0 ? "up" : "down", "controlled", d("working_at_height") >= 0 ? "↑" : "↓"),
  ];
}

/* ------------------------------ network graph ----------------------------- */

export interface NetNode {
  id: string;
  label: string;
  kind: "ACTIVITY" | "HAZARD" | "BARRIER" | "PRECURSOR";
  emoji: string;
  weight: number; // report count — drives radius
  ruleId: string;
  x: number;
  y: number;
}

export interface NetLink {
  source: string;
  target: string;
}

export interface NodeDetail {
  emoji: string;
  label: string;
  reports: number;
  sifReports: number;
  activities: string[];
  barrierIssue: string;
  sites: string[];
  ruleLabel: string;
}

function countSif(rows: SafetyReport[]): number {
  return rows.filter((r) => r.sif_potential === "HIGH" || r.sif_potential === "MEDIUM").length;
}

/** Static, hand-tuned layout for a readable investigation graph. */
const NET_LAYOUT: Array<{
  id: string; label: string; kind: NetNode["kind"]; emoji: string; ruleId: string;
  fx: number; fy: number;
}> = [
  // Activities (top band)
  { id: "a-pipeline", label: "Pipeline Maintenance", kind: "ACTIVITY", emoji: "🔧", ruleId: "energy_isolation", fx: 0.16, fy: 0.14 },
  { id: "a-pump", label: "Pump Maintenance", kind: "ACTIVITY", emoji: "🔧", ruleId: "energy_isolation", fx: 0.38, fy: 0.08 },
  { id: "a-lifting", label: "Lifting", kind: "ACTIVITY", emoji: "🏗️", ruleId: "line_of_fire", fx: 0.62, fy: 0.1 },
  { id: "a-vessel", label: "Vessel Entry", kind: "ACTIVITY", emoji: "🕳️", ruleId: "confined_space", fx: 0.85, fy: 0.15 },
  { id: "a-hotwork", label: "Hot Work", kind: "ACTIVITY", emoji: "🔥", ruleId: "hot_work", fx: 0.5, fy: 0.26 },
  // Hazards (middle band)
  { id: "h-stored", label: "Stored Energy", kind: "HAZARD", emoji: "⚡", ruleId: "energy_isolation", fx: 0.22, fy: 0.46 },
  { id: "h-dropped", label: "Dropped Object", kind: "HAZARD", emoji: "🪨", ruleId: "line_of_fire", fx: 0.52, fy: 0.44 },
  { id: "h-toxic", label: "Toxic Atmosphere", kind: "HAZARD", emoji: "☣️", ruleId: "confined_space", fx: 0.82, fy: 0.46 },
  { id: "h-fire", label: "Fire / Explosion", kind: "HAZARD", emoji: "🔥", ruleId: "hot_work", fx: 0.37, fy: 0.6 },
  { id: "h-vehicle", label: "Vehicle Movement", kind: "HAZARD", emoji: "🚗", ruleId: "driving", fx: 0.68, fy: 0.62 },
  // Barriers (bottom band)
  { id: "b-isolation", label: "Energy Isolation", kind: "BARRIER", emoji: "🔒", ruleId: "energy_isolation", fx: 0.16, fy: 0.82 },
  { id: "b-exclusion", label: "Exclusion Zone", kind: "BARRIER", emoji: "🚧", ruleId: "line_of_fire", fx: 0.4, fy: 0.9 },
  { id: "b-gastest", label: "Gas Testing", kind: "BARRIER", emoji: "🧪", ruleId: "confined_space", fx: 0.64, fy: 0.84 },
  { id: "b-permit", label: "Permit Verification", kind: "BARRIER", emoji: "📋", ruleId: "work_authorisation", fx: 0.84, fy: 0.9 },
  { id: "b-ppe", label: "PPE", kind: "BARRIER", emoji: "🦺", ruleId: "working_at_height", fx: 0.28, fy: 0.68 },
];

const NET_LINKS: NetLink[] = [
  { source: "a-pipeline", target: "h-stored" },
  { source: "a-pump", target: "h-stored" },
  { source: "a-hotwork", target: "h-fire" },
  { source: "a-hotwork", target: "h-dropped" },
  { source: "a-lifting", target: "h-dropped" },
  { source: "a-lifting", target: "h-vehicle" },
  { source: "a-vessel", target: "h-toxic" },
  { source: "h-stored", target: "b-isolation" },
  { source: "h-dropped", target: "b-exclusion" },
  { source: "h-dropped", target: "b-ppe" },
  { source: "h-toxic", target: "b-gastest" },
  { source: "h-toxic", target: "b-permit" },
  { source: "h-fire", target: "b-permit" },
  { source: "h-fire", target: "b-ppe" },
  { source: "h-vehicle", target: "b-permit" },
];

/** Terminal SIF-potential node appended after barriers in the chain. */
export const SIF_TERMINUS = {
  id: "sif",
  label: "SIF Potential",
  fx: 0.08,
  fy: 0.6,
};

export function precursorNetwork(): { nodes: NetNode[]; links: NetLink[] } {
  const nodes: NetNode[] = NET_LAYOUT.map((n) => {
    const rows = SYNTHETIC_REPORTS.filter((r) => r.life_saving_rule === n.ruleId);
    return {
      id: n.id,
      label: n.label,
      kind: n.kind,
      emoji: n.emoji,
      weight: rows.length,
      ruleId: n.ruleId,
      x: n.fx,
      y: n.fy,
    };
  });
  // Terminus node (small)
  nodes.push({
    id: SIF_TERMINUS.id,
    label: SIF_TERMINUS.label,
    kind: "PRECURSOR",
    emoji: "🔴",
    weight: 4,
    ruleId: "energy_isolation",
    x: SIF_TERMINUS.fx,
    y: SIF_TERMINUS.fy,
  });
  const extra = [
    { source: "b-isolation", target: "sif" },
    { source: "b-gastest", target: "sif" },
  ];
  return { nodes, links: [...NET_LINKS, ...extra] };
}

export function nodeDetail(node: NetNode): NodeDetail {
  const rows = SYNTHETIC_REPORTS.filter((r) => r.life_saving_rule === node.ruleId);
  const meta = rule(node.ruleId)!;
  const activities = [...new Set(rows.map((r) => r.activity))].slice(0, 3);
  const sites = [...new Set(rows.map((r) => r.site))].slice(0, 3);
  return {
    emoji: node.emoji,
    label: node.label,
    reports: rows.length,
    sifReports: countSif(rows),
    activities,
    barrierIssue: meta.id === "energy_isolation" ? "Zero-energy verification" : meta.short,
    sites,
    ruleLabel: meta.label,
  };
}

/* -------------------------------- heatmap --------------------------------- */

export interface HeatCell {
  site: string;
  activity: string;
  reports: number;
  sif: number;
  dominantRuleId: string;
  dominantRuleLabel: string;
  dominantEmoji: string;
  commonPrecursor: string;
  level: "high" | "medium" | "low";
}

export const HEAT_ACTIVITIES = [
  "Maintenance", "Lifting", "Hot Work", "Confined Space", "Height Work", "Driving",
] as const;

const ACT_TO_RULES: Record<string, string[]> = {
  Maintenance: ["energy_isolation", "safety_controls", "work_authorisation"],
  Lifting: ["lifting", "line_of_fire"],
  "Hot Work": ["hot_work"],
  "Confined Space": ["confined_space"],
  "Height Work": ["working_at_height"],
  Driving: ["driving"],
};

const PRECURSOR_BY_RULE: Record<string, string> = {
  energy_isolation: "Zero-energy verification skipped",
  lifting: "Lift plan / rigging check skipped",
  line_of_fire: "Exclusion zone not enforced",
  hot_work: "Fire watch not posted",
  confined_space: "Atmospheric testing not verified",
  working_at_height: "100% tie-off not maintained",
  driving: "Journey plan / fatigue checks missed",
  safety_controls: "Unapproved bypass left in place",
  work_authorisation: "Work started before permit signed",
  excavation: "Utility scan not completed",
};

export function heatCell(site: string, activity: string): HeatCell {
  const ruleIds = ACT_TO_RULES[activity] ?? [];
  const rows = SYNTHETIC_REPORTS.filter(
    (r) => r.site === site && ruleIds.includes(r.life_saving_rule),
  );
  const sifRows = rows.filter((r) => r.sif_potential === "HIGH" || r.sif_potential === "MEDIUM");
  // dominant rule by SIF weight
  const byRule = new Map<string, number>();
  for (const r of rows) {
    const w = r.sif_potential === "HIGH" ? 3 : r.sif_potential === "MEDIUM" ? 2 : r.sif_potential === "LOW" ? 1 : 0;
    byRule.set(r.life_saving_rule, (byRule.get(r.life_saving_rule) ?? 0) + w);
  }
  let dominant = ruleIds[0] ?? "work_authorisation";
  let max = -1;
  for (const [rid, w] of byRule) {
    if (w > max) {
      max = w;
      dominant = rid;
    }
  }
  const meta = rule(dominant);
  const heat = rows.reduce(
    (acc, r) => acc + (r.sif_potential === "HIGH" ? 3 : r.sif_potential === "MEDIUM" ? 2 : r.sif_potential === "LOW" ? 0.5 : 0),
    0,
  );
  const level = heat >= 14 ? "high" : heat >= 7 ? "medium" : "low";
  return {
    site,
    activity,
    reports: rows.length,
    sif: sifRows.length,
    dominantRuleId: dominant,
    dominantRuleLabel: meta?.label ?? activity,
    dominantEmoji: meta?.emoji ?? "📋",
    commonPrecursor: PRECURSOR_BY_RULE[dominant] ?? "—",
    level,
  };
}

export function siteTotals(site: string): { reports: number; sif: number } {
  const rows = SYNTHETIC_REPORTS.filter((r) => r.site === site);
  return { reports: rows.length, sif: countSif(rows) };
}

export { SITES };

/* ------------------------------- risk story ------------------------------- */

export interface RiskStory {
  headline: string;
  body: string;
  sources: string[];
  sites: string[];
}

export function riskStory(): RiskStory {
  const energy = SYNTHETIC_REPORTS.filter(
    (r) => r.life_saving_rule === "energy_isolation" && r.barrier_failure !== "Barrier held — no failure identified",
  );
  const sites = [...new Set(energy.map((r) => r.site))].slice(0, 2);
  const ids = energy.slice(0, 3).map((r) => r.report_id);
  return {
    headline: "Maintenance is starting before zero-energy verification",
    body: `${energy.length} maintenance reports across ${sites.length} sites show the same precursor: work began on piping or rotating equipment before isolation status was confirmed at zero energy. Isolation paperwork exists — field verification does not.`,
    sources: ids,
    sites,
  };
}
