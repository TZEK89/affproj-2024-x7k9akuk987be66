# Standard Operating Procedure (SOP): Dependency Security Audit

**Author:** Manus AI  
**Date:** December 17, 2025  
**Version:** 1.0

---

## 1. Objective

To conduct a comprehensive security audit of all project dependencies (frontend and backend) to identify, assess, and remediate vulnerabilities. This SOP ensures a consistent, thorough, and proactive approach to maintaining the security of the software supply chain.

This document serves as a reusable prompt. When this SOP is provided, execute all steps outlined below.

---

## 2. Trigger

This security audit should be triggered under the following conditions:

-   **On-Demand:** Whenever a user requests a security audit.
-   **After Major Dependency Changes:** After adding or updating a significant number of packages.
-   **Scheduled:** On a regular, predefined schedule (e.g., weekly or bi-weekly) for continuous monitoring.

---

## 3. Audit Protocol: Step-by-Step Execution

### Phase 1: Intelligence Gathering & Reconnaissance

**Objective:** To understand the current threat landscape and identify any high-priority vulnerabilities that may affect the project's specific technology stack.

1.  **Research Recent Advisories:**
    -   Conduct a web search for recent security vulnerabilities related to the project's core technologies (e.g., "React security vulnerabilities", "Next.js vulnerabilities", "npm supply chain attacks").
    -   Filter search results to the last 30-60 days to focus on recent threats.
    -   Pay close attention to official security blogs from major vendors (e.g., React, Next.js, Node.js) and reputable security news sites.

2.  **Identify High-Impact CVEs:**
    -   From the research, identify any critical or high-severity CVEs (Common Vulnerabilities and Exposures) that have been announced.
    -   For each high-impact CVE, document the affected package names, vulnerable versions, and patched versions.

3.  **Check for Known Malicious Packages:**
    -   Search for reports of recently hijacked or malicious packages (e.g., "Shai-Hulud worm packages", "npm malware December 2025").
    -   Create a list of known malicious package names to check against the project's dependencies.

### Phase 2: Automated Vulnerability Scanning

**Objective:** To use built-in package manager tools to automatically scan for known vulnerabilities in the project's dependency tree.

1.  **Audit Backend Dependencies:**
    -   Navigate to the `backend` directory.
    -   Run the command: `pnpm audit --json > backend_audit.json`
    -   Analyze the resulting JSON file for any vulnerabilities.

2.  **Audit Frontend Dependencies:**
    -   Navigate to the `frontend` directory.
    -   Run the command: `pnpm audit --json > frontend_audit.json`
    -   Analyze the resulting JSON file for any vulnerabilities.

### Phase 3: Manual Verification & Analysis

**Objective:** To manually verify the findings from the automated scan and cross-reference them with the intelligence gathered in Phase 1.

1.  **Verify Critical Framework Versions:**
    -   Manually inspect the `package.json` files (frontend and backend).
    -   Check the versions of critical frameworks (e.g., `next`, `react`, `react-dom`) against the patched versions identified in Phase 1.

2.  **Analyze Audit Reports:**
    -   For each vulnerability found in the `pnpm audit` reports, assess its real-world impact on the project.
    -   **Distinguish between development and production dependencies.** A vulnerability in a development tool (like ESLint) is less critical than one in a production runtime package, but should still be fixed.
    -   Determine the dependency path to understand how the vulnerable package is being introduced.

3.  **Check for Known Malicious Packages:**
    -   Run a `grep` command across both `package.json` files to search for any of the known malicious package names identified in Phase 1.

### Phase 4: Remediation & Patching

**Objective:** To fix all identified vulnerabilities in a safe and structured manner.

1.  **Attempt Automated Fixes:**
    -   For each project (frontend and backend), run `pnpm audit --fix`.
    -   This command will attempt to automatically update vulnerable packages or create overrides.

2.  **Apply Manual Updates (if necessary):**
    -   If `pnpm audit --fix` does not resolve all issues, manually update the affected packages using `pnpm update <package_name> --latest`.
    -   If a direct update is not possible without causing breaking changes, use `pnpm.overrides` in `package.json` to force a secure version of the sub-dependency.

3.  **Verify the Fix:**
    -   After applying fixes, run `pnpm install` to ensure the changes are applied.
    -   Run `pnpm audit` again to confirm that there are zero vulnerabilities remaining.

4.  **Regression Testing (Optional but Recommended):**
    -   Run any available tests (e.g., `npm test`, `npx tsc --noEmit`) to ensure that the dependency updates have not introduced any breaking changes.

### Phase 5: Reporting & Documentation

**Objective:** To provide a clear, comprehensive report of the audit findings and the actions taken.

1.  **Create a Security Audit Report:**
    -   Generate a new Markdown document (e.g., `DEPENDENCY_SECURITY_AUDIT_YYYY-MM-DD.md`).
    -   The report must include:
        -   An **Executive Summary** with the overall status (e.g., "Secure & Patched").
        -   A summary of the **Research Findings** from Phase 1.
        -   A detailed breakdown of the **Vulnerabilities Found** in each project (frontend/backend).
        -   A clear explanation of the **Solutions Implemented** for each vulnerability.
        -   A final **Conclusion** confirming the security of the dependencies.

2.  **Commit Changes:**
    -   Commit all changes (`package.json`, `pnpm-lock.yaml`, etc.) to the Git repository with a clear commit message (e.g., "Fix: Security audit and dependency vulnerability fixes").

3.  **Deliver the Report:**
    -   Present the final report to the user, attached to the message, with a concise summary of the outcome.

