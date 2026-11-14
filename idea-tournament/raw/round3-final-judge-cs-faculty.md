# Round 3: final judge cs faculty

Verbatim final report from this subagent.

RANKING: C B A D E

A. Heckle: 6/10, about 13%. Worst flaw: "the exact word that lost them" overclaims. Each person marked only 8 transcripts, so the per-person models will barely beat word rarity. The ramble, phone-check and walk-out thresholds are made up, not drawn from the survey. Fix: fit one pooled model with a per-person threshold. Say only "words these people marked unknown". Report how far it beats the rarity baseline, with a confidence interval over the 12 people.

B. Say It Right: 7/10, about 20%. Worst flaw: the evaluation compares a cold read against reading after the sticker. That conflates the sticker with simply hearing the name, plus a second attempt. The owner who rates is not blind, and NameCoach-style audio is the real baseline. Fix: randomise strangers between a plain recording and the full sticker. Owners rate shuffled attempts without knowing the arm. Be cautious about how well wav2vec2 phonemes work on non-English names.

C. Proven Guard: 7.5/10, about 22%. Worst flaw: "0 of 412 attacks" against a proven checker is true by construction, so it measures nothing. "No attack exists" mixes up Z3's search, which stops at length 8, with Dafny's proof for all lengths. The trusted base (the Dafny-to-Python compiler, the ledger wrapper, the clock) goes unstated. Fix: lead with the AI-written guard's breach rate and the share of legitimate bills still paid. On the poster, say "proved against this spec; the spec is confirmed by your edge-case answers; trusted: X, Y".

D. Elastic: 6/10, about 7%. Worst flaw: live speech-rate conversion with pause trimming is a known method (broadcast research has done it for years) dressed up as new. The lag numbers are just how the controller behaves, not a finding. The listening-effort A/B has 8 people. The effect is also hard to perceive through earbuds in a loud hall in 3 minutes. Fix: cite the prior systems. Make the clean result the blind A/B on effort with a confidence interval, and be honest that n=8.

E. Monkey's Paw: 5/10, about 5%. Worst flaw: Z3 picking a consistent subset of 60 hand-written curses is a set filter dressed up as formal methods. The fun depends entirely on the team's comedy writing, not on the solver. Fix: drop the solver framing from the pitch or make it real. Have the solver build curses from world facts, and report what share of curses were generated rather than hand-written.

HEAD TO HEAD: C has a real, checkable technical core: a machine-checked monitor plus a solver that finds a counterexample to the AI-written guard. The judge attacks it by hand. B's evaluation is confounded and its novelty over NameCoach is thin.

LOSES IF: The daily-window proof slips and the team still says "mathematically proven" on stage. Or non-technical judges see a blocked payment and think "so, an if-statement".

TRACK PRIZES:
- A: Best Pitch
- B: Accessibility
- C: Best AI Security Hack (or Nessie)
- D: Accessibility (runner-up to B)
- E: UI/UX
