# Round 0: generator 5 recent research

Verbatim final report from this subagent.

**1. Pulsecam** · **Type**: impact · **FM-adjacent**: no
- Pitch: Point a laptop camera at your face and watch your heartbeat travel across your skin as a live heat map, with your BPM, and no wearable.
- Motivation: A telehealth visit can't take your pulse, but your face changes colour very slightly with every heartbeat.
- For: Rural or homebound telehealth patients and the nurses who triage them by video. Test it Saturday on 10 hackers, plus one nursing student if one is in the room.
- Demo: (0:00) The judge sits in front of the laptop. (0:05) A pulse waveform starts scrolling and a pink heat map pulses over the cheeks and forehead. (0:30) The judge's own smartwatch or phone pulse app sits next to it and the two BPM numbers match. (1:00) The judge does 10 squats and both numbers rise together. (2:00) Show the evaluation chart.
- Build: Python and FastAPI on the 3060 Ti with **open-rppg**, which packages the ME-rPPG model (the paper says 3.6 MB of memory and single-frame inference). MediaPipe face mesh picks the skin regions. A React front end draws the waveform and heat map. Split: P1 model pipeline, P2 per-region heat map, P3 UI, P4 evaluation and pitch. Fallback is the classic POS algorithm in plain JS (unconfirmed).
- Riskiest part: Stable BPM under expo lighting and with people moving. Test: by hour 3, record 5 people for 60 s under hall lighting and compare with a watch.
- Measured result: Mean absolute error in BPM against a consumer watch across 10 people, at rest and after squats.
- Closest existing thing: Commercial SDKs such as Binah.ai (unconfirmed) and research toolboxes. "Doesn't this exist?": they are closed SDKs that show a number; we show the blood-flow map that justifies the number, and it runs locally. "Isn't this just a prompt?": no LLM is involved; it is signal processing on face video.
- Paper: "Memory-efficient Low-latency Remote Photoplethysmography through Temporal-Spatial State Space Duality", arXiv:2504.01774, 2025, confirmed. Code: KegangWangCCNU/ME-rPPG, and the README says the model is in open-rppg.
- Prize tracks: MedTech, Best Overall, UI/UX, Most Impactful AI.

**2. Mind Charades** · **Type**: fun · **FM-adjacent**: no
- Pitch: Taboo played against an AI's brain: make the model *think* "pizza" without saying pizza, and a meter reads the thought straight from its neurons.
- Motivation: Everyone wonders what an AI is "really thinking". This lets you poke at it and see.
- For: Students and the public curious about AI, and intro-ML instructors who want a classroom hook.
- Demo: (0:00) The judge draws a secret card, for example "the ocean", with banned words listed. (0:20) The judge types a sentence. Each token lights up by how strongly the model's internal "ocean" feature fires, and a score bar fills. (1:30) They see their score on the leaderboard. (2:00) Reveal: clamp that feature on, and Gemma talks about the ocean in every answer.
- Build: Gemma 3 1B plus Gemma Scope 2 residual-stream SAEs (16k width), loaded with SAELens on the 3060 Ti. Both fit comfortably. Feature labels come from Neuronpedia's Gemma 3 pages, or Claude labels top-activating examples itself. Claude referees banned words and synonyms. Split: P1 SAE server, P2 picks 30 clean, fun features, P3 game UI, P4 steering reveal and leaderboard.
- Riskiest part: Finding features that are monosemantic and fun at 1B. Test: in hour 1–3, screen 100 features and keep 30 that fire on paraphrases but not on unrelated text.
- Measured result: For the 30 cards, the share of blind-written paraphrases that trigger the feature against matched control sentences (an AUROC per card), plus median attempts per player.
- Closest existing thing: Neuronpedia's research dashboards and Anthropic's Golden Gate Claude. "Doesn't this exist?": those are research viewers; this is a playable game with a score. "Isn't this just a prompt?": the score is read from activations inside the network, and asking the model would not give it.
- Paper: Gemma Scope 2 (Google DeepMind), released Dec 19 2025, confirmed. It covers Gemma 3 270M–27B; weights are on Hugging Face and load via SAELens. No arXiv id confirmed.
- Prize tracks: Best Overall, UI/UX, Most Impactful AI, Best Pitch.

**3. Was That Me?** · **Type**: impact · **FM-adjacent**: no
- Pitch: Record 10 seconds of your voice, hear a clone of yourself you can't tell apart, then watch an invisible watermark catch the fake even after it plays through a phone speaker.
- Motivation: Voice-clone "grandparent scam" calls are real, and people overestimate their ability to spot them.
- For: Older adults targeted by phone scams, and the bank and family members who protect them. Run the listening test on hackers and volunteers Saturday.
- Demo: (0:00) The judge reads one sentence into a phone. (0:30) The laptop plays two clips: the judge saying a new sentence, and a clone. The judge guesses which is real. (1:15) The detector draws a red timeline over the fake, sample by sample. (1:45) The fake is replayed over a speaker into a second phone's mic and checked again.
- Build: Chatterbox 0.5B (MIT licence, voice cloning, outputs carry the PerTh watermark; 8 GB fit unconfirmed) and AudioSeal (Meta) as a second, localized watermark and detector. A web UI shows the A/B test and timeline. Split: P1 cloning, P2 watermark pipeline, P3 UI, P4 listening study.
- Riskiest part: The watermark may not survive replay through a speaker into a mic (the "analog hole"). Test by hour 3 with 20 clips. If it fails, that becomes the honest finding, and digital-path detection stays the demo.
- Measured result: Human real-or-fake accuracy (expected near 50%) against detector accuracy, for digital and over-the-air replay.
- Closest existing thing: Resemble's and Meta's own detectors. "Doesn't this exist?": the parts do; nobody shows a layperson their own clone and then measures watermark survival through a phone. "Isn't this just a prompt?": no LLM; it is audio models and signal detection.
- Paper: "Proactive Detection of Voice Cloning with Localized Watermarking" (AudioSeal), ICML 2024, PMLR 235, arXiv:2401.17264, confirmed. Code: facebookresearch/audioseal. Chatterbox has no paper (code is public, MIT).
- Prize tracks: Best AI Security Hack, Most Secure Hack, Most Impactful AI, Best Overall.

**4. Did It Read Me?** · **Type**: impact · **FM-adjacent**: no
- Pitch: Paste any paragraph and see, word by word, whether a language model memorised it during training.
- Motivation: Writers and students want to know whether AI was trained on their work. Today they can only guess.
- For: Authors, student journalists (for example at the *Daily Collegian*, unconfirmed), and artists checking their published work.
- Demo: (0:00) The judge pastes a famous opening line and the text glows red as memorised. (0:40) The judge types a sentence they just made up and it stays cool. (1:20) The judge pastes their own blog or LinkedIn text. (2:00) The "receipts" view: because Pythia's training set (the Pile) is public, we show the detector checked against ground truth.
- Build: Pythia-2.8B-deduped (fp16 fits in 8 GB) on the 3060 Ti. Min-K%++ scores per token from the official repo, with a React heat map. Split: P1 scoring server, P2 Pile-membership ground-truth sampling, P3 UI, P4 evaluation.
- Riskiest part: Paragraph-level scores are noisy. Test by hour 3: reproduce a reasonable AUROC on 200 known-member and 200 known-non-member Pile and post-2023 snippets.
- Measured result: AUROC on 400 snippets with known membership on Pythia, compared with plain loss.
- Closest existing thing: "Have I Been Trained" (an image-dataset search, unconfirmed current status). "Doesn't this exist?": that searches a dataset; we interrogate the model itself, which also works when the data is secret. "Isn't this just a prompt?": asking a model "did you read this?" is unreliable; this uses token probability geometry.
- Paper: "Min-K%++: Improved Baseline for Pre-Training Data Detection from Large Language Models", ICLR 2025 spotlight, arXiv:2404.02936, confirmed. Code: zjysteven/mink-plus-plus. Pythia: ICML 2023, arXiv:2304.01373, confirmed, open weights. Pythia on the WikiMIA benchmark is unconfirmed.
- Prize tracks: Best AI Security Hack, Most Impactful AI, Best Software.

**5. Shaky** · **Type**: impact · **FM-adjacent**: no
- Pitch: An AI answer where every sentence the model is likely making up visibly wobbles.
- Motivation: Students copy confident-sounding AI answers, and a confabulation looks exactly like a fact.
- For: First-year UMass students using AI for coursework, and the TAs who grade the fallout. Test with 5 students Saturday.
- Demo: (0:00) The judge asks about something obscure they know, such as their hometown's history or their own research. (0:20) The answer appears and made-up claims shake with a dotted underline. (1:00) Tap a claim to see the 5 sampled versions disagreeing. (1:45) Side by side: "Claude's self-reported confidence" against Shaky, and the calibration chart.
- Build: Claude API (Haiku for samples): split the answer into claims, resample each 5× at temperature 1, then cluster by bidirectional entailment using Claude or DeBERTa-large-MNLI locally (unconfirmed) and compute semantic entropy. Split: P1 sampling and clustering, P2 claim splitting, P3 UI, P4 evaluation.
- Riskiest part: Latency and cost of 5× sampling per claim. Test by hour 3: under 6 s for a 4-claim answer using parallel calls.
- Measured result: AUROC for predicting wrong answers on 100 TriviaQA-style questions plus 30 obscure local questions, semantic entropy against verbalised confidence.
- Closest existing thing: The semantic-entropy research code; chat apps show no per-claim uncertainty. "Isn't this just a prompt?": we show that asking the model how sure it is scores worse than measuring disagreement across its samples.
- Paper: Farquhar et al., "Detecting hallucinations in large language models using semantic entropy", *Nature* 630, 2024, confirmed. Code: jlko/semantic_uncertainty, seen via mirror listings only, so code availability is partly unconfirmed.
- Prize tracks: Most Impactful AI, Best UMass Hack, UI/UX, Best Overall.

**6. Minuteman Mirror** · **Type**: fun · **FM-adjacent**: no
- Pitch: Say a costume out loud ("make me a Minuteman", "make me a marble statue") and your live webcam reflection becomes it in about a second.
- Motivation: It is joyful, instant, and everybody walks away with a GIF of themselves.
- For: Expo crowds and campus events, for example UMass orientation or open-house booths.
- Demo: (0:00) The judge stands in front of the camera. (0:10) They speak a costume and the mirror restyles them live as they move. (1:00) They try two more. (2:00) They scan a QR code and their GIF is on their phone.
- Build: StreamDiffusion with SD-Turbo img2img on the 3060 Ti. The repo has a browser webcam demo. The browser's Web Speech API picks the prompt. Split: P1 diffusion server and tuning, P2 voice prompting, P3 UI and GIF/QR, P4 face-consistency and evaluation.
- Riskiest part: The frame rate on a 3060 Ti is unknown. The paper reports about 94 fps img2img on a 4090; no 3060 figure was found. Test in hour 1: aim for at least 10 fps at 512px.
- Measured result: fps and end-to-end latency on the 3060 Ti, plus the share of 20 users who rated themselves "recognisable".
- Closest existing thing: The StreamDiffusion demo itself and TouchDesigner installations. Honest answer to "doesn't this exist?": mostly yes. What we add is voice control, an identity-keeping tweak and a take-home GIF. This is the weakest card on novelty. "Isn't this just a prompt?": no; it is a real-time diffusion pipeline.
- Paper: "StreamDiffusion: A Pipeline-level Solution for Real-Time Interactive Generation", arXiv:2312.12491, ICCV 2025, confirmed; code cumulo-autumn/StreamDiffusion. StreamDiffusionV2 (arXiv:2511.07399, MLSys 2026) is confirmed but probably too heavy for 8 GB (unconfirmed).
- Prize tracks: Best UMass Hack, UI/UX, Best Pitch.

Sources: https://huggingface.co/google/gemma-scope-2-4b-it · https://www.neuronpedia.org/gemma-3-1b · https://arxiv.org/abs/2504.01774v1 · https://kegangwangccnu.github.io/open-rppg/intro.html · https://huggingface.co/ResembleAI/chatterbox · https://proceedings.mlr.press/v235/san-roman24a.html · https://arxiv.org/abs/2404.02936v4 · https://github.com/EleutherAI/pythia · https://oatml.cs.ox.ac.uk/publications/202406_FarquharKossenKuhn_HallucinatingLLMs.html · https://arxiv.org/html/2312.12491v2 · https://github.com/chenfengxu714/StreamDiffusionV2
