// A promptfoo provider that runs one prompt through Claude Code (via the Claude Agent SDK) with
// this checkout loaded as a plugin, the way `claude plugin eval` does, and hands back what the
// graders in ../evals/ read: the final message as `output`, and the whole session in `metadata`.
//
// config:
//   plugin       true loads this checkout (the with-plugin arm); false runs without it.
//   allowTools   Operator grants on top of the read-only set, like `claude plugin eval
//                --allow-tools`. Exact names, or a prefix ending in `*`.
//   model        Model for the session under test. Unset uses Claude Code's default.
//   judge        true makes this a grading provider instead: one turn, no tools, no plugin.
//
// Per-case settings (max_turns, timeout_seconds, append_system_prompt, model) arrive as vars from
// cases.mjs.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "@anthropic-ai/claude-agent-sdk";

export const PLUGIN_ROOT = fileURLToPath(new URL("..", import.meta.url));

// The built-in tools `claude plugin eval` allows without a grant. AskUserQuestion is left out:
// nobody can answer it in an unattended run, so a question has to go in the reply.
export const READ_ONLY_TOOLS = [
  "Read", "Glob", "Grep", "NotebookRead", "Skill", "Agent", "TodoWrite",
  "TaskCreate", "TaskGet", "TaskList", "TaskUpdate", "TaskStop",
];

// How many trace lines an `llm` judge with `focus: trace` sees from each end, as in
// `claude plugin eval`.
const JUDGE_TRACE_EDGE = 12;

const JUDGE_SYSTEM_PROMPT =
  "You grade another assistant's work against a rubric. Use only the material in the request. " +
  "Answer in exactly the format the request asks for, with nothing before or after it.";

// promptfoo hands a grading provider its rubric prompt as a JSON chat array. The judge here is a
// single Claude Code turn, so the messages become one prompt.
export function flattenChat(prompt) {
  let parsed;
  try {
    parsed = JSON.parse(prompt);
  } catch {
    return String(prompt);
  }
  if (!Array.isArray(parsed) || !parsed.every((m) => m && typeof m.role === "string")) return String(prompt);
  return parsed
    .map((m) => {
      const text = typeof m.content === "string"
        ? m.content
        : (Array.isArray(m.content) ? m.content : []).map((part) => part?.text ?? "").join("");
      return m.role === "system" ? text : `${m.role.toUpperCase()}:\n${text}`;
    })
    .join("\n\n");
}

export function toolAllowed(name, allowed) {
  return allowed.some((rule) => (rule.endsWith("*") ? name.startsWith(rule.slice(0, -1)) : name === rule));
}

export function judgeTrace(lines) {
  if (lines.length <= 2 * JUDGE_TRACE_EDGE) return lines.join("\n");
  const omitted = lines.length - 2 * JUDGE_TRACE_EDGE;
  return [
    ...lines.slice(0, JUDGE_TRACE_EDGE),
    `[${omitted} messages omitted]`,
    ...lines.slice(-JUDGE_TRACE_EDGE),
  ].join("\n");
}

// Every tool call in the session, the main thread's and each subagent's, with its result.
export function collectToolCalls(messages) {
  const calls = new Map();
  for (const msg of messages) {
    const content = msg.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (msg.type === "assistant" && block.type === "tool_use") {
        calls.set(block.id, {
          name: block.name,
          input: block.input,
          output: undefined,
          isError: false,
          parentToolUseId: msg.parent_tool_use_id ?? null,
        });
      } else if (msg.type === "user" && block.type === "tool_result" && calls.has(block.tool_use_id)) {
        const call = calls.get(block.tool_use_id);
        call.output = block.content;
        call.isError = block.is_error ?? false;
      }
    }
  }
  return [...calls.values()];
}

export function summarize(messages, startedAt) {
  const result = messages.findLast((m) => m.type === "result");
  const trace = messages.filter((m) => m.type === "assistant" || m.type === "user" || m.type === "result")
    .map((m) => JSON.stringify(m));
  const usage = result?.usage ?? {};
  const prompt = (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0);
  const completion = usage.output_tokens ?? 0;
  return {
    output: typeof result?.result === "string" ? result.result : "",
    cost: result?.total_cost_usd,
    tokenUsage: { prompt, completion, total: prompt + completion },
    metadata: {
      trace: trace.join("\n"),
      judgeTrace: judgeTrace(trace),
      toolCalls: collectToolCalls(messages),
      numTurns: result?.num_turns,
      resultSubtype: result?.subtype ?? "none",
      durationMs: Date.now() - startedAt,
      permissionDenials: result?.permission_denials ?? [],
    },
  };
}

export default class CicadaPluginProvider {
  constructor(options = {}) {
    this.config = options.config ?? {};
    // Both arms load this one file, so the id names the arm to keep them apart.
    const arm = this.config.plugin ? "with-plugin" : "without-plugin";
    this.providerId = this.config.judge ? "cicada-guide:judge" : `cicada-guide:${arm}`;
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context) {
    return this.config.judge ? this.grade(prompt) : this.run(prompt, context?.vars ?? {});
  }

  async run(prompt, vars) {
    const grants = this.config.allowTools ?? [];
    const allowed = [...READ_ONLY_TOOLS, ...grants];
    const builtins = allowed.filter((t) => !t.startsWith("mcp__") && !t.includes("*"));
    const maxTurns = Number(vars.max_turns ?? 10);
    const timeoutMs = Number(vars.timeout_seconds ?? 300) * 1000;
    const model = vars.model || this.config.model;

    const cwd = await mkdtemp(join(tmpdir(), "cicada-promptfoo-"));
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);
    const startedAt = Date.now();
    const messages = [];
    try {
      const session = query({
        prompt,
        options: {
          cwd,
          abortController,
          maxTurns,
          ...(model ? { model } : {}),
          // No user, project or local settings: the only plugin in the session is the one under
          // test, and no CLAUDE.md from the machine running the eval reaches it.
          settingSources: [],
          plugins: this.config.plugin ? [{ type: "local", path: PLUGIN_ROOT }] : [],
          skills: "all",
          tools: builtins,
          // Every call goes through this check, so nothing outside the read-only set and the
          // grants runs, and nothing waits on a permission prompt no one will answer.
          canUseTool: async (name) =>
            toolAllowed(name, allowed)
              ? { behavior: "allow" }
              : { behavior: "deny", message: `${name} is not available in this eval run.` },
          ...(vars.append_system_prompt
            ? { systemPrompt: { type: "preset", preset: "claude_code", append: vars.append_system_prompt } }
            : {}),
        },
      });
      for await (const msg of session) messages.push(msg);
    } catch (err) {
      const partial = summarize(messages, startedAt);
      const reason = abortController.signal.aborted ? `timed out after ${timeoutMs / 1000} s` : String(err);
      return { ...partial, error: `Run failed: ${reason}` };
    } finally {
      clearTimeout(timer);
      await rm(cwd, { recursive: true, force: true });
    }

    const response = summarize(messages, startedAt);
    // Hitting max_turns is a run error in `claude plugin eval`, not a graded reply.
    if (response.metadata.resultSubtype !== "success") {
      return { ...response, error: `Run ended with ${response.metadata.resultSubtype}` };
    }
    return response;
  }

  async grade(prompt) {
    const cwd = await mkdtemp(join(tmpdir(), "cicada-promptfoo-judge-"));
    const messages = [];
    try {
      const session = query({
        prompt: flattenChat(prompt),
        options: {
          cwd,
          maxTurns: 1,
          model: this.config.model ?? "sonnet",
          settingSources: [],
          tools: [],
          systemPrompt: JUDGE_SYSTEM_PROMPT,
        },
      });
      for await (const msg of session) messages.push(msg);
    } catch (err) {
      return { error: `Judge failed: ${err}` };
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
    const { output, cost, tokenUsage, metadata } = summarize(messages, Date.now());
    if (metadata.resultSubtype !== "success") return { error: `Judge ended with ${metadata.resultSubtype}` };
    return { output, cost, tokenUsage };
  }
}
