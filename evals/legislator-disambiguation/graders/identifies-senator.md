---
type: regex
target: trace
flags: m
# Claude's own text in any message, not tool output (see bill-brief/graders/bill-facts.md).
pattern: '^\{"type":"assistant"[^\n]*"type":"text","text":"[^\n]*District 26'
---
