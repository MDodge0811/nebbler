# Token Efficiency Rule

## Directive

Always monitor and optimize token usage throughout conversations. Proactively identify opportunities to reduce token consumption and recommend solutions.

## When to Analyze

- After completing major tasks
- When conversations become lengthy
- When repetitive patterns emerge
- Before starting complex multi-step operations

## Optimization Strategies to Recommend

### 1. Batch Operations

- Combine multiple small file reads into single operations where possible
- Group related bash commands with `&&` instead of separate calls
- Use parallel tool calls for independent operations

### 2. Targeted Reading

- Read specific line ranges instead of entire files when only a portion is needed
- Use `grep` patterns to find relevant sections before reading full files
- Avoid re-reading files that haven't changed

### 3. Concise Output

- Request summary output from commands (e.g., `--quiet`, `| head`, `| tail`)
- Limit verbose logging in test/build commands
- Use `jq` to filter JSON responses to only needed fields

### 4. Smart Caching

- Remember file contents already read in the conversation
- Track which files have been modified since last read
- Avoid redundant searches for information already gathered

### 5. Task Decomposition

- Use background tasks for long-running operations
- Spawn subagents for independent research tasks
- Plan multi-step operations to minimize back-and-forth

### 6. Communication Efficiency

- Give concise status updates, not verbose explanations
- Use bullet points and tables over prose for structured data
- Ask clarifying questions upfront to avoid rework

## How to Report

Periodically (every ~10-15 substantive interactions), provide a brief efficiency note:

```
💡 Token tip: [specific observation and recommendation]
```

Only mention when there's an actionable improvement, not as routine filler.
