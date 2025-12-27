# MANUS PROJECT INSTRUCTIONS
## Affiliate System Hub - Mandatory Operating Guidelines

**CRITICAL: These instructions apply to EVERY task in this project. Read completely before any action.**

---

## IDENTITY & MISSION

You are working on the **8-Core AI-Powered Affiliate Marketing System**. This project's success is critical to operational viability. Every output must be **production-grade, profitable, and reliable**. Prototype-quality work is unacceptable.

---

## MANDATORY STARTUP PROTOCOL

**Before ANY work, you MUST:**

1. **Clone/access the repository**: `gh repo clone TZEK89/affiliate-marketing-system`
2. **Read these files in order**:
   - `PROJECT_SOP.md` - Complete operating procedures
   - `SOURCE_OF_TRUTH.md` - Current architecture and state
   - `CURRENT_STATUS.md` - Where we left off, active work
   - `ERROR_LOG.md` - Past issues and solutions
3. **Confirm understanding** before proceeding with any task

**If these files don't exist, create them from the templates in PROJECT_SOP.md.**

---

## CONTEXT RETENTION RULES

**You WILL lose context during long sessions.** To prevent this:

1. **Update CURRENT_STATUS.md** after every significant milestone
2. **Re-read context files** every 5-6 tool calls during complex tasks
3. **Document decisions immediately** in DECISION_LOG.md
4. **Never rely on memory** - always verify against source files

**Self-Check Questions (ask yourself regularly):**
- What is the current objective?
- What have I accomplished so far?
- What files have I modified?
- Am I still aligned with the user's original request?

---

## CODE QUALITY REQUIREMENTS

### Before Writing Code
- Research existing codebase patterns first
- Plan the implementation in discrete steps
- Check for existing solutions - never duplicate

### While Writing Code
- TypeScript strict mode for all frontend code
- No `any` types without documented justification
- Error handling for ALL async operations
- Meaningful error messages with context
- Maximum 50 lines per function, 300 lines per file

### After Writing Code (MANDATORY)
```bash
npm run lint      # Must pass
npm run typecheck # Must pass
npm run build     # Must succeed
npm run test      # No regressions
```

**NEVER mark code complete if any check fails.**

---

## DASHBOARD DEVELOPMENT RULES

Dashboards have been a recurring pain point. Follow these rules strictly:

### Design System First
- Check `tailwind.config.ts` and `globals.css` before ANY styling
- Use semantic tokens - NEVER hardcode colors
- Create component variants - NEVER inline styles
- Match existing patterns exactly

### Every Dashboard Component MUST Have
- Loading state (skeleton loaders)
- Error state (user-friendly message)
- Empty state (meaningful UI)
- Responsive design (mobile, tablet, desktop)
- Proper error boundaries

### Common Bugs to Prevent
- Always cancel requests on component unmount
- Handle zero/null/undefined data gracefully
- Memoize expensive computations
- Use React Query for server state
- Test with realistic data volumes

---

## TOOL UTILIZATION

### Claude MCP (claude-http-mcp) - Reasoning Engine
Use for: Code review, architecture decisions, complex analysis, documentation

```bash
manus-mcp-cli tool call claude_send_message --server claude-http-mcp --input '{
  "prompt": "Your question",
  "system": "You are a senior [role]",
  "model": "haiku"
}'
```

### Perplexity MCP (perplexity-pro) - Research Engine
Use for: Market research, best practices, technology comparisons, current information

```bash
manus-mcp-cli tool call perplexity_search --server perplexity-pro --input '{
  "query": "Your search query",
  "model": "sonar-pro"
}'
```

### Tool Chaining Pattern
1. **Research** (Perplexity) → Gather information
2. **Analyze** (Claude) → Process and plan
3. **Implement** (Manus tools) → Execute
4. **Verify** (Claude) → Review

---

## GIT PRACTICES

- **NEVER** use `git add .` - add files explicitly
- **NEVER** force push
- **NEVER** commit without user approval
- Commit format: `type(scope): description`
- Branch format: `feature/description` or `fix/description`

---

## ERROR HANDLING PROTOCOL

### When Errors Occur
1. **Document immediately** in ERROR_LOG.md
2. **Investigate systematically** - don't guess
3. **Fix root cause** - not symptoms
4. **Add prevention** - tests, checks, documentation

### Recurring Errors
If same error type occurs 3+ times:
1. Stop and analyze the pattern
2. Create prevention checklist
3. Add automated checks if possible
4. Update this instruction file

---

## COMMUNICATION STANDARDS

### Progress Updates (provide regularly)
- What was completed
- What's in progress
- Any blockers
- Next steps

### Ask First (before proceeding)
- Architectural changes
- New dependencies
- Scope changes
- Irreversible actions

### Proceed and Inform
- Bug fixes within patterns
- Code improvements
- Documentation updates
- Test additions

---

## SESSION MANAGEMENT

### Starting Work
1. Read all context files
2. Confirm understanding
3. State the plan

### During Work
- Update CURRENT_STATUS.md at milestones
- Document decisions immediately
- Flag blockers right away

### Ending Work
1. Update CURRENT_STATUS.md with:
   - Accomplishments
   - Remaining work
   - Blockers
   - Next steps
2. Update SOURCE_OF_TRUTH.md if architecture changed
3. Commit work if approved

---

## PROFITABILITY FOCUS

Before implementing ANY feature, answer:
1. Does this drive revenue?
2. What's the ROI on time invested?
3. Is there a simpler solution?
4. Can we validate before full build?

### Priority Order
- P0: Revenue-critical (payments, tracking)
- P1: User retention (core features)
- P2: Efficiency (automation)
- P3: Nice-to-have (polish)

**Always work highest priority first.**

---

## CONNECTOR REQUIREMENTS

**Keep ALL connectors activated for every task:**
- GitHub (TZEK89/affiliate-marketing-system)
- Google Drive
- Gmail
- Supabase
- Railway
- Vercel
- Cloudflare
- Firecrawl
- Playwright
- Claude MCP (claude-http-mcp)
- Perplexity MCP (perplexity-pro)

---

## FINAL REMINDERS

1. **Quality over speed** - but deliver both
2. **Document everything** - future you will thank present you
3. **Test thoroughly** - bugs cost more than prevention
4. **Use your tools** - Claude and Perplexity are there to help
5. **Stay focused** - profitability is the goal

**This project's success determines if we keep operating. Treat every task accordingly.**
