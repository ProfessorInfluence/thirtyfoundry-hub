# Project rules

## Autonomy boundaries

Automation may create local branches, application source, tests, documentation, and tracker records. It may publish only when the configured GitHub, Stripe, and hosting credentials are present and explicitly scoped. It never invents credentials, buys domains, changes billing settings, deletes remote resources, or contacts customers.

## Security

- Keep secrets in environment variables or the host's secret manager, never in this tracker.
- Accept payment only from a signature-verified Stripe webhook; a redirect is not proof.
- Store license hashes, not raw keys, and never log a complete key.
- Minimize customer data to Stripe customer ID, plan, expiry, and entitlement records.
- Require a constant-time-checked admin key for revocation.
- Validate all untrusted input and apply request-size and rate limits.

## Failure recovery

Each day is a state machine: `selected → build → test → monetize → publish → integrate → report → complete`. A phase is written atomically before and after execution. A failed phase records its error, attempt count, and next retry time. Reruns resume the first non-complete phase, reuse known resources, and never allocate the same day twice. After bounded exponential retries, status becomes `blocked`; an operator may repair configuration and rerun. Day 30 retires the runner.
