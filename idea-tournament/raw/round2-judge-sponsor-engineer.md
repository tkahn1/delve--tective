# Round 2: judge sponsor engineer

Verbatim final report from this subagent.

A)
0 | 4/10 | PARTLY | Witness cards are a good idea, but still nothing for a non-technical judge to do; Crosscheck sits right next to it | Fold the witness cards into Vault or Proven Guard; don't build this separately
1 | 6/10 | FIXED | Scope creep: witness cards, Z3 heist, Dafny repair, phone robbery and Nessie mirror is five subsystems in 3 minutes | Pick three fixed rule shapes; drop free English; script the 3-minute path end to end by hour 16
2 | 6/10 | FIXED | Out-of-vocabulary wishes give "the genie doesn't deal in that" on a third of tries; Claude parsing needs Wi-Fi | Offer starter-wish chips first; cache parses; serve the z3 WASM from the laptop hotspot
7 | 5/10 | FIXED | Looking down droops the eyelid and loses the iris; head turns get confused with glances at a standing table | Use left/right/up plus a blink for accept; seat the judge; enforce a dwell
12 | 6/10 | FIXED | Segmenting sloppy hummed notes is the part that fails; bad segmentation gives bad harmony | Quantize to a beat grid and snap to the key before harmonizing; show the detected notes
18 | 6/10 | PARTLY | I'll accept the digital feed, but the wow is "slower audio"; Silero plus a worklet on iOS Safari is risky | Bring two Android test phones; the rubber-band timeline must carry the demo visually
20 | 5/10 | FIXED | Saturday labelling of 12 people times 20 transcripts is real labour; GPU Whisper degrades without the 3060 Ti; looks like a MinervAI sequel | Make typed/pasted mode the main demo; use Whisper small on CPU with a headset
22 | 3/10 | PARTLY | Slang Clarifier already ships this; with sarcasm gone it's a lexicon lookup plus Haiku, a wrapper | Drop it
23 | 5/10 | PARTLY | Owner-edit hides that wav2vec2 respelling of non-English names is often wrong; small idea | Lead with the deployed sticker count; get the first draft from Claude plus the phonemes, and report edits honestly
25 | 6/10 | PARTLY | DIES WITHOUT THE 3060 Ti (clamped generation); at 1B few features stay clean on paraphrases | Confirm the GPU is physically at the table; precompute clamp outputs; CPU forward pass for scoring as fallback
28 | 4/10 | NOT FIXED | Still a Claude wrapper that depends on Wi-Fi; resampling latency; the card admits the contribution is thin | Drop it
35 | 7/10 | NEW IDEA | Blocking is the expected behaviour; judges may see "an if statement" unless the proof is made visible | Show the Z3 attacker hitting UNSAT live, then the Dafny proof; keep a running count of blocked attacks
36 | 4/10 | NEW IDEA | At a standing table the judge looks at the team, not the screen; the gaze zones misfire | Drop the gaze channel; build Heckle
37 | 4/10 | NEW IDEA | Two projects at once; adds a GPU/server dependency; keeping captions aligned to stretched audio is unsolved | Build Elastic alone

B) RANKING: 35, 1, 12, 18, 25, 2, 7, 20, 23, 0, 36, 37, 28, 22

C) PAIRS:
- Heckle (20) over Lose the Room (36): gaze adds a failure mode at a standing table and adds no depth.
- Elastic (18) over Lecture Ear (37): one thing, no server, no GPU, nothing that can drift out of sync.
- Proven Guard (35) over Vault (1): the attack always works, the model plays no part, the scope is smaller, and the agent-security story is timely.

D) MUTATION: Proven Guard plus a wall. Every judge's attack, plus the Z3 attacker's best trace, gets logged to a public counter ("0 of 412 attacks got through, 30 of 30 bills paid"). Vault's witness cards confirm the rule. This makes the invisible proof visible as a growing number, and it costs about 2 hours.

E) CUT LIST:
- 35: Cut free-English rules; ship three templated rules with sliders.
- 1: Cut the Nessie mirror and the judge's phone robbery; keep the solver heist.
- 12: Cut style switching; ship one well-tuned hymn arrangement.

GPU flag: Mind Charades (25) dies without the 3060 Ti. Heckle (20) and Lose the Room (36) degrade to CPU Whisper. Lecture Ear (37) needs a server. Proven Guard, Vault, Choir, Elastic, Monkey's Paw and Glance need no GPU.
