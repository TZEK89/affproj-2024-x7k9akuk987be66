# Shai-Hulud 2.0 Attack Indicators

## Attack Mechanism

The Shai-Hulud 2.0 attack works by:

1. **Preinstall Script Injection**: Threat actors add a preinstall script named `setup_bun.js` in the `package.json` of compromised packages
2. **Bun Runtime Installation**: The script checks for Bun runtime binary; if not found, it installs it
3. **Malicious Script Execution**: Bun runtime executes the bundled malicious script `bun_environment.js`
4. **GitHub Actions Runner**: Downloads and installs GitHub Actions Runner archive
5. **Repository Creation**: Configures a new GitHub repository and runner agent called `SHA1Hulud`
6. **Credential Harvesting**: Uses TruffleHog to query the system for stored credentials and retrieve cloud credentials from GitHub, npm, AWS, GCP, and Azure

## Detection Indicators

### File Indicators
- `setup_bun.js` - preinstall script in package.json
- `bun_environment.js` - malicious bundled script
- `SHA1Hulud` - GitHub Actions runner agent name
- TruffleHog executable
- Runner.Listener executable

### Behavioral Indicators
- Preinstall scripts that execute before security checks
- Suspicious usage of the shred command on hidden files
- Command injection to exfiltrate credentials
- Commits authored by fake personas (e.g., "Linus Torvalds")

### Compromised High-Profile Packages
- Zapier
- PostHog
- Postman
- ENS Domains

## Detection Commands

Check for suspicious preinstall scripts:
```bash
grep -r "preinstall" package.json
grep -r "setup_bun" package.json pnpm-lock.yaml
grep -r "bun_environment" package.json pnpm-lock.yaml
grep -r "SHA1Hulud" package.json pnpm-lock.yaml
```

## Project Status
- Need to check for these indicators in both frontend and backend
- Need to verify no suspicious preinstall scripts exist
