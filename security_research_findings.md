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
