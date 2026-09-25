# SIF SENTINEL — Precursor Intelligence (Demo Prototype)

**Serious Injury & Fatality Precursor Intelligence** — a hackathon prototype for the Oil India
Limited (OIL) HSSE problem statement. SIF Sentinel reads UA/UC observations, near-miss reports
and incident narratives, flags those carrying **SIF potential**, maps them to IOGP Life-Saving
Rules, and surfaces the recurring barrier failures behind them.

> ⚠️ **This is a demo prototype, not a production safety system.** The AI does not predict
> fatalities. All flags are prioritization signals ("SIF potential", "risk signal", "flagged
> for HSE review") and final assessment always remains with qualified HSE personnel.
> Every number in the app is **synthetic demonstration data** — nothing reflects real OIL
> sites, people or events.

## Run it

```bash
bun install
bun run dev
```

No database, no backend, no API keys. The deterministic classifier runs in the browser.

## The four screens

| Route | Screen | Question it answers |
| --- | --- | --- |
| `/command-center` | 🛰 Command Center | Which signals need HSE attention right now? |
| `/investigator` | 🔍 Report Investigator | Why did the engine flag this report? |
| `/network` | 🧬 Precursor Network | How do activities, hazards and barriers connect? |
| `/sites` | 📍 Site Intelligence | Where are precursor signals concentrating? |

## Architecture

```
INPUT (report narrative)
  → NLP ENGINE            src/lib/sif/classifier.ts   (keyword + term-similarity, deterministic)
  → CLASSIFICATION        risk score, SIF level, JSON contract
  → RULE MAPPING          src/lib/sif/rules.ts        (IOGP Life-Saving Rules knowledge base)
  → PRECURSOR EXTRACTION  src/lib/sif/analytics.ts    (ranking, trend, network, heatmap, risk story)
  → DASHBOARD             src/pages/sif/*.tsx
```

The engine is modular by design: `classifyReport(text) → Analysis` is the single seam.
Swap the deterministic fallback for an LLM-backed engine (same JSON contract:

```json
{
  "sif_potential": "HIGH",
  "risk_score": 0.94,
  "life_saving_rule": "energy_isolation",
  "activity": "Pipeline Maintenance",
  "hazard": "Stored Pressure",
  "barrier": "Energy Isolation",
  "barrier_failure": "Zero-energy verification",
  "potential_consequence": "High-energy release",
  "reason": "…"
}
```

) and every screen keeps working without changes.

## Synthetic corpus

~244 seeded reports across 6 sites and 10 precursor families (Energy Isolation, Line of Fire,
Confined Space, Hot Work, Working at Height, Safe Mechanical Lifting, Driving, Excavation,
Work Authorisation, Bypassing Safety Controls), with both SIF-potential and barrier-held
examples, plus 5 preloaded demo reports in the Investigator. The seeded PRNG keeps the dataset
identical across reloads so the demo is reproducible during a presentation.

## Demo script (60 seconds)

1. **Command Center** — read the hero, the status strip, then walk the three "Attention
   required" cards (Energy Isolation +Δ at Site A, Line of Fire at Site C, Confined Space at
   Site F). Open the "Risk story" tab.
2. **Report Investigator** — hit ⚡ Analyse on the preloaded pipeline-flange report. Watch the
   staged NLP animation, the SIF verdict (HIGH 🔴), the Life-Saving Rule mapping, the precursor
   chain and the HSE review buttons. Then load the "barrier held" example to show the engine
   distinguishes good catches from exposure.
3. **Precursor Network** — click Energy Isolation, then Gas Testing; show the side-panel
   investigation (reports, SIF counts, barrier issue, sites).
4. **Site Intelligence** — click Site C × Confined Space; read the cell investigation panel.

## Design language

Minimalism theme: off-white paper background with a faint engineering grid, charcoal ink,
safety-orange accent, IBM Plex Sans/Mono typography, compact bordered panels, tabular numerals,
emoji used as safety visual language (🔴🟠🟡🟢 ⚠️🛑🔒🕳️🔥🧗🏗️🚧🚗).
