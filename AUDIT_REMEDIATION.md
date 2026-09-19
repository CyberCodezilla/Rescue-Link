# RescueLink Audit Remediation

This build incorporates the concrete security, reliability, and performance findings from the supplied RescueLink technical audit.

## Remediated

- Removed production dependence on `AWS_ACCESS_KEY_ID` for deciding whether DynamoDB is available. The AWS SDK v3 credential provider chain is used by the DynamoDB client.
- Removed volatile in-memory success fallback for DynamoDB create/update operations. Persistent writes now retry with exponential backoff and fail without reporting success when DynamoDB remains unavailable.
- Added conditional DynamoDB creates to prevent duplicate incident creation races.
- Added explicit HTTP 503 responses when incident persistence is unavailable.
- Removed hardcoded responder API-key fallback and production placeholder secrets. Production API and client keys are required and must be at least 32 characters.
- Added constant-time API-key comparison and reused it for satellite uplink authentication.
- Protected incident acknowledge and broadcast mutation endpoints with API-key authentication.
- Kept SOS rate limiting attached to the SOS creation route.
- Preserved survivor-side `peopleAffected >= 1` normalization.
- Added a functional Bedrock circuit breaker with CLOSED, OPEN, and HALF_OPEN states, failure tracking, cooldown probing, and telemetry.
- Added Bedrock request timeouts using `BEDROCK_TIMEOUT_MS` in both the API and Lambda triage paths.
- Preserved SSE connection cleanup on request close.
- Added `PriorityCreatedAtIndex` and indexed DynamoDB query paths for common status, priority, and multi-status listing patterns.
- Retained paginated DynamoDB scans only for filter combinations that cannot use the configured indexes.
- Changed the survivor offline queue from serial flushing to a four-worker concurrency pool with per-item transient retries and exponential backoff.
- Added CloudFormation configuration for the priority GSI and required production callback/email secrets.

## Validation performed in this environment

- TypeScript source syntax transpilation check: PASS for the complete TypeScript source tree.
- Trailing-whitespace check: PASS.
- Runtime validation of production/development shared config rules: PASS.
- Runtime authentication helper test with mocked dependencies: PASS.
- CloudFormation template structural YAML check with CloudFormation intrinsic tags: PASS.

## Full dependency test limitation

The supplied archive contains no usable installed dependency binaries. The environment has no DNS/network access to the npm registry, so `npm ci` could not complete and Vitest could not be executed. The final package therefore does not claim a full Jest/Vitest, typecheck, or production build run from this environment.

Run the repository's normal verification after dependencies are installed:

```bash
npm ci
npm run typecheck
npm run test
npm run build
```
