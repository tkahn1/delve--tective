# HackUMass XIV idea tournament

You are the orchestrator of an idea tournament. Your job is to produce project ideas that can win Best Overall at HackUMass XIV, by generating many ideas with subagents, attacking them with judge subagents, rewriting, and repeating. This is ideation only: write no project code (hackathon rules forbid work that isn't done by the team during the event).

## Situation
- Team of 4 experienced hackers. Software only, on a laptop or phone (web, mobile, ML/Python). No hardware.
- Time left to build: [HOURS LEFT] hours. Submissions close 9:00 AM Sunday Nov 15. Judging is expo style: about three minutes per judge at a noisy table, and many judges are not technical.
- Compute: [GPU? e.g. "one laptop with an RTX 4060" or "none"]. API keys: [which].
- Prizes we care about: Best Overall first. Also Best Software, UI/UX, Most Impactful AI, MedTech, Most Secure Hack, Best AI Security Hack, Accessibility, Best UMass Hack, Best Pitch, Capital One Nessie, Best Agentic Hack.

## What has won here
- 2025 Soundbrush: drawing app where each colour plays a note, for visually impaired artists.
- 2024 SpeedPUB: colours words by grammatical role so you read faster.
- 2023 MinervAI: simulated classroom of AI students so teachers can rehearse.
- Pattern: one idea explainable in a sentence; a new way to sense or interact, not a chat window; a specific person it helps; a simple stack with a demo the judge can try.
- Campus utility apps (dining, lost and found, events) win track prizes, never the grand prize.

## What an earlier judging loop taught us
- The demo should take the judge's own voice, words, face or hand as input and change something visible within five seconds.
- Running on the judge's phone from a QR code, or fully locally, beats anything that waits on a remote server.
- One named real person who tested it on Saturday beats any framing. Do not speak for a community the team cannot reach this weekend; the best beneficiaries are people in the room.
- A research paper adds credibility but is never the hook. One measured number from a small evaluation is what separates a project from a toy.
- Judges ask "doesn't this exist?" and "isn't this just a prompt?" Every idea needs a one-sentence answer to both.
- Ideas already explored (reuse only if clearly improved): Dial, an activation-steering slider that makes a flattering AI honest; Tone, hearing your own cloned voice speak Mandarin with tone shapes drawn over your attempt.

## Seed idea (from a teammate)
Verified AI code. AI writes more and more code, and AI also finds more and more exploits. Math can be checked with Lean proofs; code can be checked with formal methods. Build a library or plugin for Claude or Codex that takes a plain-English request, turns it into a formal specification, generates the code, and then produces a machine-checked proof that the code meets the specification, or a concrete counterexample when it doesn't.
Treat this as idea 0. It competes on equal terms, and one generator explores variants of it.

## What to produce
At least 20 new ideas of the same calibre as the seed, plus the seed. Requirements for every idea:
- A motivation a non-technical judge accepts in one sentence, and a clear goal: either real impact on real people, or a real fun factor. At least 5 of the ideas must be primarily fun.
- Not limited to formal methods. At most 5 ideas may be formal-methods adjacent.
- Buildable by 4 people in the time left with the compute listed.
- A recent research paper method is welcome where it fits, but not required. Never cite a paper, product or number without confirming it by web search; mark anything unconfirmed as unconfirmed.

Each idea card has: name; one-sentence pitch; motivation; who it is for; the three-minute demo, beat by beat, including what the judge does; how it is built; the riskiest part and a test for it in the first three hours; the measured result to show; closest existing thing and how this differs; paper if any; prize tracks.

## Agents and models
You, the orchestrator, run on the session model (Claude Fable 5.2). You deduplicate, cull, rewrite and decide. Subagents are read-only and return text to you.

- Generators: 6 agents on Opus, launched in parallel, each with one lens and each returning 6 idea cards:
  1. variants and neighbours of the seed (verified code, proofs, AI security);
  2. new ways to sense or interact (voice, hum, camera, touch);
  3. pure fun: toys, games, things a judge would drag another judge over to see;
  4. problems of people in the room (students, hackers, international students, judges);
  5. recent research methods (2025–2026) that make a striking live demo;
  6. sponsor and track fits (Capital One Nessie, MedTech, security, accessibility).
- Prior-art scouts: 3 agents on Sonnet with web search, splitting the idea list, returning the closest existing product or hackathon project for each idea and whether any cited paper is real.
- Gut-check panel: 5 agents on Haiku. Each sees only the name and one-sentence pitch of every idea, plays a tired non-technical judge, and returns for each: "get it / don't get it", and "would walk over / would walk past".
- Judges: 4 agents on Opus, each with one persona and told to be harsh:
  1. Best Overall floor judge, three minutes per table, tired by project 40;
  2. senior sponsor engineer: feasibility in the time left, depth versus wrapper, will the demo survive;
  3. accessibility and user-research practitioner: does the beneficiary want this, is the team speaking for people it hasn't met;
  4. CS faculty researcher: do the claims survive a sceptical question, is the evaluation sound.
  Each judge returns a score out of 10 per idea, the single worst flaw, one concrete fix, a ranking, and optionally one mutation or merge.

## The loop
- Round 0, generate: run the 6 generators. Merge duplicates. Keep at least 24.
- Round 1, wide cut: run scouts and the gut-check panel in parallel, then the 4 judges on everything with the scout and panel results attached. Keep the top 10 by total score, but always keep the highest-scoring fun idea and the seed.
- Round 2, rewrite: rewrite each survivor against its criticism, add up to 4 new ideas from the judges' mutations and merges, and re-judge with the same 4 judges so they can say whether their objection was really fixed. Keep the top 5.
- Round 3, final: fully flesh out the top 5 and send them to 4 fresh judge agents with the same personas and no memory of earlier rounds, for a head-to-head ranking and a rough win probability each.
- Stop after round 3. Stop earlier only if one idea averages 8 or higher with no judge below 7.
- In every round, change ideas because of what the judges said, not to please them: if a judge's objection is wrong, say why and keep the idea.

## Output
Keep one file, `ideas.md`, updated after every round:
1. Top 5, as full idea cards, ranked, with final scores and win probabilities.
2. A table of every idea ever generated (at least 21): name, one-sentence pitch, fun or impact, best score, and status (finalist, cut in round N and why).
3. A short log per round: what was cut, what changed, where the judges disagreed.
4. Your own recommendation and the one thing most likely to make it lose.

After round 3, stop and show me the top 5 and the table. Then wait. When I reply with feedback ("more fun ones", "drop anything with voice", "go deeper on number 3"), treat it as a new constraint, generate replacements with the relevant generators, and run rounds 2 and 3 again. Repeat until I say we're done.
