# Snapper security scan

Scan of the QIE ID Snap with [Snapper](https://github.com/sayfer-io/Snapper),
as required by MetaMask's
[allowlisting prerequisites](https://docs.metamask.io/snaps/how-to/get-allowlisted/).

| Item            | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| Snap version    | 0.1.1 (`npm:@qie-blockchain/qie-id-snap`)                        |
| Snap commit     | `95dfb7a` (tag `v0.1.1`)                                         |
| Snapper version | 0.19.1 (built from source, commit `66ea315`)                     |
| Date            | 2026-10-30                                                       |
| Scanned path    | `packages/snap` (8 source files)                                 |
| Result          | 14 findings: 13 low (risk 1), 1 medium (risk 3). None actionable |

## Summary

| Detector         | Count | Risk | Verdict                           |
| ---------------- | ----- | ---- | --------------------------------- |
| HardcodedSecrets | 1     | 3    | False positive                    |
| ESLinting        | 13    | 1    | Style rule conflict, not an issue |

No code changes were needed.

## HardcodedSecrets (1)

| File         | Line | Finding                                                   |
| ------------ | ---- | --------------------------------------------------------- |
| `src/rpc.ts` | 55   | Potential hardcoded secret detected: `"application/json"` |

**Verdict: false positive.** The flagged value is the standard HTTP
`Content-Type` header for the JSON-RPC request
(`headers: { 'Content-Type': 'application/json' }`). The Snap contains no
secrets, API keys or credentials. It only calls public QIE Mainnet RPC
endpoints listed in `src/config.ts`.

## ESLinting (13)

All 13 findings are the same rule: "Expected only 0 line after block
description" (`jsdoc/tag-lines`).

| File               | Lines                   |
| ------------------ | ----------------------- |
| `src/address.ts`   | 32, 46, 56, 69, 94, 116 |
| `src/contracts.ts` | 16                      |
| `src/index.ts`     | 9                       |
| `src/networks.ts`  | 60                      |
| `src/resolver.ts`  | 11, 23                  |
| `src/rpc.ts`       | 19, 41                  |

**Verdict: style rule conflict, not a security issue.** Each JSDoc comment
has one blank line between its description and its `@param`/`@returns`
tags. Snapper runs `jsdoc/tag-lines` with its default of 0 blank lines.
The project uses MetaMask's own ESLint config (`@metamask/eslint-config`),
which sets `jsdoc/tag-lines` to `startLines: 1` and so requires that blank
line. Removing it would fail `yarn lint` and CI. The formatting is left as
MetaMask's config requires.

## Other prerequisites checked

- No `console` calls or TODO/FIXME comments in `packages/snap/src`.
- Only two permissions, both used: `endowment:name-lookup` (TLD `qie`) and
  `endowment:network-access`.
- No key-management methods (`snap_getBip32Entropy`, `snap_getBip32PublicKey`,
  `snap_getBip44Entropy`, `snap_getEntropy`, `snap_manageAccounts`), so no
  third-party audit is required.

## Reproducing the scan

The npm package `@sayfer_io/snapper@0.19.1` fails to install
(`Unsupported URL Type "workspace:"`), so build it from source:

```shell
git clone --depth 1 https://github.com/sayfer-io/Snapper.git
cd Snapper
npm ci --ignore-scripts
npx tsc
node dist/main.js --path /path/to/qie-id-snap/packages/snap --output results.json
```
