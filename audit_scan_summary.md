# Automated Vulnerability Scan Summary - February 2, 2026

## Backend Audit Results

**Status:** ✅ CLEAN - Zero vulnerabilities detected

**Dependencies Scanned:** 267 total dependencies
- Production dependencies: 267
- Development dependencies: 0
- Optional dependencies: 0

**Vulnerability Count:**
- Critical: 0
- High: 0
- Moderate: 0
- Low: 0
- Info: 0

**Conclusion:** Backend dependencies are secure with no known vulnerabilities.

---

## Frontend Audit Results

**Status:** ⚠️ VULNERABILITIES DETECTED - 3 vulnerabilities found

**Dependencies Scanned:** 442 total dependencies
- Production dependencies: 442
- Development dependencies: 0
- Optional dependencies: 0

**Vulnerability Count:**
- Critical: 0
- High: 1
- Moderate: 2
- Low: 0
- Info: 0

---

## Detailed Vulnerability Findings

### 1. CVE-2026-23864: Next.js DoS via React Server Components (HIGH)

**Advisory ID:** 1112653
**Severity:** High (CVSS 7.5)
**Module:** next
**Current Version:** 14.2.35
**Vulnerable Versions:** >=13.0.0 <15.0.8
**Patched Versions:** >=15.0.8
**Recommendation:** Upgrade to version 15.0.8 or later

**Description:**
A vulnerability affects certain React Server Components packages for versions 19.0.x, 19.1.x, and 19.2.x and frameworks that use the affected packages, including Next.js 13.x, 14.x, 15.x, and 16.x using the App Router. The issue is tracked upstream as CVE-2026-23864.

A specially crafted HTTP request can be sent to any App Router Server Function endpoint that, when deserialized, may trigger excessive CPU usage, out-of-memory exceptions, or server crashes. This can result in denial of service in unpatched environments.

**CVSS Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
- Attack Vector: Network
- Attack Complexity: Low
- Privileges Required: None
- User Interaction: None
- Scope: Unchanged
- Confidentiality: None
- Integrity: None
- Availability: High

**CWE:**
- CWE-400: Uncontrolled Resource Consumption
- CWE-502: Deserialization of Untrusted Data

**References:**
- https://github.com/facebook/react/security/advisories/GHSA-83fc-fqcc-2hmg
- https://github.com/vercel/next.js/security/advisories/GHSA-h25m-26qc-wcjf
- https://nvd.nist.gov/vuln/detail/CVE-2026-23864
- https://vercel.com/changelog/summary-of-cve-2026-23864

**Impact:** CRITICAL - This matches the CVE-2026-23864 vulnerability identified in Phase 1 research. Our Next.js 14.2.35 is vulnerable and requires upgrade to 15.0.8+.

---

### 2. CVE-2025-59471: Next.js DoS via Image Optimizer (MODERATE)

**Advisory ID:** 1112593
**Severity:** Moderate (CVSS 5.9)
**Module:** next
**Current Version:** 14.2.35
**Vulnerable Versions:** >=10.0.0 <15.5.10
**Patched Versions:** >=15.5.10
**Recommendation:** Upgrade to version 15.5.10 or later

**Description:**
A DoS vulnerability exists in self-hosted Next.js applications that have `remotePatterns` configured for the Image Optimizer. The image optimization endpoint (`/_next/image`) loads external images entirely into memory without enforcing a maximum size limit, allowing an attacker to cause out-of-memory conditions by requesting optimization of arbitrarily large images.

This vulnerability requires that `remotePatterns` is configured to allow image optimization from external domains and that the attacker can serve or control a large image on an allowed domain.

**CVSS Vector:** CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H
- Attack Vector: Network
- Attack Complexity: High
- Privileges Required: None
- User Interaction: None
- Scope: Unchanged
- Confidentiality: None
- Integrity: None
- Availability: High

**CWE:**
- CWE-400: Uncontrolled Resource Consumption
- CWE-770: Allocation of Resources Without Limits or Throttling

**References:**
- https://github.com/vercel/next.js/security/advisories/GHSA-9g9p-9gw9-jx7f
- https://nvd.nist.gov/vuln/detail/CVE-2025-59471
- https://github.com/vercel/next.js/releases/tag/v15.5.10

**Impact:** MODERATE - Requires specific configuration (remotePatterns) to be exploitable. Need to verify if we use remotePatterns in next.config.js.

---

### 3. CVE-2025-50537: ESLint Stack Overflow (MODERATE)

**Advisory ID:** 1112686
**Severity:** Moderate (CVSS 5.5)
**Module:** eslint
**Current Version:** 8.57.1
**Vulnerable Versions:** <9.26.0
**Patched Versions:** >=9.26.0
**Recommendation:** Upgrade to version 9.26.0 or later

**Description:**
There is a Stack Overflow vulnerability in eslint before 9.26.0 when serializing objects with circular references in `eslint/lib/shared/serialization.js`. The exploit is triggered via the `RuleTester.run()` method, which validates test cases and checks for duplicates. During validation, the internal function `checkDuplicateTestCase()` is called, which in turn uses the `isSerializable()` function for serialization checks. When a circular reference object is passed in, `isSerializable()` enters infinite recursion, ultimately causing a Stack Overflow.

**CVSS Vector:** CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:N/I:N/A:H
- Attack Vector: Local
- Attack Complexity: Low
- Privileges Required: None
- User Interaction: Required
- Scope: Unchanged
- Confidentiality: None
- Integrity: None
- Availability: High

**CWE:**
- CWE-674: Uncontrolled Recursion

**References:**
- https://nvd.nist.gov/vuln/detail/CVE-2025-50537
- https://github.com/eslint/eslint/issues/19646
- https://github.com/eslint/eslint/commit/d683aebc8e0792e4f80bd1488c705c90f22c317e

**Impact:** LOW - This is a development tool vulnerability requiring local access and user interaction. Lower priority but should still be fixed.

---

## Summary

**Total Vulnerabilities:** 3
- **High:** 1 (CVE-2026-23864 - Next.js DoS)
- **Moderate:** 2 (CVE-2025-59471 - Image Optimizer, CVE-2025-50537 - ESLint)

**Critical Action Required:**
The CVE-2026-23864 vulnerability is the most critical finding, matching our Phase 1 research. Next.js 14.2.35 is vulnerable to DoS attacks via React Server Components. Upgrade to Next.js 15.0.8 or higher is required.

**Risk Assessment:**
- **Production Runtime Risk:** HIGH (Next.js DoS vulnerabilities)
- **Development Tool Risk:** MODERATE (ESLint)
- **Configuration-Dependent Risk:** MODERATE (Image Optimizer - depends on remotePatterns usage)
