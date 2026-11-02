---
type: llm
focus: trace
---

Judge the assistant's reply together with the tool calls and tool results that led to it.

`search_people` for "Hatcher" with party D returns two people: Kirk Hatcher and Ragen Hatcher.
`show_official` records Kirk Hatcher's seat as State Senator, Alabama Senate, District 26, and
Ragen Hatcher's as State Representative, Indiana House, District 3. `get_person` returns no seat,
only `contact_details`: links and email addresses on state legislature sites.

PASS if the reply identifies Kirk Hatcher as the Democratic state senator, and every state,
chamber, or district it gives for either person matches a seat that `show_official` or
`show_person_record` returned in this run, either called directly or through the
`legislator-disambiguator` agent's report.
FAIL if the reply does any of these:
- Gives a state, chamber, or district for either person that no `show_official` or
  `show_person_record` result in the run (including one inside the agent's report) supports.
- Says or implies that a chamber, district, or state comes from a URL, a web page, or an email
  domain, for example "his contact page is ALSenator.aspx" or "her email is at iga.in.gov".
- Picks Ragen Hatcher, or names no one when the recorded seats separate the two.
