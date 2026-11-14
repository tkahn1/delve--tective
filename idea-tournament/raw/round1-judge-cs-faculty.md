# Round 1: judge cs faculty

Verbatim final report from this subagent.

A)
0 | 3/10 | General verified codegen in 30h is a fantasy; "proved" only means it matches Claude's own spec | Narrow to one domain; show the spec back as concrete examples a human confirms
1 | 6/10 | Proves Claude's Dafny spec, not the user's rule; Dafny counterexamples often aren't concrete | Back-translate the spec into example traces the user confirms; use bounded search for replays; own ledger
2 | 6/10 | "Airtight" means UNSAT against a toy world model Claude wrote, not the wish itself | Say "airtight in this 12-variable world" on screen; show the world model openly
3 | 6/10 | AutoCedar already does this; Claude writes the guard question too; cvc5 build on Windows | Hand-write the guard queries; report the leak-catch rate on seeded bugs; get symcc running by hour 3
4 | 5/10 | CaMeL with a new costume, already demoed; modern baseline may refuse, so the contrast collapses | Pre-measure baseline ASR on a fixed attack set; report the utility cost too
5 | 4/10 | Crowded field; hallucination base rate on current models may be near zero | Make the hallucination-rate measurement itself the headline, with confidence intervals
6 | 3/10 | Detection is decoding by construction, so a 100% rate means nothing; many clones exist | Measure whether current models actually obey each payload type instead
7 | 5/10 | WebGazer accuracy in a noisy hall; known components (SpeakFaster precedent) | Within-subject, counterbalanced, prediction vs none; report selections per phrase with CIs
8 | 3/10 | "Proves" collapses against a published 99.8% copy-typing evasion; surveillance framing | Drop "proof"; report LOPO accuracy and your own forgery success rate honestly
9 | 2/10 | Short-window rPPG changes are noise; binary bluff call has 50% chance, not 33% | Drop the bluff inference; at most show average BPM vs smartwatch
10 | 3/10 | Already exists (Arcania, Spell Duel); nothing to evaluate beyond gesture accuracy | Report unseen-user accuracy honestly; otherwise pick another idea
11 | 4/10 | ChartA11y exists; blindfolded sighted people aren't blind users; no vibration on iOS | Present it as a sighted-proxy pilot; run haptic+audio vs audio, counterbalanced
12 | 4/10 | Real DSP but known product category; real-time latency is risky | Lead with the record-then-harmonise fallback; report cents error and latency
13 | 3/10 | Known method; SD port to 8 GB unconfirmed; success rides on one render | Pre-test 10 pairs; report naming rate on strangers
14 | 3/10 | Seen since 2007; no claim worth testing | Measure head-to-render latency only; otherwise drop it
15 | 3/10 | Rigging arbitrary silhouettes is a research problem; Shadow Critters exists | Limit it to 5 classes with hand-made rigs
16 | 4/10 | Junkyard Jumbotron lineage; sync under 50 ms across phones is unproven | Report calibration mm error and sync jitter as the clean result
17 | 3/10 | InterFACE exists; latency across two phones; nothing scientific to claim | Measure latency; keep it a toy
18 | 6/10 | Own cited paper (Novak 2019) predicts a null comprehension result; n=8 is underpowered | Headline the guaranteed lag bound as an engineering result; frame comprehension as exploratory
19 | 4/10 | "Drinks" conversion has no source; touch latency and self-report confound the correlation | Report a BAC-equivalent band; calibrate per device; show the scatter with r and n
20 | 4/10 | Word-frequency "jargon" detection is crude; before/after with 6 teams proves nothing | Validate jargon flags against blind listener labels (precision/recall)
21 | 4/10 | "Bug is where you didn't look" is an untested premise; non-coders can't play | Measure share of planted bugs in unmentioned lines vs chance line share
22 | 4/10 | Slang Clarifier exists; sarcasm from caption text alone is unreliable | Drop sarcasm; report idiom precision/recall on a labelled clip
23 | 4/10 | wav2vec2 phoneme accuracy on non-English names is weak; respelling rules break | Owner-rated respelling accuracy on 20 names before any learning claim
24 | 4/10 | Average-HR rPPG is known; a 60 s drop is inside the noise | Report MAE vs oximeter with Bland-Altman; demand a drop larger than the error
25 | 6/10 | "Reads its thoughts" overclaims; 1B SAE features are polysemantic and their labels unreliable | Keep the per-card AUROC vs matched controls; drop the "thought" language
26 | 3/10 | Over-the-air watermark detection near zero (published); only catches cooperating tools | Drop the replay beat; this is an AudioSeal demo, not a contribution
27 | 2/10 | Pythia membership inference is near chance (CheckMIABench); the heat map would show noise | Don't build it, or make "it's noise" the honest finding
28 | 5/10 | Semantic entropy with a new costume; claim-level clustering on Claude is shaky | Report AUROC vs verbalised confidence with a bootstrap CI on held-out questions
29 | 2/10 | The StreamDiffusion demo is this already | Drop it
30 | 3/10 | Hypothetical willingness-to-pay from 12 hackers doesn't test Prelec's real-money effect | Frame as a design probe; no behavioural claims
31 | 4/10 | Exists commercially; call 2 vs call 1 confounds learning with suspicion | Measure tactic-tagger accuracy against human labels instead
32 | 4/10 | Close to Color Blind Pal; recruiting 5 colourblind testers is uncertain | Secure testers Saturday morning; with vs without, timed, counterbalanced
33 | 5/10 | Baseline Claude may refuse; the shield ("scene text untrusted") is a known pattern | Fix 50 notes ahead of time; report ASR and task success for both arms
34 | 4/10 | Simulated impairment isn't validated; comparing against 6 unimpaired hackers measures nothing about impairment | Claim only "finds stuck-points humans also hit"; report precision/recall

B) RANKING: 1, 3, 2, 18, 25, 28, 4, 33, 7, 5, 24, 32

C) MUTATIONS:
1. Guarded Vault (1+3+4): A Claude banking agent reads injected emails, but every tool call passes through a Cedar policy compiled from the user's rule and symbolically proven. Measure ASR baseline vs guarded, and also policy-intent agreement against blind human labels. It answers "who checks the spec" and drops the fragile Dafny path.
2. Spec Witness (1 or 3, spec-validation core): Before any "proved" badge, the system generates distinguishing example traces from the formal spec, and the user accepts or rejects them. Headline metric: share of Claude-written specs that misread the English, caught by witnesses, out of 30 rules labelled by humans. This attacks the real open problem directly.

D) NOTE: Almost nobody commits to one pre-registered metric with a real baseline, a held-out human-labelled ground truth and confidence intervals. Formal-methods cards ignore spec validation. Sensing cards ignore noise floors. Sample sizes of 6–8 are presented as findings.
