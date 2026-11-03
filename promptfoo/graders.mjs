// promptfoo assertions for the free grader types in ../evals/ graders/*.md. Each reads the
// grader's frontmatter from `context.config` (cases.mjs copies it there) and the session from the
// provider's metadata (provider.mjs).

function session(context) {
  return context.providerResponse?.metadata ?? {};
}

// A grader whose session never ran has nothing to read; say so instead of matching nothing.
function missingTrace(context) {
  return typeof session(context).trace !== "string";
}

export function regex(output, context) {
  const { pattern, flags = "", match = "contains", target = "last_message" } = context.config;
  if (target !== "last_message" && target !== "trace") {
    return { pass: false, score: 0, reason: `regex target "${JSON.stringify(target)}" is not supported by the promptfoo runner` };
  }
  if (target === "trace" && missingTrace(context)) {
    return { pass: false, score: 0, reason: "No session trace in the provider response" };
  }
  const text = target === "trace" ? session(context).trace : String(output ?? "");
  const found = text.match(new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`)) ?? [];
  let pass;
  if (match === "contains") pass = found.length > 0;
  else if (match === "not_contains") pass = found.length === 0;
  else if (/^count:\d+$/.test(match)) pass = found.length === Number(match.slice(6));
  else return { pass: false, score: 0, reason: `regex match "${match}" is not supported by the promptfoo runner` };
  return {
    pass,
    score: pass ? 1 : 0,
    reason: `${found.length} match(es) of /${pattern}/${flags} in ${target}; wanted ${match}`,
  };
}

function matches(call, spec) {
  const { tool, input_match: inputMatch } = typeof spec === "string" ? { tool: spec } : spec;
  if (call.name !== tool) return false;
  return !inputMatch || new RegExp(inputMatch).test(JSON.stringify(call.input ?? {}));
}

export function toolUsed(_output, context) {
  const { min = 1, max } = context.config;
  const calls = session(context).toolCalls ?? [];
  const count = calls.filter((c) => matches(c, context.config)).length;
  const pass = count >= min && (max === undefined || max === null || count <= max);
  return {
    pass,
    score: pass ? 1 : 0,
    reason: `${context.config.tool} called ${count} time(s); wanted ${min}..${max ?? "any"}`,
  };
}

export function toolOrder(_output, context) {
  const { before, after } = context.config;
  const calls = session(context).toolCalls ?? [];
  const first = (spec) => calls.findIndex((c) => matches(c, spec));
  const b = first(before);
  const a = first(after);
  const pass = b !== -1 && a !== -1 && b < a;
  return { pass, score: pass ? 1 : 0, reason: `first "before" call at ${b}, first "after" call at ${a}` };
}
