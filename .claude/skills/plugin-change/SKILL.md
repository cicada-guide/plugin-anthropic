---
name: plugin-change
description: "Procedure for editing the cicada-guide plugin: reconciling tool docs after a server change, changing skill or agent guidance, restating dataset rules in every entry point, adding eval cases, updating card limits or URIs, and bumping a release. Use whenever skills/, agents/, README.md, docs/, evals/, CHANGELOG.md or .claude-plugin/ is edited in this repo, including follow-ups and small wording fixes, so no restated copy is missed."
---

# Changing the plugin

This repo is Markdown and JSON read by a plugin loader. There is no build, so the only things
between a wrong sentence and every installed user are the checks and a careful reader. The
rules are in `.claude/CLAUDE.md` ("Invariants", "Product constraints", "Conventions"); this
skill is the procedure for applying them to a given change.

## 1. Save the live tools list first (any change that touches tools)

```bash
mkdir -p _agents_workspace
E=https://anthropic.cicada.guide/mcp
H=(-H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream'
   -H 'MCP-Protocol-Version: 2025-06-18')
curl -s "${H[@]}" "$E" -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' |
  sed -n 's/^data: //p' > _agents_workspace/01_tools-list.json
```

Everything you write about a tool comes from this file. Never commit it.

## 2. Classify the change and follow its procedure

| Kind | Procedure |
| --- | --- |
| Server added, renamed or removed a tool or parameter | `docs/howto-update-tool-docs.md`, steps 2–8 |
| New command or agent | `docs/howto-add-a-command-or-agent.md` |
| Skill or agent guidance | section 3 below, then the eval run |
| Card URI bump | `references/tool-reference.md`, `docs/reference-cards.md`, `CHANGELOG.md`; the PR merges only once the live list links the new URI |
| Card input limit (e.g. `show_bill`'s 120-character `headline`) | grep the repo for the number; update every copy (the four entry points, `tool-reference.md`, `workflows.md`, the `docs/` pages, the changelog). No script checks these |
| Release | `PUBLISHING.md`, "Before each release" |

## 3. Restate, don't reference

Subagents never load `get-legislation`, and a slash command can run without it, so every skill
and agent carries its own copy of each dataset rule it relies on. When one changes, find and
update every copy:

| Rule | Grep for |
| --- | --- |
| `search_bills` exact bill-number matching and query caps | `search_bills`, `chamber prefix`, `max 50`, `max 500` |
| `get_rollcalls` includes vote-linked roll calls | `get_rollcalls` |
| Never add counts across roll calls | `across roll calls` |
| `search_people` 100-id batch cap | `batches of up to 100`, `1-100` |
| The two error shapes | `isError`, `-32602` |
| 600 requests a minute | `600` |
| 25,000-character truncation | `25,000` |
| `context`: no credentials, personal data or names; `llm_model`: a model id or `"unknown"` | `llm_model` |
| Pass back the `conversation_id` an earlier result returned; never make one up | `conversation_id` |
| `governor_action` is the state's general rule; never compute a date from it | `governor_action` |
| Load a tool listed by name only before calling it | `listed by name`, `tool-search tool` |
| Agents: `Read` is for `${CLAUDE_PLUGIN_ROOT}` files only | `CLAUDE_PLUGIN_ROOT` in `agents/` |

These patterns matched the current copies on 2026-11-06; a copy reworded since may need a
broader search. Compare the list of files each pattern hits against the entry points that rely
on the rule: a missing entry point is a finding too.

```bash
grep -rn '<pattern>' skills agents
```

The numbers in each restated rule are checked by `scripts/check.mjs`; the wording is not. If a
rule changes on purpose, change `scripts/check.mjs` in the same commit.

## 4. Invariants a diff can silently break

- Version is three fields in two files (`.claude-plugin/plugin.json`; `metadata.version` and
  `plugins[0].version` in `.claude-plugin/marketplace.json`). Bump only on a release.
- Cross-component links use `${CLAUDE_PLUGIN_ROOT}`, never `../`.
- Fully qualified tool names keep the `guide-public` segment:
  `mcp__plugin_cicada-guide_guide-public__<tool>`.
- The endpoint hostname and path in `.mcp.json` never change outside a planned migration.
- Frontmatter `description:` stays on one line.
- No tool count in prose; no phrase that critiques the dataset; no mention of a bill synopsis.
- Call examples keep a flat `arguments` object; parameter tables keep the
  `| Parameter | Type | Notes |` shape under a `###` heading naming the tool.

## 5. Record the change

Add a line under `Unreleased` in `CHANGELOG.md`. A change that follows the server starts with
"Updated to match the server:". Commit subjects are plain sentence case with no prefix.
