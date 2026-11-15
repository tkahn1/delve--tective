# Round 0: generator 4 people in the room

Verbatim final report from this subagent.

**Elastic** · **Type**: impact · **FM-adjacent**: no
- Pitch: Live lectures in your earbuds, slowed down 15%, and it catches up with the speaker by cutting the pauses, so you never fall more than about 3 seconds behind.
- Motivation: If English is your second language, a fast professor is the hardest part of class, and you can't pause a live lecture.
- For: International students. Find 5 by asking at the international-student meetup and mentor tables; ESL hackers are likely about 20-30% of the room (unconfirmed).
- Demo: (1) Judge puts on earbuds. (2) A teammate speaks fast into the phone. (3) The judge hears it slower while a "behind-live" gauge rises to 2.5 s and then drops back to 0 during pauses. (4) The judge drags the slow-down slider. (5) A captions strip highlights where they are versus where the speaker is.
- Build: Web Audio and AudioWorklet in the phone browser. Voice activity detection (Silero VAD, a speech/silence detector, in ONNX web) finds pauses, and WSOLA time-stretching (a standard way to change speed without changing pitch) slows the speech. Optional Whisper captions on the 3060 Ti. Split: P1 time-stretch DSP, P2 pause-skip and lag controller, P3 UI and captions, P4 tester study and pitch.
- Riskiest part + 3-hour test: Total delay must stay under 3 s with real lecture audio, not lab speech. Test: run a 5-minute recorded UMass lecture through it and plot the lag.
- Measured result: A comprehension quiz on two fast clips, normal speed versus Elastic, n≈8 ESL testers, giving one score difference. Be honest: Novak et al. (Interspeech 2019) found listeners preferred slower playback but comprehension did not change, so measuring it here is the point.
- Closest existing thing: YouTube or podcast speed controls only work on recordings, and Otter-style captions are text. This works on live speech by trading silence for time. No LLM is involved.
- Paper: Novak, Bunn, Kenyon, Interspeech 2019 (confirmed exists).
- Prize tracks: Accessibility, Best Software, UI/UX, Best Overall.

---

**Tired Test** · **Type**: fun · **FM-adjacent**: no
- Pitch: A 60-second tap test on your phone that tells you how many drinks your sleep loss is worth.
- Motivation: Everyone here is sleep-deprived, and research has compared tiredness with being legally drunk, but nobody can feel how impaired they are.
- For: Every hacker in the building. Put up QR posters and run a live leaderboard.
- Demo: (1) Judge scans the QR. (2) Taps whenever the dot turns red, for 60 s. (3) Their reaction-time histogram and lapse count appear, along with "you test like someone ~X hours awake ≈ roughly Y drinks." (4) Show the overnight chart from the room: hours awake against lapses for every hacker tested.
- Build: A static PWA (installable web app) using the high-precision performance.now() timer. A brief psychomotor vigilance task (PVT, a standard tap-when-you-see-it test of alertness), shortened. A Supabase free tier stores the results. P1 test engine and timing calibration, P2 backend and leaderboard, P3 visuals, P4 recruiting about 100 testers overnight.
- Riskiest part + 3-hour test: Touch latency differs by phone, around 30-80 ms (unconfirmed), which could swamp the signal. Test: run the same person on 4 phones and calibrate an offset per device.
- Measured result: The correlation between self-reported hours awake and PVT lapses across about 50 or more hackers tested Saturday night.
- Closest existing thing: Research PVT apps exist, such as the smartphone validation study (doi 10.3758/s13428-016-0763-8), but nothing turns it into a social, room-wide experiment. No AI, no prompt. Its honesty point: the alcohol figure is labelled as a rough research comparison.
- Paper: Dawson and Reid, "Fatigue, alcohol and performance impairment," Nature 388 (1997) (confirmed). Basner, Mollicone and Dinges 2011, the 3-minute PVT-B (confirmed). A later study questions how well the 3-minute version matches the 10-minute one (confirmed exists), so describe the result as a rough estimate.
- Prize tracks: MedTech, Best Overall, UI/UX, Best Pitch.

---

**Heckle** · **Type**: fun · **FM-adjacent**: no
- Pitch: Pitch to a crowd of animated judges who visibly get bored, check their phones and walk out the moment you say jargon, ramble or mumble.
- Motivation: Every team here has to pitch to non-technical judges in 3 minutes, and nobody tells you when you've lost them.
- For: Hackers rehearsing their pitch, including the ~200 teams in this building. Offer free rehearsal at the table on Saturday night.
- Demo: (1) Judge gives our booth a 20-second pitch of anything. (2) Every jargon word ("Kubernetes," "embedding") turns a face grey, and filler words make one yawn. (3) When engagement hits zero, a judge stands up and leaves. (4) At the end: "you lost the room at 0:14, on the word 'vector'."
- Build: Whisper with word timestamps on the 3060 Ti, or the browser Web Speech API as a fallback. A local frequency list rates how rare each word is, so the jargon check needs no LLM. Claude writes one post-pitch question in a judge's voice. A Canvas/Lottie crowd of animated faces. P1 audio and timing, P2 jargon and filler scoring, P3 crowd animation, P4 study.
- Riskiest part + 3-hour test: The faces must react within 1 s in a noisy hall. Test: a close-talk headset mic at the venue, measuring word-to-reaction latency.
- Measured result: 6 teams pitch twice, before and after Heckle. Count the jargon terms that blind non-technical listeners flagged.
- Closest existing thing: Yoodli and Orai-style speech coaches give reports after you finish (unconfirmed for real-time features). Heckle reacts live, per word, to what an outsider would understand. The jargon score is a measured word-rarity statistic, not a prompt.
- Paper: none.
- Prize tracks: Best Pitch, UI/UX, Best Overall.

---

**Blind Spot** · **Type**: impact · **FM-adjacent**: no
- Pitch: Explain your bug out loud like you would to a rubber duck, and your code lights up with the lines you skipped, because the bug is usually where you didn't look.
- Motivation: Talking through code to a rubber duck is a famous debugging trick, and the lines you gloss over are exactly where the mistakes hide.
- For: Hackers debugging at 3 a.m. Recruit 5 from the mentor queue.
- Demo: (1) A buggy 30-line function is on screen. (2) The judge, or a teammate for non-coders, explains it aloud. (3) Lines they mention turn green in real time, with a sweep that follows their voice. (4) The unmentioned lines stay red, and the planted off-by-one bug is in the red.
- Build: A VS Code extension or a Monaco web editor. Whisper for speech-to-text, then local alignment of spoken words to code lines by matching identifiers, using the parsed code structure and fuzzy matching, so no LLM is needed for coverage. Claude is used only to map vague phrases ("then we loop over it") to code. P1 speech, P2 alignment, P3 editor UI, P4 study.
- Riskiest part + 3-hour test: How accurately speech maps to code lines. Test: record 5 explanations, label which lines each covered by hand, and measure precision.
- Measured result: 8 hackers each get 2 functions with a planted bug. Measure the time to find the bug with and without Blind Spot, plus the percentage of planted bugs that ended up in red lines.
- Closest existing thing: Copilot Chat or a Claude "find my bug" prompt fixes the code for you. Blind Spot doesn't answer anything; it shows where you didn't pay attention, which keeps the human doing the debugging.
- Paper: none confirmed.
- Prize tracks: Best Software, Best Overall, Most Impactful AI.

---

**Idiom Lens** · **Type**: impact · **FM-adjacent**: no
- Pitch: SpeedPUB for conversation: live captions that colour idioms, sarcasm and cultural references, with a one-tap literal meaning.
- Motivation: International students can catch every word of "that midterm was a piece of cake, not" and still miss what was meant.
- For: International students. Recruit 5 at the international table and among ESL hackers.
- Demo: (1) Judge says a sentence full of idioms ("let's not beat around the bush, this demo is the whole nine yards"). (2) Within about 2 s the captions show the idioms underlined in amber. (3) The judge taps one and sees the literal meaning plus a small emoji gloss. (4) Toggle "sarcasm" to see a tone colour on a deadpan line.
- Build: The browser Web Speech API for captions. A local idiom lexicon from Wiktionary dumps (free) does fast exact matching. Claude Haiku handles idioms that don't match exactly and the tone tagging, batched per sentence. P1 captions, P2 lexicon matching, P3 Claude layer and eval, P4 UI.
- Riskiest part + 3-hour test: Delay plus false positives. Test: 50 sentences, 25 with idioms, scored for precision and recall.
- Measured result: 6 ESL testers watch a 2-minute clip of a TV sitcom, with and without Idiom Lens, then answer "what did they mean?" questions. Compare the scores.
- Closest existing thing: Live Caption and Google Translate translate words, but idioms come out wrong or literal. The lexicon gives speed and certainty, and the LLM only handles the long tail, so it is more than a prompt.
- Paper: none confirmed.
- Prize tracks: Accessibility, Most Impactful AI, UI/UX.

---

**Say It Right** · **Type**: impact · **FM-adjacent**: no
- Pitch: Say your name once and get a badge QR that teaches anyone to say it: your own voice, slowed down, with the syllables drawn as stress bars and an English-friendly respelling.
- Motivation: Many international students give up and use a "Starbucks name" because nobody says their real one right.
- For: International students and judges, who say about 60 names a day. Recruit at check-in and the badge table.
- Demo: (1) A tester says "Siobhán." (2) The screen shows a respelling ("shi-VAWN") plus syllable bars sized by stress. (3) The judge scans the QR on the tester's badge and hears the name in the tester's own voice, at 0.7x speed and split into syllables. (4) The judge tries it, and a match meter shows whether the stress landed on the right syllable.
- Build: wav2vec2 phoneme recognition (the facebook/wav2vec2-lv-60-espeak-cv-ft model, which turns speech into IPA phonetic symbols; existence unconfirmed) on the 3060 Ti. A rule-based conversion from IPA to an English respelling, with Claude checking that respelling. Stress is detected from pitch and loudness. A static QR page. Split across ML, rules, frontend and recruiting.
- Riskiest part + 3-hour test: Phoneme accuracy on non-English names. Test: 15 names from teammates and friends, rated by each name's owner.
- Measured result: Judges and volunteers attempt 10 names before and after a 15-second session, and the name owners rate each attempt "right / close / wrong."
- Closest existing thing: NameCoach and LinkedIn name recordings (unconfirmed) play audio only. This adds a visual stress shape and a respelling generated from the owner's own audio. It is somewhat close to the earlier "Tone" idea, so pick only one of the two.
- Paper: none.
- Prize tracks: Accessibility, Best UMass Hack, UI/UX.

Sources: [Dawson & Reid 1997](https://pubmed.ncbi.nlm.nih.gov/9230429/), [Basner et al. PVT-B](https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786), [Smartphone PVT validation](https://dx.doi.org/10.3758/s13428-016-0763-8), [Novak et al. Interspeech 2019](https://www.isca-archive.org/interspeech_2019/novak19_interspeech.html)
