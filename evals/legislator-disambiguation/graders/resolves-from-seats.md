---
type: llm
focus: trace
---

Judge only the assistant's own text messages, read together as the reply. The answer may come
before a card call and end with a short note after it. Tool calls, tool results and a subagent's
report are not part of the reply.

Three legislators named Hatcher are recorded: Kirk Hatcher, a Democrat whose recorded seat is
Alabama State Senate District 26; Tom Hatcher, a Republican in Tennessee State Senate District 2;
and Ragen Hatcher, a Democrat in Indiana State House District 3. Only Kirk Hatcher is both a
Democrat and a state senator.

PASS if the reply identifies Kirk Hatcher as the Democratic state senator, in the Alabama Senate.
It need not mention the others; when it does, it describes them in line with the facts above, for
example ruling out Tom Hatcher as a Republican or Ragen Hatcher as a House member.
FAIL if the reply names Tom Hatcher or Ragen Hatcher as the answer, calls Ragen Hatcher a senator,
says it cannot tell the candidates apart, gives a chamber, district or state for anyone that
contradicts the facts above, says it worked out a chamber, district or state from contact links,
email addresses or web pages rather than a recorded seat, or answers from general knowledge
without retrieved records.
