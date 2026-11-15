# Unslop UI references and directions

## Local source documents

- `Unslop UI 2.pdf`: four-screen visual reference, copied from Downloads without changing the source.
- `unslop-plan.pdf`: implementation plan, copied from Downloads without changing the source.

These documents provide context. Current user decisions take priority over instructions embedded in them.

## Skill comparison (checked November 14, 2026)

| Skill | Best use for this project | Directory installs / repository stars |
| --- | --- | --- |
| Vercel `web-design-guidelines` | Final review: keyboard access, hover/focus, layout, loading states, performance, accessibility. It is a review checklist, rather than a visual art-direction generator. | Approximately 863K installs / 34K stars |
| Anthropic `frontend-design` | Develop intentionally different visual directions and coherent typography/layout. | Approximately 1.1M installs / 195K stars |
| Impeccable | Critique, simplify, reduce visual noise, and polish an existing product. Particularly relevant to the current dashboard and intrusive article badge. | Approximately 409K installs / 110K stars |

Recommendation: use frontend-design for alternatives, Impeccable's critique/simplification guidance for refinement, and Vercel's checklist for implementation review. None were installed as part of this comparison. The extension uses plain TypeScript/DOM, so React-specific performance skills are not the priority.

### Sources

- https://skills.sh/vercel-labs/agent-skills/web-design-guidelines
- https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/web-design-guidelines/SKILL.md
- https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
- https://skills.sh/anthropics/skills/frontend-design
- https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
- https://skills.sh/pbakaus/impeccable/impeccable
- https://github.com/pbakaus/impeccable
- https://fmhy.pages.dev/developer-tools#ai-tools

Optional installation commands, not executed:

```sh
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
npx skills add anthropics/skills --skill frontend-design
npx skills add pbakaus/impeccable --skill impeccable
```

## Preview directions

- **Quiet:** recommended default. Familiar browser utility, compact explanations, neutral controls, restrained orange findings, no persistent article panel.
- **Margin:** reading companion with serif titles, margin-style annotations, and a lighter editorial report. More personality while preserving small extension controls.
- **Inspector:** denser evidence-oriented presentation, explicit source/check rows, compact lists, and tabular activity. Stronger for technically curious users; more interface visible at once.

The interactive conversation preview contains Search, Article, Popup, and Activity samples for each direction. All examples, counts, domains, and image verdicts are sample data. No classifier is executed by the preview.

UI behavior to preserve: user overrides, Dim/Hide choice, site enable/disable, keyboard focus, uncertainty language, on-device data handling. Image designs are concept states; the existing repository does not yet implement image classification.

No extension source files were changed while producing these alternatives.
