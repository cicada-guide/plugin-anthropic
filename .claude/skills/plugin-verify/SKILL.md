---
name: plugin-verify
description: "Verification procedure for a cicada-guide plugin change: scripts/check.mjs, scripts/check-live-tools.mjs against the live or a saved tools/list, claude plugin validate --strict, comparison of every restated tool list, dataset rule and card limit, and the eval suite with --judge-model sonnet after a skill or agent change. Use before any plugin PR, when re-checking a fix, after the nightly live-tools run fails, or when asked to verify, check or QA the plugin."
---

# Verifying a plugin change

The scripts catch the mechanical invariants. They cannot tell whether two copies of a rule say
the same thing, whether a parameter's type or limit changed, or whether Claude follows the new
guidance. Those three are this skill's job.

## 1. Run the checks

| Check | Command | When |
| --- | --- | --- |
| Offline invariants | `node scripts/check.mjs` | always |
| Docs vs the server | `node scripts/check-live-tools.mjs` (live), or `--file _agents_workspace/01_tools-list.json` | always; exit 1 is a mismatch, exit 2 a fetch error |
| Manifest and component schema | `claude plugin validate --strict .claude-plugin/plugin.json`, then the same for `marketplace.json`, `skills` and `agents` (as `check.yml` does) | when manifests, skills or agents changed and the CLI is present |
| Server up | `curl -s https://anthropic.cicada.guide/health` | when the live check fails |

Read `.github/workflows/check.yml` for the exact validate invocations CI uses, and match them.

## 2. Compare restated facts against the server and each other

| Fact | Copies | Compare against |
| --- | --- | --- |
| Tool list | `README.md` Tools table, `skills/get-legislation/SKILL.md` Tool selection, `references/tool-reference.md` | the saved `tools/list`, never each other |
| A touched tool's parameters | its `tool-reference.md` table and every call example | the schema: names, types, `max`, defaults, required |
| Tools without `response_format` | `README.md`, `references/project-settings.md`, `cicada-guide.local.md.example`, the tool reference | `jq -r '.result.tools[] | select(.inputSchema.properties.response_format == null) | .name'` |
| Card URIs | `tool-reference.md`, `docs/reference-cards.md`, `CHANGELOG.md` | the `_meta` URIs in the saved list |
| Card limits (`headline` 120) | the entry points, `tool-reference.md`, `workflows.md`, `docs/` | the schema's `maxLength` |
| Each dataset rule the diff touched | every `skills/*/SKILL.md` and `agents/*.md` carrying it (see `plugin-change`, section 3) | each other, word for word on the numbers |

A copy that lags is a finding even when the scripts pass.

## 3. Run the evals (skills or agents changed)

```bash
claude plugin eval . --trust-plugin --allow-real-servers \
  --allow-tools "mcp__plugin_cicada-guide_guide-public__*" ToolSearch \
  --judge-model sonnet --threshold 0.8
```

- Always `--judge-model sonnet`; the small default judge has failed correct answers.
- Each run and grader is a model call on the maintainer's account; `--ablation none` halves the
  cost. If the brief sets no budget, run only the cases whose entry point changed
  (`docs/howto-verify-a-change.md`, section 5, says what each case measures) and say so.
- Read the `WITH` column against the threshold. Results land in `evals/results/` (ignored).
- If `claude plugin eval` is not available here, mark it `not run` and give the command.

## 4. Write the report

`_agents_workspace/04_plugin-verifier_report.md`:

```markdown
issue: #N
server list: live | saved (<timestamp>)

## Checks
| Check | Command | Ran | Result |
| --- | --- | --- | --- |

## Copies compared
- <fact>: <files>: agree | disagree (finding n)

## Findings
1. [severity] file:line: what it says, what the server or the other copy says

VERDICT: PASS | FAIL
```
