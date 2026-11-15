# Round 1: judge sponsor engineer

Verbatim final report from this subagent.

A)
0 | 2/10 | General code verification won't happen in 30h; prior art already ships it (Crosscheck, lemmafit) | Narrow it to one domain with templated specs (which is just idea 1)
1 | 6/10 | Dafny counterexamples are often not concrete, so the Nessie replay has nothing to replay; Nessie balances don't change | Add a bounded Z3 trace search to get concrete attacks; keep your own ledger; use Nessie only for show
2 | 5/10 | Z3 is just for show; the jokes come from Claude, and the world model is too small to give real loopholes | Hand-build a rich world model; cache the narrations; serve COOP/COEP headers locally, not over hall Wi-Fi
3 | 5/10 | Building cedar-policy-symcc plus cvc5 on Windows eats the first day; AutoCedar already does this | Run it in a Linux Docker image from hour 0; demo on a course-site story
4 | 4/10 | Current Claude refuses the injection, so the left pane never drains and the demo is dead | Make the guard enforce no matter what: let the judge steer the hijacked agent directly
5 | 2/10 | Crowded field, rare hallucinations from current models, non-technical judges get nothing | Drop it
6 | 3/10 | ASCII Smuggler clones already exist; it's a client-side decoder with no depth | Drop it, or fold it into a larger agent-security demo
7 | 4/10 | WebGazer drifts under hall lighting, with glasses, and with 60 different heads needing recalibration | Use MediaPipe iris with a 4-zone board and a head-pose fallback
8 | 3/10 | Copy-typing forgery beats these classifiers 99.8% of the time; feels like surveillance | Drop it
9 | 3/10 | Webcam rPPG cannot resolve short-window heart-rate changes; the bluff signal is noise | Drop the pulse; turn it into a blink and micro-expression game
10 | 4/10 | Already exists; the iOS DeviceMotion permission prompt and unseen users break gesture recognition | Use three very different gestures with a $1 recognizer and per-user tutorial templates
11 | 3/10 | iOS Safari has no vibration, so half the judges get audio only, which is Apple Audio Graphs | Drop it, or ship Android-only test devices at the table
12 | 6/10 | Real-time PSOLA under 150ms in Python fails; with 60 judges the headphone mic picks up the hall | Default to a 5s record-then-render path; use pYIN and a cardioid headset mic
13 | 4/10 | No confirmed SD port of Visual Anagrams; under 60s on 8GB is unproven; there will be a queue | Test SD 1.5 view-averaging at hour 1; pre-render a gallery as the fallback
14 | 4/10 | Depth plus face tracking at 24fps on a mid-range Android won't happen; already seen | Run it on the laptop webcam and a monitor; phones only take the photo
15 | 3/10 | Rigging arbitrary hand silhouettes into gaits looks like broken jelly | Use 5 fixed shadow classes with hand-rigged creature templates
16 | 5/10 | Phones auto-dim and lock, glare washes out ArUco under hall lights, and the Safari fullscreen API is missing | Use Wake Lock, keep markers on during the animation for re-tracking, bring a matte mat
17 | 4/10 | Two-phone WebSocket latency plus face-blendshape noise means no pair hits the notes | Use one laptop camera for both faces and a local synth
18 | 6/10 | A loud expo hall has no silences, so the VAD never finds pauses to cut | Feed a recorded fast lecture over a line-in; publish the lag-control algorithm
19 | 4/10 | Touch latency across phones swamps the lapse signal; no depth beyond a PVT clone | Calibrate per device with a tap-to-beat test; report BAC-equivalent, not drinks
20 | 5/10 | Streaming Whisper in a noisy hall mishears; word-frequency jargon detection is shallow | Use a headset mic and faster-whisper on the GPU; pre-tune a jargon lexicon for the demo
21 | 3/10 | Non-coder judges can't play; mapping speech to code lines is fragile | Drop it
22 | 4/10 | Already exists (Slang Clarifier); Web Speech fails in the hall; it's a Claude wrapper | Run it on a sitcom clip file instead of a live mic
23 | 5/10 | wav2vec2 phoneme recognition mangles non-English names in hall noise | Let users correct the phonemes; record in a quiet booth or headset; keep the stress analysis
24 | 4/10 | rPPG is noisy under expo lighting; a 60s drop is invisible next to measurement error | Show breathing rate from chest motion instead; keep the face heat map as eye candy
25 | 6/10 | Clean, fun SAE features at Gemma 1B are rare; clamping makes word salad, not "ocean" | Screen features on day 1 and keep the 15 best; drop clamping if it's incoherent
26 | 3/10 | AudioSeal detection over the air is about 0.07-5%; the key moment fails | Drop over-the-air; show detection only on the digital path, or drop the idea
27 | 2/10 | Membership inference on Pythia is near chance (AUC 0.50); the heat map is noise | Drop it
28 | 4/10 | Claim splits times 5 resamples times NLI over hall Wi-Fi gives 10+s latency; still a chat window | Precompute answers for a curated question set; keep live mode optional
29 | 3/10 | It's literally the StreamDiffusion demo | Drop it
30 | 3/10 | Nessie balances don't move; iOS has no vibration and adds a permission prompt; gimmick | Drop it
31 | 4/10 | Already shipped commercially; two-way Web Speech in the hall exceeds 2s and misrecognizes | Run the call on a headset; make the live tactic panel the product
32 | 3/10 | Colour constancy under sodium/LED hall lighting breaks CIELAB clustering | Add a white-card calibration step, or drop it
33 | 4/10 | Claude vision probably refuses or ignores the note; OCR under bad lighting is flaky | Build the shield so it enforces regardless of whether the model obeys; print notes in thick marker
34 | 4/10 | Five parallel Claude browser agents are slow and costly; sketch-to-HTML breaks on bad handwriting | Use pre-built UIs plus one live sketch; run 3 agents, not 5

B) RANKING: 1, 25, 12, 18, 16, 3, 2, 23, 20, 7, 10, 14

C) MUTATIONS:
- Loophole Lab (1 + 2): The judge types a money rule. A Z3 bounded search over transaction traces always finds a concrete exploit, narrated as a heist and replayed on our own ledger. After a fix, Dafny proves the rule safe for all traces. That makes the counterexample guaranteed, keeps the formal depth, and adds the Monkey's Paw comedy.
- Proven Guard (1 + 4): A Dafny-verified rule monitor sits between any AI agent and the ledger. The judge personally drives the "hijacked" agent and tries anything. The guard holds because of the proof, not because Claude happened to resist, so the demo never depends on the baseline falling for an injection.

D) NOTE: Almost every idea depends on hall Wi-Fi, live mics or cameras under bad light. Few run the GPU locally on typed input, which is the one modality that survives the hall. Nobody planned a pre-cached offline demo path or a deterministic "judge can't break it" moment.
