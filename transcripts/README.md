# Agent transcripts

Exported Claude Code sessions, rendered to Markdown with
`scripts/render-transcript.py` (from the desktop app's session export;
the terminal `/export` produced an empty file, see AI_LOG row 5).

| File | Session | Covers |
| --- | --- | --- |
| `2026-11-12-setup-research-plan.md` | 12 Nov | setup, research, ADR, plan, step 1 |
| `2026-11-13-build-prototype.md` | 13 Nov | step 2: prototype built with drush (not recorded in docs at the time) |
| `2026-11-19-build-steps-2-12.md` | 16 + 19 Nov | status check; steps 2 (recorded) to 12. Exported during step 12, so the end of step 12 is missing |

Transcripts are checked for secrets before committing; local throwaway
admin passwords printed by `drush site:install` are replaced with
`[redacted]`.
