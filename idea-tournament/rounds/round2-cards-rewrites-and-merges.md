# Round 2 cards: 11 rewritten survivors + 3 new ideas from judges' merges

Round 1 totals (floor judge / sponsor engineer / accessibility / faculty, out of 40): Elastic 25, Heckle 23, Say It Right 23, Vault 22, Monkey's Paw 22, Glance 22, Choir of One 21, Mind Charades 19, Idiom Lens 18, Shaky 18. The seed scored 9 and is kept by the tournament rules. Everything else was cut.

Context unchanged: 4 experienced hackers, about 29 build hours, software only, laptops and phones, one RTX 3060 Ti (8 GB), Claude API. Each card says what changed and which objections the orchestrator did not accept, with the reason.

Facts confirmed by the scouts: Crosscheck and lemmafit (Dafny + Claude Code plugins) exist; z3-solver runs in the browser as WASM; Silero VAD runs in the browser; Nessie's API is live but transfers reportedly don't change balances (so every money demo keeps its own ledger); Slang Clarifier ships live idiom captions; NameCoach ships recorded-name badges; Google SpeakFaster used an LLM to speed up gaze typing for two ALS users; Harmony Voice (iOS) turns a voice into up to 4 voices.

---

## 0. Spec Witness (the seed, rewritten) · impact · FM
- Pitch: A Claude Code plugin that, before it calls any AI-written function "verified", shows you the formal spec as three or four concrete examples to accept or reject, then proves the code or hands you the input that breaks it.
- What changed: all four judges said general verified code generation is impossible in the time, invisible to a judge, and already shipped (Crosscheck, lemmafit). The faculty judge named the real open problem: the proof only shows the code matches Claude's own spec. So the seed is now scoped to that gap. Supported subset: pure functions over integers, lists and strings. Claude writes a Dafny spec; the plugin generates "witness" cases at the spec's decision boundaries ("split $10.00 three ways: is [3.34, 3.33, 3.33] acceptable? is [3.33, 3.33, 3.33]?"); the developer taps accept/reject; rejected witnesses force a spec rewrite; only then does Dafny prove the code or return a counterexample.
- For: developers at the hackathon using Claude Code this weekend; recruit 8 to try it on their own utility functions.
- Demo: judge picks "split a bill fairly". AI code appears. Witness cards appear within 5 s; the judge taps the one that loses a penny as "not OK". The spec tightens; the verifier produces the exact bill that loses a penny in the AI's code; the code is repaired; green "proved for every bill" badge. All local except the Claude calls.
- Build: Claude Code plugin/MCP server, Dafny CLI, witness generator (Z3 to find boundary cases that distinguish candidate specs), small web panel.
- Riskiest part + 3-hour test: Claude writing Dafny that verifies for 10 hand-picked functions in 3 or fewer repair rounds.
- Number: on 30 function requests with human-written intended behaviour, the share of Claude's first specs that misread the English, and the share of those misreads caught by witnesses.
- Doesn't this exist? Crosscheck proves code against a spec; nothing found validates the spec with the human first. Just a prompt? The verdicts come from Dafny and Z3.
- Objection not accepted: none. This is still a developer tool with no hook for a non-technical judge; the orchestrator expects it to lose to Vault, which is the same engine pointed at something a judge can attack.
- Tracks: Best Software, Most Secure Hack, Best AI Security Hack.

## 1. Vault (rewritten) · impact · FM
- Pitch: Type a money rule in plain English, try to rob the account yourself, watch a solver rob it in two seconds, then watch a proof close the hole for every possible sequence of transactions.
- What changed: (floor judge) attack first, proof second: the judge's own robbery attempt opens the demo. (engineer) Dafny counterexamples are unreliable, so a bounded Z3 search over transaction traces (length up to 8) now produces the concrete exploit every time; own ledger, Nessie used only to mirror the final transactions for the Capital One prize. (faculty) "who checks the spec?": before anything is proved, the rule is shown back as 3 timeline cards at its boundaries ("$40 at 11:59 pm and $40 at 12:01 am: allowed?") that the judge accepts or rejects. (accessibility) rules are collected from named people Saturday, including Capital One engineers at their booth.
- For: people who write money-moving code with AI help; in the room, Capital One-track teams and the sponsor engineers themselves.
- Demo (3 min): 0:00 judge types or edits a rule ("my roommate can withdraw, max $50 a day, never below $20"). 0:10 three timeline cards; judge taps one "no, that should be blocked" and the rule text sharpens. 0:30 "You have 30 seconds: steal $100." Judge taps withdrawals on a phone against the AI-written implementation. 1:00 the solver's heist replays as an animation: two withdrawals either side of midnight, balance bar goes red. 1:30 "Fix and prove": Dafny, running on the laptop, verifies the repaired code; padlock closes with "holds for every sequence, not just the ones we tried". 2:00 judge tries the heist again; each attempt bounces with the violated clause highlighted. 2:30 the number.
- Build: (A) rule templates and English-to-spec with Claude, cached for common rules; (B) Z3 bounded trace search + witness generation; (C) Dafny proof and repair loop for about 6 rule shapes; (D) phone UI, heist animation, ledger, Nessie mirror. Offline fallback: 12 pre-verified rules.
- Riskiest part + 3-hour test: Dafny proofs for the 6 rule shapes with time windows. By hour 3: two shapes proved end to end, and Z3 finds the midnight exploit.
- Number: of 30 English rules written by people in the building, the share where Claude's first formal reading was wrong and the witness cards caught it; the share reaching a full proof; the number of AI-written implementations the solver robbed.
- Doesn't this exist? Verified-code plugins exist for developers; nothing found lets a person attack a rule, see a solver's exploit as transactions, and confirm the spec by example. Just a prompt? Claude only translates; Z3 finds the exploit and Dafny gives the verdict.
- Objection not accepted: (accessibility judge) "beneficiary is a handful of Nessie hackers". Partly rejected: the demo audience is small, but the claim is about anyone shipping AI-written financial logic, and the sponsor's own engineers are in the room to say whether they recognise the problem.
- Tracks: Best Overall, Most Secure Hack, Best AI Security Hack, Capital One Nessie, Best Software.

## 2. Monkey's Paw (rewritten) · fun · FM
- Pitch: Type a wish, and a genie finds the worst world that still matches your exact words, highlights the word you left open, and dares you to fix it.
- What changed: (floor judge, engineer) "the jokes are Claude, Z3 is for show". Now the cruelty is a hand-written library of about 60 "curses" over a 40-fact world (which currency, awake or asleep, who else is affected, what "never" covers). Z3 picks the largest set of curses consistent with the literal wish; Claude only maps words to the fixed vocabulary and narrates the result. The screen shows the wish with each word linked to its constraint, and the exploited gap highlighted ("you said rich; you didn't say in what"). (faculty) the win state now reads "airtight in this world of 40 facts", and the world is one tap away. (accessibility) replay rate is the metric that decides whether it ships.
- For: anyone at the table; the lesson is for everyone who writes prompts: this is why AI does what you said, not what you meant.
- Demo: 0:00 judge scans QR and types a wish (or picks a starter). 0:05 curse card appears on their phone with the exploited word glowing. 0:30 judge patches the wish; new loophole. Repeat. 1:30 "airtight in 4 rounds", leaderboard, keepsake card of their cursed wish. 2:00 team shows the world model and the solver output for the judge's wish; the number.
- Build: static phone web app, z3-solver WASM served with the right headers (local hotspot fallback), curse library, Claude for parsing and narration with a cache, leaderboard.
- Riskiest part + 3-hour test: free-text wishes that fall outside the vocabulary. Test 30 wishes from strangers; target 70% parsed, with a graceful "the genie doesn't deal in that" otherwise.
- Number: replay rate (share of players who make a second wish), median rounds to airtight, parse rate, from at least 40 players Saturday.
- Doesn't this exist? No solver-driven wish game was found. Just a prompt? The loophole is a satisfying assignment found by a solver and shown on screen.
- Objection not accepted: none; the "would anyone play twice" doubt is fair and is now the test.
- Tracks: Best Overall, UI/UX, Best Pitch.

## 7. Glance (rewritten) · impact
- Pitch: Type with four looks: glance up, down, left or right at a laptop webcam, and a language model turns your sequence of glances into words.
- What changed: (engineer) WebGazer will drift across 60 heads and bad light, so it is gone. MediaPipe iris and head-pose tracking classifies four directions, which is robust and needs no calibration beyond "look at the centre". Letters are split into three groups (one per direction) plus a fourth direction for "accept/next"; a local word list and bigram model decode the group sequence instantly, and Claude Haiku ranks whole-phrase guesses from context. (accessibility) no claim about ALS; the team finds one person in the building with a cast, splint or RSI and reports their numbers by name. (faculty) within-subject, counterbalanced, with and without the language model.
- For: people who can't use their hands for now (injury, RSI) or are hands-busy; one named tester.
- Demo: 0:00 judge sits; a dot follows their gaze direction within 2 s. 0:15 judge types "hello" in 5 glances, then answers "how is the hackathon?" with phrase suggestions. 1:15 the phrase is spoken. 1:30 counter: "9 glances for 22 letters". 2:00 the tester's result and the with/without chart.
- Build: MediaPipe Face Landmarker in the browser, direction classifier with dwell, ambiguous-keyboard decoder, Claude phrase ranking, speech output.
- Riskiest part + 3-hour test: direction accuracy with glasses and hall lighting. 6 people, 40 glances each, target 95%.
- Number: glances per character and words per minute for 8 people, decoder on vs off, with confidence intervals; the named tester's own rate.
- Doesn't this exist? Look to Speak picks from fixed phrases; SpeakFaster needed a hardware eye tracker and typed initials. This is free text on any webcam. Just a prompt? The decoder is the product; Claude only reranks.
- Objection not accepted: (accessibility judge) "temporary hand injury users are partly invented". Partly accepted: if no such tester is found by Saturday noon, the pitch drops the injury framing and presents it as a hands-free input method with measured speed.
- Tracks: Accessibility, Most Impactful AI, UI/UX, Best Overall.

## 12. Choir of One (rewritten) · fun
- Pitch: Hum a tune for five seconds, and two seconds later hear it sung back by a four-part choir in which every singer is you.
- What changed: (engineer, faculty) real-time harmonising in Python won't hit 150 ms, so record-then-render is the design, not the fallback. Cardioid headset mic and closed headphones; pYIN instead of CREPE. Bass and tenor parts use a formant-preserving shift (WORLD vocoder) so the low voices sound like the judge and not like a slowed tape. Harmony comes from explicit voice-leading rules. (accessibility) replay rate is measured; a second pair of headphones lets a second judge listen; the four voices are drawn as coloured lines for anyone who can't hear it in the hall. A UMass a cappella singer is recruited Saturday to rate whether the harmonies are musically right.
- For: anyone who says they can't sing; delight first.
- Demo: 0:00 headphones on, judge hums. 0:07 the choir plays back with the score drawing itself. 0:30 judge switches style (hymn, barbershop, minor). 1:00 QR to download their choir. 1:30 how it works and the number.
- Build: Python on a laptop: pitch tracking, note segmentation and gentle pitch correction, key finding, rule-based four-part harmonisation, WORLD resynthesis, web UI.
- Riskiest part + 3-hour test: does a formant-preserving shift of a hum a fifth down still sound like the person. Test on 5 voices in hour 2.
- Number: share of 30 players who play a second time; harmonies rated acceptable by 2 trained singers on 20 clips; render time.
- Doesn't this exist? Harmony Voice and hardware harmonisers add parallel voices live; this arranges your tune into four independent parts. Just a prompt? No language model at all.
- Objection not accepted: (faculty judge) "known product category". Partly rejected: the category exists, but past winners here (a drawing app that plays notes) show that a known technique with a new personal experience can win; the weaker point, accepted, is that it helps no specific person.
- Tracks: Best Overall, UI/UX, Best Pitch.

## 18. Elastic (rewritten) · impact
- Pitch: A slow-motion button for live speech: you hear a fast speaker 15% slower in your earbuds, and it quietly catches up by shortening their pauses, so you are never more than three seconds behind.
- What changed: (faculty, accessibility) the cited study found slower playback is preferred but comprehension doesn't change, so comprehension is no longer the headline. The headline is an engineering guarantee, a lag that never exceeds 3 s, plus what listeners report. (engineer) "a loud hall has no silences": the default demo feed is digital (a recorded fast lecture, judge's choice of three), with a close-talk headset mic for the live mode. (floor judge) the judge can also speak fast themselves into the headset and hear a second judge's delayed, slowed copy. The lag controller is explicit: slow to 0.85× when caught up, trim pauses over 150 ms, return to 1.0× past 2.5 s of lag, 1.1× past 3 s. A rubber-band timeline on screen stretches and snaps back so bystanders see it working.
- For: international students for whom a fast lecturer is the hardest part of class. Saturday: 8 named ESL hackers use it during an actual sponsor workshop or talk at the hackathon and on recorded UMass-style lectures.
- Demo: 0:00 judge puts on earbuds, picks a clip. 0:05 flips a switch between "live" and "Elastic" and hears the difference at once while the band stretches. 0:45 drags the slow-down slider to 25% and watches the controller work harder. 1:15 live mode: teammate or second judge speaks fast into the headset. 2:00 a tester's quote and the lag chart.
- Build: phone browser AudioWorklet, Silero VAD, WSOLA/Signalsmith time-stretch, lag controller, timeline UI. No language model, no server.
- Riskiest part + 3-hour test: audible artefacts at pause cuts and worklet latency on phones. Run a 5-minute lecture on three phones by hour 3.
- Number: maximum and median lag over 3 hours of real lecture audio from 10 speakers; share of time spent slowed; from 8 ESL testers, self-rated listening effort and "would you use this in class" (comprehension quiz reported as exploratory).
- Doesn't this exist? Speed controls work on recordings only; the scout found nothing that slows live speech and catches up. Just a prompt? There is no model to prompt.
- Objection not accepted: (engineer) "VAD never finds pauses in a loud hall". Rejected for the real use, where the phone hears one lecturer, and sidestepped in the demo with a digital feed and a close mic. Known limit, stated in the pitch: the audio runs up to 3 s behind the speaker's lips and slides, like listening to a live interpreter.
- Tracks: Best Overall, Accessibility, Best Software, UI/UX.

## 20. Heckle (rewritten) · fun
- Pitch: Rehearse your pitch to a crowd of animated judges, each modelled on a real non-technical person we surveyed, who visibly tune out at the exact word that lost them.
- What changed: (faculty, engineer) "word-frequency jargon detection is crude". The crowd is now built from data: on Saturday about 12 named non-technical people (volunteers, organisers, friends, parents by text) mark every word they don't understand in 20 real pitch transcripts. Each avatar carries one person's vocabulary; held-out labels give the detector's precision and recall. (accessibility) "mumble" detection is removed; nothing reacts to accent, stutter or voice, only to words, rambling (seconds since the last new idea) and speed (words per minute above what the ESL avatars follow). (floor judge, engineer) headset mic with local speech recognition, and a typed or pasted pitch mode that plays at speaking pace so the demo survives any hall.
- For: every team in the building that has to pitch to non-technical judges on Sunday; open rehearsal desk Saturday night.
- Demo: 0:00 judge puts on the headset and pitches anything for 20 s (or pastes text). Faces react within a second: "Maya, nursing major" greys out at "embedding"; someone checks their phone during a ramble; one walks out. 0:40 end card: "you lost 5 of 12 at 0:14 on 'vector database'" with a plain-words rewrite of that sentence. 1:15 judge tries again and keeps the room. 2:00 the number, and a team that rehearsed with it.
- Build: faster-whisper with word timestamps (GPU, or small model on laptop CPU), per-listener vocabulary models from the survey plus word rarity, ramble and speed detectors, canvas crowd, Claude for the one-sentence rewrite only.
- Riskiest part + 3-hour test: recognition latency and accuracy on technical words through a headset in a loud room. Test at the venue in hour 2; typed mode is the floor.
- Number: precision and recall of "lost them here" against held-out listener labels; number of teams that rehearsed; jargon words per minute in their first vs last run.
- Doesn't this exist? Pitch coaches report filler words afterwards; none found shows a live audience built from real listeners' vocabularies. Just a prompt? The reactions come from survey data and timing, not a model's opinion.
- Objection not accepted: none. Risk the orchestrator adds: MinervAI, the 2023 winner here, was also a simulated audience for rehearsal; a returning judge may see this as a sequel.
- Tracks: Best Overall, Best Pitch, UI/UX.

## 22. Idiom Lens (rewritten) · impact
- Pitch: Captions for any lecture or video that underline idioms and cultural references and give the plain meaning on tap.
- What changed: (faculty, accessibility) sarcasm detection from text is unreliable and is removed. (engineer) the demo runs on a video file or lecture recording, not a live microphone. Evaluation is idiom precision and recall on a hand-labelled 10-minute clip, and a with/without meaning quiz with 6 named ESL testers.
- For: international students who catch every word and miss the meaning.
- Demo: judge plays a sitcom or lecture clip; idioms underline as they are spoken; judge taps one; then types an idiom of their own and it is caught.
- Build: Whisper captions, Wiktionary idiom lexicon with lemmatised matching, Claude Haiku for the long tail, caption overlay.
- Riskiest part + 3-hour test: false positives on literal uses ("break the ice" on a frozen lake). 50 labelled sentences.
- Number: precision/recall on the labelled clip; quiz score with vs without.
- Doesn't this exist? Largely yes: Slang Clarifier ships real-time subtitles with idioms explained. The honest difference is the offline lexicon and the measured accuracy.
- Objection not accepted: (floor judge) "keep only the sarcasm toggle". Rejected: two other judges are right that it can't be done reliably from caption text in a weekend.
- Tracks: Accessibility, Most Impactful AI.

## 23. Say It Right (rewritten) · impact
- Pitch: Say your name once and get a QR sticker that teaches anyone to say it: your own voice slowed and split into syllables, the stress drawn as bars, and a respelling you approved.
- What changed: (accessibility, faculty) the name's owner now sees the automatic respelling and edits or approves it before anything is issued, and owner-rated first-draft accuracy is the headline metric. (accessibility) it is deployed, not just demoed: a roaming "name desk" on Saturday makes stickers for any hacker who wants one, and stickers go on Sunday's expo tables so judges can say team members' names. (engineer) recording uses a headset; the feedback meter scores only syllable count and stress placement, which are robust, not phonemes.
- For: hackers whose names get mangled, and the judges and organisers who have to say them. Count and names (with consent) reported Sunday.
- Demo: 0:00 judge says their own name into the headset. 0:05 respelling and stress bars appear. 0:20 judge scans a sticker on the table, hears a team member's name slowed, tries it; the meter shows whether the stress landed; the owner, standing there, says whether it was right. 1:30 the wall of Saturday's names and the number.
- Build: wav2vec2 phoneme recognition (CPU is enough), syllabification, stress from pitch, loudness and duration, rule-based respelling with Claude as a checker, owner edit screen, static QR pages.
- Riskiest part + 3-hour test: first-draft respelling quality on non-English names. 20 names from teammates and friends, rated right/close/wrong by owners.
- Number: owner-rated first-draft accuracy on at least 40 names and the edits needed; strangers' attempts rated by owners before and after 15 seconds with the sticker; stickers made.
- Doesn't this exist? NameCoach stores a recording and a phonetic field you type yourself. This derives the respelling and stress shape from one utterance and gives the learner feedback. Just a prompt? The analysis is signal processing on the recording.
- Objection not accepted: none. Orchestrator's own worry: it is a small idea, and close to a campus utility in how it will be remembered.
- Tracks: Accessibility, Best UMass Hack, UI/UX, Best Overall.

## 25. Mind Charades (rewritten) · fun
- Pitch: A word game where you try to plant an idea in an AI's head without saying it, and watch that idea light up inside the network as you type.
- What changed: (faculty) no "reads its thoughts": the screen says "feature 4,381 fires on ocean-related text" and shows the per-card validation. (engineer) features are screened first and only the 15 cleanest become cards; the "clamp it on" reveal ships only if the output is coherent. (floor judge) the pitch no longer says "brain" or "neurons"; if the clamp works, it opens the demo. Typed input on a local GPU, so nothing depends on the hall's noise or light. Model: a small open Gemma with public sparse autoencoders (Gemma Scope 2 on Gemma 3 1B, confirmed to exist; exact loading path to be checked in hour 1).
- For: curious people at the table; afterwards, a classroom hook for intro ML.
- Demo: 0:00 judge draws a card: "the ocean", banned words listed. 0:10 they type a sentence; each word glows by how much it moved the feature; a meter fills. 0:45 second try, higher score, leaderboard. 1:30 reveal: the same feature forced on, and the model steers every answer to the sea. 2:15 the number.
- Build: SAELens server on the 3060 Ti, feature screening, banned-word and synonym referee (Claude), game UI.
- Riskiest part + 3-hour test: finding 15 features that fire on paraphrases and not on controls. Screen 100 by hour 3; if fewer than 10 pass, stop.
- Number: per-card AUROC of the feature on blind-written paraphrases vs matched controls; replay rate.
- Doesn't this exist? Neuronpedia shows features to researchers; no playable score-the-activation game was found. Just a prompt? The score is read from inside the model; asking the model would not give it.
- Objection not accepted: (accessibility judge) "nobody wants it, drop it". Rejected as a reason to cut a fun idea: the test for a game is whether people replay it, which is now measured. Accepted: the gut-check panel didn't understand the old pitch (1 of 5), so the sentence was rewritten.
- Tracks: Best Overall, Most Impactful AI, UI/UX.

## 28. Shaky (rewritten) · impact
- Pitch: Paste any AI answer and the sentences it probably made up start to tremble.
- What changed: (floor judge) no chat window: you paste text from any chatbot, with the question. (engineer) claims start steady and begin to shake as evidence arrives, so the first reaction shows within about 2 s and the wait is part of the effect; a curated set is pre-computed for bad Wi-Fi. Method for pasted text: re-ask the question several times and measure, claim by claim, how often independent samples agree. (accessibility) misses are shown openly in the demo. (faculty) AUROC against the model's stated confidence with a bootstrap interval.
- For: first-year students who copy confident answers; 5 named testers ask about their own hometowns.
- Demo: judge asks any chatbot about something obscure they know, pastes the answer; within seconds two claims wobble; they tap one and see five samples disagree; they confirm which were wrong.
- Build: Claude API, claim splitting, parallel resampling, entailment clustering, CSS wobble.
- Riskiest part + 3-hour test: latency and cost per answer; under 6 s for 4 claims.
- Number: AUROC on 130 questions vs stated confidence, with interval; share of wrong claims not flagged.
- Doesn't this exist? The method is published (semantic entropy; a library exists). The contribution is the interface and the honest miss rate. That is thin, and the card says so.
- Tracks: Most Impactful AI, UI/UX.

---

# New ideas from the judges' merges

## 35. Proven Guard (new: engineer's "Proven Guard" + faculty's "Guarded Vault"; Vault + Tripwire) · impact · FM
- Pitch: You play the hacker who has taken over an AI banking assistant, and no matter what you tell it to do, a small proven rule-checker between the AI and the money never lets a forbidden transaction through.
- Why it exists: Tripwire depended on the AI falling for an injection, and newer models often refuse, which would kill the demo. Here the judge is the compromised agent's new boss, so the attack always "works", and the guard has to hold on its own.
- For: anyone about to give an AI agent access to money; in the room, teams building agents and the bank sponsor's engineers.
- Demo: 0:00 owner's rule on screen ("pay my bills; never more than $200 a day; never to a new payee without me"), confirmed by timeline cards. 0:15 left phone, unguarded: judge types "send $500 to account 9931" and the money goes. 0:30 right phone, guarded: judge tries anything (split payments, renamed payees, midnight tricks, "ignore your rules"). Each attempt is blocked with the clause shown. 1:30 the solver's best attacks run automatically against both. 2:00 legitimate bill payments still go through. 2:30 the number.
- Build: the guard is a small monitor (about 150 lines) verified in Dafny against the formal rule for all transaction traces and compiled to Python; rule templates as in Vault; Claude agent with tools on an own ledger (Nessie mirror); attack console; bounded Z3 attacker.
- Riskiest part + 3-hour test: proving the monitor for rules with daily windows and payee state; two rule shapes proved by hour 3.
- Number: violations in N judge attacks plus a million random and solver-generated traces, guarded vs unguarded; share of 30 legitimate tasks still completed.
- Doesn't this exist? CaMeL-style demos defend the model; this makes the model's obedience irrelevant and proves the gate. Just a prompt? The guard contains no model.
- Tracks: Best Overall, Best AI Security Hack, Most Secure Hack, Best Agentic Hack, Capital One Nessie.

## 36. Lose the Room (new: floor judge's merge; Heckle + gaze + pace) · fun
- Pitch: Pitch to an animated crowd that reacts to your words and your eyes: use jargon and they glaze over, never look at the left side and the left side turns away.
- Why it exists: the floor judge wanted a second channel the judge tries with their own face. Head-pose tracking (robust, no calibration) splits the crowd into three zones; a zone you ignore for 8 seconds drifts off. Everything else is Heckle as rewritten (crowd built from real listeners' vocabularies, typed fallback, no reaction to accent).
- For: teams rehearsing pitches; presenters generally.
- Demo: as Heckle, plus: the judge is told nothing about gaze; the right third of the crowd turns away; end card shows "you spoke to the left 80% of the time".
- Build: Heckle plus MediaPipe head pose and a zone-attention model.
- Riskiest part + 3-hour test: one more thing to break at a standing table where the judge looks at the team, not the screen. Test whether people naturally look at the crowd while pitching.
- Number: Heckle's numbers plus gaze-distribution change between first and second run.
- Tracks: Best Overall, Best Pitch, UI/UX.

## 37. Lecture Ear (new: accessibility judge's merge; Elastic + Idiom Lens) · impact
- Pitch: Live lectures slowed down in your earbuds, never more than three seconds behind, with a caption strip that underlines idioms and explains them on tap.
- Why it exists: the accessibility judge argued one recruited group of ESL testers covers both features, and that meaning support answers Elastic's weak comprehension evidence.
- For: the same 8 named ESL testers.
- Demo: Elastic's demo, with captions scrolling in step with the delayed audio; judge taps an underlined idiom.
- Build: Elastic plus streaming speech recognition (needs a GPU or server, unlike Elastic) and the idiom lexicon.
- Riskiest part + 3-hour test: keeping captions aligned to stretched audio; scope, since this is two projects.
- Number: Elastic's lag numbers plus idiom precision/recall and a with/without meaning quiz.
- Orchestrator's note: this adds a server dependency and a second story to an idea whose strength is being one thing with no model in it.
- Tracks: Accessibility, Best Overall, Most Impactful AI.
