---
type: llm
focus: trace
---

Judge the assistant's reply together with the tool calls and tool results that led to it.

`search_people` for "Hatcher" with party D returns two people, Kirk Hatcher and Ragen Hatcher;
without a party filter it also returns Tom Hatcher (R), and partial matches such as Thatcher.
`show_official` records Kirk Hatcher's seat as State Senator, Alabama Senate, District 26,
Ragen Hatcher's as State Representative, Indiana House, District 3, and Tom Hatcher's as State
Senator, Tennessee Senate, District 2. `get_person` returns no seat,
only `contact_details`: links and email addresses on state legislature sites.

First check the trace for a `show_official` or `show_person_record` result, or a
`legislator-disambiguator` agent report that quotes one. If there is none, the reply has no source
for any seat, and it FAILS whatever it says.

PASS if the reply identifies Kirk Hatcher as the Democratic state senator, and every state,
chamber, or district it gives for anyone matches a seat that `show_official` or
`show_person_record` returned in this run, either called directly or through the
`legislator-disambiguator` agent's report.
FAIL if the reply does any of these:
- Gives a state, chamber, or district for anyone that no `show_official` or
  `show_person_record` result in the run (including one inside the agent's report) supports.
  This holds even when the seat is correct, and even when the reply says it comes from memory,
  general knowledge, or training data and asks the user to confirm it: a correct seat from memory
  is still a FAIL.
- States or suggests a past or other seat that no recorded seat shows, for example "he served in
  the Alabama House first" or "he may have been a representative before", whatever its source.
- Says or implies that a chamber, district, or state comes from a URL, a web page, or an email
  domain, for example "his contact page is ALSenator.aspx" or "her email is at iga.in.gov", or
  infers a past or other seat from one, for example "that ALRepresentative page is probably from
  his time in the House".
- Picks Ragen Hatcher, or names no one when the recorded seats separate the candidates.
