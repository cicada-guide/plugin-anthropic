---
type: regex
target: trace
# A show_official call in the main conversation, or a dispatch of the agent that makes one.
pattern: '"name":"mcp__[^"]*show_official"|"subagent_type":"[^"]*legislator-disambiguator"'
arm: with-only
---
