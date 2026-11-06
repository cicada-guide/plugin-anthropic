# Tools registry

Agents and skills reference a tool by its **role**, never by a hard tool name. When the
preferred tool is unavailable, fall back to the alternative.

Issue tracking (GitHub Issues) is a project process, not a role tool: its commands are inlined
in the orchestrator's Phase 0 and 4.

| Role | Preferred tool | Alternative (if unavailable) | Status | Last reviewed |
| --- | --- | --- | --- | --- |
| live-tools-list | the curl POST in `plugin-change` (section 1), then `node scripts/check-live-tools.mjs --file` | MCP Inspector CLI: `npx -y @modelcontextprotocol/inspector@2.14.0 --cli https://anthropic.cicada.guide/mcp --transport http --method tools/list` (Node ≥ 22.23.4) | active | 2026-11-06 |
| public-server | the plugin's own `guide-public` tools (`mcp__plugin_cicada-guide_guide-public__*`), for checking what a tool returns | the curl POST against `https://anthropic.cicada.guide/mcp` | active | 2026-11-06 |
| plugin-validation | `claude plugin validate --strict` on both manifests, `skills` and `agents` (as in `check.yml`) | the `plugin-dev:plugin-validator` agent | active | 2026-11-06 |
| plugin-evals | `claude plugin eval` with `--judge-model sonnet` | the promptfoo runner in `promptfoo/` (`docs/howto-run-promptfoo.md`) | active (costs model calls) | 2026-11-06 |
| claude-code-docs | the `claude-code-guide` agent (plugin, skill, agent and eval formats) | WebFetch of code.claude.com docs | active | 2026-11-06 |
| skill-review | the `plugin-dev:skill-reviewer` agent, for a second read of new skill prose | `plugin-verifier` alone | active (optional) | 2026-11-06 |
| github | GitHub MCP (`mcp__github__*`: PRs, issues, Actions runs) | `gh` CLI (authenticated) | active | 2026-11-06 |
