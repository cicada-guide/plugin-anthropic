// Builds promptfoo tests from ../evals/, so `claude plugin eval` and promptfoo run the same cases
// and graders and neither copy can drift. Each case becomes one test per arm: `with-plugin` gets
// every grader, `without-plugin` (the no-plugin baseline) leaves out the ones `claude plugin eval`
// excludes from a two-arm score.
//
// A grader type this file cannot translate fails the load, rather than being skipped and
// quietly passing.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import { PLUGIN_ROOT } from "./provider.mjs";

const EVALS = join(PLUGIN_ROOT, "evals");
const GRADERS = "file://graders.mjs";

export function parseMarkdown(text, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${file}: no frontmatter`);
  return { front: load(match[1]) ?? {}, body: match[2].trim() };
}

// Mirrors `claude plugin eval`: `arm: with-only` and `tool_used` on Skill are indicators that
// count only when the plugin is loaded; `arm: both` scores in both arms.
export function scoredWithoutPlugin(grader) {
  if (grader.arm === "both") return true;
  if (grader.arm === "with-only") return false;
  return !(grader.type === "tool_used" && grader.tool === "Skill");
}

export function toAssertion(name, grader, rubric, file) {
  const base = { metric: name, ...(grader.weight ? { weight: grader.weight } : {}) };
  switch (grader.type) {
    case "regex":
      return {
        ...base,
        type: "javascript",
        value: `${GRADERS}:regex`,
        config: {
          pattern: grader.pattern,
          flags: grader.flags ?? "",
          match: grader.match ?? "contains",
          target: grader.target ?? "last_message",
        },
      };
    case "tool_used":
      return {
        ...base,
        type: "javascript",
        value: `${GRADERS}:toolUsed`,
        config: { tool: grader.tool, input_match: grader.input_match, min: grader.min ?? 1, max: grader.max },
      };
    case "tool_order":
      return {
        ...base,
        type: "javascript",
        value: `${GRADERS}:toolOrder`,
        config: { before: grader.before, after: grader.after },
      };
    case "llm": {
      const focus = grader.focus ?? "last_message";
      const transform = { last_message: undefined, trace: "context.metadata.judgeTrace" };
      if (!(focus in transform)) throw new Error(`${file}: llm focus "${JSON.stringify(focus)}" is not supported by the promptfoo runner`);
      return {
        ...base,
        type: "llm-rubric",
        value: grader.criteria ?? rubric,
        ...(transform[focus] ? { transform: transform[focus] } : {}),
      };
    }
    default:
      throw new Error(`${file}: grader type "${grader.type}" is not supported by the promptfoo runner`);
  }
}

export function loadCase(dir) {
  const name = dir;
  const promptFile = join(EVALS, dir, "prompt.md");
  const { front, body } = parseMarkdown(readFileSync(promptFile, "utf8"), promptFile);
  const graderDir = join(EVALS, dir, "graders");
  const graders = existsSync(graderDir)
    ? readdirSync(graderDir).filter((f) => f.endsWith(".md")).sort().map((f) => {
      const file = join(graderDir, f);
      const { front: grader, body: rubric } = parseMarkdown(readFileSync(file, "utf8"), file);
      return { name: f.slice(0, -3), grader, rubric, file };
    })
    : [];
  if (!graders.length) throw new Error(`${promptFile}: case has no graders`);

  const vars = {
    prompt: body,
    case: name,
    max_turns: String(front.max_turns ?? 10),
    timeout_seconds: String(front.timeout_seconds ?? 300),
    ...(front.model ? { model: front.model } : {}),
    ...(front.append_system_prompt ? { append_system_prompt: front.append_system_prompt } : {}),
  };
  const arm = (label, keep) => ({
    description: `${name} [${label}]`,
    // A prefix, so a second provider labelled, say, `with-plugin-opus` runs the same tests.
    providers: [`${label}*`],
    vars,
    metadata: { case: name, arm: label, tags: (front.tags ?? []).join(",") },
    assert: graders.filter(keep).map((g) => toAssertion(g.name, g.grader, g.rubric, g.file)),
  });
  return [arm("with-plugin", () => true), arm("without-plugin", (g) => scoredWithoutPlugin(g.grader))];
}

// CICADA_ABLATION=none drops the baseline arm, like `claude plugin eval --ablation none`. It is an
// environment variable because promptfoo's --filter-providers rejects a test that names a
// provider the filter removed.
export default function cases(env = process.env) {
  const ablation = env.CICADA_ABLATION ?? "with-without";
  if (!["with-without", "none"].includes(ablation)) {
    throw new Error(`CICADA_ABLATION must be "with-without" or "none", not "${ablation}"`);
  }
  const dirs = readdirSync(EVALS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(EVALS, d.name, "prompt.md")))
    .map((d) => d.name)
    .sort();
  return dirs.flatMap(loadCase)
    .filter((test) => test.assert.length > 0)
    .filter((test) => ablation === "with-without" || test.metadata.arm === "with-plugin");
}
