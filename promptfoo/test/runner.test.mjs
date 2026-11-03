// Offline checks for the promptfoo runner: no model calls, no network. Run with `npm test` in
// promptfoo/.

import assert from "node:assert/strict";
import { test } from "node:test";
import cases, { scoredWithoutPlugin } from "../cases.mjs";
import { regex, toolOrder, toolUsed } from "../graders.mjs";
import { flattenChat, judgeTrace, summarize, toolAllowed } from "../provider.mjs";

// A session shaped like the Agent SDK's messages: a tool call, its result, an answer, a card call
// and a short closing note.
const messages = [
  {
    type: "assistant",
    message: { content: [{ type: "tool_use", id: "t1", name: "mcp__plugin_cicada-guide_guide-public__search_bills", input: { state: "AL", bill: "HB 1", context: "bill lookup" } }] },
    parent_tool_use_id: null,
  },
  { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "HB1 Sweet Grown Alabama" }] }, parent_tool_use_id: null },
  { type: "assistant", message: { content: [{ type: "text", text: "HB 1 funds Sweet Grown Alabama. The concurrence vote was 102-1." }] }, parent_tool_use_id: null },
  {
    type: "assistant",
    message: { content: [{ type: "tool_use", id: "t2", name: "mcp__plugin_cicada-guide_guide-public__show_bill", input: { headline: "Creates a seafood dealer fee" } }] },
    parent_tool_use_id: null,
  },
  { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t2", content: "card" }] }, parent_tool_use_id: null },
  { type: "assistant", message: { content: [{ type: "text", text: "The card is above." }] }, parent_tool_use_id: null },
  { type: "result", subtype: "success", result: "The card is above.", num_turns: 4, total_cost_usd: 0.01, usage: { input_tokens: 10, output_tokens: 5 } },
];
const response = summarize(messages, Date.now());
const ctx = (config) => ({ config, providerResponse: response });

test("every case loads, once per arm, with only graders the runner supports", () => {
  const tests = cases();
  const names = new Set(tests.map((t) => t.vars.case));
  assert.ok(names.size >= 1);
  for (const name of names) {
    const arms = tests.filter((t) => t.vars.case === name).map((t) => t.metadata.arm).sort();
    assert.deepEqual(arms, ["with-plugin", "without-plugin"].filter((arm) => arms.includes(arm)));
    assert.ok(arms.includes("with-plugin"), `${name} has no with-plugin test`);
  }
  for (const t of tests) {
    assert.ok(t.vars.prompt.length > 0, `${t.description} has an empty prompt`);
    for (const a of t.assert) assert.ok(["javascript", "llm-rubric"].includes(a.type), `${t.description}: ${a.type}`);
  }
});

test("the baseline arm leaves out what claude plugin eval excludes", () => {
  assert.equal(scoredWithoutPlugin({ type: "regex", arm: "with-only" }), false);
  assert.equal(scoredWithoutPlugin({ type: "tool_used", tool: "Skill" }), false);
  assert.equal(scoredWithoutPlugin({ type: "tool_used", tool: "Skill", arm: "both" }), true);
  assert.equal(scoredWithoutPlugin({ type: "llm" }), true);
  const baseline = cases().find((t) => t.vars.case === "bill-brief" && t.metadata.arm === "without-plugin");
  if (baseline) assert.ok(!baseline.assert.some((a) => a.metric === "exact-bill-lookup"));
});

test("the output is the final message and the trace has one JSON message per line", () => {
  assert.equal(response.output, "The card is above.");
  const lines = response.metadata.trace.split("\n");
  assert.equal(lines.length, messages.length);
  for (const line of lines) JSON.parse(line);
  assert.equal(response.metadata.toolCalls.length, 2);
  assert.equal(response.metadata.toolCalls[0].output, "HB1 Sweet Grown Alabama");
});

test("regex graders read the target they name", () => {
  const assistantText = '^\\{"type":"assistant"[^\\n]*"type":"text","text":"[^\\n]*Sweet Grown Alabama';
  assert.equal(regex(response.output, ctx({ pattern: assistantText, flags: "m", target: "trace" })).pass, true);
  // Only the closing note is the last message.
  assert.equal(regex(response.output, ctx({ pattern: "Sweet Grown" })).pass, false);
  assert.equal(regex(response.output, ctx({ pattern: '"bill":"HB ?1"', target: "trace" })).pass, true);
  assert.equal(regex(response.output, ctx({ pattern: '"context":"[^"]*Alabama', target: "trace", match: "not_contains" })).pass, true);
  assert.equal(regex(response.output, ctx({ pattern: "card", match: "count:1" })).pass, true);
  assert.equal(regex(response.output, { config: { pattern: "x", target: "trace" }, providerResponse: {} }).pass, false);
});

test("tool graders count and order calls", () => {
  assert.equal(toolUsed("", ctx({ tool: "mcp__plugin_cicada-guide_guide-public__show_bill" })).pass, true);
  assert.equal(toolUsed("", ctx({ tool: "Skill", min: 0, max: 0 })).pass, true);
  assert.equal(toolUsed("", ctx({ tool: "mcp__plugin_cicada-guide_guide-public__show_bill", input_match: "seafood" })).pass, true);
  const order = { before: "mcp__plugin_cicada-guide_guide-public__search_bills", after: "mcp__plugin_cicada-guide_guide-public__show_bill" };
  assert.equal(toolOrder("", ctx(order)).pass, true);
  assert.equal(toolOrder("", ctx({ before: order.after, after: order.before })).pass, false);
});

test("the judge sees the first and last twelve messages", () => {
  const lines = Array.from({ length: 30 }, (_, i) => `m${i}`);
  const seen = judgeTrace(lines).split("\n");
  assert.equal(seen.length, 25);
  assert.equal(seen[0], "m0");
  assert.equal(seen[11], "m11");
  assert.equal(seen[12], "[6 messages omitted]");
  assert.equal(seen.at(-1), "m29");
  assert.equal(judgeTrace(["a", "b"]), "a\nb");
});

test("CICADA_ABLATION=none keeps only the plugin arm", () => {
  const tests = cases({ CICADA_ABLATION: "none" });
  assert.ok(tests.length > 0);
  assert.ok(tests.every((t) => t.metadata.arm === "with-plugin"));
  assert.throws(() => cases({ CICADA_ABLATION: "both" }), /CICADA_ABLATION/);
});

test("tool grants match exact names and trailing wildcards", () => {
  const allowed = ["Read", "mcp__plugin_cicada-guide_guide-public__*"];
  assert.equal(toolAllowed("Read", allowed), true);
  assert.equal(toolAllowed("mcp__plugin_cicada-guide_guide-public__get_bill", allowed), true);
  assert.equal(toolAllowed("Bash", allowed), false);
  assert.equal(toolAllowed("mcp__other__get_bill", allowed), false);
});

test("a grading prompt in chat form becomes one prompt", () => {
  const chat = JSON.stringify([{ role: "system", content: "Grade it." }, { role: "user", content: "Output: x" }]);
  assert.equal(flattenChat(chat), "Grade it.\n\nUSER:\nOutput: x");
  assert.equal(flattenChat("plain"), "plain");
});
