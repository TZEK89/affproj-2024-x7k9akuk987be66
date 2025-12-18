# Context Management SOP

**Author:** Manus AI  
**Version:** 1.0  
**Status:** Active

---

## 1. Purpose

To ensure perfect context continuity between sessions, preventing information loss and repeated questions. This SOP defines the triggers, processes, and tools for capturing, storing, and recalling session context.

---

## 2. Triggers

### 2.1. Automatic Trigger

-   **Condition:** 2 hours of continuous conversation without a manual trigger.
-   **Action:** Automatically execute the "Context Commit Process" (see section 3).

### 2.2. Manual Trigger

-   **Condition:** User says the exact phrase "commit changes on chat".
-   **Action:** Immediately execute the "Context Commit Process" (see section 3).

---

## 3. Context Commit Process

When triggered, the following steps will be executed:

1.  **Analyze Chat History:** Review the entire conversation since the last commit.
2.  **Identify Key Information:** Extract:
    -   **Decisions Made:** e.g., "Decided to use Railway for both frontend and backend."
    -   **Code Changes:** New files created, existing files modified.
    -   **New Discoveries:** e.g., "Found that Hotmart API doesn't provide marketplace access."
    -   **Action Items:** For both user and AI.
    -   **Blockers:** Any issues preventing progress.
3.  **Generate Session Summary:** Create a new, dated Markdown file in `/docs/session-summaries/` named `YYYY-MM-DD_Session_Summary.md`.
4.  **Update Core Context:** Update `CURRENT_CONTEXT.md` with the latest information, ensuring it reflects the absolute current state of the project.
5.  **Commit to GitHub:** Commit the new session summary and any changes to `CURRENT_CONTEXT.md` to the GitHub repository.
6.  **Store in Knowledge Base:** Ingest both the session summary and the updated `CURRENT_CONTEXT.md` into my internal vector database for long-term recall.
7.  **Confirm to User:** Send a message confirming that the context has been saved, including a link to the new session summary.

---

## 4. Context Recall Process

At the beginning of a new session, or when the user provides a context recall prompt, the following steps will be executed:

1.  **Recall from Knowledge Base:** Query internal vector database for the most recent session summaries and the latest `CURRENT_CONTEXT.md`.
2.  **Review Core Documents:** Quickly re-read:
    -   `DEPLOYMENT.md` (for infrastructure)
    -   `OPERATIONAL_MANUAL.md` (for project goals)
    -   `FEATURE_STATUS.md` (for progress)
3.  **Synthesize Current State:** Combine the recalled information into a coherent understanding of the project's current state.
4.  **Acknowledge and Confirm:** Start the conversation by confirming the last known state, e.g., "Welcome back! Last time, we fixed the Railway deployment and were about to test the Hotmart connect button. Are you ready to proceed with that?"

---

## 5. Context Recall Prompt

To help me recall context quickly, you can use the following prompt:

> **"Manus, please recall the latest context for the AI Affiliate Marketing System. Use the Context Recall Process defined in `CONTEXT_MANAGEMENT_SOP.md`."

---

## 6. Tools & Implementation

-   **Scheduling:** The 2-hour automatic trigger will be implemented using an internal scheduling mechanism.
-   **Knowledge Base:** My internal vector database will be used for long-term storage and retrieval.
-   **File System:** The `/docs/session-summaries/` directory will be used for human-readable audit trails.
-   **GitHub:** Used for version control and persistence of context documents.

---

This SOP is now active. I will follow it rigorously to ensure I never lose context again.
