---
type: llm
focus: trace
---

Judge only the `headline` argument Claude passes to `show_bill`. Tool results, skill text and
documents Claude read are not part of it.

The bill is Alabama HB 1 from the 2025 regular session. Its official title begins "Seafood, to
assess a fee on seafood dealers dealing in imported seafood", and the tools return its text. Its
stored `headline` field is null (checked 2026-11-02), so Claude writes the headline itself.

PASS if Claude called `show_bill` and its `headline`:
1. is plain text of at most 120 characters;
2. reads like a neutral news headline: it leads with a verb, or a noun phrase built on one, that
   says what the bill does, for example "Creates ..." or "Sets up ...";
3. uses no loaded or promotional words, such as "protects", "finally", "common-sense", "attack",
   "radical", "historic" or "bold";
4. claims no passage or outcome: no "passes", "signed", "becomes law" or "enacted".

FAIL if Claude never called `show_bill`, or its `headline` breaks any of the above, or it only
repeats the official title word for word when the tools returned the bill's text.
