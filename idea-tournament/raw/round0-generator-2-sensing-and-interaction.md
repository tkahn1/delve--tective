# Round 0: generator 2 sensing and interaction

Verbatim final report from this subagent.

**1. Glance** · **Type**: impact · **FM-adjacent**: no
- Pitch: Type a sentence using only your eyes and a laptop webcam. Claude guesses the rest of the phrase, so you look at maybe 3 targets instead of 30 letters.
- Motivation: If you can't use your hands, even for a while (a cast, RSI, holding a baby), a $0 webcam should still let you write.
- For: Hackers here with wrist strain, and anyone in a cast. Test with named teammates and judges on Saturday. Do not claim to speak for ALS users.
- Demo: (1) The judge sits down and does a 10-second calibration by looking at 5 dots. (2) A large 6-tile board shows letters grouped into clusters, plus 3 phrase guesses from Claude. (3) The judge types "where is the bathroom" by dwelling on tiles. (4) A counter shows "11 glances vs 21 letters". (5) The board speaks the phrase over a speaker.
- Build: WebGazer.js in the browser, coarse 6-zone layout (it is not accurate enough for a full keyboard), Claude Haiku for completions. Split: 1 gaze and calibration, 1 UI, 1 prediction prompt and cache, 1 evaluation and pitch.
- Riskiest part + test in hours 0–3: WebGazer accuracy under expo lighting. Test: 5 people, 6 zones, measure the hit rate. If it is under 85%, drop to 4 zones.
- Measured result: Selections per phrase and words per minute for 8 people, with prediction vs without, on the same 5 phrases.
- Closest existing thing: Google Look to Speak (Android, 2020, confirmed) lets you pick from a fixed phrase list with left/right/up glances. Tobii needs hardware. Glance writes new sentences, and context-aware prediction is the point. The prompt only ranks guesses; the input channel is what makes it work.
- Paper: Papoutsaki et al., "WebGazer," IJCAI 2016 (confirmed). It reports 100–200 px accuracy, which is why the layout uses coarse zones.
- Prize tracks: Accessibility, Most Impactful AI, UI/UX, Best Overall.

**2. Proof of Typing** · **Type**: impact · **FM-adjacent**: no
- Pitch: Your keystroke rhythm proves you composed an answer instead of retyping a ChatGPT draft from a second screen.
- Motivation: Thinking while you write leaves pauses and rewrites that copying does not, and that can be measured.
- For: UMass TAs grading take-home short answers, and the students who want a way to prove their own work. Find one TA in the room on Saturday.
- Demo: (1) The judge answers "What did you eat yesterday?" in a text box. (2) A live timeline colours each pause: thinking (long, before words) vs motor (even). (3) The judge then retypes a printed paragraph. (4) The verdict flips to "transcribed" with a score, and the two rhythm plots sit side by side.
- Build: A browser keylogger on one page only, with a local consent banner. Features: coefficient of variation of inter-key intervals, pause before word vs within word, and revision rate. A small scikit-learn model. Split: logger, features/model, visual timeline, data collection.
- Riskiest part + test in hours 0–3: Whether the signal separates people we have never seen. Collect 6 people × (1 composed + 1 transcribed) and run leave-one-person-out.
- Measured result: Leave-one-person-out accuracy on about 20 hackers. Also show an attack: one teammate tries to fake "composed" rhythm, and report honestly whether he gets through.
- Closest existing thing: GPTZero and Turnitin judge the finished text. This judges the process. It is not a prompt because there is no LLM in the detector. Be upfront that a 2026 preprint shows timing forgery is possible, and pitch it as a speed bump, not proof.
- Paper: "Keystroke Dynamics Against Academic Dishonesty in the Age of LLMs," arXiv 2406.15335 (confirmed). An EDM 2024 short paper reports 99% for written vs transcribed (confirmed via search). The forgery critique is arXiv 2601.17280 (confirmed).
- Prize tracks: Best AI Security Hack, Most Secure Hack, Best UMass Hack.

**3. Tell** · **Type**: fun · **FM-adjacent**: no
- Pitch: A Two Truths and a Lie game where the laptop webcam watches your pulse (read from colour changes in the skin), blinks and micro-smiles while Claude interrogates you.
- Motivation: Everyone wants to know whether their poker face holds up.
- For: Hackers and judges at 3 AM. Pure party fun. Tell people plainly that it is not a real lie detector.
- Demo: (1) The judge sits down and a live BPM appears within about 10 seconds, read from their forehead. (2) They type 3 statements. (3) Claude asks a follow-up on each, shown on screen with no audio needed. (4) A "nervous meter" made of heart rate rise, blink rate and lip press goes up. (5) The game names its guess for the lie, and the judge reveals the answer.
- Build: MediaPipe Face Landmarker (blendshapes plus a forehead region), a green-channel rPPG with bandpass filter and FFT in JS, Claude for follow-up questions. Split: rPPG, face features, game UI, Claude and evaluation.
- Riskiest part + test in hours 0–3: rPPG under hall lighting and head movement. Compare against a teammate's smartwatch for 2 minutes.
- Measured result: Mean absolute BPM error vs a smartwatch across 10 people. Also report the game's honest lie-guess hit rate over 30 rounds; chance is 33%.
- Closest existing thing: rPPG demos and "AI lie detector" toys. The difference is a live game with an adaptive interrogator, and the sensing is the product. It shows its own error bar instead of claiming it can read lies.
- Paper: Verkruysse et al., "Remote plethysmographic imaging using ambient light," Optics Express 2008 (confirmed).
- Prize tracks: Best Overall, Best Software, Best Pitch.

**4. Wand Duel** · **Type**: fun · **FM-adjacent**: no
- Pitch: Two judges scan a QR code, and their phones become wands. They cast spells by drawing gestures in the air and duel on the big screen.
- Motivation: Every kid wanted a working wand.
- For: Everyone at the table, and two judges at once.
- Demo: (1) A QR code on the screen. Each judge scans it and taps "Allow motion". (2) A 15-second tutorial: flick for bolt, circle for shield, Z for lightning. (3) A 60-second duel with phone buzzes on hits (Android; iOS gets a sound). (4) A winner card.
- Build: A web page using DeviceMotion/gyro. iOS needs the user tap plus requestPermission over HTTPS. Gesture recognition uses $1-style template matching or a small 1D CNN, with a WebSocket game server. Split: sensor capture and recognizer, game server, big-screen visuals, gesture data and polish.
- Riskiest part + test in hours 0–3: Recognizing gestures from people the model has never seen. Collect 5 gestures × 6 people and test on a 7th.
- Measured result: Recognition accuracy for 15 unseen people, with gesture-to-screen latency in ms.
- Closest existing thing: Wii and Joy-Con games, and the Harry Potter Kano wand (hardware; exact name unconfirmed). This runs on any phone in the room with nothing to install. There is no LLM.
- Paper: Wobbrock et al., "$1 Unistroke Recognizer," UIST 2007 (unconfirmed).
- Prize tracks: Best Overall, UI/UX, Best Software.

**5. Feel the Graph** · **Type**: impact · **FM-adjacent**: no
- Pitch: Drag your finger across a chart on your phone. Higher values buzz harder and sound higher, so you can find the peak and the trend with your eyes closed.
- Motivation: In a stats lecture, a chart is a wall for a student who can't see it.
- For: Blind and low-vision students in data-heavy courses. We can't reach them this weekend, so test blindfolded with hackers and say exactly that. Try UMass Disability Services after the event.
- Demo: (1) The judge scans the QR code, closes their eyes and drags across a mystery line chart. (2) They answer "Where is the peak? Up or down overall?" (3) They open their eyes and see whether they were right. (4) They swipe up and Claude speaks a short summary of the chart.
- Build: PWA with canvas, Web Audio pitch mapping, navigator.vibrate for intensity. Vibration works on Android only; iOS Safari does not support the Vibration API (confirmed), so iOS gets audio only. Bring Android phones. Split: touch rendering, haptic/audio mapping, chart import (CSV/image via Claude vision), user study.
- Riskiest part + test in hours 0–3: Whether vibration strength can be told apart. navigator.vibrate is on/off only, so intensity must come from pulse width (duty cycle). Test whether 5 people can rank 4 levels.
- Measured result: Accuracy and time locating the peak and trend on 10 charts, for 8 blindfolded people, haptic+audio vs audio only.
- Closest existing thing: Apple Audio Graphs (iOS 15, audio only, and only in apps that adopt it; confirmed). This adds touch and vibration, works on any chart image, and runs in the browser.
- Paper: none confirmed.
- Prize tracks: Accessibility, UI/UX, Most Impactful AI.

**6. Choir of One** · **Type**: fun · **FM-adjacent**: no
- Pitch: Hum 5 seconds into headphones and hear yourself come back as a 4-part choir, every part in your own voice.
- Motivation: Everyone hums, almost no one gets to hear themselves harmonize.
- For: Judges and hackers who "can't sing".
- Noisy hall: closed headphones with a built-in close mic, a pitch tracker gated to sustained voiced tones, and a noise gate. The screen shows the 4 voices as coloured lines so passers-by can follow without audio.
- Demo: (1) The judge puts on headphones and hums any tune. (2) Within 1 second they hear 3 harmony voices join, pitch-shifted copies of their own voice voiced to the key we detect. (3) The screen draws 4 lines in real time. (4) Replay and download.
- Build: Python on a laptop: CREPE or pYIN for pitch, key detection, voice-leading rules, PSOLA pitch-shifting (librosa/psola). Split: pitch and key, harmony rules, shifting and latency, visuals and evaluation. Fallback: record then play back if real-time fails.
- Riskiest part + test in hours 0–3: Round-trip latency under 150 ms. Measure it on the laptop with a simple 1-voice shift.
- Measured result: Median pitch error in cents of the judge's melody vs the corrected lead line across 12 people, plus end-to-end latency.
- Closest existing thing: Google Tone Transfer (2020, confirmed) turns a hum into one instrument, and hardware vocal harmonizers exist (TC-Helicon, unconfirmed). This is free, uses your own timbre for 4 parts, and needs no LLM.
- Paper: Kim et al., "CREPE," ICASSP 2018 (unconfirmed).
- Prize tracks: Best Overall, UI/UX, Best Pitch.

Sources:
- [Look to Speak (Google blog)](https://blog.google/outreach-initiatives/accessibility/look-to-speak/)
- [WebGazer IJCAI 2016](https://mlanthology.org/ijcai/2016/papoutsaki2016ijcai-webgazer)
- [Brown WebGazer news](https://www.brown.edu/news/2016-06-01/eyetracker)
- [Verkruysse 2008 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2717852)
- [Keystroke Dynamics Against Academic Dishonesty, arXiv 2406.15335](https://arxiv.org/html/2406.15335v1)
- [Timing-forgery attacks, arXiv 2601.17280](https://arxiv.org/html/2601.17280v1)
- [EDM 2024 short paper](https://educationaldatamining.org/EDM2024/proceedings/2024.EDM-short-papers.47/index.html)
- [Apple Audio Graphs](https://developer.apple.com/documentation/accessibility/representing-chart-data-as-an-audio-graph.md)
- [iOS vibration support (MDN compat issue)](https://github.com/mdn/browser-compat-data/issues/29166)
- [Magenta Tone Transfer](https://magenta.tensorflow.org/tone-transfer)
