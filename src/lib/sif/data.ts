/**
 * SIF SENTINEL — Synthetic report corpus.
 *
 * ⚠️ DEMO MODE: every record below is synthetic / representative.
 * Nothing here reflects real Oil India Limited sites, people or events.
 *
 * A seeded PRNG keeps the dataset stable between reloads so the dashboard,
 * network graph and heatmap stay consistent during a presentation.
 */

import { DOMAIN_PROFILES } from "./classifier";
import type { SifLevel } from "./rules";

export interface SafetyReport {
  report_id: string;
  date: string; // ISO
  site: string;
  activity: string;
  report_text: string;
  sif_potential: SifLevel;
  risk_score: number;
  life_saving_rule: string; // rule id
  hazard: string;
  barrier: string;
  barrier_failure: string;
  potential_consequence: string;
}

/** Mulberry32 — tiny deterministic PRNG. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20260925);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

export const SITES = ["Site A", "Site B", "Site C", "Site D", "Site E", "Site F"] as const;
export const SITE_KINDS: Record<string, string> = {
  "Site A": "Producing field — gathering station",
  "Site B": "Processing / separator complex",
  "Site C": "Drilling & workover location",
  "Site D": "Pipeline corridor & pigging",
  "Site E": "Workshop, yard & logistics",
  "Site F": "Tank farm & storage terminals",
};

/** Narrative templates. {slot} tokens are replaced with domain vocabulary. */
const FAILURE_TEXTS: Record<string, string[]> = {
  energy_isolation: [
    "During pipeline maintenance, the technician began loosening the flange before confirming that the line had been fully depressurized. The isolation status was not verified.",
    "Crew replaced a pump seal without applying personal lockout. The upstream valve was closed but no zero-energy verification was carried out before work started.",
    "A spool piece was removed while residual pressure was still reported in the header. Isolation certificate was signed but the bleed valve position was not checked.",
    "While replacing a compressor suction valve, the fitter assumed the circuit was depressurized because the panel showed a closed status. No field verification of zero energy was done.",
  ],
  line_of_fire: [
    "Rigger walked under a suspended load carrying taglines to guide it into the cellar deck. The exclusion zone had not been enforced and personnel entered while the crane was moving.",
    "A pallet being lowered by forklift swung toward two technicians standing inside the marked exclusion zone. No barriers or banksman were in place at the time.",
    "During a vessel lift, the crew passed under the hook path to position shackles. Dropped-object potential was not assessed before starting.",
    "Load secured with a defective sling slipped from the hook while a fitter adjusted the load from below the crane, inside the barricaded area.",
  ],
  confined_space: [
    "Operator entered a storage tank through the manway to inspect the internal coating before gas testing was completed. No standby person was positioned at the entry point.",
    "Crew began cleaning inside a separator without a valid entry permit. Atmospheric testing showed oxygen levels were not verified for the lower section of the vessel.",
    "A technician descended into a sump pit to recover a tool without authorisation. The atmosphere was not tested and no attendant was posted.",
    "Vessel entry started before the gas detector reading was reviewed. H2S checks were pending while the entrant was already inside the confined space.",
  ],
  hot_work: [
    "Grinding was carried out near an open drain with hydrocarbon vapor reported the previous shift. No fire watch had been assigned and flammables were not cleared from the area.",
    "Welding on a pipeline spool began while the hot work permit had expired an hour earlier. Spark potential near painted surfaces was not assessed.",
    "Gas cutting on a retired line produced sparks that traveled into an adjacent bundle containing residual product. Fire extinguisher was present but the watch left the area unattended.",
  ],
  working_at_height: [
    "A technician climbed a damaged ladder section to reach a pipe rack without a harness. The ladder tag had not been inspected this quarter.",
    "Work on elevated grating proceeded with the guardrail removed for access. No fall-restraint was attached and the opening was not barricaded below.",
    "Second man on the scaffold unclipped the lanyard to reposition the platform, overreaching beyond the guardrail while the scaffold tag was not current.",
  ],
  lifting: [
    "Crane lift of a heat exchanger proceeded without a lift plan. Shackle capacity was not verified against load charts and rigging inspection was skipped due to schedule pressure.",
    "Tandem lift arranged at short notice with uncertified slings. The competent person was not present during the initial hoist.",
    "Load chart for the mobile crane was exceeded while lifting a drilling collar. Outriggers were not fully deployed on the soft shoulder.",
  ],
  driving: [
    "Field vehicle left site after dark with no journey plan logged. The driver, fatigued after a double shift, was observed exceeding the site speed limit on the access road.",
    "Driver used a mobile phone at the wheel while overtaking a tanker convoy on the lease road. Seatbelt use by the rear passenger was not verified.",
    "Vehicle skidded on the wet haul road while returning without the journey-management check-in. Braking distance was misjudged during night driving.",
  ],
  excavation: [
    "Excavator trenching started before the utility scan was completed near the buried product line. Hand-dig instructions in the permit were ignored.",
    "Trench for the new drain line was left unsupported at 1.8 m depth with no shoring and spoil stacked at the edge. No daily inspection was recorded.",
    "Digging near a pipeline marker proceeded without a permit or scan. The excavation collapsed at the shoulder while a worker was still in the trench.",
  ],
  work_authorisation: [
    "Work started on the header replacement before the permit was signed. Scope changed overnight but the JSA was not reviewed with the crew.",
    "Crew continued work under an expired work authorization while the toolbox talk was not updated for the new SIMOPS crane movement nearby.",
    "Permit not displayed at the worksite; controls listed on the JSA were not verified before the crew began the task.",
  ],
  safety_controls: [
    "Gas detector inside the compressor shelter was left bypassed after maintenance. The override was not approved through management of change and was not restored.",
    "ESD push-in station defeated during a plant upset so the unit could keep running. Alarm bypass had no documented authorization.",
    "Relief valve isolation left closed after testing, disabling the safety device. The bypass status was not recorded in the log.",
  ],
};

const SAFE_TEXTS: Record<string, string[]> = {
  energy_isolation: [
    "Crew completed the isolation certificate, applied personal locks and verified zero energy at the flange before opening the line. Job well executed.",
    "Good catch: fitter stopped work when the bleed valve was found passing. Supervisor re-verified the isolation before the task continued.",
    "Zero-energy verification was demonstrated to the new technician before pump seal replacement. All locks removed after sign-off.",
  ],
  line_of_fire: [
    "Rigger positioned the entire crew outside the exclusion zone and used taglines from a safe distance. Lift completed without incident.",
    "Banksman stopped the forklift when a pedestrian entered the route. Barriers were repositioned before work resumed.",
    "Crew suspended the lift when unauthorized personnel approached the load path. Exclusion zone reinstated before continuing.",
  ],
  confined_space: [
    "Atmospheric testing completed for top, middle and bottom of the vessel before entry. Standby person maintained continuous watch and log.",
    "Entrant and attendant followed the permit correctly, re-testing the atmosphere after the sump was agitated. Well-controlled entry.",
    "Gas test verified oxygen at 20.9 percent before tank cleaning. Rescue tripod rigged before the entrant descended.",
  ],
  hot_work: [
    "Fire watch remained in place 30 minutes after welding finished. Flammable store blankets and extinguishers staged before work began.",
    "Hot work permit verified, nearby drains covered, and spark potential contained with fire blankets. Excellent housekeeping.",
    "Grinding stopped when smoke was detected from an adjacent cable tray; watch investigated and work resumed after the area was cleared.",
  ],
  working_at_height: [
    "Technician used a double-lanyard transition across the pipe rack with 100 percent tie-off. Scaffold tag was green and current.",
    "Guardrail opening barricaded below before grating panels were removed. Fall-restraint checked by the supervisor before access.",
    "Damaged ladder removed from service and tagged out after inspection. Replacement verified before the shift continued.",
  ],
  lifting: [
    "Lift plan reviewed with the crew, shackles certified and inspected, load chart verified. Lift completed within capacity.",
    "Competent rigger supervised the critical lift; exclusion zone maintained and taglines used from outside the radius.",
    "Crane operator halted the lift when outrigger settlement was noticed. Load lowered and ground re-assessed before continuing.",
  ],
  driving: [
    "Journey plan logged, fatigue check completed, and seatbelts confirmed for all occupants. Smooth trip with no deviations.",
    "Driver pulled over to rest when drowsy during night driving, per the journey management plan. Arrived safely after break.",
    "Vehicle skid avoided by reducing speed on the wet lease road and following the convoy plan. Correct defensive driving.",
  ],
  excavation: [
    "Utility scan completed and marked before mechanical digging. Hand-dig within one metre of the buried line as per permit.",
    "Trench shored and inspected at shift start; spoil set back from the edge. Daily excavation log maintained.",
    "Permit verified and survey completed before excavator mobilized to the dig location. No buried services affected.",
  ],
  work_authorisation: [
    "Permit signed, JSA reviewed with the crew, and controls verified before work started. Scope change stopped until re-authorization.",
    "Toolbox talk updated when SIMOPS crane movement was notified. Work paused until the overlapping permit was coordinated.",
    "Crew verified the permit was valid and displayed at the worksite before commencing. All controls checked off.",
  ],
  safety_controls: [
    "Bypass request raised through management of change with approval and time limit logged. Device restored and function-tested.",
    "Technician reported a passing alarm to the control room instead of silencing it. Fault corrected the same shift.",
    "Relief valve isolation verified open and locked after testing. Log signed and cross-checked by the panel operator.",
  ],
};

const HOUSEKEEPING_TEXTS = [
  "Housekeeping around the workshop benches was improved after the toolbox talk. Offcuts cleared and bins emptied.",
  "Extra drinking water stations placed near the field crew staging area ahead of the summer shift pattern.",
  "Office corridor lighting panel was replaced after a flicker was reported. No impact on operations.",
  "Canteen feedback form suggested adding more vegetarian options at lunch. Forwarded to admin services.",
  "Stores reorganized so that PPE sizes are easier to locate. Thank you to the stores team.",
  "New noticeboard installed at the security gate for visitors induction schedules.",
  "The meeting room projector HDMI cable was replaced after intermittent display issues.",
];

const UNITS: Record<string, string[]> = {
  energy_isolation: ["Pipeline Maintenance", "Pump Maintenance", "Valve Replacement", "Compressor Overhaul"],
  line_of_fire: ["Lifting", "Material Handling", "Vessel Lift", "Yard Logistics"],
  confined_space: ["Vessel Entry", "Tank Inspection", "Sump Cleaning", "Separator Cleaning"],
  hot_work: ["Hot Work", "Welding Repair", "Grinding", "Gas Cutting"],
  working_at_height: ["Height Work", "Pipe Rack Access", "Grating Removal", "Scaffold Work"],
  lifting: ["Mechanical Lifting", "Critical Lift", "Equipment Erection", "Collar Handling"],
  driving: ["Driving", "Field Journey", "Convoy Move", "Night Transport"],
  excavation: ["Excavation", "Trenching", "Drain Line Dig", "Cable Route Dig"],
  work_authorisation: ["Inspection", "Permit Review", "SIMOPS Coordination", "Header Replacement"],
  safety_controls: ["Maintenance", "Instrument Testing", "Plant Upset Response", "Relief Valve Service"],
};

function hazardProfile(ruleId: string) {
  const p = DOMAIN_PROFILES.find((d) => d.ruleId === ruleId)!;
  return p;
}

function isoDate(daysAgo: number): string {
  const d = new Date(2026, 8, 24); // 24 Sep 2026 (dataset "today")
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Build the corpus. Distribution target: ~19% HIGH, ~21% MEDIUM,
 * ~24% LOW, ~36% MINIMAL/housekeeping — realistic UA/UC funnel shape.
 */
function buildReports(count: number): SafetyReport[] {
  const reports: SafetyReport[] = [];
  const ruleIds = DOMAIN_PROFILES.map((d) => d.ruleId);

  // Explicit weights: energy isolation & line of fire dominate precursor volume.
  const weighted: string[] = [];
  const weights: Record<string, number> = {
    energy_isolation: 30, line_of_fire: 24, confined_space: 18, hot_work: 14,
    working_at_height: 14, lifting: 12, driving: 8, excavation: 8,
    work_authorisation: 8, safety_controls: 10,
  };
  for (const [k, v] of Object.entries(weights)) for (let i = 0; i < v; i++) weighted.push(k);

  for (let i = 0; i < count; i++) {
    const roll = rand();
    const ruleId = pick(weighted);
    const site = pick(SITES);
    const profile = hazardProfile(ruleId);
    const activity = pick(UNITS[ruleId]);

    // Hazard concentration: certain rule/site combos run hotter (for the heatmap story).
    const hotCombo =
      (site === "Site A" && ruleId === "energy_isolation") ||
      (site === "Site C" && ruleId === "confined_space") ||
      (site === "Site C" && ruleId === "line_of_fire") ||
      (site === "Site F" && ruleId === "energy_isolation") ||
      (site === "Site B" && ruleId === "hot_work") ||
      (site === "Site D" && ruleId === "excavation");

    let sif: SifLevel;
    if (roll < 0.19) sif = "HIGH";
    else if (roll < 0.4) sif = "MEDIUM";
    else if (roll < 0.64) sif = "LOW";
    else sif = "MINIMAL";
    if (hotCombo && sif === "LOW" && rand() < 0.55) sif = "MEDIUM";
    if (hotCombo && sif === "MEDIUM" && rand() < 0.35) sif = "HIGH";

    let text: string;
    let risk: number;
    let hazard = profile.hazard;
    let barrier = profile.barrier;
    let barrierFailure = profile.barrierFailure;
    let consequence = profile.consequence;

    if (sif === "MINIMAL") {
      // Housekeeping-level observation, no domain vocabulary.
      text = pick(HOUSEKEEPING_TEXTS);
      risk = Number((0.05 + rand() * 0.1).toFixed(2));
      hazard = "No specific hazard identified";
      barrier = "Routine supervision";
      barrierFailure = "None identified";
      consequence = "Minor / first-aid level";
      reports.push({
        report_id: `RPT-${String(10000 + i)}`,
        date: isoDate(int(0, 89)),
        site,
        activity: "General site activity",
        report_text: text,
        sif_potential: sif,
        risk_score: risk,
        life_saving_rule: "work_authorisation",
        hazard,
        barrier,
        barrier_failure: barrierFailure,
        potential_consequence: consequence,
      });
      continue;
    }

    if (sif === "HIGH") {
      text = pick(FAILURE_TEXTS[ruleId]);
      risk = Number((0.78 + rand() * 0.19).toFixed(2));
    } else if (sif === "MEDIUM") {
      text = pick(FAILURE_TEXTS[ruleId]);
      risk = Number((0.52 + rand() * 0.18).toFixed(2));
    } else {
      text = rand() < 0.5 ? pick(SAFE_TEXTS[ruleId]) : pick(FAILURE_TEXTS[ruleId]);
      risk = Number((0.31 + rand() * 0.17).toFixed(2));
      if (rand() < 0.4) {
        barrierFailure = "Barrier held — no failure identified";
        consequence = "Limited / controlled exposure";
      }
    }

    reports.push({
      report_id: `RPT-${String(10000 + i)}`,
      date: isoDate(int(0, 89)),
      site,
      activity,
      report_text: text,
      sif_potential: sif,
      risk_score: risk,
      life_saving_rule: ruleId,
      hazard,
      barrier,
      barrier_failure: barrierFailure,
      potential_consequence: consequence,
    });
  }

  // guarantee every rule id appears
  for (const id of ruleIds) {
    if (!reports.some((r) => r.life_saving_rule === id)) {
      const profile = hazardProfile(id);
      reports[reports.length - 1 - ruleIds.indexOf(id)] = {
        report_id: `RPT-${String(10000 + reports.length - 1 - ruleIds.indexOf(id))}`,
        date: isoDate(int(0, 89)),
        site: pick(SITES),
        activity: pick(UNITS[id]),
        report_text: pick(FAILURE_TEXTS[id]),
        sif_potential: "HIGH",
        risk_score: 0.84,
        life_saving_rule: id,
        hazard: profile.hazard,
        barrier: profile.barrier,
        barrier_failure: profile.barrierFailure,
        potential_consequence: profile.consequence,
      };
    }
  }
  return reports;
}

export const SYNTHETIC_REPORTS: SafetyReport[] = buildReports(244);

/** The five preloaded demo reports for the Investigator. */
export const DEMO_REPORTS: { label: string; text: string; site: string; activity: string }[] = [
  {
    label: "Pipeline flange — isolation not verified",
    site: "Site A",
    activity: "Pipeline Maintenance",
    text: "During pipeline maintenance, the technician began loosening the flange before confirming that the line had been fully depressurized. The isolation status was not verified.",
  },
  {
    label: "Rigger under suspended load",
    site: "Site C",
    activity: "Lifting",
    text: "Rigger walked under a suspended load carrying taglines to guide it into place. The exclusion zone had not been enforced and personnel entered while the crane was moving.",
  },
  {
    label: "Tank entry before gas testing",
    site: "Site F",
    activity: "Vessel Entry",
    text: "Operator entered a storage tank through the manway to inspect the internal coating before gas testing was completed. No standby person was positioned at the entry point.",
  },
  {
    label: "Grinding near open drain — no fire watch",
    site: "Site B",
    activity: "Hot Work",
    text: "Grinding was carried out near an open drain with hydrocarbon vapor reported the previous shift. No fire watch had been assigned and flammables were not cleared from the area.",
  },
  {
    label: "Zero-energy verification done correctly",
    site: "Site E",
    activity: "Pump Maintenance",
    text: "Crew completed the isolation certificate, applied personal locks and verified zero energy at the flange before opening the line. Job well executed.",
  },
];
