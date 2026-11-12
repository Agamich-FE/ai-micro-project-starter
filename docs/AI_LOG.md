# AI log

> Record how you worked with AI as you go — not at the end. Specific and
> honest entries are far more valuable than polished ones.

## Tools used

| Tool | Mode / model | Used for |
| --- | --- | --- |
| Claude Code (desktop app) | agent, Opus 5.5 | setup, research spike, ADR draft |

## Key prompts

### 2026-11-12 — setup

**Prompt:**

```
Please check the project and PDF files with all requirements and rules.
Describe what I should do step by step. What the final result I need to do.
```

then: `Yes, start step 1`

**Result:** The agent wrote a step-by-step guide. It then:
- created the DDEV project `ls-events`
- installed Drupal 11.4.12 and Drush 13.8 with the standard profile
- filled in CLAUDE.md
- made 4 small commits

### 2026-11-12 — research

**Prompt:**

```
Start research spike
```

**Result:** The agent:
- read the 11.4 core source for the recipe runner, config actions,
  default content and test tooling
- fetched the official docs
- tested re-apply behaviour with two throwaway recipes

Output: [RESEARCH.md](RESEARCH.md) and a draft of
[ADR-001](ADR-001.md). The decision is left for me.

## Recipe lifecycle in my own words

<Write after reading RESEARCH.md section 1 and the official docs.
Required by the task: install → config import → config actions → default
content.>

## Where the AI was wrong or misleading

| # | What the AI said or did | How I noticed | How I verified / fixed it |
| --- | --- | --- | --- |
| 1 | Ran `ddev composer create-project` in the non-empty starter folder | DDEV refused: "composer create-project needs to be run on a clean/empty project" | Moved starter files out, created the project, moved them back |
| 2 | Passed `-y` to `composer create-project` (that is a Drush flag) | Composer error: `The "-y" option does not exist` | Re-ran without it |
| 3 | Assumed `.ddev/` would be committed | `git add .ddev` said it was ignored; `git check-ignore -v` pointed at `~/.gitignore_global` | Added `!/.ddev/` to the project `.gitignore` |
| 4 | Official docs summary (WebFetch) couldn't answer "what happens on re-apply" (it is listed as an open question in the initiative docs) | Gap in the docs | Tested with throwaway recipes: config actions on config the recipe ships break the 2nd apply under default `strict: true` (RESEARCH.md §4) |

## Manual work

| What I did by hand | Why not with the agent |
| --- | --- |
| | |

## Context management

- Rules file changes and why: CLAUDE.md filled with the stack, commands
  and recipe rules after setup. Pitfalls are added as they are found.
- When I started a fresh session or reset context, and why: <…>

## Verification

- Tests/checks run and results:
  - site responds with HTTP 200 after install
  - re-apply experiment (RESEARCH.md §4)
- Test I deliberately broke to prove it works: <…>
- Diffs I reviewed carefully: <…>
