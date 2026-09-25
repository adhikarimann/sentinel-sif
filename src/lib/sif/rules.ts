/**
 * SIF SENTINEL — Local safety knowledge base (IOGP Life-Saving Rules).
 *
 * Concise demo labels & descriptions — NOT official IOGP wording.
 * Modular: swap this file or the NLP layer without touching UI code.
 */

export type SifLevel = "HIGH" | "MEDIUM" | "LOW" | "MINIMAL";

export interface LifeSavingRule {
  id: string;
  label: string;
  emoji: string;
  short: string;
  description: string;
}

export const LIFE_SAVING_RULES: LifeSavingRule[] = [
  {
    id: "energy_isolation",
    label: "Energy Isolation",
    emoji: "🔒",
    short: "Isolate & verify zero energy",
    description:
      "Separate oneself from all forms of hazardous energy — pressure, electrical, mechanical, chemical — and verify isolation before starting work.",
  },
  {
    id: "line_of_fire",
    label: "Line of Fire",
    emoji: "🚧",
    short: "Stay out of the line of fire",
    description:
      "Position personnel where they will not be hit by moving objects, vehicles, released pressure or dropped loads.",
  },
  {
    id: "confined_space",
    label: "Confined Space",
    emoji: "🕳️",
    short: "Obtain authorisation before entry",
    description:
      "No entry into confined spaces without authorised permit, atmospheric testing, and a standby person.",
  },
  {
    id: "hot_work",
    label: "Hot Work",
    emoji: "🔥",
    short: "Control flammables & ignition",
    description:
      "Permit and controls required for welding, cutting, grinding — remove flammables and keep fire watch in place.",
  },
  {
    id: "working_at_height",
    label: "Working at Height",
    emoji: "🧗",
    short: "Protect against falls",
    description:
      "Inspect equipment and use fall protection when working at any height with fall potential.",
  },
  {
    id: "lifting",
    label: "Safe Mechanical Lifting",
    emoji: "🏗️",
    short: "Control suspended loads",
    description:
      "No personnel under a suspended load; certified equipment, rigging checks and exclusion zones in place.",
  },
  {
    id: "driving",
    label: "Driving",
    emoji: "🚗",
    short: "Drive to the journey plan",
    description:
      "Follow journey management plans, seatbelts for all occupants, no phones while driving.",
  },
  {
    id: "excavation",
    label: "Excavation",
    emoji: "⛏️",
    short: "Protect the excavation",
    description:
      "No ground disturbance without utility scans, shoring / battering, and regular inspections.",
  },
  {
    id: "work_authorisation",
    label: "Work Authorisation",
    emoji: "📋",
    short: "Work with a valid permit",
    description:
      "Confirm the permit is valid for the work, verify controls, and authorise the Gas Test where required.",
  },
  {
    id: "safety_controls",
    label: "Bypassing Safety Controls",
    emoji: "🛑",
    short: "Never bypass without approval",
    description:
      "Do not disable or bypass safety-critical equipment or alarms without documented authorisation.",
  },
];

export const RULE_MAP: Record<string, LifeSavingRule> = Object.fromEntries(
  LIFE_SAVING_RULES.map((r) => [r.id, r]),
);

export function rule(ruleId: string): LifeSavingRule | undefined {
  return RULE_MAP[ruleId];
}

export const SIF_LEVEL_META: Record<
  SifLevel,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  HIGH: {
    label: "High SIF potential",
    dot: "🔴",
    text: "text-critical",
    bg: "bg-critical-soft",
    border: "border-critical/30",
  },
  MEDIUM: {
    label: "Attention",
    dot: "🟠",
    text: "text-attention",
    bg: "bg-attention-soft",
    border: "border-attention/30",
  },
  LOW: {
    label: "Watch",
    dot: "🟡",
    text: "text-watch",
    bg: "bg-watch-soft",
    border: "border-watch/40",
  },
  MINIMAL: {
    label: "Controlled",
    dot: "🟢",
    text: "text-controlled",
    bg: "bg-controlled-soft",
    border: "border-controlled/30",
  },
};
