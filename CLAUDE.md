# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A MetaMask Snap that resolves QIE IDs (`alice.qie`) to the owner's address on the network the user is sending on. Yarn 3 workspace monorepo (Node 20+, `corepack enable`):

- `packages/snap` — the Snap (`@qie-blockchain/qie-id-snap`), the only package published to npm.
- `packages/site` — Gatsby install page. `SNAP_ORIGIN` env var selects the Snap; defaults to `local:http://localhost:8080`, and `.env.production.dist` points at the npm package.

Design rationale and open questions live in `docs/implementation-plan.md`. The npm publish and MetaMask allowlisting process is in `docs/publishing.md`.

## Commands

```shell
yarn start        # Snap at :8080 (mm-snap watch) + site at :8000
yarn build        # build both; also rewrites snap.manifest.json shasum/version
yarn test         # Snap tests (jest). Requires `yarn build` first — index.test.ts uses installSnap(), which loads dist/bundle.js
yarn lint         # ESLint + Prettier check
yarn lint:fix

# Single test file / test name (run from packages/snap)
yarn workspace @qie-blockchain/qie-id-snap jest src/resolver.test.ts
yarn workspace @qie-blockchain/qie-id-snap jest -t 'resolves a QIE ID'

# Live test: built Snap against QIE Mainnet (skipped unless QIE_LIVE=1).
# Optional: QIE_LIVE_DOMAIN (default anish.qie), QIE_LIVE_ADDRESS to pin the expected address
QIE_LIVE=1 yarn workspace @qie-blockchain/qie-id-snap jest src/index.live.test.ts
```

CI (`.github/workflows/build-lint-test.yml`) fails if the working tree is dirty after build/lint/test, so commit the regenerated `snap.manifest.json` shasum after any change to Snap source.

Install scripts are blocked by LavaMoat; enabling one requires `yarn allow-scripts auto` and an entry under `lavamoat.allowScripts` in the root `package.json`.

## Snap architecture (`packages/snap/src`)

Single entry point: `onNameLookup` in `index.ts` (permission `endowment:name-lookup` for TLD `qie`). Only forward lookup (domain → address) is supported; address lookups return `null`. Any error, including all RPCs failing, is reported as `null` (no resolution).

Lookup flow, one module per layer:

1. `networks.ts` — `getNetwork(chainId)` maps a CAIP-2 chain ID to a `Network` = ordered record keys + address parser. All `eip155:*` chains share `['evm', 'qie']` (`qie` is a legacy key); Solana, Bitcoin (mainnet/testnets) and TRON chains are an explicit allowlist. Unsupported chain → `null`.
2. `resolver.ts` — `normalizeDomain` (trim, lowercase, `^[a-z0-9-]+\.qie$`; contract lookups are case-sensitive). `resolveDomain` queries every (record key × metadata contract) pair in parallel, picks the first non-empty, non-zero-address value in priority order (keys first, then contracts in `METADATA_CONTRACTS` order: free/wallet IDs before premium/Hovr IDs), then validates it with the network's parser.
3. `contracts.ts` — `getRecord` ABI-encodes `resolveMetadata(string,string)` and decodes the string result.
4. `rpc.ts` — `ethCall` posts raw JSON-RPC `eth_call` to QIE Mainnet, falling back through `QIE_RPC_URLS` with a per-request timeout. An execution revert (code 3) means "no record" (`null`), not a failure.
5. `address.ts` — per-chain validators; a resolved value that doesn't match the target chain's format is dropped. EVM addresses are returned checksummed.

All on-chain constants (RPC URLs, contract addresses, timeout, protocol name) are in `config.ts`. All resolution, regardless of the target chain, reads from QIE Mainnet.

Tests mock the layer below (`jest.mock('./resolver')`, `'./contracts'`, `'./rpc'`, or `globalThis.fetch`), so each module is tested in isolation.

## Releasing

Bump `version` in `packages/snap/package.json` and add a `CHANGELOG.md` entry, run `yarn build` (syncs manifest version and shasum), then `cd packages/snap && npm publish`. A new version must be allowlisted via the Snaps Directory update form before users can install it. If permissions change, update the permission/privacy tables in `packages/snap/README.md`.
