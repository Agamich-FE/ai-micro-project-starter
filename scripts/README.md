# Scripts

- `test-recipe.sh` — tests the `ls_events` recipe on fresh sites: for each
  profile (default `minimal standard`) it reinstalls the DDEV site (wipes
  the database), applies the recipe twice, runs `recipe-assertions.php`,
  checks `/events`, and on `standard` checks that Tags and the Content
  editor role are unchanged. Stops non-zero on the first failure. Run:
  `scripts/test-recipe.sh [-y] [profile ...]`.
- `recipe-assertions.php` — the checks `test-recipe.sh` runs inside the
  site. Run alone: `ddev drush php:script ../scripts/recipe-assertions.php`.
- `render-transcript.py` — turns a Claude Code session export
  (`transcript.jsonl` from the desktop app's Export zip) into readable
  Markdown for `transcripts/`. Run:
  `python3 -I scripts/render-transcript.py <transcript.jsonl> <out.md>`.
