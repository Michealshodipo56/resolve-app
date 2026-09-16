# Contributing to Resolve App

Thanks for helping improve the Resolve reference web application.

## Development

1. Ensure sibling packages are available:
   - `../resolve-sdk` — build with `npm install && npm run build`
   - `../resolve-indexer` — optional for market discovery
2. From `resolve-app`:
   ```bash
   cp .env.example .env.local
   # fill NEXT_PUBLIC_* values
   npm install
   npm run dev
   ```
3. Before opening a PR:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

## Guidelines

- Do **not** add mock pools, balances, or invented market results as fallbacks when RPC/indexer fails. Surface errors instead.
- Settlement writes always go through `@resolve-protocol/sdk` → Soroban RPC. The indexer is discovery-only.
- Prefer clear loading / empty / error states for every data view.
- Keep the visual language restrained: editorial typography, monochrome + one accent, no purple-glow dashboard aesthetics.

## Pull requests

- Keep changes focused and documented in the PR description.
- Include screenshots for UI changes when practical.
- Link related contract/SDK/indexer issues when applicable.
