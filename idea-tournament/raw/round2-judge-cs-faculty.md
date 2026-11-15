# Round 2: judge cs faculty

Verbatim final report from this subagent.

A)
0 | 6/10 | FIXED | Witnesses only catch misreads that one of the candidate specs already differs on; a wrong reading shared by all candidates goes unseen | Have the "intended behaviour" written by a different person, before they see any spec
1 | 7/10 | PARTLY | Three cards don't validate the spec; "every sequence" depends on how Dafny models time windows | Collect each rule author's intended verdicts first; report cards' misread catch rate and misses against them
2 | 6/10 | FIXED | Loopholes are hand-authored curses, so "solver-found" means choosing from 60 jokes the team wrote | Say "chosen by a solver from 60 curses" on screen; it's honest and still fun
7 | 5/10 | FIXED | Three letter groups give heavy decoder ambiguity, a known T9/ambiguous-keyboard method; n=8 has learning effects | Report error rate alongside glances per character; counterbalance order; compare against a plain T9-style decoder baseline
12 | 4/10 | NOT FIXED (still right) | Still a known category with no measurable claim beyond "singers liked it"; past-winner argument isn't evidence | Accept it as a delight entry; blind singer ratings vs a parallel-harmoniser baseline
18 | 6/10 | FIXED | The lag bound holds by construction; benefit rests on unblinded self-reported effort from 8 people | Report time slowed per speaker (low for pause-free talkers); blind A/B listening-effort ratings
20 | 6/10 | FIXED | Leakage risk if a listener's labels both build and test their avatar; the first vs last run measures practice | Split held-out labels by transcript; compare against a plain word-rarity baseline for precision/recall
22 | 4/10 | PARTLY | Slang Clarifier ships this; measured accuracy on one 10-minute clip isn't a contribution | Report against a pure Wiktionary-lexicon baseline; otherwise fold it into nothing
23 | 5/10 | FIXED | Owners approving their own respelling inflate the ratings; wav2vec2 phonemes on non-English names are weak | Have a stranger say the respelling cold; the owner rates the stranger's attempt, not the text
25 | 6/10 | FIXED | Screening features on the same paraphrases later used for AUROC is selection leakage; the 1B clamp may be incoherent | Screen on one set; report AUROC on fresh paraphrases written by players
28 | 4/10 | PARTLY | Resampling Claude measures Claude's consistency, not the chatbot that wrote the pasted answer; it's an interface on a published method | Restrict it to Claude answers, or show agreement with the source model empirically
35 | 7/10 | NEW IDEA | The unguarded baseline is a straw man; attacker-chosen payments within the rule still pass | Compare against a prompt-guarded agent; show openly what the proven rule still allows ($199/day to existing payees)
36 | 5/10 | NEW IDEA | At an expo table the judge looks at the team, so head-pose "zones" measure posture, not audience attention | Drop gaze unless the hour-3 test shows natural screen-looking; keep Heckle
37 | 4/10 | NEW IDEA | Two half-projects; adds a server and a second, unmeasured comprehension claim to Elastic's one clean guarantee | Don't merge; ship Elastic alone

B) RANKING: 35, 1, 18, 0, 20, 2, 25, 7, 23, 36, 12, 22, 37, 28

C) PAIRS:
- Heckle (20) vs Lose the Room (36): Heckle. Its vocabulary detector is validated on held-out labels; the gaze channel is untested at a standing table.
- Elastic (18) vs Lecture Ear (37): Elastic. One guaranteed property, no server, no unmeasured comprehension story.
- Vault (1) vs Proven Guard (35): Proven Guard. It proves a small model-free monitor, so it doesn't need the AI to fail.

D) MUTATION: Guard with a Paw (35 + 2's loophole finder + witness cards). After the proof, Z3 lists legal-but-harmful traces the rule still allows ("attacker can still move $200/day to your landlord"). The owner tightens the rule. It's honest about what the proof covers, and it shows the spec gap rather than hiding it.

E) SCEPTICAL QUESTION:
- 35: "What exactly is proved, and can the agent reach the ledger without passing the monitor?" Satisfying answer: "Every trace the monitor accepts satisfies the formal rule; the ledger is reachable only through it; here is what the rule still allows."
- 1: "Who checks the spec beyond three cards, and how many misreads did the cards miss?" Satisfying answer: "Authors wrote their verdicts before seeing Claude's version; the cards caught 9 of 12 misreads; here are the 3 they missed."
- 18: "Isn't the 3 s bound true by construction? What happens with a speaker who never pauses?" Satisfying answer: "Yes, guaranteed. With no pauses it plays at 1.1x, so you get little slow-down. Time slowed per speaker: 58% down to 12%."
