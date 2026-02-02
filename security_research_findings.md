# Security Research Findings - January 19, 2026

## Phase 1: Intelligence Gathering & Reconnaissance

### Recent React Server Components Vulnerabilities

**CVE-2025-55184** (CVSS 7.5, HIGH severity)
- **Description**: Denial of Service through unsafe deserialization in React Server Components
- **Affected Versions**: React 19.0.0-19.2.1
- **Attack Vector**: Pre-authentication DoS via recursive Promise deserialization
- **Impact**: Server hangs through infinite recursion in Node.js microtask queue
- **Patched Versions**: React 19.0.3+, 19.1.4+, 19.2.3+

**CVE-2025-55183** (CVSS 5.3, MEDIUM severity)
- **Description**: Server function source code exposure through toString coercion
- **Affected Versions**: React 19.0.0-19.2.1
- **Attack Vector**: Crafted HTTP requests to Server Function endpoints
- **Impact**: Exposes backend business logic, API endpoints, and hardcoded secrets
- **Patched Versions**: React 19.0.3+, 19.1.4+, 19.2.3+
- **Note**: Confirmed active exploitation despite lower severity rating

### Next.js Impact

**Affected Next.js Versions**: 13.x through 16.x (App Router only)
- Next.js 13.x: Upgrade to 13.5.8+ (if still supported)
- Next.js 14.x: Upgrade to 14.2.35+
- Next.js 15.x: Upgrade to 15.0.7+
- Next.js 16.x: Upgrade to 16.0.10+

**Important Notes**:
- Pages Router applications are NOT affected
- Only App Router feature is vulnerable
- React Server Components are bundled inside Next.js
- Check Next.js version, not just React version

### React Router Vulnerability

**CVE-2025-61686** (CVSS 8.8, CRITICAL severity)
- **Description**: XSS via Open Redirects in React Router
- **Affected Versions**: @react-router/node 7.0.0 through 7.9.3
- **Impact**: Allows attackers to create redirect paths from untrusted content
- **Patched Versions**: 7.9.4+

### Node.js Vulnerabilities

**CVE-2025-59466** (HIGH severity)
- **Description**: DoS vulnerability in async_hooks causing server crashes
- **Released**: January 13, 2026 security release
- **Impact**: Memory leaks and crashes in production apps
- **Affected Versions**: Multiple Node.js versions
- **Patched Versions**: Latest 25.x, 24.x, 22.x, 20.x releases

**Additional Node.js Issues** (January 2026 release):
- 3 high severity issues
- 4 medium severity issues
- Total of 8 vulnerabilities addressed

### Supply Chain Threats (Recent Context)

Based on historical context from previous audits:
- **Shai-Hulud worm**: Known malicious package campaign
- **"is" package hijacking**: Supply chain attack on popular utility
- **Malicious VS Code extensions**: Development environment threats

### Key Learnings Applied

1. **React Server Components Confusion**: The vulnerability affects react-server-dom-* packages bundled inside Next.js, not standalone React installations
2. **Version Verification**: Always check Next.js version (14.2.35+) rather than just React version
3. **Sub-dependencies**: Use pnpm.overrides for forcing secure versions when needed
4. **Development vs Production**: Distinguish risk levels but fix both
5. **Zero Tolerance Goal**: Aim for zero vulnerabilities

### Official Security Advisories Reviewed

- React official security advisory (December 11, 2025)
- Next.js security update
- Node.js January 2026 security releases
- Multiple security research blogs and CVE databases

### Timeline of Disclosures

- December 3, 2025: Initial CVE-2025-55182 disclosure
- December 11, 2025: CVE-2025-55184 and CVE-2025-55183 disclosed
- December 11, 2025: Initial incomplete patches released
- Follow-up: Complete patches (19.0.3, 19.1.4, 19.2.3) released
- January 13, 2026: Node.js security releases
- January 15, 2026: Updated security guidance published

### Risk Assessment for Our Project

**Critical Packages to Monitor**:
- next (currently 14.2.35 - need to verify)
- react (currently 18.2.0 - need to verify)
- react-dom (currently 18.2.0 - need to verify)
- @supabase/supabase-js
- playwright
- openai

**Expected Findings**:
- Next.js 14.2.35 should be patched (if at this version)
- React 18.x is NOT affected (vulnerabilities are in React 19.x)
- Need to check for React Router if used
- Need to verify Node.js runtime version
- Check for any sub-dependency vulnerabilities


## Recent npm Supply Chain Attacks (December 2025 - January 2026)

### NeoShadow Campaign (December 30, 2025)

**Malicious Typosquatting Packages**:
- `viem-js` (typosquatting viem)
- `cyrpto` (typosquatting crypto)
- `tailwin` (typosquatting tailwind)
- `supabase-js` (typosquatting @supabase/supabase-js)

**Author**: cjh97123
**Attack Vector**: Windows-only multi-stage loader with blockchain C2 infrastructure
**Techniques**:
- Anti-analysis heuristics (Windows Event Log counting)
- Dynamic C2 configuration via Ethereum smart contract
- MSBuild-based living-off-the-land execution
- Process injection into RuntimeBroker.exe
- RC4 encryption for payload obfuscation

**Risk Level**: HIGH - Sophisticated attack targeting Windows development environments

### Shai-Hulud 3.0 (December 2025)

**Description**: npm supply chain worm with improved obfuscation
**Attack Vector**: Install-time scripts to steal secrets
**Techniques**: Enhanced persistence and obfuscation compared to previous versions
**Status**: Active threat

### n8n Community Nodes Attack (January 2026)

**Malicious Package**: n8n-nodes-google-ads (fake Google Ads integration)
**Target**: n8n workflow automation ecosystem
**Attack Vector**: OAuth token theft via trusted workflow integrations
**Impact**: Credential storage compromise

### Hash Validation Package Attacks (January 2026)

**Target**: Popular hash validation libraries
**Duration**: Multiple months of undetected compromise
**Impact**: Crypto asset theft
**Status**: Recently disclosed

### Phishing Infrastructure Campaign (December 2025 - January 2026)

**Scale**: 27+ malicious npm packages over 5 months
**Purpose**: Spear-phishing infrastructure hosting
**Technique**: Abuse of trusted developer platforms for browser-based phishing
**Target**: Credential theft

### Known Malicious Package Names to Check

From NeoShadow campaign:
- viem-js
- cyrpto
- tailwin
- supabase-js (NOT the legitimate @supabase/supabase-js)

From n8n attack:
- n8n-nodes-google-ads

Historical threats (from previous audits):
- Shai-Hulud related packages
- "is" package (if hijacked version)

### Detection Strategy

1. Check for exact package name matches against known malicious packages
2. Verify legitimate package scopes (e.g., @supabase/ vs supabase-)
3. Review install scripts in package.json
4. Check package author reputation and history
5. Verify package download counts and age

### Key Takeaway

The npm ecosystem is experiencing an industrialization of supply chain attacks, with sophisticated threat actors using:
- Typosquatting of popular packages (especially crypto, blockchain, and framework utilities)
- Advanced obfuscation and anti-analysis techniques
- Blockchain-based C2 infrastructure
- Living-off-the-land binaries (MSBuild, etc.)
- Multi-stage payloads with dynamic configuration


---

## UPDATE: February 2, 2026 - New React Server Components Vulnerability

### CVE-2026-23864: React Server Components DoS Vulnerability (NEW)

**Severity:** High (CVSS 7.5/10)
**Published:** January 26, 2026
**Status:** CRITICAL - Incomplete fixes from previous CVE-2025-55184

### Key Finding
The fixes to address DoS in React Server Components (from December 2025) were **incomplete**. Multiple denial of service vulnerabilities still exist in React Server Components.

### Affected Packages
- `react-server-dom-webpack` versions 19.0.0 - 19.2.3
- `react-server-dom-parcel` versions 19.0.0 - 19.2.3
- `react-server-dom-turbopack` versions 19.0.0 - 19.2.3

### Patched Versions
- 19.0.4, 19.1.5, 19.2.4 (released January 26, 2026)

### Description
The vulnerabilities are triggered by sending specially crafted HTTP requests to Server Function endpoints, and could lead to:
- Server crashes
- Out-of-memory exceptions
- Excessive CPU usage

### Attack Vector
- **Attack Vector:** Network
- **Attack Complexity:** Low
- **Privileges Required:** None
- **User Interaction:** None
- **Scope:** Unchanged
- **Confidentiality:** None
- **Integrity:** None
- **Availability:** High

### Weaknesses
- CWE-400: Uncontrolled Resource Consumption
- CWE-502: Deserialization of Untrusted Data

### Impact on Our Project
**CRITICAL NOTE:** These vulnerabilities affect React 19.x Server Components packages. Our project uses Next.js 14.x which bundles React 18.x, NOT React 19.x. 

**Verification Required:**
1. Confirm Next.js version is 14.2.35 or higher (patched for previous CVEs)
2. Confirm React version is 18.x, not 19.x
3. Verify no react-server-dom-* packages are present in dependencies
4. Check if Next.js has issued any updates related to CVE-2026-23864

### References
- GitHub Advisory: https://github.com/facebook/react/security/advisories/GHSA-83fc-fqcc-2hmg
- CVE ID: CVE-2026-23864
- Published: January 26, 2026

### Timeline Update
- December 2025: CVE-2025-55184, CVE-2025-55183 disclosed
- December 2025: Initial patches released (19.0.3, 19.1.4, 19.2.3)
- January 26, 2026: **NEW** CVE-2026-23864 disclosed - previous fixes incomplete
- January 26, 2026: New patches released (19.0.4, 19.1.5, 19.2.4)


### Next.js Impact - CVE-2026-23864

**Affected Next.js Versions:**
- Next.js 13.x: All versions >=13.0.0 <15.0.8
- Next.js 14.x: All versions >=13.0.0 <15.0.8
- Next.js 15.x: Versions >=15.0.0 <15.6.0-canary.61
- Next.js 16.x: Versions >=16.0.0 <16.1.5

**Patched Next.js Versions:**
- 15.0.8, 15.1.12, 15.2.9, 15.3.9, 15.4.11, 15.5.10, 15.6.0-canary.61
- 16.0.11, 16.1.5

**CRITICAL FOR OUR PROJECT:**
Our project uses Next.js 14.x. According to the advisory, **ALL Next.js 14.x versions are affected** (>=13.0.0 <15.0.8). The minimum patched version is **15.0.8**, which means:

1. **Next.js 14.2.35 is NOT patched for CVE-2026-23864**
2. **We must upgrade to Next.js 15.0.8 or higher**
3. This is a breaking change from Next.js 14 to 15

**Vulnerability Details:**
- Affects App Router Server Function endpoints only
- Pages Router is NOT affected
- Specially crafted HTTP requests can trigger:
  - Excessive CPU usage
  - Out-of-memory exceptions
  - Server crashes
- Results in denial of service

**Action Required:**
1. Verify current Next.js version in frontend/package.json
2. Assess feasibility of upgrading from Next.js 14 to 15
3. Review Next.js 15 breaking changes
4. If upgrade is not immediately feasible, consider:
   - Implementing rate limiting
   - Adding request validation
   - Monitoring for DoS patterns
   - Temporary WAF rules

### References
- Next.js Advisory: https://github.com/vercel/next.js/security/advisories/GHSA-h25m-26qc-wcjf
- React Advisory: https://github.com/facebook/react/security/advisories/GHSA-83fc-fqcc-2hmg


---

## PackageGate: Zero-Day Vulnerabilities in Package Managers (January 2026)

**Published:** January 26, 2026
**Severity:** Critical - Multiple RCE and Supply Chain Attack Vectors

### Overview
Six zero-day vulnerabilities were discovered across npm, pnpm, vlt, and Bun package managers that bypass `--ignore-scripts` and lockfile protections. These vulnerabilities enable arbitrary code execution even with security features enabled.

### CVE-2026-23890: pnpm Path Traversal Vulnerability

**Status:** PATCHED
**Severity:** High
**Description:** A path traversal vulnerability in pnpm allows remote attackers to exploit malicious npm packages.

### pnpm Vulnerabilities (CVE-2025-69263, CVE-2025-69264)

**Status:** PATCHED by pnpm
**Vulnerability:** Scripts disabled by default bypass
**Details:** pnpm v10 introduced "scripts disabled by default" as a security feature, but this only applies to the build phase. Git dependencies go through a separate fetch phase where prepare, prepublish, and prepack scripts run unconditionally without any security checks.

**Attack Vector:** An attacker publishes a git dependency with a prepare script, and it executes without any prompt or warning, bypassing the onlyBuiltDependencies allowlist.

### npm Git Configuration RCE

**Status:** UNPATCHED - npm (Microsoft) closed report as "Works as expected"
**Severity:** Critical - Full RCE
**Vulnerability:** Git configuration option abuse for arbitrary code execution

**Details:** npm has a git configuration option that specifies which git binary to use. When installing a git dependency, npm clones the repo and runs npm install inside it, loading any .npmrc file present. An attacker can create a git dependency containing a malicious .npmrc that points `git=./malicious-script.sh`, plus a nested git dependency. When npm processes that nested dependency, it runs the attacker's script instead of git.

**Impact:** Full RCE, even with `--ignore-scripts` enabled. Evidence exists that actors have published proof-of-concept exploits creating reverse shells using this technique.

### Remote Dynamic Dependencies (RDD) Attack

**Affected:** pnpm and vlt (both patched)
**Vulnerability:** HTTP tarball dependencies stored without integrity hashes

**Details:** pnpm and vlt stored HTTP tarball dependencies (remote dynamic dependencies) without integrity hashes. These URLs pointing to tarballs hosted anywhere get recorded in the lockfile by URL alone, with nothing to verify the content.

**Attack Scenario:**
1. Malicious dependency points to an HTTP tarball
2. Server returns different code on each request
3. First install: benign code that passes security review
4. Second install in CI: malicious payload
5. Lockfile is committed, URL unchanged, but code is completely different

**Real-World Example:** PhantomRaven campaign (October 2025) used RDD to hide malicious code from every security scanner on npm, gaining over 86,000 downloads.

### Impact on Our Project

**CRITICAL CONCERNS:**

1. **npm RCE Vulnerability:** This is UNPATCHED and npm has refused to fix it. We use npm/pnpm for package management. Any git dependency in our dependency tree could potentially exploit this.

2. **pnpm Vulnerabilities:** We use pnpm. Need to verify we're on the latest patched version that includes fixes for CVE-2025-69263 and CVE-2025-69264.

3. **Lockfile Integrity:** Our pnpm-lock.yaml files may contain remote dynamic dependencies without integrity hashes if we're on an older pnpm version.

### Mitigation Actions Required

1. **Update pnpm immediately** to the latest version with PackageGate patches
2. **Audit all git dependencies** in both frontend and backend
3. **Check for HTTP tarball dependencies** in lockfiles
4. **Review .npmrc files** for suspicious git configuration
5. **Consider switching away from git dependencies** where possible
6. **Implement additional security scanning** for dependency sources

### References
- PackageGate Research: https://www.koi.ai/blog/packagegate-6-zero-days-in-js-package-managers-but-npm-wont-act
- CVE-2026-23890 (pnpm path traversal)
- CVE-2025-69263 (pnpm script bypass)
- CVE-2025-69264 (pnpm script bypass)
