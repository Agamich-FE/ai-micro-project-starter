# Scripts

Put helper scripts here (sample content generation, token conversion,
test runners). Document each script's purpose in one line below.

- `render-transcript.py` — turns a Claude Code session export
  (`transcript.jsonl` from the desktop app's Export zip) into readable
  Markdown for `transcripts/`. Run:
  `python3 -I scripts/render-transcript.py <transcript.jsonl> <out.md>`.
