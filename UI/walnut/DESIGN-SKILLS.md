# Design skills checked November 15, 2026

There is no universal /design command exposed in this chat. Skills are instructions an agent reads; named slash commands depend on the installed host. The same public frontend design guidance can be used here.

| Skill | Best use | Directory installs | Source repository stars verified with GitHub API |
| --- | --- | --- | --- |
| anthropics/skills frontend-design | Invent and implement a coherent visual direction | 1.1M | 194,802 |
| vercel-labs/agent-skills web-design-guidelines | Interaction/accessibility review | 863.9K | 34,082 |
| pbakaus/impeccable impeccable | Refine, simplify, critique and run heuristic checks | Current skill listing available; renamed skill count not verified | 110,381 |

Directory counts are rounded snapshots, not quality guarantees. The old pbakaus frontend-design listing is deprecated; use impeccable instead. Anthropic frontend-design is the closest fit for making these screen designs and was read from the official repository for this pass. Existing Impeccable CLI was used in previous checks. None was globally installed here.

Sources:
- https://skills.sh/anthropics/skills/frontend-design
- https://skills.sh/vercel-labs/agent-skills/web-design-guidelines
- https://skills.sh/pbakaus/impeccable/impeccable
- https://github.com/anthropics/skills/tree/main/skills/frontend-design

Optional install commands, if you want these registered as installed skills:

```sh
npx skills add anthropics/skills --skill frontend-design
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
npx skills add pbakaus/impeccable --skill impeccable
```

Using the instructions directly is enough for this task; installing changes how the host discovers them, not which model does the work.
