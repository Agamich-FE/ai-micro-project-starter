# AI log

> Record how you worked with AI as you go — not at the end. Specific and
> honest entries are far more valuable than polished ones.

## Tools used

| Tool | Mode / model | Used for |
| --- | --- | --- |
| Claude Code (desktop app) | agent, Opus 5.5 | setup, research spike, ADR and plan drafts, dependencies, transcript export |
| Claude Code (terminal CLI) | Sonnet 4.6 | only an accidental, empty `/export` |

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

### 2026-11-12 — plan

**Prompt:**

```
Start the plan
```

**Result:** The agent wrote PLAN.md:
- a content model table
- 12 steps
- a verification table
- a risks section
- 3 decisions for me

The plan is committed unchanged (`e78fe14`). My review is in a separate
commit (`48ed374`).

### 2026-11-12 — build step 1 (dependencies)

**Prompt:**

```
Approve, start step 1
```

**Result:** The agent added, each in its own commit:
- pathauto 1.16
- coder 9 + `phpcs.xml.dist`
- Playwright 1.65 + `playwright.config.ts`, with a setup test that
  passes against the DDEV site

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
| 5 | Told me to "run `/export`" to save the transcript; I ran it in a separate terminal CLI session, which exported an empty conversation (header only) | The exported file had only the Claude Code banner | The agent used the desktop app's session export instead and rendered the JSONL to Markdown with `scripts/render-transcript.py` |
| 6 | The agent's own plan put sample event dates "around 2026-11", with an optional past event | My plan review: the dates would expire within weeks and empty the upcoming list | Changed to 2027–2028 dates, none in the past (PLAN.md step 7) |
| 7 | Nearly used the core `sdc` module for the Event card component | Checked `core/modules/sdc/sdc.info.yml`: `lifecycle: obsolete`, `hidden: true`; SDC is part of core since 10.3 | Plan step 6 says not to install `sdc` |

## Manual work

| What I did by hand | Why not with the agent |
| --- | --- |
| Wrote the "My decision" section of ADR-001 (`ae67e33`) | The task requires the decision in my own words; I based it on an example structure the agent suggested and on RESEARCH.md |
| Wrote "My changes to the agent's plan" in PLAN.md (`48ed374`) | Reviewing the plan is my job as architect; the agent listed weak spots, I chose which ones to adopt |

## Context management

- Rules file changes and why: CLAUDE.md filled with the stack, commands
  and recipe rules after setup. Pitfalls are added as they are found.
- When I started a fresh session or reset context, and why: <…>

## Verification

- Tests/checks run and results:
  - site responds with HTTP 200 after install
  - re-apply experiment (RESEARCH.md §4)
  - Playwright setup test passes against https://ls-events.ddev.site
  - `phpcs -i` lists the Drupal and DrupalPractice standards
- Test I deliberately broke to prove it works: <…>
- Diffs I reviewed carefully: <…>
