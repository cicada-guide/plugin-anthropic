# How to run the evals under promptfoo

`claude plugin eval` is the eval runner this repo relies on (see
[How to verify a change](howto-verify-a-change.md#5-run-the-eval-suite)). `promptfoo/` runs the same
cases in [promptfoo](https://www.promptfoo.dev/) instead, for its results viewer, its history of
past runs, and side-by-side comparisons, such as one model against another on the same cases.

It does not copy the cases. `promptfoo/cases.mjs` reads `evals/*/prompt.md` and each case's
`graders/*.md` every time it runs, so a case added or changed for `claude plugin eval` runs here
too, unchanged.

## Set up

You need Node 22.22 or later, and Claude Code credentials: a logged-in `claude`, or
`ANTHROPIC_API_KEY` in the environment. Each session runs through the Claude Agent SDK, which uses
the same credentials Claude Code does.

```bash
cd promptfoo
```

```bash
npm install
```

The packages install into `promptfoo/node_modules/`, which is ignored. Nothing in the plugin itself
depends on them.

## Run the suite

```bash
npx promptfoo eval
```

```bash
npx promptfoo view
```

Each case runs three times on each of two providers: `with-plugin`, with this checkout loaded as a
plugin, and `without-plugin`, the no-plugin baseline. That is the same 42 runs as `claude plugin
eval`. To run only the plugin arm and halve the cost, set `CICADA_ABLATION=none`, which works like
`--ablation none`:

```bash
CICADA_ABLATION=none npx promptfoo eval
```

To run one case once while iterating, filter by its directory name:

```bash
CICADA_ABLATION=none npx promptfoo eval --filter-pattern bill-brief --repeat 1
```

Use `CICADA_ABLATION` rather than `--filter-providers`: every test names its arm, and promptfoo
refuses a test that names a provider the filter removed.

- **Cost.** Every run is a full Claude Code session on your account, and every `llm` grader is a
  judge call. A `bill-brief` run took 9 turns and about $0.33 plus judge tokens.
- **Real server.** The runs use the live public server. Nothing in them writes, but they count
  toward the 600-a-minute rate limit, so `promptfooconfig.yaml` runs one session at a time.

## Compare models

The session uses Claude Code's default model unless a provider sets `model`, or a case's
`prompt.md` does. To compare two models on the plugin arm, list the `with-plugin` provider twice in
`promptfooconfig.yaml`, each with its own `model` and a label that starts with `with-plugin`, such
as `with-plugin-opus` and `with-plugin-sonnet`. Each arm's tests match their providers by that
prefix, so both run every case and the viewer shows them side by side. The judge's model is
`defaultTest.options.provider.config.model`, `sonnet` by default, as with `--judge-model sonnet`.

## How it differs from `claude plugin eval`

The cases and graders are the same. These things are not:

- **One judge vote.** An `llm` grader is one promptfoo `llm-rubric` call. `claude plugin eval` takes
  the majority of three votes, so a borderline reply can pass there and fail here, or the reverse.
- **Pass means every grader passed.** promptfoo passes a test only when all of its assertions pass.
  There is no `--threshold`; the per-grader results are in the viewer, under each assertion's
  metric name, which is the grader's file name.
- **Tools are gated, not sandboxed.** A session gets the read-only tools `claude plugin eval`
  allows plus the grants in `promptfooconfig.yaml`, and every other tool call is refused. There is
  no OS sandbox around it. `AskUserQuestion` is left out, since nobody can answer it, so a question
  has to go in the reply.
- **No settings from your machine.** Each session starts in an empty temporary directory and loads
  no user, project or local settings, so none of your own plugins or `CLAUDE.md` files reach it.
- **Grader types.** `regex`, `llm`, `tool_used` and `tool_order` are translated. A regex can target
  `last_message` or `trace`, and an `llm` grader can focus on either. A case with any other grader
  type, target or focus fails to load, rather than passing without it.
- **Results.** They go to promptfoo's own store, read by `npx promptfoo view`, not to
  `evals/results/`.

The trace is the same shape as the one `claude plugin eval` grades: the session as JSON, one message
per line. A regex grader sees every line; an `llm` judge with `focus: trace` sees the first 12 and
the last 12.

## Check the runner itself

```bash
npm test
```

Run it from `promptfoo/` after `npm install`. It loads every case, checks that each grader
translates, and runs the graders against a fixed session. It makes no model calls and needs no
network. CI does not run it.

## Related

- [How to verify a change](howto-verify-a-change.md): the checks to run before every commit, and
  the `claude plugin eval` command.
- [Plugin eval docs](https://code.claude.com/docs/en/plugin-evals): the case and grader format both
  runners read.
