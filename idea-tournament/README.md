# Idea tournament (HackUMass XIV)

Research from an AI-run idea tournament held early Saturday Nov 14, 2026, to choose what to build. It generated 38 project ideas (including a teammate's seed idea), attacked them with judge agents over three rounds, and ranked a final five.

**Start with [ideas.md](ideas.md).** It has the top 5 as full idea cards, a table of every idea with its score and why it was cut, a log of each round, and a recommendation.

## Result in brief

| Rank | Idea | Pitch | Final score /40 |
|------|------|-------|-----------------|
| 1 | Say It Right | Say your name once and get a QR sticker that teaches anyone to say it. | 29.5 |
| 2 | Heckle | Rehearse your pitch to animated listeners built from real non-technical people you surveyed. | 28 |
| 3 | Elastic | Hear a live speaker 15% slower; it catches up by shortening their pauses. | 26 |
| 4 | Proven Guard | You play the hacker controlling an AI banking assistant; a proven checker never lets a forbidden payment through. | 24.5 |
| 5 | Monkey's Paw | A genie grants your wish in the worst way that still matches your exact words. | 20.5 |

First and second are effectively tied. The seed idea (verified AI code) was cut in round 2 as a standalone project; its engine lives on in Proven Guard.

## Read this before trusting the numbers

- Every score comes from language-model agents role-playing judges. Nothing has been built or shown to a person. The rankings separate plausible from implausible; they do not separate first from second.
- Prior-art checks were web searches by agents, and at least one was wrong (it reported nothing like Elastic exists; NHK built real-time speech-rate converters in the 1990s). Search again before telling a judge an idea is new.
- Agents were told about 28 to 30 build hours, one RTX 3060 Ti (8 GB) that may not be at the table, and the Claude API only. Those were assumptions.
- This folder is ideation only. It contains no project code.

## What is in this folder

| Path | What it is |
|------|------------|
| [ideas.md](ideas.md) | The main output: top 5 cards, full table, round logs, recommendation. |
| [brief.md](brief.md) | The prompt that defined the tournament: situation, what has won before, the loop, the agents. |
| [rounds/round1-cards-35-ideas.md](rounds/round1-cards-35-ideas.md) | Digest of all 35 round 1 ideas, as the judges saw them. |
| [rounds/round1-pitches-for-gut-check.md](rounds/round1-pitches-for-gut-check.md) | Name and one-sentence pitch only, as shown to the non-technical panel. |
| [rounds/round1-evidence-panel-and-prior-art.md](rounds/round1-evidence-panel-and-prior-art.md) | Gut-check tallies and prior-art findings for all 35. |
| [rounds/round2-cards-rewrites-and-merges.md](rounds/round2-cards-rewrites-and-merges.md) | The 11 rewritten survivors and 3 merges, with what changed and which objections were rejected. |
| [rounds/round3-cards-as-judged.md](rounds/round3-cards-as-judged.md) | The five finalist cards exactly as the final judges saw them (ideas.md has the versions updated afterwards). |
| [raw/](raw/) | Verbatim final reports from every agent: 6 generators, 3 scouts, 5 gut-check panelists, 4 judges for rounds 1 and 2, and 4 fresh judges for round 3. |

## How it was run

1. **Round 0, generate.** Six generator agents, one lens each (seed variants, new ways to sense or interact, pure fun, people in the room, recent research, sponsor fits), six ideas each. Merged to 35.
2. **Round 1, wide cut.** Three scouts searched for existing products and checked cited papers. Five non-technical "tired judge" agents saw only name and pitch. Four harsh judges (Best Overall floor judge, sponsor engineer, accessibility and user-research practitioner, CS faculty) scored everything. Top 10 kept, plus the seed.
3. **Round 2, rewrite.** Each survivor was rewritten against its criticism, three merges proposed by the judges were added, and the same four judges said whether their objection was actually fixed. Top 5 kept.
4. **Round 3, final.** Four fresh judges with the same personas and no memory of earlier rounds ranked the five head to head.
