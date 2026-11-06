# Tools registry

Agents and skills reference a tool by its **role**, never by a hard tool name. When the
preferred tool is unavailable, fall back to the alternative. MCP tool names vary by how a server
is connected (a claude.ai connector, a plugin, a project `.mcp.json`), so the names below are
examples: find the current name with tool search rather than assuming the one shown here.

Issue tracking (GitHub Issues) is a project process, not a role tool: its commands are inlined
in the orchestrator's Phase 0 and 4.

Review a row when its tool fails, when a pinned version is bumped, and before each release; set
"Last reviewed" to that date.

| Role | Preferred tool | Alternative (if unavailable) | Status | Last reviewed |
| --- | --- | --- | --- | --- |
| live-tools-list | `node scripts/check-live-tools.mjs` in live mode (no `--file`): it fetches `tools/list` itself and also reads every card resource, which a saved file cannot. Save the list with the curl POST in `plugin-change` (section 1) for the editor and for `--file` re-runs | MCP Inspector CLI: `npx -y @modelcontextprotocol/inspector@2.14.0 --cli https://anthropic.cicada.guide/mcp --transport http --method tools/list` (Node version per its `package.json` `engines`) | active | 2026-11-06 |
| public-server | the plugin's own `guide-public` tools (`mcp__plugin_cicada-guide_guide-public__*`), for checking what a tool returns | the curl POST against `https://anthropic.cicada.guide/mcp` | active | 2026-11-06 |
| plugin-validation | `claude plugin validate --strict` on both manifests, `skills` and `agents` (as in `check.yml`) | none: if the CLI is unavailable, mark the check `NOT_RUN`. The `plugin-dev:plugin-validator` agent may add an opinion, never stand in for it | active | 2026-11-06 |
| plugin-evals | `claude plugin eval` with `--judge-model sonnet` | the promptfoo runner in `promptfoo/` (`docs/howto-run-promptfoo.md`) | active (costs model calls) | 2026-11-06 |
| claude-code-docs | the `claude-code-guide` agent (plugin, skill, agent and eval formats) | WebFetch of code.claude.com docs | active | 2026-11-06 |
| skill-review | the `plugin-dev:skill-reviewer` agent, for a second read of new skill prose | `plugin-verifier` alone | active (optional) | 2026-11-06 |
| github | GitHub MCP, e.g. `list_issues`, `issue_read`, `issue_write`, `pull_request_read`, `list_repository_collaborators` (confirm names with tool search) | `gh` CLI (authenticated) | active | 2026-11-06 |
