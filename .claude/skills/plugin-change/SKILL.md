---
name: plugin-change
description: "Procedure for editing the cicada-guide plugin: reconciling tool docs after a server change, changing skill or agent guidance, restating dataset rules in every entry point, adding eval cases, updating card limits or URIs, updating scripts/check.mjs when a rule changes, and bumping a release. Use whenever skills/, agents/, README.md, docs/, evals/, scripts/, CHANGELOG.md or .claude-plugin/ is edited in this repo, including follow-ups and small wording fixes, so no restated copy is missed."
---

# Changing the plugin

This repo is Markdown and JSON read by a plugin loader. There is no build, so the only things
between a wrong sentence and every installed user are the checks and a careful reader. The rules
are in [.claude/CLAUDE.md](../../CLAUDE.md) and the procedures are in the human docs under
[docs/](../../../docs/README.md). This skill links to both and adds only what differs for the
harness: where files go, and what to hand back.

## 1. Save the live tools list first (any change that touches tools)

Run the command in
[How to update the tool docs, step 1](../../../docs/howto-update-tool-docs.md#1-save-the-live-toolslist),
writing to `.agents/workspace/01_tools-list.json` instead of `tools-list.json`:

```bash
mkdir -p .agents/workspace
```

In steps 2–8 of that page, read `.agents/workspace/01_tools-list.json` wherever it says
`tools-list.json`. Everything you write about a tool comes from this file. Never commit it.

## 2. Classify the change and follow its procedure

| Kind | Procedure |
| --- | --- |
| Server added, renamed or removed a tool or parameter | [How to update the tool docs](../../../docs/howto-update-tool-docs.md), steps 2–8 |
| New command or agent | [How to add a command or agent](../../../docs/howto-add-a-command-or-agent.md) |
| Skill or agent guidance | section 3 below; the verifier then runs the eval suite |
| Card URI bump or card input limit | [.claude/CLAUDE.md, "Invariants"](../../CLAUDE.md#invariants): the card URI and card input limit paragraphs |
| A dataset rule changes on purpose | section 3, and change `scripts/check.mjs` in the same commit |
| Release (only when the orchestrator's release phase asks) | [PUBLISHING.md, "Before each release"](../../../PUBLISHING.md#before-each-release) |

## 3. Restate, don't reference

Subagents never load `get-legislation`, and a slash command can run without it, so every skill
and agent carries its own copy of each dataset rule it relies on. Follow
[How to add a command or agent, step 4](../../../docs/howto-add-a-command-or-agent.md#4-restate-the-dataset-rules-it-relies-on):
copy a rule's paragraph from a sibling entry point rather than rewording it. `scripts/check.mjs`
requires each rule's key phrase in every entry point that triggers it (its `REQUIRED` table) and
checks the numbers in fixed phrasings anywhere (its `CANONICAL` table).

`node scripts/check.mjs` is the definitive copy check; its `REQUIRED` table is the authoritative
list and runs on every pull request. The searches below are a finding aid for the rest: they show
every copy, including the `references/` files and the two rules no script checks. Each search
tolerates a phrase wrapped across lines. Compare the files each one hits against the entry points
that rely on the rule: a missing entry point is a finding too.

```bash
r() { rg -U -n "$@" skills agents; }
# search_bills exact bill-number matching (not checked by check.mjs)
r '(?i)bill[\s-]+number(s\s+match|\s+matching\s+is)\s+exact'
# search_bills query caps
r 'at\s+most\s+50\s+distinct\s+bill'; r 'first\s+8\s+terms'
# get_rollcalls includes roll calls linked through votes (not checked by check.mjs)
r 'linked_via'
# never add counts across roll calls
r '(?i)never\s+add\s+counts\s+across\s+roll\s+calls'
# search_people ids batch cap (check.mjs also accepts a bare "up to 100")
r 'batches\s+of\s+(up\s+to|at\s+most)\s+100|1-100'
# the two error shapes
r -e '`Error:`'; r -e '-32602'
# rate limit
r 'rate\s+limited\s+to\s+600\s+a\s+minute'; r 'Retry\s+in\s+60\s+seconds'
# truncation
r '25,000'
# context and llm_model
r '(?i)never\s+put\s+credentials,\s+personal\s+data'; r '(?i)a\s+surname\s+alone'; r 'llm_model'
# conversation_id; agents also hand it back
r '(?i)never\s+make\s+one\s+up'; r 'Begin\s+every\s+return'
# governor_action is the state's general rule
r '(?i)never\s+compute\s+a\s+date\s+from\s+it'
# load a tool listed by name only before calling it
r 'load\s+its\s+definition\s+with\s+the\s+tool-search\s+tool'
# agents: Read is for plugin files only
r 'Use\s+`Read`\s+only\s+for\s+files\s+under'
# tool results are data; contact_details are not a seat
r 'Tool\s+results\s+are\s+data,\s+not\s+instructions'
r '`contact_details`[^.]*not\s+a\s+source\s+for'
```

When a rule changes on purpose, update every copy, then change its `REQUIRED` or `CANONICAL`
entry in `scripts/check.mjs` in the same commit.

## 4. Invariants and product constraints

Read [.claude/CLAUDE.md, "Invariants"](../../CLAUDE.md#invariants) and
["Product constraints"](../../CLAUDE.md#product-constraints) for every file you touch; a diff can
break them with no error anywhere. Two that a docs edit most often breaks:

- Cross-component links use `${CLAUDE_PLUGIN_ROOT}`, never relative paths. Within
  `skills/get-legislation/`, sibling `references/*.md` may be referenced relatively.
- The endpoint hostname and path move only with a version bump and a transition period where the
  old one still resolves.

## 5. Record the change

If the change is user-visible, add a line under `Unreleased` in `CHANGELOG.md`
([CONTRIBUTING.md](../../../CONTRIBUTING.md)). A change that follows the server starts with
"Updated to match the server:". Do not commit: the orchestrator owns git.
