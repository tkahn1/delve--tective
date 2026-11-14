# Round 0: generator 3 pure fun

Verbatim final report from this subagent.

**Flipbook: Your Face Is a Hidden Picture** · **Type**: fun · **FM-adjacent**: no
- Pitch: Tell it two things, and it paints one picture that shows the first when upright and the second when you turn your phone upside down.
- Motivation: Everyone loves a hidden picture, and this one is about you: "a lighthouse" that turns into "my dog" when flipped.
- For: Hackathon attendees and judges. Later, teachers and party hosts who make custom puzzle cards.
- Demo: (1) The judge scans a QR code and types or picks two prompts, for example "a moose" and "Judge Sarah's coffee mug". (2) While it renders (about 40–60 s on the 3060 Ti), the judge flips through printed illusions from earlier visitors and tries to spot the second image. (3) The result reaches their phone. They rotate it and the image changes. (4) They keep a PNG and a printable card. A team member photographs it for the "wall of flips".
- Build: SD 1.5/SDXL-turbo-class model in diffusers on the 3060 Ti, running the view-averaged denoising loop (P1). FastAPI queue and job status (P2). Mobile web UI with rotation that follows the device gyro (P3). Prompt-pair suggester with Claude, which rewrites user prompts into pairs that flip well, plus the print pipeline (P4).
- Riskiest part + test in hour 1–3: Whether an 8 GB card gives recognizable flips in under 60 s. Port the method to an SD pipeline, run 10 prompt pairs, and time each one.
- Measured result: Share of 20 strangers who name both hidden images unprompted (target above 60%).
- Closest existing thing: The Visual Anagrams research code (DeepFloyd IF, research GPU). This version is personal, on a phone, and fast. It is not just a prompt: a single prompt cannot make a picture that reads two ways under rotation. That needs the per-step noise averaging across views.
- Paper: Geng, Park, Owens, "Visual Anagrams", CVPR 2024 (confirmed, arXiv 2311.17919).
- Prize tracks: Best Overall, UI/UX, Best Pitch, Most Impactful AI.

**Window: Your Selfie Becomes a Diorama Behind the Glass** · **Type**: fun · **FM-adjacent**: no
- Pitch: Take a selfie, and your phone becomes a window: move your head and the photo shifts in true 3D parallax, as if the scene were inside the phone.
- Motivation: It is a real "wait, how?" illusion. A flat screen suddenly has depth, with no glasses or headset.
- For: Anyone with a phone. The team's room demo uses judge-and-friend selfies.
- Demo: (1) The judge scans the QR code and takes a selfie with a friend (or a photo of the hall). (2) Within about 5 s, depth is estimated on the phone and the photo is lifted into a layered 3D mesh. (3) The front camera tracks the judge's eyes. The judge tilts their head and the foreground slides against the background with off-axis projection, like looking through a box. (4) Both judges try it on their own phones. (5) They keep an exported "wiggle" GIF.
- Build: Transformers.js running Depth Anything V2 Small on WebGPU/WASM in the browser (P1). MediaPipe Face Landmarker for eye position, plus the off-axis projection maths (P2). three.js displaced mesh with hole filling at depth edges (P3). Capture flow, GIF export and QR hosting (P4). Claude is optional, for scene captions only. Not needed.
- Riskiest part + test: Running depth and face tracking at the same time on mid-range phones. In hours 1–3, run both on three team phones and log fps (target 24+).
- Measured result: Head-to-render latency in ms on 5 phones, plus the share of 20 viewers who rate the depth as "real" with the effect on versus off.
- Closest existing thing: Johnny Lee's Wiimote head-tracked display (2007, needed an IR rig) and 3D photo effects in phone galleries (gyro only, no head tracking, unconfirmed). This needs no hardware and uses the judge's own photo. It is not a prompt. There is no LLM in the core.
- Paper: Depth Anything V2 (model confirmed on Hugging Face, Apache-2.0 for Small). Lee 2007 project confirmed through press coverage.
- Prize tracks: Best Overall, UI/UX, Best Software.

**Poker Pulse: A Bluffing Game Where Your Face Gives Away Your Heartbeat** · **Type**: fun · **FM-adjacent**: no
- Pitch: Two players take turns bluffing while the phone camera reads each one's pulse from tiny colour changes in their face and shows it live on screen.
- Motivation: Seeing your own heartbeat appear from a selfie camera is both delightful and unsettling. It is a party game with a real physiological signal behind it.
- For: Friends at a game night. At the table: two judges, or a judge against a team member.
- Demo: (1) The judge looks at a laptop or phone for 10 s while the pulse trace appears ("72 bpm, that's you"). (2) Claude acts as dealer and deals a card plus a prompt ("Claim you've been to Iceland"). (3) The judge answers truthfully or bluffs. The opponent sees the judge's heart-rate change and calls "bluff" or "true". (4) Three rounds, then a score. (5) The judge keeps a card with their heart-rate trace and their best bluff. The game says plainly that this is not a lie detector, only a fun signal.
- Build: POS rPPG in Python/JS over MediaPipe face ROI (P1). Signal filtering and confidence gating, so no number is shown when lighting is bad (P2). Game UI and two-player flow (P3). Claude dealer for prompt generation and banter, plus the evaluation runs (P4).
- Riskiest part + test: Whether rPPG works under hall lighting. In hours 1–3, compare against a team smartwatch in the venue.
- Measured result: Mean absolute error in bpm against a smartwatch across 10 people (target below 5 bpm).
- Closest existing thing: Phone apps that measure heart rate with a finger on the camera, and rPPG research demos. This differs because it is contactless, live and two-player, and the pulse is the game mechanic. It is not a prompt: Claude only deals cards and the signal comes from the camera pixels.
- Paper: Wang et al., "Algorithmic Principles of Remote PPG", IEEE TBME 2017 (confirmed).
- Prize tracks: Best Overall, MedTech (contactless vitals), Best Pitch.

**Shadow Zoo: Hand Shadows That Come Alive** · **Type**: fun · **FM-adjacent**: no
- Pitch: Make a hand-shadow animal in front of your phone camera, and it detaches from your hand and walks around the screen as its own animated creature.
- Motivation: Everyone has tried a shadow rabbit. Watching yours hop away on its own is pure magic.
- For: Kids and parents. At the expo: any judge willing to make a dog or bird with their hands.
- Demo: (1) The judge scans the QR code and holds a hand shape against the camera. (2) A live silhouette appears in black. (3) When they hold still for 2 s, the silhouette freezes, sprouts legs or wings and walks or flies off across the screen. (4) A second judge adds theirs, and the two creatures meet and interact. (5) The creature joins a shared "zoo" wall on the team's laptop. The judge keeps a GIF of their creature.
- Build: MediaPipe hand segmentation and contour extraction (P1). Silhouette classifier (rabbit, dog, bird, snail, other) trained on frames the team collects Saturday (P2). Mesh rigging with ARAP deformation, plus procedural gaits per class (P3). Zoo wall over WebSocket, GIF export, and Claude naming each creature and writing a one-line bio (P4).
- Riskiest part + test: Rigging an arbitrary silhouette so it walks convincingly. In hours 1–3, ARAP-animate 3 hand-drawn silhouettes with fixed rigs.
- Measured result: Classification accuracy on 50 hand shadows from 10 people in the room.
- Closest existing thing: Meta's Animated Drawings (human figures drawn on paper). This uses live hand shadows, animals, and multiplayer. It is not a prompt: the creature is a deformed mesh of your own silhouette, not a generated image.
- Paper: Smith et al., "A Method for Animating Children's Drawings of the Human Figure", ACM TOG 2023 (confirmed, ARAP-based).
- Prize tracks: Best Overall, UI/UX, Accessibility (playful hand-motion exercise, a weak fit).

**Swarm Screen: Every Phone on the Table Becomes One Giant Display** · **Type**: fun · **FM-adjacent**: no
- Pitch: Judges drop their phones on the table in any arrangement. One laptop camera works out where each phone is, then a single animation flows across all of them.
- Motivation: Your own phone becoming one pixel of a bigger picture feels like a magic trick, and it is social.
- For: Groups: classrooms, parties, the people crowding round a hackathon table.
- Demo: (1) Two or three judges scan the QR code. Each phone shows a unique flashing marker. (2) They put their phones anywhere on the table, rotated however they like. (3) The overhead laptop camera sees the markers and calibrates in about 3 s. (4) A fish swims from one phone to the next, crossing the gaps correctly. The judges move a phone and the fish adapts. (5) A judge draws on one phone and the line continues onto the next. (6) A keepsake GIF of the whole swarm goes to every phone.
- Build: Marker detection and homography with OpenCV/ArUco on the laptop (P1). WebSocket sync with a shared clock so frames line up (P2). Phone web client and the animations/drawing (P3). Re-calibration when a phone moves, latency compensation, and the evaluation (P4).
- Riskiest part + test: Frame sync across mixed phones. In hours 1–3, get 3 phones to show a moving bar across their edges with visible tearing under 50 ms.
- Measured result: Calibration error in mm, and time from "phones down" to "fish swimming", averaged over 10 trials with 3–5 phones.
- Closest existing thing: Junkyard Jumbotron (MIT, 2011), which stitched screens from a still photo. This version tracks live (phones can move), keeps frames in sync for motion, and supports drawing across phones. It is not a prompt. There is no LLM in the core.
- Paper: None. Junkyard Jumbotron confirmed through press coverage.
- Prize tracks: Best Overall, Best Software, UI/UX.

**Face Duet: Two Faces, One Instrument** · **Type**: fun · **FM-adjacent**: no
- Pitch: Two people play one song together using only their faces: one player's eyebrows set the pitch, the other's mouth shapes the sound, and a scrolling score shows how well they are in sync.
- Motivation: Making music with your face is silly. Doing it with a stranger and getting it right makes people laugh and want to try again.
- For: Pairs of friends, and judges plus team members at the table. Later, an expressive instrument for people with limited hand movement.
- Demo: (1) Each judge scans the QR code. Their phone becomes their half of the instrument. (2) The phones play through a shared clip-on speaker or wired earbuds, because the hall is noisy, and show the notes visually as well. (3) The judges try to follow a scrolling "Happy Birthday" ribbon: pitch from one face, open-mouth "wah" from the other. (4) A live sync meter shows their score. (5) They keep a short video of both faces with the melody they made.
- Build: MediaPipe Face Landmarker on each phone for blendshapes (P1). Web Audio synth with pitch quantization to keep it musical (P2). WebSocket session pairing and the latency-compensated score ribbon (P3). Recording/export, plus Claude turning the session into a funny band name and a review (P4).
- Riskiest part + test: Latency from face to sound across two phones. In hours 1–3, measure ms from a mouth-open blendshape to an audio onset (target below 120 ms).
- Measured result: How many first-time pairs hit 70% of notes within ±1 semitone in 60 s, out of 10 pairs.
- Closest existing thing: Face-controlled theremin web toys (unconfirmed) and karaoke games. This is a two-person split instrument with sync scoring. It is not a prompt: the signal is face geometry and the sound is synthesized live.
- Paper: None.
- Prize tracks: Best Overall, Accessibility, UI/UX.

Sources:
- [Visual Anagrams, CVPR 2024](https://openaccess.thecvf.com/content/CVPR2024/html/Geng_Visual_Anagrams_Generating_Multi-View_Optical_Illusions_with_Diffusion_Models_CVPR_2024_paper.html)
- [arXiv 2311.17919](https://arxiv.org/abs/2311.17919)
- [Junkyard Jumbotron (MIT)](https://www.mit.edu/~jlrubin/projects/junkyard-jumbotron)
- [Junkyard Jumbotron, Boing Boing 2011](https://boingboing.net/2011/03/13/junkyard-jumbotron-j.html)
- [Animated Drawings paper, arXiv 2303.12741](https://arxiv.org/pdf/2303.12741)
- [Algorithmic Principles of Remote PPG](https://cir.nii.ac.jp/crid/1360574094799722624?lang=en)
- [Wiimote head tracking, Hackaday 2007](https://hackaday.com/2007/12/21/wiimote-head-tracking-desktop-vr-display)
- [Depth Anything V2 Small ONNX](https://huggingface.co/onnx-community/depth-anything-v2-small)
- [Depth Anything V2 README (license)](https://cdn.jsdelivr.net/gh/depthanything/depth-anything-v2@main/README.md)
