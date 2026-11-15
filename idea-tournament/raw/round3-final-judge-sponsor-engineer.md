# Round 3: final judge sponsor engineer

Verbatim final report from this subagent.

RANKING: A, D, B, C, E

A. Heckle: 7.5/10, about 14% to win Best Overall.
Worst flaw: live streaming ASR. faster-whisper does not stream; it re-transcribes rolling chunks on a laptop CPU. In the hall that means 1.5 to 3 s of delay, duplicated words, and jargon split apart ("vector data base"), so the face greys out late or at the wrong word. The 12-person per-listener models are too thin to beat a word-rarity baseline.
Fix: push-to-talk. Transcribe the 20 s clip when the judge stops (about 2 s), then replay it with the crowd reactions synced to the word timestamps.

D. Elastic: 7/10, about 10%.
Worst flaw: Silero VAD in a loud expo hall. Crowd noise fills every pause, so there is nothing to trim, the lag hits its cap and the slowdown gives way. The demo turns into the failure case from 1:20. Bluetooth earbuds add 200+ ms of latency and drift. Also, 15% slower is subtle in a loud room.
Fix: close-talk headset mic with a noise gate, and over-ear wired headphones (one pair, wiped between judges). Lead with a 25% demo on recorded lecture audio and keep live input second.

B. Say It Right: 6.5/10, about 8%.
Worst flaw: the attempt meter. Detecting stress on a 2 to 3 syllable name from loudness, pitch and duration, through a noisy headset, is unreliable. It will say "mismatch" while the owner standing there says "perfect", and that contradiction happens in front of the judge. The wav2vec2 phoneme output in noise also makes the syllable split shaky.
Fix: cut the score. Show only the pitch-line overlay and let the owner's verdict be the feedback.

C. Proven Guard: 6/10, about 6%.
Worst flaw: scope, plus a staged round 2. Dafny, Z3, a Claude agent, Nessie and timeline cards are five systems in 28 hours, and the Dafny window proof needs someone who has used Dafny before. If Claude writes a correct guard, the heist dies. If the team plants the bug, a sharp judge calls it rigged. Non-technical judges see "blocked" and think if-statement.
Fix: cut Nessie and the timeline cards. Run the solver against 20 recorded Claude-written guards and report the share it robs.

E. Monkey's Paw: 4.5/10, about 3%.
Worst flaw: Z3 compiled to WebAssembly on judges' phones. It is a download of tens of MB over a laptop hotspot, needs special cross-origin headers (COOP/COEP) for SharedArrayBuffer, and is fragile on iOS Safari. Expect blank screens on half the iPhones. Underneath, the solver picks from 60 canned curses, which is a lookup with a costume on.
Fix: run Z3 on the laptop server and send phones JSON. Make the curses generative (compose world facts), not hand-written.

HEAD TO HEAD: Heckle has the louder failure mode, but it fails gracefully: typed mode still makes faces grey out. Every judge is pitching all day, so it lands in 10 seconds. Elastic's payoff is subtle audio inside earbuds that the judge has to trust.

LOSES IF: the live transcription lags or garbles the judge's own jargon, and the crowd reacts to the wrong word, or late, while the judge watches.

TRACK PRIZES:
- A: Best Pitch
- B: Best UMass Hack (Saturday name desk)
- C: Best AI Security Hack
- D: Accessibility
- E: UI/UX, if the curses are actually funny
