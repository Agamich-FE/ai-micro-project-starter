"""Render a Claude Code session JSONL export as readable Markdown.

Usage: python3 -I render_transcript.py <transcript.jsonl> <out.md>
Keeps user prompts, assistant replies, tool calls and (truncated) results.
Skips thinking blocks, metadata records and large binary attachments.
"""
import json
import sys

MAX_RESULT = 1500
MAX_INPUT = 1200


def clip(text, limit):
    text = text if isinstance(text, str) else json.dumps(text, ensure_ascii=False)
    if len(text) > limit:
        return text[:limit] + f"\n… [truncated {len(text) - limit} chars]"
    return text


def result_text(content):
    if isinstance(content, str):
        return content
    parts = []
    for item in content or []:
        if item.get("type") == "text":
            parts.append(item.get("text", ""))
        else:
            parts.append(f"[{item.get('type')} omitted]")
    return "\n".join(parts)


def tool_input(name, data):
    if name == "Bash":
        desc = data.get("description", "")
        return f"_{desc}_\n\n```bash\n{clip(data.get('command', ''), MAX_INPUT)}\n```"
    if name in ("Write",):
        return f"`{data.get('file_path')}`\n\n```\n{clip(data.get('content', ''), MAX_INPUT)}\n```"
    if name == "Edit":
        return (f"`{data.get('file_path')}`\n\n```diff\n- "
                + clip(data.get("old_string", ""), 400).replace("\n", "\n- ")
                + "\n+ " + clip(data.get("new_string", ""), MAX_INPUT).replace("\n", "\n+ ")
                + "\n```")
    return f"```json\n{clip(json.dumps(data, ensure_ascii=False, indent=1), MAX_INPUT)}\n```"


def main(src, dst):
    out = ["# Session transcript", ""]
    for line in open(src, encoding="utf-8"):
        rec = json.loads(line)
        kind = rec.get("type")
        if kind not in ("user", "assistant"):
            continue
        msg = rec.get("message") or {}
        content = msg.get("content")
        if kind == "user" and isinstance(content, str):
            out += ["---", "", "## User", "", content.strip(), ""]
            continue
        for block in content if isinstance(content, list) else []:
            btype = block.get("type")
            if btype == "text" and kind == "assistant":
                out += ["### Assistant", "", block["text"].strip(), ""]
            elif btype == "text" and kind == "user":
                out += ["## User", "", block["text"].strip(), ""]
            elif btype == "tool_use":
                name = block.get("name", "")
                out += [f"**Tool call: `{name}`**", "", tool_input(name, block.get("input", {})), ""]
            elif btype == "tool_result":
                text = clip(result_text(block.get("content")), MAX_RESULT)
                out += ["<details><summary>Result</summary>", "", "```", text, "```", "", "</details>", ""]
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
