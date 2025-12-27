# Affiliate Marketing AI System - Standard Operating Procedures

**Version:** 1.0.0  
**Last Updated:** December 27, 2025  
**Project:** 8-Core AI-Powered Affiliate Marketing System  
**Criticality:** PRODUCTION - Profitability Dependent

---

## MISSION STATEMENT

This project's success determines operational viability. Every decision, every line of code, every feature must drive toward **profitability**. There is no room for prototype-quality work, recurring bugs, or context loss. This SOP ensures consistent, production-grade output across all tasks.

---

## PART 1: CONTEXT RETENTION SYSTEM

### 1.1 Mandatory Context Files

Before ANY work begins, the following files MUST be read and understood:

| File | Purpose | When to Update |
|------|---------|----------------|
| `SOURCE_OF_TRUTH.md` | Master architecture, decisions, current state | After every significant change |
| `CURRENT_STATUS.md` | Active work, blockers, next steps | Start and end of every session |
| `DECISION_LOG.md` | Why decisions were made (prevents re-discussion) | After every architectural decision |
| `ERROR_LOG.md` | Past errors and their solutions | After resolving any bug |

### 1.2 Context Preservation Protocol

At the **START** of every task:
1. Read `SOURCE_OF_TRUTH.md` completely
2. Read `CURRENT_STATUS.md` to understand where we left off
3. Check `ERROR_LOG.md` for relevant past issues
4. Confirm understanding before proceeding

At the **END** of every task:
1. Update `CURRENT_STATUS.md` with progress made
2. Log any decisions in `DECISION_LOG.md`
3. Document any errors encountered in `ERROR_LOG.md`
4. Update `SOURCE_OF_TRUTH.md` if architecture changed

### 1.3 Self-Reference Checkpoints

Every 3-4 tool calls, perform a mental checkpoint:
- What is the current objective?
- What have I accomplished so far?
- What files have I modified?
- Am I still aligned with the user's request?

If uncertain, **re-read the relevant context file** before continuing.

---

## PART 2: CODE QUALITY STANDARDS

### 2.1 Pre-Coding Requirements

Before writing ANY code:

1. **Research First**: Use search tools to understand existing codebase patterns
2. **Plan the Work**: Break complex tasks into discrete, trackable steps
3. **Check for Existing Solutions**: Never duplicate functionality that exists
4. **Verify Dependencies**: Confirm all required packages are available

### 2.2 Code Writing Standards

All code MUST meet these criteria:

**Structure:**
- Clean, modular architecture with single-responsibility functions
- Consistent naming conventions (camelCase for JS, snake_case for Python)
- Maximum function length: 50 lines (refactor if longer)
- Maximum file length: 300 lines (split if longer)

**Documentation:**
- JSDoc/docstrings for all public functions
- Inline comments for complex logic only
- README updates for new features

**Error Handling:**
- Try-catch blocks for all async operations
- Meaningful error messages with context
- Graceful degradation, never silent failures
- Log errors with stack traces

**TypeScript (Mandatory for Frontend):**
- Strict mode enabled
- No `any` types except when absolutely necessary (document why)
- Interface definitions for all data structures
- Proper null/undefined handling

### 2.3 Post-Coding Verification

After writing code, ALWAYS:

1. **Lint Check**: Run `npm run lint` or equivalent
2. **Type Check**: Run `npm run typecheck` or equivalent
3. **Test**: Run existing tests to ensure no regressions
4. **Manual Verification**: Test the feature manually if possible
5. **Build Check**: Ensure production build succeeds

**NEVER commit code that fails any of these checks.**

### 2.4 Git Practices

- **NEVER** use `git add .` - explicitly add intended files only
- **NEVER** force push - ask for help if push fails
- **NEVER** commit without explicit user request
- Commit messages: `type(scope): description` (e.g., `feat(dashboard): add revenue chart`)
- Branch naming: `feature/description` or `fix/description`

---

## PART 3: DASHBOARD DEVELOPMENT PROTOCOL

### 3.1 Design System First

Before ANY dashboard work:

1. **Check existing design system** in `tailwind.config.ts` and `globals.css`
2. **Use semantic tokens** - never hardcode colors
3. **Create component variants** - never inline styles
4. **Maintain consistency** - match existing patterns exactly

### 3.2 Dashboard Quality Checklist

Every dashboard component MUST pass:

| Check | Requirement |
|-------|-------------|
| **Responsive** | Works on mobile, tablet, desktop |
| **Loading States** | Skeleton loaders for async data |
| **Error States** | User-friendly error messages |
| **Empty States** | Meaningful UI when no data |
| **Accessibility** | Proper ARIA labels, keyboard navigation |
| **Performance** | No unnecessary re-renders |

### 3.3 Common Dashboard Bugs to Prevent

**Data Fetching:**
- Always handle loading, error, and empty states
- Use proper caching (React Query, SWR)
- Implement retry logic for failed requests
- Cancel requests on component unmount

**State Management:**
- Keep state as local as possible
- Use React Query for server state
- Avoid prop drilling - use context sparingly
- Memoize expensive computations

**Charts/Visualizations:**
- Lazy load chart libraries
- Handle edge cases (zero values, negative numbers)
- Responsive container sizing
- Proper number formatting (locale-aware)

### 3.4 Testing Dashboard Changes

Before marking dashboard work complete:

1. Test all interactive elements
2. Test with realistic data volumes
3. Test error scenarios (API failures, timeouts)
4. Test on different screen sizes
5. Check browser console for errors/warnings

---

## PART 4: TOOL UTILIZATION PROTOCOL

### 4.1 Claude MCP (Reasoning Engine)

Use Claude for:
- Code review and architecture decisions
- Complex problem analysis
- Writing documentation
- Debugging difficult issues

**Invocation:**
```bash
manus-mcp-cli tool call claude_send_message --server claude-http-mcp --input '{
  "prompt": "Your detailed question",
  "system": "You are a senior [role]. Focus on [specific aspect].",
  "model": "haiku"
}'
```

### 4.2 Perplexity MCP (Research Engine)

Use Perplexity for:
- Current market research
- Technology comparisons
- Best practices lookup
- Competitor analysis

**Invocation:**
```bash
manus-mcp-cli tool call perplexity_research --server perplexity-pro --input '{
  "topic": "Your research topic"
}'
```

### 4.3 Tool Chaining Pattern

For complex tasks, chain tools:

1. **Research** (Perplexity) → Gather current information
2. **Analyze** (Claude) → Process and plan based on research
3. **Implement** (Manus) → Execute the plan
4. **Verify** (Claude) → Review implementation

### 4.4 When to Use Each Tool

| Scenario | Primary Tool | Supporting Tool |
|----------|--------------|-----------------|
| New feature planning | Perplexity (research) | Claude (analysis) |
| Code review | Claude | - |
| Bug investigation | Claude | Perplexity (if external) |
| Market research | Perplexity | Claude (synthesis) |
| Architecture decisions | Claude | Perplexity (patterns) |
| Documentation | Claude | - |

---

## PART 5: ERROR PREVENTION & HANDLING

### 5.1 Proactive Error Prevention

**Before making changes:**
- Read existing code thoroughly
- Understand the data flow
- Check for edge cases
- Review related tests

**During implementation:**
- Add error handling as you code (not after)
- Log meaningful information
- Validate inputs at boundaries
- Use TypeScript strictly

### 5.2 When Errors Occur

1. **Document immediately** in `ERROR_LOG.md`:
   - What happened
   - What was being attempted
   - Error message/stack trace
   - Steps to reproduce

2. **Investigate systematically:**
   - Check logs first
   - Reproduce the error
   - Isolate the cause
   - Research if needed (Perplexity)

3. **Fix properly:**
   - Address root cause, not symptoms
   - Add tests to prevent recurrence
   - Update documentation if needed

### 5.3 Recurring Error Protocol

If the same type of error occurs more than twice:

1. **Stop and analyze** - there's a systemic issue
2. **Document the pattern** in `ERROR_LOG.md`
3. **Create a prevention checklist** for that error type
4. **Add automated checks** if possible (lint rules, tests)

---

## PART 6: PROFITABILITY FOCUS

### 6.1 Every Feature Must Answer

Before implementing ANY feature:

1. **Does this drive revenue?** (directly or indirectly)
2. **What's the time investment vs. return?**
3. **Is there a simpler solution?**
4. **Can we validate before full implementation?**

### 6.2 Priority Framework

| Priority | Category | Examples |
|----------|----------|----------|
| P0 | Revenue-critical | Payment processing, affiliate tracking |
| P1 | User retention | Core dashboard, notifications |
| P2 | Efficiency | Automation, bulk operations |
| P3 | Nice-to-have | UI polish, minor features |

**Always work on highest priority first.**

### 6.3 Technical Debt Management

- **Acceptable:** Shortcuts that save time without compromising stability
- **Unacceptable:** Shortcuts that cause bugs or maintenance burden
- **Document all debt** with TODO comments and tracking
- **Schedule debt paydown** - don't let it accumulate

---

## PART 7: COMMUNICATION STANDARDS

### 7.1 Progress Updates

Provide clear, concise updates:
- What was completed
- What's in progress
- Any blockers or decisions needed
- Next steps

### 7.2 When to Ask vs. Proceed

**Ask first:**
- Architectural changes
- New dependencies
- Scope changes
- Anything irreversible

**Proceed and inform:**
- Bug fixes within existing patterns
- Code improvements
- Documentation updates
- Test additions

### 7.3 Reporting Issues

When reporting problems:
1. State the issue clearly
2. Provide context (what was being done)
3. Include error details
4. Suggest potential solutions
5. Ask for guidance if needed

---

## PART 8: SESSION MANAGEMENT

### 8.1 Starting a Session

```
1. Read SOURCE_OF_TRUTH.md
2. Read CURRENT_STATUS.md
3. Confirm understanding of current state
4. Clarify any ambiguities before proceeding
5. State the plan for this session
```

### 8.2 During a Session

```
- Update CURRENT_STATUS.md after major milestones
- Save work frequently (commits to feature branch)
- Document decisions as they're made
- Flag blockers immediately
```

### 8.3 Ending a Session

```
1. Complete or checkpoint current work
2. Update CURRENT_STATUS.md with:
   - What was accomplished
   - What's remaining
   - Any blockers
   - Recommended next steps
3. Update SOURCE_OF_TRUTH.md if architecture changed
4. Commit all work (if approved)
```

---

## APPENDIX A: Quick Reference Commands

### Linting & Type Checking
```bash
npm run lint
npm run typecheck
npm run build
```

### Testing
```bash
npm run test
npm run test:coverage
```

### Claude MCP
```bash
manus-mcp-cli tool call claude_send_message --server claude-http-mcp --input '{"prompt": "...", "model": "haiku"}'
```

### Perplexity MCP
```bash
manus-mcp-cli tool call perplexity_search --server perplexity-pro --input '{"query": "...", "model": "sonar-pro"}'
```

---

## APPENDIX B: File Templates

### ERROR_LOG.md Entry
```markdown
## [DATE] - [Brief Description]

**Context:** What was being done
**Error:** The error message/behavior
**Cause:** Root cause analysis
**Solution:** How it was fixed
**Prevention:** How to prevent recurrence
```

### DECISION_LOG.md Entry
```markdown
## [DATE] - [Decision Title]

**Context:** Why this decision was needed
**Options Considered:** List alternatives
**Decision:** What was chosen
**Rationale:** Why this option
**Implications:** What this affects
```

---

**This SOP is a living document. Update it when better practices are discovered.**

**Remember: Profitability is the goal. Quality is the path. Consistency is the method.**
