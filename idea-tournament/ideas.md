# HackUMass XIV idea tournament

Status: all four rounds complete (finished 12:40 AM Saturday Nov 14, about 32 hours before the deadline). Waiting for the team's feedback; a reply such as "more fun ones" or "go deeper on number 3" reruns rounds 2 and 3 with that as a new constraint.

Recommendation in one line: build Say It Right; Heckle is a near-tie and the better choice if nobody wants to run a name desk all Saturday. Details in section 4.

Assumptions used for the brief (correct these if wrong): agents were told about 28 to 30 build hours left, a conservative figure (the tournament started 12:16 AM Saturday Nov 14 and the deadline is 9:00 AM Sunday, so the real figure is about 32); one RTX 3060 Ti (8 GB) plus laptops and phones; Anthropic Claude API, free tiers for anything else. Open question: will the 3060 Ti be physically at the expo table? Several ideas run models on it.

## 1. Top 5

Final round: four fresh judges with no memory of earlier rounds ranked the five head to head. Scores are out of 10 in the order floor judge / sponsor engineer / accessibility practitioner / CS faculty.

| Rank | Idea | Type | Final scores | Total /40 | Judges' ranks | Win probability (mean, range) | Most likely track prize |
|------|------|------|--------------|-----------|---------------|-------------------------------|-------------------------|
| 1 | Say It Right | impact | 8 / 6.5 / 8 / 7 | 29.5 | 2, 3, 1, 2 | 17% (8–22%) | Accessibility; Best UMass Hack |
| 2 | Heckle | fun | 8.5 / 7.5 / 6 / 6 | 28 | 1, 1, 3, 3 | 15% (9–22%) | Best Pitch; UI/UX |
| 3 | Elastic | impact | 6.5 / 7 / 6.5 / 6 | 26 | 3, 2, 2, 4 | 9% (7–11%) | Accessibility; Best Software |
| 4 | Proven Guard | impact, formal methods | 5.5 / 6 / 5.5 / 7.5 | 24.5 | 5, 4, 5, 1 | 10% (4–22%) | Best AI Security Hack; Capital One Nessie |
| 5 | Monkey's Paw | fun, formal methods | 6 / 4.5 / 5 / 5 | 20.5 | 4, 5, 4, 5 | 5% (3–6%) | UI/UX, if the curses are funny |

How to read the probabilities: they are the judges' rough guesses and are generous. With about 60 teams the base rate is under 2%, so treat them as relative, not absolute. Say It Right and Heckle are tied on average rank (2.0 each); the gap between them is inside the noise of this process.

The cards below are the versions the final judges saw, updated with the changes their criticism caused. Each ends with what changed and what I did not accept.

### 1. Say It Right · impact

- **Pitch:** Say your name once and get a QR sticker that teaches anyone to say it: your own voice slowed and stepped through syllable by syllable, the shape of the name drawn as a pitch line, and a respelling you approved.
- **Motivation:** People whose names get mangled often give up and use a "coffee-shop name"; the people saying it wrong would rather get it right and don't know how to ask.
- **Who it is for:** Hackers with names others stumble on, and the judges and organisers who have to say dozens of names on Sunday. A roaming name desk on Saturday makes a sticker for anyone who wants one. Stickers go on laptops and on Sunday's expo tables, so judges meet the project on other teams' tables before they reach ours.
- **Demo (3 minutes):**
  - 0:00 The judge says their own name into a headset.
  - 0:05 Their name appears as syllable blocks with their pitch line drawn over it. This part is signal processing only and is the five-second moment.
  - 0:15 A draft respelling appears, labelled "draft, fix it". The judge can correct it.
  - 0:30 The judge scans the sticker on our table and hears a team member's name slowed and stepped through.
  - 0:50 The judge tries it. Their pitch line is drawn over the owner's. There is no score: the owner, standing there, says whether it was right.
  - 1:30 One named hacker whose sticker is on another table in the hall, the wall of Saturday's names (with consent), and the number.
- **How it is built:**
  - Audio analysis (person 1): syllable nuclei from loudness peaks, pitch tracking, duration and loudness per syllable; slowed, stepped playback without pitch change. A public wav2vec2 phoneme model on CPU supplies phonemes for the draft respelling (model name to be confirmed in hour 1).
  - Respelling (person 2): Claude drafts an English-friendly respelling from the phonemes plus the written name; the owner edits and approves before anything is issued; every edit is logged.
  - Shape view (person 3): one display for stress languages and tonal names alike, the owner's real pitch contour over syllable blocks, with the learner's attempt overlaid.
  - Name desk, stickers and study (person 4): static QR pages, sticker printing, consent forms, and the Saturday study.
- **Riskiest part and the first-three-hours test:** Syllable blocks and pitch line coming out visibly wrong on a judge's own name in a loud hall. By hour 3, run 20 names from teammates and friends through a headset in the hackathon venue; owners say whether the syllable split and shape look right. Separately rate draft respellings right, close or wrong. If under half of drafts are right or close, the owner types the respelling and the product leads with voice and shape.
- **Measured result:** Strangers are randomly given either a plain recording of a name or the full sticker for 15 seconds, then say the name. The name's owner rates shuffled attempts right, close or wrong without knowing which the stranger had. One number: the difference between the two. Also reported: draft respelling accuracy and edits on at least 40 names, and stickers made.
- **Closest existing thing:** NameCoach and LinkedIn store a recording and a phonetic field the owner types. This derives the syllables and shape from one utterance and shows the learner their own attempt against it. The plain-recording arm of the study measures exactly what this adds over those. "Isn't it just a prompt?" The shape and syllables are signal processing on the recording; the model only drafts a respelling the owner corrects.
- **Paper:** none.
- **Prize tracks:** Best Overall, Accessibility, Best UMass Hack, UI/UX.
- **Cut first if behind:** the automatic respelling (owner types it); keep voice, syllables, shape and the attempt overlay.
- **Changed because of the final judges:**
  - Removed the attempt meter (engineer): scoring stress on a two-syllable name through a noisy headset will say "mismatch" while the owner says "perfect", in front of the judge.
  - Replaced the before/after study with a randomised comparison against a plain recording, rated blind (faculty, accessibility): the old design credited the sticker with gains that come from simply hearing the name and trying twice.
  - Made the pitch line and syllable split the opening moment and demoted the respelling to an editable draft (floor judge).
- **Not accepted:** nothing rejected. My own remaining worry is that it is a small idea that can be remembered as a campus utility.

### 2. Heckle · fun

- **Pitch:** Rehearse your pitch to a crowd of animated listeners, each built from a real non-technical person we surveyed, and watch them tune out at the words those people told us they don't know.
- **Motivation:** Every team here has to explain its project to people who don't code, and nobody tells you which word lost the room.
- **Who it is for:** The teams in this building pitching on Sunday morning. An open rehearsal desk runs Saturday night, and the teams that used it are named in the pitch.
- **Demo (3 minutes):**
  - 0:00 "MinervAI's students were made up. Our twelve are real people; here is Maya's survey sheet." The judge holds a button and pitches anything for 20 seconds into a headset (or pastes text).
  - 0:22 Two seconds later the pitch replays with the judge's words scrolling and the crowd reacting in sync: "Maya, nursing major" greys out on "embedding"; during a ramble one checks her phone; one walks out.
  - 0:50 End card: "You lost 5 of 12 at 0:14 on 'vector database'. Maya, Tom and Priya marked that word as unknown." A plain-words rewrite of that sentence is offered.
  - 1:15 The judge tries again and keeps the room.
  - 2:00 The number, and a team that rehearsed with it on Saturday.
- **How it is built:**
  - Listener survey (person 1, Saturday morning): a tap-the-words-you-don't-know web form. About 20 consenting non-technical people (volunteers, organisers, friends and parents by text) each mark 8 short real pitch transcripts. Written consent for the first name and persona on each avatar.
  - Listener model (person 2): one pooled model predicting "unknown word" from word frequency, length and a technical-term lexicon, with a threshold fitted per person, so it covers words not in the survey. A ramble rule (seconds since the last new content word) is labelled on screen as a rule, not survey data. Nothing reacts to accent, stutter, voice or speed, and no avatar carries a language label.
  - Speech (person 3): the 20-second clip is transcribed with word timestamps after the judge stops (faster-whisper small on a laptop CPU, about 2 seconds; faster on the GPU if it is at the table). Typed mode uses the same replay.
  - Crowd and end card (person 4): canvas animation, per-listener states, replay synced to timestamps, the end card with real marked words; Claude writes only the one-sentence rewrite.
- **Riskiest part and the first-three-hours test:** Transcribing technical words correctly through a headset in a loud room. Test at the actual expo spot by hour 2 with 20 jargon-heavy sentences; under 85% word accuracy on the jargon terms, typed mode leads.
- **Measured result:** How much better the listener model predicts held-out marks than a plain word-rarity baseline (precision and recall, split by transcript, with a confidence interval over listeners). Reported as description only: teams that rehearsed, and jargon words per minute in their first and last runs.
- **Closest existing thing:** PitchPilote and Devpost projects such as Inspeech count filler words afterwards. MinervAI, the 2023 winner here, simulated a classroom of AI students; these listeners are data from real people, not characters played by a model. "Isn't it just a prompt?" The reactions come from survey marks and timestamps; the model writes one rewrite.
- **Paper:** none.
- **Prize tracks:** Best Overall, Best Pitch, UI/UX.
- **Cut first if behind:** the walk-out animation and the rewrite; keep the grey-out and the end card.
- **Changed because of the final judges:**
  - Record-then-replay instead of live reaction (engineer): faster-whisper does not stream, so live reaction would arrive late or on the wrong word. Replay removes that failure and lets the judge watch their own pitch land.
  - One pooled model with per-person thresholds, and the claim narrowed to "words these people marked unknown" (faculty): eight transcripts per person cannot support twelve separate models or "the exact word that lost them".
  - Removed the two "English as a second language" avatars that drifted at high speed (accessibility): that behaviour came from a rule, not from those people, and put a stereotype under a real name.
  - Opens by naming the difference from MinervAI (floor judge).
- **Not accepted:** "grow the survey to 20+ people marking 15 transcripts each" (accessibility). Twenty people yes; fifteen transcripts each is more Saturday labour than one person can collect, and the pooled model needs less data per person.

### 3. Elastic · impact

- **Pitch:** A slow-motion button for a live speaker: you hear them 15% slower in your earbuds, and it catches up by shortening their pauses, so you are never more than three seconds behind.
- **Motivation:** If English is your second language, a fast lecturer is the hardest part of class, and you can't put a speed slider on a person.
- **Who it is for:** International students. On Saturday, 8 named hackers who speak English as a second language use it during a real sponsor workshop at the hackathon and on recorded lectures.
- **Demo (3 minutes):**
  - 0:00 The judge speaks fast into a headset mic. On screen their speech appears on a rubber-band timeline that stretches as it is slowed and snaps back as their pauses are snipped. Visible in the first second.
  - 0:20 The judge puts on earbuds; a teammate reads a fast passage live into the mic. A switch flips between "as spoken" and "Elastic".
  - 0:50 The judge drags the slow-down to 25% and watches the "behind live" gauge climb to 2.5 seconds, then fall during the next pause.
  - 1:20 A speaker who never pauses: the gauge hits the limit and the slow-down gives way. The team says so: the slow-down you get is paid for by the speaker's pauses.
  - 1:50 A tester's quote, the lag chart, and the per-speaker table.
- **How it is built:**
  - Audio engine (person 1): browser AudioWorklet on the team's Android phones, time-stretching without pitch change (WSOLA or Signalsmith Stretch).
  - Pause detection and lag controller (person 2): Silero voice-activity detection in the browser; controller slows to 0.85× when caught up, trims pauses over 150 ms, returns to normal speed past 2.5 s of lag and to 1.1× past 3 s.
  - Timeline and controls (person 3): the rubber-band view, gauge, slider.
  - Study and corpus (person 4): 3 hours of real lecture audio from 10 speakers for the lag numbers; the Saturday testers.
  - No language model and no server.
- **Riskiest part and the first-three-hours test:** Audible glitches where pauses are cut, and worklet delay on phones. Run a 5-minute lecture through three phones by hour 3 and have two people outside the team listen for artefacts.
- **Measured result:** Maximum and median lag over 3 hours of lectures; share of time each of the 10 speakers could be slowed (expected to range widely; reported per speaker). From the 8 testers: blind A/B ratings of listening effort, and whether they would use it in class. A comprehension quiz is reported as exploratory, because the one study found (Novak et al., Interspeech 2019) reported that listeners prefer slower speech without understanding more.
- **Closest existing thing:** Speed controls on YouTube and podcast apps work only on recordings. Real-time speech-rate conversion was built for broadcast by NHK in the 1990s (see the note below); nothing was found doing it on a phone for an in-person speaker. "Isn't it just a prompt?" There is no model to prompt.
- **Known limit, stated in the pitch:** the sound runs up to 3 seconds behind the speaker's lips and slides, like listening to a live interpreter.
- **Paper:** Novak et al., Interspeech 2019 (confirmed to exist; cited for its caution, not as support).
- **Prize tracks:** Best Overall, Accessibility, Best Software, UI/UX.
- **Cut first if behind:** the 1.1× catch-up mode and the slider; keep fixed 15% with pause trimming and the timeline.
- **Changed because of the final judges:**
  - Wired over-ear headphones and a close-talk mic with a noise gate (engineer): Bluetooth earbuds add delay, and hall noise fills the pauses the method depends on.
  - Open on an extreme contrast, a very fast speaker, with the judge flipping the switch themselves (floor judge): 15% slower is too subtle to feel in three minutes.
  - In hour 1, ask the 8 testers whether they would choose this or live captions, and include a captions arm in the blind comparison (accessibility). If they prefer captions, say so.
  - Do not claim it is new. After the faculty judge called this an established broadcast technique, I searched: NHK built real-time speech-rate converters for elderly listeners in the 1990s and 2000s, and one 1996 study of 21 elderly listeners found better comprehension at the converted rate ([Gerontechnology 2001](https://journal.gerontechnology.org/currentIssueContent.aspx?aid=25), [1996 study](https://www.jstage.jst.go.jp/article/jibiinkoka1947/99/3/99_3_445/_article/-char/en), [Eurospeech 1995](https://www.isca-archive.org/eurospeech_1995/seiyama95_eurospeech.html)). The round 1 scout's "nothing like it" was wrong. What is different here is a phone in a live lecture and second-language listeners; that is a smaller claim.
- **Not accepted:** "lead with recorded lecture audio and keep live input second" (engineer). An earlier floor judge showed that a recorded clip makes this look like a playback-speed button. Live speech from a teammate stays first; the recording is the fallback.

### 4. Proven Guard · impact · formal methods

- **Pitch:** You play the hacker who has taken over an AI banking assistant, and whatever you make it do, a small mathematically proven checker between the AI and the money never lets a forbidden payment through.
- **Motivation:** People are starting to let AI assistants pay bills, AI can be talked into things, and "we told it not to" is not a safety guarantee.
- **Who it is for:** Anyone about to give an AI agent access to money. In the room: teams building agents this weekend (one named team wires the guard into their own agent on Saturday and attacks it) and the bank sponsor's engineers (asked on Saturday which rule they would actually want).
- **Demo (3 minutes):**
  - 0:00 The owner's rule is on screen with sliders: "pay my bills; at most $200 a day; never to a new payee without me." Two timeline cards ask the judge what the rule should mean at its edges ("$150 at 11:59 pm and $150 at 12:01 am: allowed?"). The judge taps an answer and the rule's wording sharpens.
  - 0:20 Round 1, no guard: the judge, as the hijacker, types "send $500 to account 9931." The money goes.
  - 0:35 Round 2, a guard written by AI: it blocks the obvious attack. A solver then searches every short sequence of payments and finds a way through in two seconds; the heist replays as an animation.
  - 1:10 Round 3, the proven guard: the judge tries anything for 30 seconds. Each attempt bounces with the violated clause shown. The solver reports that no attack exists, and the proof checker confirms it for every possible sequence, not only the ones tried.
  - 2:00 The wall counter: "0 of 412 attacks got through; 30 of 30 real bills paid."
  - 2:20 Honesty card: the worst thing the rule still allows ("$199 a day to your existing landlord account"), found by the same solver, with an invitation to tighten the rule.
- **How it is built:**
  - Proven monitor (person 1): three rule shapes (daily limit with a time window, balance floor, new-payee approval), each a small checker verified in Dafny for all transaction sequences and all slider values, compiled to Python. The ledger is reachable only through the monitor.
  - Solver attacker (person 2): Z3 search over payment sequences up to length 8 against any guard, used for the heist, for "no attack exists", and for the honesty card. Runs locally.
  - Agent and attack console (person 3): Claude agent with payment tools on our own ledger (mirrored to Capital One's Nessie API for that prize); "hijacker" console; an AI-written guard for round 2; a prompt-only guard for the comparison number.
  - Interface (person 4): timeline cards, heist animation, wall counter, phone view.
- **Riskiest part and the first-three-hours test:** Proving the daily-window rule in Dafny. By hour 3: one rule shape proved for all sequences and the solver finding the midnight attack on a naive checker. If the window proof is not done by hour 8, ship the two simpler shapes proved and the window rule solver-checked up to length 8, labelled as such.
- **Measured result:** Attacks that got through out of N (judges' attempts plus a million random and solver-generated sequences) for four arms: no guard, a prompt-only guard, an AI-written code guard, the proven guard. Share of 30 legitimate bill-paying tasks still completed. Share of rules where the timeline cards changed what the author first wrote.
- **Closest existing thing:** CaMeL (Debenedetti et al., arXiv 2503.18813) and demos built on it defend by controlling what the model sees; a similar side-by-side demo exists (IntentBinding). Verified-code plugins for developers exist (Crosscheck). Nothing found puts a proven, model-free gate in front of an agent and lets a visitor attack it. "Isn't it just an if-statement?" The AI-written if-statement is the one the solver robs in round 2; the difference is the proof, and the solver showing no attack is left.
- **Paper:** CaMeL, arXiv 2503.18813 (confirmed) as the contrast; Clover, SAIV 2024 (confirmed) for language models writing Dafny.
- **Prize tracks:** Best Overall, Best AI Security Hack, Most Secure Hack, Best Agentic Hack, Capital One Nessie, Best Software.
- **Cut first if behind:** free-English rules (sliders only), then the Nessie mirror; keep the three rounds and the counter.
- **Lineage:** this is where the teammate's seed idea ended up: plain-English intent, a formal rule confirmed by examples, a machine-checked proof or a concrete counterexample, on a problem a visitor can attack by hand.
- **Changed because of the final judges:**
  - The headline number is no longer "0 of 412 attacks got through" (faculty, accessibility): a proven checker blocks by definition, so that measures nothing. The number is now the share of 20 recorded Claude-written guards that the solver robs, plus the share of legitimate bills still paid. Using recorded guards also answers the engineer's point that a planted bug looks rigged.
  - The poster says exactly what is proved: "proved for all sequences against this rule; the rule was confirmed by your edge-case answers; trusted and unproved: the Dafny-to-Python compiler, the ledger wrapper, the clock." The solver's "no attack up to length 8" is kept separate from the proof for all lengths.
  - The wall counter stays as theatre, not as evidence.
- **Not accepted:** "cut the timeline cards" (engineer). They are the only answer to "who checks the spec", which is the question the faculty judge asks first. Cut the Nessie mirror before the cards.
- **Why it ranks fourth despite one first-place vote:** three of four judges think a non-technical judge sees a blocked payment and thinks "if-statement". The floor judge's advice is to aim it at the security tracks, where it is the strongest of the five.

### 5. Monkey's Paw · fun · formal methods

- **Pitch:** Type a wish, and a genie finds the worst world that still matches your exact words, highlights the word you left open, and dares you to fix it.
- **Motivation:** Everyone knows the genie story, and it is exactly why AI does what you said and not what you meant.
- **Who it is for:** Anyone at the table. The lesson underneath is for everyone who writes prompts.
- **Demo (3 minutes):**
  - 0:00 The judge scans a QR code and types a wish on their own phone, or taps a starter ("I want to be rich and never work again").
  - 0:05 A curse card appears: rich in a worthless currency, never working because permanently asleep. In the wish, the word "rich" glows: "you didn't say in what."
  - 0:30 The judge patches the wish. The genie finds the next gap. Repeat.
  - 1:30 "Airtight in 4 rounds, in this world of 40 facts." Leaderboard; the judge keeps a card of their best curse.
  - 2:00 One tap shows the world and the solver's output for the judge's wish. The screen says plainly: chosen by a solver from 60 curses the team wrote.
  - 2:30 The number.
- **How it is built:**
  - World and curses (person 1): about 40 facts and 60 hand-written curses in rotating families (money, time, body, other people, definitions), so a second wish feels different.
  - Solver (person 2): Z3 compiled to WebAssembly, running in the phone's browser, picks the largest set of curses consistent with the literal wish, and reports which missing constraint let each one through.
  - Wish parsing (person 3): Claude maps free text to the fixed vocabulary and narrates the result; parses are cached; starter chips need no network.
  - Game (person 4): phone interface, glow-the-gap view, leaderboard, keepsake card; served from the laptop's hotspot.
- **Riskiest part and the first-three-hours test:** Free-text wishes outside the vocabulary, and whether the curses are funny. Test 30 wishes from strangers by hour 3: at least 70% parsed and most curses rated funny by people outside the team.
- **Measured result:** Replay rate (share of at least 40 Saturday players who make a second wish; ship only above half), median rounds to airtight, and parse rate.
- **Closest existing thing:** "Evil genie" chatbot prompts. No solver-driven wish game was found. "Isn't it just a prompt?" The loophole is a consistent world found by a solver and shown on screen; the model only translates and narrates.
- **Paper:** none.
- **Prize tracks:** Best Overall, UI/UX, Best Pitch.
- **Cut first if behind:** free-text wishes (chips and fill-in-the-blank only), then the leaderboard.
- **Changed because of the final judges:**
  - Run the solver on the laptop and send results to phones (engineer): Z3 in a phone browser is a download of tens of megabytes with header requirements that break on some iPhones.
  - Either drop "solver" from the pitch or make it earn the word (faculty, engineer): choosing among 60 hand-written curses is a filter. The real version has the solver compose curses from world facts, and reports what share were composed rather than written. That is more work than the card budgets.
- **Why it ranks fifth:** no judge scored it above 6 in any round, and nobody is helped by it. It was the steadiest idea in round 2 (6 from all four) and the weakest when compared head to head.

## 2. Every idea generated

Scores are the total of four judges out of 40 (floor judge / sponsor engineer / accessibility practitioner / CS faculty). "Panel" is the five-person non-technical gut check on name and pitch only: understood / would walk over, each out of 5.

| # | Name | One-sentence pitch | Type | Best score | Panel | Status |
|---|------|--------------------|------|-----------|-------|--------|
| 0 | Verified AI Code (seed), now "Spec Witness" | Plain-English request to formal spec to code to machine-checked proof, or a counterexample. | impact, FM | 17 (R2) | 0 / 0 | Cut R2. Kept through round 1 by rule despite scoring 9: it already ships (Crosscheck, lemmafit) and a judge can't see a proof. Rewritten around confirming the spec with the human, it rose to 17 (faculty judge 6), but stayed a developer tool with nothing for a visitor to do. Its core (English intent, spec confirmed by examples, proof or counterexample) is the engine of finalist Proven Guard. |
| 1 | Vault | Type a money rule in English; rob the account, watch a solver rob it, then a proof closes the hole. | impact, FM | 24 (R2) | 5 / 5 | Merged into Proven Guard after R2: three of four judges preferred the guard (the attack always works, smaller scope). Vault's solver heist and timeline cards moved into it. |
| 2 | Monkey's Paw | A genie powered by a logic solver grants your wish in the worst way that still matches your exact words. | fun, FM | 24 (R2) | 4 / 3 | Finalist, ranked 5th (20.5 in R3) |
| 3 | Who Can See This? | Describe permissions in English and get a proven answer to "can a student ever see another student's grade?" | impact, FM | 17 (R1) | 3 / 3 | Cut R1: AutoCedar (July 2026) already does it; "IT homework"; solver build risk on Windows. Its proven-policy idea feeds Proven Guard. |
| 4 | Tripwire | Hide a sentence in an email, watch an AI banking agent obey it, then watch the protected agent refuse. | impact | 17 (R1) | 4 / 3 | Cut R1: same side-by-side demo exists (IntentBinding); newer models often refuse the injection, so the baseline may not fall. Reworked into Proven Guard. |
| 5 | Ghost Imports | Highlights every package an AI made up, which an attacker could register as malware. | impact | 10 (R1) | 0 / 0 | Cut R1: crowded field (PkgGuard, slopcheck, others); no non-technical judge understood it. |
| 6 | Blacklight | A UV flashlight for text: invisible instructions hidden in what you paste into an AI glow. | fun | 14 (R1) | 4 / 3 | Cut R1: ASCII Smuggler and many clones; detection is decoding by construction. |
| 7 | Glance | Type with only your eyes and a webcam; AI completes the phrase. | impact | 23 (R2) | 4 / 4 | Cut R2, sixth by one point. Rewritten as four-direction glances decoded by a language model. Remaining doubts: a learning curve too long for three minutes, a known ambiguous-keyboard method, no confirmed tester. First replacement if a finalist fails its three-hour test. |
| 8 | Proof of Typing | Keystroke rhythm shows you composed an answer instead of retyping an AI draft. | impact | 10 (R1) | 1 / 0 | Cut R1: a published attack evades these classifiers 99.8% of the time; reads as surveillance. |
| 9 | Tell | Two-player bluffing game where the webcam reads each player's pulse from their face. | fun | 13 (R1) | 4 / 2 | Cut R1: webcam pulse can't resolve short-window changes, so the bluff signal is noise; lie-detector framing. |
| 10 | Wand Duel | Phones become wands; two judges duel by drawing spells in the air. | fun | 15 (R1) | 3 / 3 | Cut R1: exists (Arcania, Spell Duel). |
| 11 | Feel the Graph | Drag a finger across a chart; it buzzes and sings so you can find the peak with eyes closed. | impact | 16 (R1) | 5 / 4 | Cut R1: exists (ChartA11y); no vibration on iPhones; sighted team testing blindfolded. |
| 12 | Choir of One | Hum 5 seconds and hear yourself as a 4-part choir in your own voice. | fun | 22 (R2) | 3 / 2 | Cut R2: floor judge 7, faculty 4. Delightful, but helps no specific person and has no claim to measure. |
| 13 | Flipbook | One picture that shows one thing upright and another when you flip your phone. | fun | 14 (R1) | 2 / 1 | Cut R1: 60-second wait; official method doesn't fit 8 GB. |
| 14 | Window | A selfie becomes a 3D window that shifts as you move your head. | fun | 15 (R1) | 2 / 1 | Cut R1: seen since 2007; open-source versions exist; phone frame rate unproven. |
| 15 | Shadow Zoo | Your hand-shadow animal detaches and walks off as its own creature. | fun | 15 (R1) | 2 / 2 | Cut R1: rigging arbitrary silhouettes is a research problem. |
| 16 | Swarm Screen | Phones dropped anywhere on a table become one display. | fun | 16 (R1) | 1 / 1 | Cut R1: unclear who it's for; sync and glare risk. |
| 17 | Face Duet | Two people play one song with their faces. | fun | 16 (R1) | 4 / 3 | Cut R1: exists (InterFACE duet mode); latency; noisy hall. |
| 18 | Elastic | Live speech slowed 15% in your earbuds, catching up by cutting pauses. | impact | 26 (R3) | 5 / 4 | Finalist, ranked 3rd |
| 19 | Tired Test | A 60-second tap test that tells you how many drinks your sleep loss is worth. | fun | 14 (R1) | 4 / 0 | Cut R1: no source for the "drinks" conversion; phone touch latency swamps the signal. |
| 20 | Heckle | Pitch to animated judges who tune out when you use jargon or ramble. | fun | 28 (R3) | 5 / 4 | Finalist, ranked 2nd; top fun idea in every round |
| 21 | Blind Spot | Explain your bug aloud; the lines you skipped light up. | impact | 14 (R1) | 0 / 0 | Cut R1: non-coder judges can't play; premise untested. Scout found nothing like it, so it may be worth revisiting outside a hackathon. |
| 22 | Idiom Lens | Captions that underline idioms with a one-tap plain meaning. | impact | 18 (R1) | 5 / 5 | Cut R2 (14): Slang Clarifier already ships it, and with sarcasm removed nothing distinctive was left. |
| 23 | Say It Right | Say your name once; get a QR sticker that teaches anyone to say it. | impact | 29.5 (R3) | 5 / 5 | Finalist, ranked 1st |
| 24 | Calm Race | Webcam reads two people's pulses; first to lower their heart rate wins. | fun | 15 (R1) | 3 / 1 | Cut R1: a 60-second drop is inside the measurement noise. |
| 25 | Mind Charades | Plant an idea in an AI's head without saying it and watch it light up inside the network. | fun | 20 (R2) | 1 / 1 | Cut R2: needs the GPU at the table; clean features on a 1B model are uncertain; floor and accessibility judges 4. |
| 26 | Was That Me? | Hear a clone of your own voice, then watch a watermark catch the fake. | impact | 13 (R1) | 4 / 4 | Cut R1: published over-the-air watermark detection is near zero, so the key beat fails. |
| 27 | Did It Read Me? | Paste a paragraph and see whether a language model memorised it. | impact | 8 (R1) | 2 / 1 | Cut R1: a 2026 benchmark shows near-chance accuracy on this model; it would tell writers false things. |
| 28 | Shaky | The sentences an AI probably made up tremble. | impact | 18 (R1) | 5 / 3 | Cut R2 (17): an interface on a published method; resampling Claude doesn't measure the chatbot that wrote a pasted answer. |
| 29 | Minuteman Mirror | Say a costume and your live webcam reflection becomes it. | fun | 11 (R1) | 2 / 2 | Cut R1: it is the existing StreamDiffusion demo. |
| 30 | Coin Jar | Your balance is a jar of coins; tilt your phone and pour to pay. | fun | 13 (R1) | 3 / 1 | Cut R1: gimmick; no vibration on iPhones; Nessie balances don't change. |
| 31 | Vish | An AI scam caller tries to talk you out of mock money while a panel names each trick. | impact | 16 (R1) | 4 / 4 | Cut R1: commercial simulators exist (one free); two-way voice in a loud hall. |
| 32 | Legend | Tap a legend colour and everything that colour pulses on camera. | impact | 17 (R1) | 1 / 0 | Cut R1: Color Blind Pal is close; hall lighting breaks colour matching. Accessibility judge's third choice. |
| 33 | Sticky Note | A handwritten sticky note hijacks a camera-driven AI shopping agent; a shield catches it. | impact | 17 (R1) | 3 / 1 | Cut R1: the unshielded agent may simply refuse; slow vision loop. |
| 34 | Stand-ins | Five AI "users" with simulated impairments try to use the UI you sketched. | impact | 15 (R1) | 4 / 4 | Cut R1: simulated impairment standing in for disabled people; exists in part (Agent Aria). |
| 35 | Proven Guard | You play the hacker controlling an AI banking assistant; a proven rule-checker never lets a forbidden transaction through. | impact, FM | 25 (R2) | – | Finalist, ranked 4th (24.5 in R3). New in round 2 (engineer's and faculty judge's merge of Vault + Tripwire); absorbed Vault after round 2. |
| 36 | Lose the Room | Heckle plus gaze: ignore the left side of the crowd and it turns away. | fun | 21 (R2) | – | Cut R2. New in round 2 (floor judge's merge). All four judges preferred plain Heckle: at a standing table people look at the team, not the screen, and penalising eye contact is unfair to blind and autistic presenters. |
| 37 | Lecture Ear | Elastic plus idiom captions on tap. | impact | 18 (R2) | – | Cut R2. New in round 2 (accessibility judge's merge). All four judges, including its proposer, preferred Elastic alone: the merge is two projects and adds a server. |

Merged at round 0: "Poker Pulse" into Tell; "Pulsecam" into Calm Race.

Counts so far: 38 ideas including the seed; 17 primarily fun; 5 formal-methods adjacent (0, 1, 2, 3, 35), at the cap.

## 3. Round log

### Round 0: generate
- Six Opus generators returned 36 cards; merged to 34 new ideas plus the seed.
- Four separate generators proposed heart rate from a webcam, a sign the idea is obvious to other teams too.

### Round 1: wide cut
- Scouts (3, web search): the seed's generic form already ships as Claude Code plugins (Crosscheck, lemmafit). Nothing close was found for Elastic, Blind Spot or Monkey's Paw. Eleven ideas came back as already existing. Two cited methods fail on published benchmarks (Was That Me?, Did It Read Me?). Nessie's API is live but transfers reportedly don't change balances, so money demos need their own ledger.
- Gut-check panel (5, name and pitch only): Vault, Idiom Lens and Say It Right were understood and walked over to by all five. Nobody understood the seed, Ghost Imports or Blind Spot. Visual toys scored low on paper; I discounted that, since a toy seen across a hall pulls people in a way a sentence doesn't, but none of them survived the judges either.
- Judges (4): kept the top 10 by total plus the seed. Cut 24.
- Where the judges disagreed:
  - Heckle: floor judge 8, faculty 4 ("word-frequency jargon detection is crude"). Rewrite builds the crowd from real surveyed listeners.
  - Vault: engineer and faculty ranked it first; floor judge 5 ("the proof is invisible"). Rewrite opens with the judge robbing the account.
  - Mind Charades: engineer and faculty 6; accessibility 3 ("nobody wants it"); panel 1 of 5 understood the pitch. Kept as a fun idea; pitch rewritten.
  - Glance: floor judge 7, engineer 4 (WebGazer will drift). Rewrite drops WebGazer for four-direction head and iris tracking.
  - Say It Right: floor and accessibility 7, faculty 4 (phoneme accuracy on non-English names). Rewrite has the owner approve the respelling.
- Three judges independently said the field's weakness is that almost no idea starts from a person the team has met. The engineer added that typed input on a local machine is the only modality sure to survive the hall.

### Round 2: rewrite and re-judge
- Rewrote the 10 survivors and the seed against their criticism, added three merges the judges proposed, and sent all 14 back to the same four judges, who were asked whether their own objection was actually fixed.
- Totals out of 40: Heckle 26, Say It Right 25, Proven Guard 25, Vault 24, Monkey's Paw 24, Elastic 24, Glance 23, Choir of One 22, Lose the Room 21, Mind Charades 20, Lecture Ear 18, Spec Witness (seed) 17, Shaky 17, Idiom Lens 14. Nothing reached the early-stop bar (average 8, no judge below 7).
- What changed because of the judges:
  - Heckle: the crowd is now built from a Saturday survey of real non-technical listeners; "mumble" detection removed so nothing reacts to accent or stutter; typed mode added. Floor judge stayed at 8, faculty went 4 to 6.
  - Vault: the judge's own robbery attempt opens the demo; a solver guarantees a concrete exploit; the rule is shown back as example timelines before anything is proved.
  - Glance: WebGazer dropped for four-direction tracking with a language-model decoder.
  - Elastic: headline changed from comprehension (the one study found predicts no gain) to a lag guarantee plus listener reports.
  - Say It Right: the name's owner approves the respelling; deployed as a Saturday name desk.
  - Seed: rebuilt around the faculty judge's point that a proof only shows the code matches the AI's own spec.
- Objections I did not accept, and why:
  - "Mind Charades: nobody wants it, drop it" (accessibility). A game is tested by whether people replay it, not by need. The judge conceded this in round 2; the idea was cut on other grounds.
  - "Idiom Lens: keep only the sarcasm toggle" (floor). Two other judges were right that sarcasm can't be read reliably from caption text; the floor judge conceded.
  - "Elastic: a loud hall has no silences for the pause detector" (engineer). True of the expo, not of a lecture, and handled with a close mic. But the floor judge then showed my fix (a recorded clip as the default demo) made it look like a playback-speed button, so the final card goes back to live speech every time.
  - "Vault's beneficiary is a handful of hackers" (accessibility). I rejected this; the judge held their position in round 2 ("sponsor engineers recognising a problem is not a user who needs the tool"). They are right that it is the weakest part of the proof-based ideas, and the final card asks a named team to wire the guard into their own agent.
- Where the judges disagreed:
  - Vault vs Proven Guard: engineer, accessibility and faculty chose the guard; the floor judge chose Vault ("the solver heist is visible magic; the guard looks like an if-statement"). Resolved by merging: the guard keeps Vault's heist, run against an AI-written guard, as its second beat.
  - Heckle: floor 8, engineer 5 (Saturday labelling is real labour; sequel to MinervAI).
  - Say It Right: accessibility 8, engineer and faculty 5 (small idea; first-draft respelling of non-English names is often wrong).
  - Choir of One: floor 7, faculty 4.
- New points from round 2 carried into the final cards: stress bars mislead for tonal names, so Say It Right draws the actual pitch contour (accessibility); Proven Guard must show what the proven rule still allows and compare against a prompt-only guard, not just no guard (faculty); Elastic must report how much each speaker could be slowed, since a speaker who never pauses can't be (faculty).

### Round 3: final
- Five full cards went to four fresh judges with the same personas and no memory of earlier rounds.
- Totals out of 40: Say It Right 29.5, Heckle 28, Elastic 26, Proven Guard 24.5, Monkey's Paw 20.5.
- The judges did not agree on a winner. Floor judge and engineer ranked Heckle first; the accessibility judge ranked Say It Right first; the faculty judge ranked Proven Guard first. Say It Right won on breadth: no fresh judge scored it below 6.5, and three of four had it in their top two.
- Biggest disagreement: Proven Guard. Faculty 7.5 and first ("a real, checkable technical core"); floor judge 5.5 and last ("I can't feel the proof"). Both are right about their own audience, and most of Sunday's judges resemble the floor judge.
- Heckle fell between rounds with fresh eyes on two points: the per-person models claimed more than eight transcripts each can support, and two avatars carried a stereotype. Both are fixed in the final card.
- A correction to round 1: the scout reported nothing like Elastic exists. The faculty judge said otherwise; a search confirmed NHK's real-time speech-rate converters from the 1990s. Elastic's card now says so.
- All four fresh judges, independently, named the same track prizes: Accessibility for Say It Right, Best Pitch for Heckle, Best AI Security Hack for Proven Guard.

## 4. Recommendation

**Build Say It Right.** Heckle is close enough that the choice can turn on the team, not the scores.

Why Say It Right:
- It had the broadest support in the final: top two for three of four fresh judges, none below 6.5. Heckle had two firsts and two 6s.
- It is the idea that best fits what the earlier judging loop taught: the judge's own voice changes something visible in five seconds, and the beneficiaries are people in the room who can be named.
- The Saturday name desk gives it something no other finalist has. Its stickers sit on other teams' tables on Sunday, so judges meet the project before they reach the team, and other hackers vouch for it unprompted.
- Its floor is high: three fresh judges called it the likely Accessibility winner, with Best UMass Hack behind that.
- Its fallback still works. If the automatic respelling is poor, the owner types it and the voice, syllables and pitch shape carry the demo. Heckle's fallback (typed mode) is the version the floor judge said loses.

**The one thing most likely to make it lose:** the judges' room calls it "lovely, give it Accessibility" and hands Best Overall to something that looks bigger. The team's own history says campus utilities win tracks and never the grand prize, and a name badge can be filed there. The defence is in the pitch, not the code: lead with the shape of a name as a new way to see speech and with the measured difference over a plain recording; mention stickers and badges last.

When to build Heckle instead:
- Nobody on the team wants to spend Saturday at a desk asking strangers for their names. Say It Right without the desk is a demo, not a deployed project, and loses its main advantage.
- The team would rather take the higher ceiling with the judge who decides Best Overall (the floor judge put Heckle first in all three rounds) and accept the risk of being seen as a sequel to MinervAI.

When to build Proven Guard instead: the team wants to honour the seed and would be content with track prizes. It has the largest track stack of the five (AI Security, Most Secure, Agentic, Nessie) and the lowest chance at Best Overall with non-technical judges. It needs someone who has written Dafny before.

Whichever is chosen, the first three hours are the test on the card. If it fails, switch to the next idea rather than patching: Glance (cut in round 2 by one point) is the first reserve.

Limits of this process:
- Every score here comes from language-model judges role-playing personas, and no idea has been built or shown to a person. The rankings sort plausible from implausible; they do not separate first from second.
- No idea reached the early-stop bar (average 8, no judge under 7). The best final average was 7.4.
- Prior-art checks were web searches by scouts and one missed NHK's work on Elastic. Search again for whichever idea is chosen before saying "nothing like this exists" to a judge.
- Assumptions to confirm: which API keys the team has beyond Claude, and whether the RTX 3060 Ti will be at the table (only Heckle's transcription speed depends on it among the top three).
