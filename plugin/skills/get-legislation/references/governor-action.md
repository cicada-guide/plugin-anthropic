# After passage: governor deadlines and effective dates

Read this when a user asks what happens to a state bill after the legislature passes it: how long
the governor has to act, what happens if the governor does nothing, or when a bill takes effect.

## What the server returns

For one bill, use what `get_bill_dossier` returns rather than this table. Its `governor_action`
holds the bill's state's rule:

- `during_session_days` and `during_session_default`;
- `after_session_days` and `after_session_default`, for once the legislature has adjourned;
- `effective_date`;
- a one-sentence `summary`;
- a `note` naming what the rule leaves out.

A default is `"law"` (the bill becomes law without a signature) or `"pocket_veto"` (an unsigned
bill dies). `governor_action` is `null` outside the 50 states, District of Columbia included.

Use this table when the user asks about a state with no bill in hand, or when the dossier could not
be loaded.

## How to use it

- **It is a general rule, not a deadline for this bill.** Present it as the state's general rule,
  and pass on the `note`: when each deadline starts, excluded weekends and holidays, emergency
  clauses and dates in the bill text can change it. Never compute a date from it, and never say when a particular bill became or
  will become law. The tools do not record when the governor received the bill, and they often do
  not record the session's adjournment date.
- **The bill text wins.** Where a state's effective date reads "In bill text", or "unless otherwise
  specified", the bill text decides. Quote the effective-date section only if you read it with
  `get_latest_bill_document`; otherwise say the text sets it.
- **Report what the record shows separately.** A bill's recorded `status` (for example `Passed`)
  and its document versions (for example `Enrolled` or `Chaptered`) are the record. This table only
  explains what the law says happens next. Never present the table as evidence of the bill's
  outcome.
- **It covers state legislatures only.** It says nothing about Congress, municipal ordinances or
  ballot measures.

## The table

"During session" and "After session" are the days the governor has to act while the legislature
is in session and once it has adjourned. "Default" is what happens when the governor does not act
in time. This is a broad overview: it leaves out when each deadline starts (presentment, delivery
or adjournment, by state), excluded weekends and holidays, and emergency clauses. Illinois, Maine,
Michigan, New Hampshire, Oregon, Pennsylvania and Utah were checked against their constitutions or
statutes on 2026-10-06.

| State | During session | Default | After session | Default | Effective date |
| --- | --- | --- | --- | --- | --- |
| Alabama | 6 days | Law | 10 days | Pocket veto | In bill text |
| Alaska | 15 days | Law | 20 days | Law | 90 days after enacted |
| Arizona | 5 days | Law | 20 days | Law | 90 days after adjournment |
| Arkansas | 5 days | Law | 20 days | Law | 90 days after adjournment |
| California | 12 days | Law | 30 days | Law | January 1 after enacted |
| Colorado | 10 days | Law | 30 days | Law | In bill text |
| Connecticut | 5 days | Law | 15 days | Law | In bill text |
| Delaware | 10 days | Law | 30 days | Pocket veto | Immediately, unless otherwise specified |
| Florida | 7 days | Law | 15 days | Law | 60 days after adjournment, unless otherwise specified |
| Georgia | 6 days | Law | 40 days | Law | July 1 after enacted, unless otherwise specified |
| Hawaii | 10 days | Law | 45 days | Law | In bill text |
| Idaho | 5 days | Law | 10 days | Law | July 1 after enacted |
| Illinois | 60 days | Law | 60 days | Law | In bill text, otherwise January 1 of the next year if passed before June 1, or June 1 of the next year if passed after May 31 |
| Indiana | 7 days | Law | 7 days | Law | In bill text |
| Iowa | 3 days | Law | 30 days | Pocket veto | July 1 after enacted, unless otherwise specified |
| Kansas | 10 days | Law | 10 days | Law | July 1 after enacted, unless otherwise specified |
| Kentucky | 10 days | Law | 10 days | Law | 90 days after adjournment, unless otherwise specified |
| Louisiana | 10 days | Law | 20 days | Law | August 1 after enacted, unless otherwise specified |
| Maine | 10 days | Law | 3 days after the same Legislature next meets; if it does not meet again, the bill does not become law | Law | 90 days after adjournment, unless otherwise specified |
| Maryland | 6 days | Law | 30 days | Law | In bill text |
| Massachusetts | 10 days | Law | 10 days | Pocket veto | In bill text, otherwise 90 days after enacted |
| Michigan | 14 days | Law | 14 days | Pocket veto | 90 days after the session ends, unless given immediate effect |
| Minnesota | 3 days | Law | 14 days | Pocket veto | In bill text, otherwise August 1 after enacted |
| Mississippi | 5 days | Law | 15 days | Law | In bill text, otherwise 60 days after enacted |
| Missouri | 15 days | Law | 45 days | Law | In bill text, otherwise August 28 after enacted |
| Montana | 10 days | Law | 10 days | Law | In bill text, otherwise October 1 after enacted |
| Nebraska | 5 days | Law | 5 days | Law | In bill text, otherwise 90 days after adjournment |
| Nevada | 5 days | Law | 10 days | Law | In bill text, otherwise October 1 after enacted |
| New Hampshire | 5 days | Law | 5 days | Pocket veto | In bill text |
| New Jersey | 45 days | Law | 7 days | Pocket veto | In bill text, otherwise July 4 after enacted |
| New Mexico | 3 days | Law | 20 days | Pocket veto | In bill text, otherwise 90 days after adjournment |
| New York | 10 days | Law | 30 days | Pocket veto | In bill text |
| North Carolina | 10 days | Law | 40 days | Law | In bill text, otherwise 60 days after adjournment |
| North Dakota | 3 days | Law | 15 days | Law | In bill text, otherwise August 1 after enacted |
| Ohio | 10 days | Law | 10 days | Law | In bill text, otherwise 91 days after enrollment |
| Oklahoma | 5 days | Law | 15 days | Pocket veto | In bill text, otherwise 90 days after adjournment |
| Oregon | 5 days | Law | 30 days | Law | January 1 after enacted, unless otherwise specified |
| Pennsylvania | 10 days | Law | 30 days | Law | In bill text |
| Rhode Island | 6 days | Law | 10 days | Law | In bill text |
| South Carolina | 5 days | Law | 5 days | Law | In bill text, otherwise 20 days after enacted |
| South Dakota | 5 days | Law | 15 days | Law | July 1 after enacted, unless otherwise specified |
| Tennessee | 10 days | Law | 10 days | Law | 40 days after enacted, unless otherwise specified |
| Texas | 10 days | Law | 20 days | Law | 90 days after adjournment |
| Utah | 10 days | Law | 20 days | Law | 60 days after adjournment, unless otherwise specified |
| Vermont | 5 days | Law | 3 days | Pocket veto | July 1 after enacted, unless otherwise specified |
| Virginia | 7 days | Law | 30 days | Law | July 1 after enacted, unless otherwise specified |
| Washington | 5 days | Law | 20 days | Law | 90 days after adjournment, unless otherwise specified |
| West Virginia | 5 days | Law | 15 days | Law | 90 days after enrollment |
| Wisconsin | 6 days | Law | 6 days | Pocket veto | 1 day after publication, unless otherwise specified |
| Wyoming | 3 days | Law | 15 days | Law | In bill text |

The server keeps the same table in `src/services/governor-action.ts` in its own repository. A
change to one needs the same change in the other.
