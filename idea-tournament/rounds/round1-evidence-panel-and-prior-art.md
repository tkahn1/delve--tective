# Round 1 evidence: gut-check panel and prior-art scouts

## Gut-check panel
Five non-technical judges (literature professor, marketing alumnus, small-business investor, student-affairs staff, bank recruiter) saw ONLY the name and one-sentence pitch. "Get" = understood it and why anyone would want it. "Over" = would walk over to try it. Caveat from the orchestrator: this was text only; a toy visible across a hall attracts people in a way a sentence does not, so low "over" counts for visual toys are weaker evidence than low "get" counts.

| # | Name | Get /5 | Over /5 | Sample reaction |
|---|------|--------|---------|-----------------|
| 0 | Verified AI Code (seed) | 0 | 0 | "Formal proofs? Sounds like homework." |
| 1 | Vault | 5 | 5 | "Break the bank rules? Show me that." |
| 2 | Monkey's Paw | 4 | 3 | "Lovely, walking over." / "Cute gag, no use to me." |
| 3 | Who Can See This? | 3 | 3 | "Permissions sounds like IT homework." / "matters for staff data" |
| 4 | Tripwire | 4 | 3 | "Watch it steal, then watch it refuse. Yes." |
| 5 | Ghost Imports | 0 | 0 | "Software packages, not my world." |
| 6 | Blacklight | 4 | 3 | "UV flashlight for hidden text, instantly get it." |
| 7 | Glance | 4 | 4 | "Eye typing for accessibility, good cause." |
| 8 | Proof of Typing | 1 | 0 | "Surveillance vibes, no thanks." |
| 9 | Tell | 4 | 2 | "Pulse bluff game, funny." / "a bit creepy" |
| 10 | Wand Duel | 3 | 3 | "Kids would love it." |
| 11 | Feel the Graph | 5 | 4 | "Charts you can feel, accessibility, yes." |
| 12 | Choir of One | 3 | 2 | "Charming, a moment." / "party toy" |
| 13 | Flipbook | 2 | 1 | "Cute, nothing more." |
| 14 | Window | 2 | 1 | "Neat trick, seen it before." |
| 15 | Shadow Zoo | 2 | 2 | "Delightful." / "Kids' toy vibe, passing." |
| 16 | Swarm Screen | 1 | 1 | "Cool visual, unclear purpose." |
| 17 | Face Duet | 4 | 3 | "Faces as instruments, bizarre, stopping." |
| 18 | Elastic | 5 | 4 | "Lectures slowed, pauses cut. Useful, I'd test." |
| 19 | Tired Test | 4 | 0 | "Catchy, quick look." / "medical-sounding, skip" |
| 20 | Heckle | 5 | 4 | "Insulting animated crowd. Ha, I'd try it." |
| 21 | Blind Spot | 0 | 0 | "Debugging, not for me." |
| 22 | Idiom Lens | 5 | 5 | "Captions that explain sarcasm? Yes." |
| 23 | Say It Right | 5 | 5 | "Name pronunciation badges, orientation gold." |
| 24 | Calm Race | 3 | 1 | "Pulse race. Gimmick." |
| 25 | Mind Charades | 1 | 1 | "Brain-reading AI? Sci-fi, no thanks." |
| 26 | Was That Me? | 4 | 4 | "Voice clone scams, I've heard. Test it." |
| 27 | Did It Read Me? | 2 | 1 | "That's my world" (professor) / "too technical" |
| 28 | Shaky | 5 | 3 | "Shows where ChatGPT makes things up. Useful." |
| 29 | Minuteman Mirror | 2 | 2 | "Costume filter, fun for a minute." |
| 30 | Coin Jar | 3 | 1 | "Pay by pouring coins? Gimmick." |
| 31 | Vish | 4 | 4 | "Scam-call training, my staff needs this." |
| 32 | Legend | 1 | 0 | "Too niche." |
| 33 | Sticky Note | 3 | 1 | "Clever security demo." / "too technical" |
| 34 | Stand-ins | 4 | 4 | "AI testers with impairments, great idea." |

## Prior-art scouts (web search this session; URLs as returned by search)
Verdicts: NOVEL = nothing close found; DIFFERENT = close things exist, core twist is new; EXISTS = someone ships essentially this.

- 0 Seed: EXISTS. Crosscheck, a Claude Code plugin that checks Claude's code with Dafny (nicholls-inc/claude-code-marketplace); lemmafit (Dafny + Claude Code); Emergence's VCG verified coding agent. Clover paper confirmed.
- 1 Vault: DIFFERENT. Vandal (Devpost): Claude finance agent with deterministic checker and counterexample-guided policy synthesis, no Dafny. Nothing found replaying proof counterexamples as Nessie transactions. Red flag: Dafny counterexamples are often not concrete or missing, so replay may need a bounded-search fallback. Nessie note below.
- 2 Monkey's Paw: NOVEL. No solver-driven wish game found. z3-solver npm ships WASM (confirmed); default build needs SharedArrayBuffer (COOP/COEP headers). Funny output depends on the LLM, not Z3.
- 3 Who Can See This?: EXISTS. AutoCedar (arXiv 2607.03656, July 2026): natural-language access requirements to Cedar with verifier-guided repair. cedar-policy-symcc is real (v0.1.3), needs a cvc5 binary; Windows build risk.
- 4 Tripwire: EXISTS as a demo. IntentBinding (hackquest.io): CaMeL-style planner/quarantine split, guard toggle, baseline drained vs blocked side by side. CaMeL paper and code confirmed. Red flag: another project (Claira) reported newer models often refuse the injections, so the baseline may not fall.
- 5 Ghost Imports: EXISTS, crowded. PkgGuard VS Code extension, slopcheck, ghostpkg, slopguard-cli. Paper confirmed.
- 6 Blacklight: EXISTS. ASCII Smuggler plus many clones (Unsmuggle, PromptShield, others). Conflicting reports on whether current Claude obeys hidden Unicode-tag instructions.
- 7 Glance: DIFFERENT. Google Look to Speak (fixed phrases); Google SpeakFaster (Nature Communications): LLM expands initials for gaze typists, 29–60% faster for two ALS users. No WebGazer + LLM project found. WebGazer is unmaintained and GPLv3 but reported functional Feb 2026.
- 8 Proof of Typing: DIFFERENT. Kundu et al. arXiv 2406.15335 does this as research. arXiv 2601.17280 claims copy-typing attacks evade five classifiers at 99.8%+.
- 9 Tell: DIFFERENT. A poker show (Deepstack) displays players' webcam heart rates; several Devpost webcam-pulse projects; no bluffing party game found. Red flag: webcam rPPG gives usable average heart rate but not precise short-window changes, which a bluff game needs.
- 10 Wand Duel: EXISTS. Arcania (QR, phone as wand against a desktop game); Spell Duel (phones pair, air-drawn accelerometer spells).
- 11 Feel the Graph: EXISTS. ChartA11y (iOS app: touch a chart, pitch tones + vibration); TactualPlot (IEEE VIS 2023). No vibration on iOS Safari.
- 12 Choir of One: DIFFERENT. Harmony Voice (iOS, voice to up to 4 voices), hardware/plug-in harmonizers. Red flag: CREPE too heavy for real time; use pYIN.
- 13 Flipbook: EXISTS as research tool. Visual Anagrams official code is DeepFloyd IF only (too heavy for 8 GB without offloading); Stable Diffusion port plausible but unconfirmed.
- 14 Window: DIFFERENT. Open-source head-tracked parallax repos exist (3D-parallax, Portal, True3D WindowMode). Depth Anything V2 Small in Transformers.js confirmed. Phone fps unknown.
- 15 Shadow Zoo: DIFFERENT. Shadow Critters (2025 installation: recorded shadow becomes a walking creature, on a projected tent); Google Shadow Art.
- 16 Swarm Screen: DIFFERENT. Junkyard Jumbotron (MIT 2011) was still-image only; no live camera-calibrated multi-phone animation found.
- 17 Face Duet: DIFFERENT. InterFACE (face-controlled instrument with a 2-person duet mode), face theremin toys exist. Split eyebrow/mouth across two phones not found.
- 18 Elastic: NOVEL. Nothing found that slows live speech and catches up by cutting silence. Building blocks confirmed (Silero VAD in browser via @ricky0123/vad-web; Signalsmith Stretch / SoundTouchJS worklets).
- 19 Tired Test: DIFFERENT. Science is real (17–19 h awake is about 0.05% BAC). Red flag: no source converts to "drinks" (depends on weight and sex); frame as BAC-equivalent.
- 20 Heckle: DIFFERENT. PitchPilote (AI audience grills you, flags fillers afterwards); Devpost Inspeech, Pitchly (post-hoc filler counting). No live-reacting animated audience with walk-outs found.
- 21 Blind Spot: NOVEL. No tool found that flags the lines you did not mention. (Lightlayer does voice code review with highlighting.)
- 22 Idiom Lens: EXISTS partly. Slang Clarifier Chrome extension: real-time subtitles with idioms and slang explained. LingoMojo explains idioms for non-native speakers. Only the sarcasm/tone part is unshipped.
- 23 Say It Right: DIFFERENT. NameCoach records names in your own voice with a phonetic field and name badges. Auto respelling, stress bars and a feedback meter not found.
- 24 Calm Race: DIFFERENT. A 2022 dissertation game ("In the Same Boat") is a two-player breathing game using webcam heart rate; Devpost rPPG wellness tools. ME-rPPG confirmed; open-rppg pip-installable; weights research-only licence.
- 25 Mind Charades: DIFFERENT. Neuronpedia had a word-association game; no player-facing "make the feature fire" game found. Gemma Scope 2 confirmed for 1B; exact SAELens release ID for 1B not found.
- 26 Was That Me?: DIFFERENT. Red flag, serious: one benchmark (arXiv 2503.19176) reports AudioSeal over-the-air detection around 0.07–5%, so the speaker-to-mic beat likely fails. Chatterbox fits in 8 GB (about 2.3–3.5 GB).
- 27 Did It Read Me?: DIFFERENT. Red flag, serious: CheckMIABench (arXiv 2606.17464) reports near-chance AUC (0.49–0.50) for membership inference on Pythia on a cleaned split.
- 28 Shaky: DIFFERENT. UQLM library (CVS Health) does claim-level uncertainty without a UI; RELIC is a per-claim consistency interface. Novelty is mainly the wobble UI.
- 29 Minuteman Mirror: EXISTS. The StreamDiffusion webcam demo is this.
- 30 Coin Jar: DIFFERENT. Gyroscope jar toys and savings-jar apps exist; no tilt-to-pay banking found.
- 31 Vish: EXISTS. Keepnet, Brightside, NINJIO and Arsen's free "AI Voice Phishing Playground" are two-way adaptive AI vishing simulators. Live tactic-naming panel not found.
- 32 Legend: DIFFERENT but close. Color Blind Pal highlights a tapped colour and helps read charts.
- 33 Sticky Note: DIFFERENT. Physical prompt-injection papers exist (arXiv 2601.17383, 2602.07104) as attack research; no live shopping-agent demo with a shield found. No test on Claude specifically found.
- 34 Stand-ins: EXISTS partly. ASE 2025 paper and Agent Aria (Product Hunt) simulate impaired users with agents. Sketch input and five-cursor heatmap not found. Sources warn simulated impairments miss real screen-reader issues.

Nessie API note (affects 1, 4, 30, 31): api.nessieisreal.com is live as of Oct 2026. Transfers and withdrawals are documented, but reportedly do NOT change the account balance; purchase creation is uncertain. Any demo that shows "the balance drops" needs its own ledger on top of Nessie.
