/**
 * SIF SENTINEL — NLP ENGINE (modular).
 *
 * Architecture:
 *   INPUT → NLP ENGINE → CLASSIFICATION → RULE MAPPING → PRECURSOR EXTRACTION → DASHBOARD
 *
 * This module implements the NLP/CLASSIFICATION layer as a deterministic
 * keyword + term-similarity engine so the demo runs with zero API keys and zero
 * model downloads. The `Analysis` contract below is the integration point: an
 * LLM-backed engine can be swapped in behind `classifyReport` without any UI
 * changes.
 */

import type { SifLevel } from "./rules";

export interface Analysis {
  sif_potential: SifLevel;
  risk_score: number; // 0..1
  life_saving_rule: string; // rule id
  activity: string;
  hazard: string;
  barrier: string;
  barrier_failure: string;
  potential_consequence: string;
  reason: string;
  matched_terms: string[];
  engine: "keyword-similarity-v2";
}

export interface DomainProfile {
  id: string;
  activity: string;
  ruleId: string;
  hazard: string;
  barrier: string;
  barrierFailure: string;
  consequence: string;
  terms: string[];
  /** Phrases that indicate a barrier was skipped / unverified — drives SIF uplift. */
  failureSignals: string[];
  riskStory: string;
}

/**
 * Domain profiles encode decades of HSE precursor logic. Each maps narrative
 * vocabulary to an IOGP Life-Saving Rule, hazard and barrier.
 */
export const DOMAIN_PROFILES: DomainProfile[] = [
  {
    id: "energy_isolation",
    activity: "Pipeline / Equipment Maintenance",
    ruleId: "energy_isolation",
    hazard: "Stored / pressurized energy",
    barrier: "Energy Isolation",
    barrierFailure: "Zero-energy verification",
    consequence: "High-energy release → serious injury / fatality potential",
    terms: [
      "isolation", "isolate", "isolated", "lockout", "loto", "tagout",
      "pressure", "pressurized", "pressurised", "depressurize", "depressurised",
      "de-pressurize", "depressurization", "stored energy", "zero energy",
      "electrical isolation", "charged", "discharge", "flange", "spool",
      "pipeline", "residual pressure", "bleed", "vent", "hydrocarbon",
      "compressor", "pump", "valve",
    ],
    failureSignals: [
      "before confirming", "not verified", "without verifying", "assumed",
      "did not verify", "no verification", "had not been", "was not isolated",
      "still pressurized", "still pressurised", "began loosening", "started work before",
      "prior to", "without isolation", "no isolation", "unverified",
    ],
    riskStory:
      "Maintenance began on a system that had not been verified at zero energy — classic stored-energy precursor.",
  },
  {
    id: "line_of_fire",
    activity: "Lifting / Material Handling",
    ruleId: "line_of_fire",
    hazard: "Dropped / suspended load, moving equipment",
    barrier: "Exclusion Zone",
    barrierFailure: "Personnel inside exclusion zone",
    consequence: "Struck-by → crush / serious injury potential",
    terms: [
      "suspended load", "dropped object", "dropped", "exclusion zone",
      "struck by", "struck-by", "pinch point", "crane", "load", "hoist",
      "rigging", "sling", "forklift", "banksmen", "banksman", "tagline",
      "swing", "crush", "hit by", "walked under", "passed under",
      "slipped off", "pallet",
    ],
    failureSignals: [
      "walked under", "passed under", "inside the exclusion", "entered the exclusion",
      "no exclusion", "no barrier", "no tagline", "below the load", "under the load",
      "crossed", "bypassed the barrier",
    ],
    riskStory:
      "Personnel were positioned inside the load path while a suspended load was moving — line-of-fire exposure.",
  },
  {
    id: "confined_space",
    activity: "Vessel / Tank Entry",
    ruleId: "confined_space",
    hazard: "Toxic / oxygen-deficient atmosphere",
    barrier: "Gas Testing & Entry Permit",
    barrierFailure: "Atmospheric testing not verified",
    consequence: "Asphyxiation / toxic exposure → fatality potential",
    terms: [
      "tank", "vessel", "confined space", "gas test", "gas testing",
      "oxygen", "h2s", "atmosphere", "atmospheric", "standby", "entrant",
      "entry", "manway", "sump", "pit", "sewer", "hydrocarbon vapor",
      "vapour", "fumes", "lel", "gas detector", "o2",
    ],
    failureSignals: [
      "without gas test", "no gas test", "not tested", "before testing",
      "entered before", "no permit", "no standby", "without authorization",
      "without authorisation", "no attendant", "unmonitored", "entered directly",
      "assumed safe",
    ],
    riskStory:
      "Entry into a confined space was made without verified atmospheric testing — confined-space precursor.",
  },
  {
    id: "hot_work",
    activity: "Welding / Hot Work",
    ruleId: "hot_work",
    hazard: "Ignition source near flammables",
    barrier: "Hot Work Permit & Fire Watch",
    barrierFailure: "Flammables not cleared / fire watch absent",
    consequence: "Fire / explosion → serious injury potential",
    terms: [
      "welding", "weld", "cutting", "cut", "grinding", "grinder", "spark",
      "sparks", "ignition", "hot work", "torch", "flame", "soldering",
      "flange up", "flameproof", "fire watch", "flammable", "combustible",
      "arc", "oxy-acetylene", "gas cutting",
    ],
    failureSignals: [
      "no fire watch", "without fire watch", "flammables nearby", "not cleared",
      "sparked near", "no extinguisher", "expired permit", "no permit",
      "unmonitored", "left unattended",
    ],
    riskStory:
      "Hot work proceeded with ignition sources active near uncleared flammables — fire precursor.",
  },
  {
    id: "working_at_height",
    activity: "Work at Height",
    ruleId: "working_at_height",
    hazard: "Fall from elevation",
    barrier: "Fall Protection / 100% Tie-off",
    barrierFailure: "Harness not anchored / equipment uninspected",
    consequence: "Fall from height → fatality potential",
    terms: [
      "scaffold", "scaffolding", "ladder", "elevated", "fall", "harness",
      "tie-off", "tie off", "anchor", "roof", "platform", "grating",
      "lanyard", "height", "riser", "climbing", "guardrail", "manbasket",
      "cherry picker", "scaffold tag",
    ],
    failureSignals: [
      "not anchored", "unanchored", "no harness", "without a harness",
      "not tied off", "no tie-off", "missing guardrail", "unclipped",
      "removed guardrail", "damaged ladder", "uninspected", "no scaffold tag",
      "overreached", "over reached",
    ],
    riskStory:
      "Work proceeded at elevation without verified fall protection — fall precursor.",
  },
  {
    id: "lifting",
    activity: "Mechanical Lifting",
    ruleId: "lifting",
    hazard: "Uncontrolled suspended load",
    barrier: "Lift Plan & Certified Rigging",
    barrierFailure: "Rigging inspection / lift plan skipped",
    consequence: "Dropped load / rigging failure → serious injury potential",
    terms: [
      "lifting", "lift plan", "crane lift", "tandem lift", "critical lift",
      "shackle", "shackles", "certified", "uncertified", "load chart",
      "outrigger", "crane operator", "rigger", "hook", "load test",
      "defective sling", "swl",
    ],
    failureSignals: [
      "no lift plan", "without a lift plan", "uncertified", "defective",
      "not inspected", "no rigging check", "exceeded capacity", "damaged sling",
      "no competent person", "hurried", "improvised",
    ],
    riskStory:
      "A lift proceeded without a verified plan and certified rigging — dropped-load precursor.",
  },
  {
    id: "driving",
    activity: "Driving / Journey Management",
    ruleId: "driving",
    hazard: "Loss of vehicle control",
    barrier: "Journey Management Plan",
    barrierFailure: "Fatigue / speeding / phone use",
    consequence: "Vehicle incident → serious injury potential",
    terms: [
      "driving", "driver", "vehicle", "speeding", "speed", "seatbelt",
      "seat belt", "fatigue", "mobile phone", "phone", "night driving",
      "journey plan", "journey management", "convoy", "tire", "tyre",
      "braking", "skid", "drowsy", "overtaking",
    ],
    failureSignals: [
      "no seatbelt", "no seat belt", "speeding", "used phone", "using phone",
      "fatigued", "exceeded hours", "no journey plan", "off plan",
      "overtaking", "drowsy", "skidded", "lost control",
    ],
    riskStory:
      "Journey-management barriers were not in place while driving conditions degraded — vehicle precursor.",
  },
  {
    id: "excavation",
    activity: "Excavation / Ground Disturbance",
    ruleId: "excavation",
    hazard: "Buried services / collapse",
    barrier: "Permit & Utility Scan",
    barrierFailure: "No scan / unsupported excavation",
    consequence: "Strike on buried service / engulfment → serious injury potential",
    terms: [
      "excavation", "excavator", "trench", "digging", "dig", "shoring",
      "battering", "buried", "underground", "utility scan", "pipeline marker",
      "hand dig", "mechanical dig", "collapsed", "spoil", "depth",
    ],
    failureSignals: [
      "no scan", "without scanning", "no permit", "not supported", "no shoring",
      "collapsed", "unmarked", "hand dig ignored", "dug before scanning",
      "no survey",
    ],
    riskStory:
      "Ground disturbance began without verified utility scanning and shoring — excavation precursor.",
  },
  {
    id: "work_authorisation",
    activity: "Permit / Work Authorisation",
    ruleId: "work_authorisation",
    hazard: "Work without verified controls",
    barrier: "Valid Permit-to-Work",
    barrierFailure: "Permit invalid / controls not verified",
    consequence: "Uncontrolled hazards during execution → SIF potential",
    terms: [
      "permit", "work authorization", "work authorisation", "ptw", "jsa",
      "job safety analysis", "tool box", "toolbox", "toolbox talk", "signature",
      "authorized", "authorised", "gas test on permit", "valid permit",
      "simops", "simultaneous operations",
    ],
    failureSignals: [
      "work started before", "expired", "no permit", "without a permit",
      "invalid permit", "not signed", "no jsa", "permit not displayed",
      "scope changed", "controls not verified", "bypassed the permit",
    ],
    riskStory:
      "Work execution ran ahead of the authorization barrier — unverified-controls precursor.",
  },
  {
    id: "safety_controls",
    activity: "Safety-Critical Equipment",
    ruleId: "safety_controls",
    hazard: "Safety controls overridden",
    barrier: "Bypass Approval & Management of Change",
    barrierFailure: "Unapproved bypass of critical device",
    consequence: "Unguarded failure event → fatality potential",
    terms: [
      "bypass", "bypassed", "disabled", "alarm", "trip", "interlock",
      "safety valve", "psv", "relief valve", "shutdown", "esd", "fire and gas",
      "gas detector disabled", "override", "defeated", "critical device",
    ],
    failureSignals: [
      "bypassed", "disabled the alarm", "no approval", "without approval",
      "left bypassed", "still bypassed", "defeated", "not restored",
      "overridden",
    ],
    riskStory:
      "A safety-critical device was bypassed without authorization — degraded-protection precursor.",
  },
];

const FAILURE_MARKERS = [
  "not verified", "no ", "didn't", "did not", "never", "skipped",
  "forgotten", "forgot", "missed", "failed to", "assumed", "bypassed",
  "expired", "invalid", "unverified", "unattended", "ignored",
];

const PROTECTIVE_MARKERS = [
  "verified", "confirmed", "completed", "signed", "isolated", "tested",
  "testing", "cleared", "attended", "stopped", "reported", "halted",
  "awaited", "corrected", "repaired", "supervisor", "maintained",
  "monitored", "supervised", "documented", "logged", "reviewed",
  "checked", "postponed",
];

/** A protective verb preceded by a negation actually signals failure. */
const NEGATION_TAIL = /\b(no|not|never|without)\s+$/;

export function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim()} `;
}

function countTerm(text: string, term: string): number {
  if (term.includes(" ")) return text.includes(term) ? 2 : 0;
  const re = new RegExp(`\\s${term.replace(/[-]/g, "\\-")}(s|ed|ing)?\\s`, "g");
  return (text.match(re) ?? []).length;
}

/** Simple lexical overlap similarity between narrative and profile terms. */
function similarity(text: string, terms: string[]): number {
  let hits = 0;
  for (const term of terms) hits += countTerm(text, term);
  return hits;
}

function matchedTerms(text: string, terms: string[], limit: number): string[] {
  const out: string[] = [];
  for (const term of terms) {
    if (text.includes(term) && out.length < limit) out.push(term);
  }
  return out;
}

function failureIntensity(text: string): { negative: number; positive: number } {
  let negative = 0;
  for (const m of FAILURE_MARKERS) {
    if (text.includes(m)) negative += 1;
  }
  let positive = 0;
  for (const m of PROTECTIVE_MARKERS) {
    const re = new RegExp(`\\b${m}\\b`, "g");
    for (const match of text.matchAll(re)) {
      const before = text.slice(Math.max(0, match.index - 18), match.index);
      if (NEGATION_TAIL.test(before)) {
        negative += 1; // "not cleared" is a failure, not protection
      } else {
        positive += 1;
      }
    }
  }
  return { negative, positive };
}

/**
 * Deterministic fallback classifier.
 * Score blends domain match strength, barrier-failure language, activity
 * context (energy / height / confined space carry higher inherent potential),
 * and specificity of the narrative.
 */
export function classifyReport(rawText: string): Analysis {
  const text = normalise(rawText);
  const words = text.trim().split(" ").filter(Boolean);

  const scored = DOMAIN_PROFILES.map((profile) => {
    const domainScore = similarity(text, profile.terms);
    const failureScore = similarity(text, profile.failureSignals) * 2;
    return { profile, raw: domainScore + failureScore * 1.5, domainScore, failureScore };
  }).sort((a, b) => b.raw - a.raw);

  const best = scored[0];
  const { negative, positive } = failureIntensity(text);

  // No safety vocabulary at all → housekeeping-level observation.
  if (!best || best.raw === 0) {
    return {
      sif_potential: "MINIMAL",
      risk_score: Number(Math.min(0.18, 0.04 + words.length / 400).toFixed(2)),
      life_saving_rule: "work_authorisation",
      activity: "General site activity",
      hazard: "No specific hazard identified",
      barrier: "Routine supervision",
      barrier_failure: "None identified",
      potential_consequence: "Minor / first-aid level",
      reason:
        "The narrative contains no recognised SIF precursor vocabulary — it reads as a general observation without exposure to high-energy sources.",
      matched_terms: [],
      engine: "keyword-similarity-v2",
    };
  }

  const profile = best.profile;
  const runnerUp = scored[1];

  // Weak safety vocabulary with a non-failure tone → housekeeping-level observation.
  if (best.raw < 4 && negative === 0 && positive >= 1) {
    return {
      sif_potential: "MINIMAL",
      risk_score: Number(Math.min(0.28, 0.06 + words.length / 500).toFixed(2)),
      life_saving_rule: profile.ruleId,
      activity: "General site activity",
      hazard: "No specific hazard identified",
      barrier: "Routine supervision",
      barrier_failure: "None identified",
      potential_consequence: "Minor / first-aid level",
      reason:
        "Only incidental safety vocabulary detected and no barrier-failure language. Classified as a general observation without SIF-relevant exposure.",
      matched_terms: matchedTerms(text, profile.terms, 4),
      engine: "keyword-similarity-v2",
    };
  }

  // Risk score model (deterministic, explainable):
  //  - domain strength (normalized)
  //  - barrier-failure language present
  //  - inherent energy potential of the domain
  //  - protective behaviours pull the score down
  const domainStrength = Math.min(1, best.raw / 9); // was 0.42 multiplier — see score blend below
  const inherent: Record<string, number> = {
    energy_isolation: 0.16,
    confined_space: 0.14,
    line_of_fire: 0.12,
    working_at_height: 0.12,
    lifting: 0.09,
    hot_work: 0.08,
    driving: 0.08,
    excavation: 0.08,
    safety_controls: 0.13,
    work_authorisation: 0.06,
  };
  const failureUplift = Math.min(0.26, best.failureScore * 0.035 + Math.max(0, negative - positive) * 0.05);
  const protectiveDiscount = Math.min(0.16, positive * 0.04);
  const specificity = Math.min(0.08, Math.max(0, words.length - 12) * 0.0035);

  let score = 0.24 + domainStrength * 0.34 + (inherent[profile.id] ?? 0.06) + failureUplift + specificity - protectiveDiscount;

  // If a strong protective action dominates the narrative, cap severity.
  if (positive >= 3 && negative <= 1) score = Math.min(score, 0.46);
  // Barrier-held pattern: domain language, no failure signals, protective verbs present.
  if (best.failureScore === 0 && negative === 0 && positive >= 2) score = Math.min(score, 0.44);
  score = Math.max(0.05, Math.min(0.97, score));

  const sifPotential: SifLevel =
    score >= 0.72 ? "HIGH" : score >= 0.5 ? "MEDIUM" : score >= 0.3 ? "LOW" : "MINIMAL";

  const failureFound = best.failureScore > 0 || negative > positive;
  const failure = failureFound
    ? profile.barrierFailure
    : "Barrier held — no failure identified";

  const matched: string[] = [];
  for (const term of profile.terms) {
    if (text.includes(term) && matched.length < 6) matched.push(term);
  }
  for (const term of profile.failureSignals) {
    if (text.includes(term) && matched.length < 8) matched.push(term);
  }

  const activityMatched =
    best.domainScore >= 2
      ? profile.activity
      : runnerUp && runnerUp.raw > 0
        ? `Possible ${runnerUp.profile.activity.toLowerCase()}`
        : profile.activity;

  const reason = failureFound
    ? `The narrative describes ${profile.activity.toLowerCase()} with signs that the ${profile.barrier.toLowerCase()} barrier was not fully applied — ${profile.barrierFailure.toLowerCase()}. This creates exposure to ${profile.hazard.toLowerCase()}.`
    : `The narrative references ${profile.activity.toLowerCase()} where ${profile.barrier.toLowerCase()} controls were described as in place. No clear barrier-failure language was detected, so the signal is retained for awareness rather than escalation.`;

  return {
    sif_potential: sifPotential,
    risk_score: Number(score.toFixed(2)),
    life_saving_rule: profile.ruleId,
    activity: activityMatched,
    hazard: profile.hazard,
    barrier: profile.barrier,
    barrier_failure: failure,
    potential_consequence: failureFound ? profile.consequence : "Limited / controlled exposure",
    reason,
    matched_terms: matched,
    engine: "keyword-similarity-v2",
  };
}
