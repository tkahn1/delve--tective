### A. Heckle · fun

- **Pitch:** Rehearse your pitch to a crowd of animated listeners, each built from a real non-technical person we surveyed, and watch them tune out at the exact word that lost them.
- **Motivation:** Every team here has to explain its project to people who don't code, and nobody tells you which word lost the room.
- **Who it is for:** The teams in this building pitching on Sunday morning. An open rehearsal desk runs Saturday night, and the teams that used it are named in the pitch.
- **Demo (3 minutes):**
  - 0:00 The judge puts on a headset and pitches anything for 20 seconds (their job, their research, their favourite app). A typed or pasted pitch that plays back at speaking pace is the equal-status alternative if the hall is too loud.
  - 0:03 Twelve faces listen. Within a second of a jargon word, "Maya, nursing major" greys out; during a ramble one checks her phone; past a speed limit the two listeners who speak English as a second language drift; one walks out.
  - 0:30 End card: "You lost 5 of 12 at 0:14 on 'vector database'. Maya, Tom and Priya marked that word as unknown." A plain-words rewrite of that one sentence is offered.
  - 1:00 The judge tries again and keeps the room.
  - 1:45 The number, and a team that rehearsed with it on Saturday.
- **How it is built:**
  - Listener survey (person 1, Saturday morning): a tap-the-words-you-don't-know web form. About 12 consenting non-technical people (volunteers, organisers, friends and parents by text) each mark 8 short real pitch transcripts. Written consent for the first name and persona on each avatar.
  - Listener models (person 2): per-person model predicting "unknown word" from word frequency, length and a technical-term lexicon, fitted on that person's marks, so it generalises to words not in the survey. Ramble detector (seconds since the last new content word) and pace detector (words per minute). Nothing reacts to accent, stutter or voice.
  - Speech (person 3): faster-whisper with word timestamps, small model on a laptop CPU with a close headset mic; GPU if it is at the table. Typed mode shares the same pipeline.
  - Crowd and end card (person 4): canvas animation, per-listener states, the end card with real marked words; Claude writes only the one-sentence rewrite.
- **Riskiest part and the first-three-hours test:** Recognising technical words through a headset in a loud room in under a second. Test at the venue by hour 2 with 20 jargon-heavy sentences. If word accuracy is under 85% or delay over 1.5 s, typed mode leads the demo.
- **Measured result:** Precision and recall of "this listener is lost here" against held-out survey marks, split by transcript so no transcript is in both training and test, compared with a plain word-rarity baseline. Also reported, as description only: teams that rehearsed, and jargon words per minute in their first and last runs.
- **Closest existing thing:** PitchPilote and Devpost projects such as Inspeech count filler words after you finish. None found shows a live audience built from real listeners' vocabularies. MinervAI, the 2023 winner here, simulated a classroom of AI students for teachers; the difference is that these listeners are data from real people, not role-played by a model. "Isn't it just a prompt?" The reactions come from survey data and timing; the model is used for one rewrite.
- **Paper:** none.
- **Prize tracks:** Best Overall, Best Pitch, UI/UX.
- **Cut first if behind:** the walk-out animation and the rewrite; keep the grey-out and the end card.

### B. Say It Right · impact

- **Pitch:** Say your name once and get a QR sticker that teaches anyone to say it: your own voice slowed and split into syllables, the shape of the name drawn as a pitch line, and a respelling you approved.
- **Motivation:** People whose names get mangled often give up and use a "coffee-shop name"; the people saying it wrong would rather get it right and don't know how to ask.
- **Who it is for:** Hackers with names others stumble on, and the judges and organisers who have to say dozens of names on Sunday. A roaming "name desk" on Saturday makes a sticker for anyone who wants one; stickers go on Sunday's expo tables.
- **Demo (3 minutes):**
  - 0:00 The judge says their own name into a headset.
  - 0:05 Their name appears split into syllables with a pitch line over it and a respelling ("shi-VAWN"). The judge can correct the respelling.
  - 0:25 The judge scans the sticker on our table and hears a team member's name slowed down and stepped through syllable by syllable.
  - 0:45 The judge tries it. Their pitch line is drawn over the owner's, and a meter shows whether syllable count and emphasis matched. The owner, standing there, says whether it was right.
  - 1:30 The wall of Saturday's names (with consent), and the number.
- **How it is built:**
  - Audio analysis (person 1): phoneme recognition with a public wav2vec2 phoneme model on CPU (model name to be confirmed in hour 1), syllable splitting, pitch tracking, loudness and duration per syllable.
  - Respelling (person 2): rules from phonemes to an English-friendly respelling, with Claude proposing a draft from phonemes plus spelling; the owner edits and approves before anything is issued. Every edit is logged.
  - Shape view and feedback (person 3): one display that works for stress languages and tonal names alike, the owner's actual pitch contour over syllable blocks; the learner's attempt overlaid; the meter scores only syllable count and emphasis placement, not individual sounds.
  - Name desk and stickers (person 4): static QR pages, sticker printing, consent, and running the Saturday study.
- **Riskiest part and the first-three-hours test:** First-draft respelling quality on non-English names. Test 20 names from teammates and friends in hour 3; owners rate right, close or wrong. If under half are right or close, the draft comes from the owner typing it and the product leads with the voice and shape.
- **Measured result:** Strangers say 10 names cold from the written spelling, then again after 15 seconds with the sticker; the name's owner rates each attempt right, close or wrong. Also: first-draft respelling accuracy and edits needed on at least 40 names, and stickers made.
- **Closest existing thing:** NameCoach and LinkedIn store a recording and a phonetic field the owner types. This derives the syllables, respelling and shape from one utterance and gives the learner feedback on their attempt. "Isn't it just a prompt?" The analysis is signal processing on the recording.
- **Paper:** none.
- **Prize tracks:** Best Overall, Accessibility, Best UMass Hack, UI/UX.
- **Cut first if behind:** the automatic respelling (owner types it); keep voice, syllables, shape and the attempt overlay.

### C. Proven Guard · impact · formal methods

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

### D. Elastic · impact

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
- **Closest existing thing:** Speed controls on YouTube and podcast apps work only on recordings. The scout found nothing that slows live speech and catches up. "Isn't it just a prompt?" There is no model to prompt.
- **Known limit, stated in the pitch:** the sound runs up to 3 seconds behind the speaker's lips and slides, like listening to a live interpreter.
- **Paper:** Novak et al., Interspeech 2019 (confirmed to exist; cited for its caution, not as support).
- **Prize tracks:** Best Overall, Accessibility, Best Software, UI/UX.
- **Cut first if behind:** the 1.1× catch-up mode and the slider; keep fixed 15% with pause trimming and the timeline.

### E. Monkey's Paw · fun · formal methods

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
