# Security Policy

## Supported versions

Security fixes are applied to the latest `main` branch of this repository.

## Reporting a vulnerability

Please report security issues privately to **security@resolve.local**.

Include:

- A description of the issue and its impact
- Steps to reproduce (proof of concept if available)
- Affected commit / release if known

Do **not** open a public GitHub issue for vulnerabilities that could affect user funds, wallet integrations, or transaction signing flows.

We aim to acknowledge reports within a few business days.

## Scope notes

- On-chain settlement logic lives in the Resolve contract and SDK — UI bugs that mislead users about claimable amounts are in scope.
- The indexer is not settlement authority; please still report indexer issues that could cause incorrect discovery displays.
