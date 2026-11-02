---
type: llm
focus: trace
---

Judge only the `headline` argument Claude passes to `show_bill`. Tool results, skill text and
documents Claude read are not part of it.

The bill is Hawaii HB420 (2025 Regular Session). Its official title is only "Relating To
Remedies.", the tools return no text for it, and its stored `headline` field is null. The tools
also return subject tags such as Contractor Repair Act, Construction Defect and Statute of Repose,
but the guidance says to write the headline from the official title alone when the text could not
be read, even when it then says little about what the bill does.

PASS if Claude called `show_bill` and its `headline` is plain text of at most 120 characters built
from the official title alone, for example "Relates to legal remedies" or "Changes Hawaii law on
remedies", and claims no passage or outcome.

FAIL if Claude never called `show_bill`, or its `headline` names anything only the subject tags
say, such as construction, contractors, repairs, defects or a statute of repose, or claims
passage or an outcome.
