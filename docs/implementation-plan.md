# QIE ID Name Resolution Snap — Implementation Plan

**Goal:** a MetaMask Snap that resolves QIE IDs (for example `anish.qie`) to the right wallet address for the network the user is sending on. Reverse resolution (address → QIE ID) is out of scope for now.

**Source of truth:** the QIE web extension (`../web-extension`, v4.2.3, commit `5bb4432c`). Its contracts, keys and networks are reused here unchanged.

---

## 1. How the extension resolves a QIE ID today

### 1.1 Forward resolution (name → address)

Forward resolution is one `view` call on **QIE Mainnet (chainId 1990 / `0x7C6`)**:

```solidity
function resolveMetadata(string domain_, string key_) view returns (string)
```

- **`domain_`:** the full plain name, e.g. `"anish.qie"`. No namehash, no label/zone split.
- **`key_`:** a plain network string. See the key table in 1.2.
- **Return value:** the address as a string. **Unset** comes back as `""` or `0x0000000000000000000000000000000000000000`.
- **Contracts:** two Metadata contracts. Query both and take the first non-empty result. The Hovr contract **reverts** (`"Metadata:domain expired"`) for wallet-type domains, so treat a revert as "not found here" (extension: `Promise.allSettled`).

| Contract                              | Address                                      |
| ------------------------------------- | -------------------------------------------- |
| Metadata (Wallet), free domains       | `0x8777d01d509D0eA71FB38F88F79867da558d5018` |
| Metadata (Hovr), paid/premium domains | `0xCFBcBCA93c607590b211c81C7DBcdbd7eD6CC6ED` |
| Default Domain Resolver (reverse)     | `0x76ec8ed377cC0d36D1B48027ac7892Ec6799171E` |

The addresses are hardcoded in `core/services/contract/contract-registry.ts:27-74`. The core logic is in `core/services/domain/domain.service.ts:862-933`, and the ABI in `core/services/contract/abis/metadata.ts:101-110`.

### 1.2 Network → key mapping

From `ui/app/pages/send/_utils/chain-to-currency.ts`:

| Network family                                                                                                    | Key       | Notes                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| **All EVM chains** (QIE, Ethereum, Polygon, BSC, Arbitrum, Avalanche, Celo, Cronos, Base, OP, and their testnets) | `evm`     | Fall back to `qie`, a legacy key that the settings page also writes the EVM address to |
| Bitcoin (mainnet + testnet4)                                                                                      | `bitcoin` | Paid domains only                                                                      |
| Solana (mainnet + devnet)                                                                                         | `solana`  | Paid domains only                                                                      |
| TRON (mainnet + Nile)                                                                                             | `tron`    | Paid domains only                                                                      |
| XRP Ledger                                                                                                        | `xrp`     | Paid domains only                                                                      |
| TON                                                                                                               | `ton`     | Paid domains only                                                                      |

Free (wallet-type) domains can only set `evm`. Testnets share their mainnet's key. Resolution itself **always** runs against QIE Mainnet, whatever network the user is sending on.

### 1.3 Reverse resolution (address → name)

`resolve(address owner_) view returns (string)` on the Default Domain Resolver. An empty string means no default name.

### 1.4 QIE RPC

- **Mainnet RPCs:** `https://rpc1mainnet.qie.digital` through `rpc4mainnet`.
- **Explorer:** `https://mainnet.qie.digital`.
- The extension rotates RPCs on network errors but not on reverts.

---

## 2. How MetaMask name resolution works

| Item                | Detail                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entry point         | `onNameLookup` (`OnNameLookupHandler` from `@metamask/snaps-sdk`)                                                                                                                                                  |
| Request             | `{ chainId, domain?, address? }`. `chainId` is CAIP-2 (`eip155:1`, `eip155:1990`, …). Exactly one of `domain` / `address` is set                                                                                   |
| Forward result      | `{ resolvedAddresses: [{ resolvedAddress, protocol, domainName }] }`                                                                                                                                               |
| Reverse result      | `{ resolvedDomains: [{ resolvedDomain, protocol }] }`                                                                                                                                                              |
| No match            | `null`                                                                                                                                                                                                             |
| Manifest permission | `endowment:name-lookup` with `matchers.tlds: ["qie"]` and optional `chains`; `maxRequestTime` caveat (5–180 s, default 60 s)                                                                                       |
| Network calls       | `endowment:network-access` exposes `fetch`                                                                                                                                                                         |
| Allowlisting        | `endowment:name-lookup` and `endowment:network-access` are **protected**. Production users can install the Snap only after MetaMask allowlists it. Development and testing work on **MetaMask Flask** without that |

**Key design point:** MetaMask passes the chain in `chainId`, so the Snap derives the QIE key from the CAIP-2 namespace:

```
eip155:*                                   -> "evm"  (fallback "qie")
solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp    -> "solana"   (mainnet)
solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1    -> "solana"   (devnet)
bip122:000000000019d6689c085ae165831e93    -> "bitcoin"  (mainnet)
bip122:00000000da84f2bafbbc53dee25a72ae    -> "bitcoin"  (testnet4)
tron:728126428                             -> "tron"
anything else                              -> null (do not resolve)
```

> ⚠️ **Unknowns to verify on Flask (Phase 0).** The docs do not say whether MetaMask runs name lookup in its **non-EVM send flows** (Solana / Bitcoin / Tron). They also don't confirm whether `chainId` is the **selected network** or the **chain of the asset being sent** in the newer multichain send screen. XRP and TON aren't MetaMask networks today, so those keys won't be reachable from MetaMask. Keep them in the mapping table anyway, so they work if support is added later.

---

## 3. Architecture

```
MetaMask send field ("anish.qie")
        │  onNameLookup({ chainId: "eip155:137", domain: "anish.qie" })
        ▼
┌─────────────────────── QIE ID Snap ───────────────────────┐
│ 1. normalize(domain)      trim, lowercase, validate *.qie │
│ 2. getNetwork(chainId)    CAIP-2 → "evm" | "solana" | …    │
│ 3. resolveMetadata ×2     Wallet + Hovr, in parallel      │
│      eth_call via fetch → QIE RPC (rotating rpc1-4)       │
│ 4. EVM: retry with "qie" key if "evm" empty               │
│ 5. validateAddress(key, value)                            │
│ 6. return { resolvedAddresses: [...] } or null            │
└───────────────────────────────────────────────────────────┘
```

- **Use direct JSON-RPC over `fetch`, not `endowment:ethereum-provider`.** That provider talks to whatever network the user has selected, not QIE.
- **No secrets in the bundle.** Use only the public QIE RPCs, not the authenticated wallet-backend RPC override.
- **No cache.** A stale address can send funds to the wrong place.

### Layout (from `@metamask/create-snap`)

```
packages/
  snap/
    snap.manifest.json
    snap.config.ts
    images/icon.svg
    src/
      index.ts        # onNameLookup handler
      config.ts       # contract addresses, RPC URLs, protocol label
      networks.ts     # CAIP-2 chain → record keys + address parser
      resolver.ts     # name normalization and resolution
      contracts.ts    # ABI encoding/decoding of the QIE ID contract calls
      rpc.ts          # eth_call over fetch with endpoint failover
      address.ts      # per-network address validation
  site/               # companion install page
```

### Manifest permissions

```json
"initialPermissions": {
  "endowment:name-lookup": {
    "matchers": { "tlds": ["qie"] },
    "maxRequestTime": 15000
  },
  "endowment:network-access": {}
}
```

Omit `chains` so MetaMask calls the Snap on every network, and filter in `getNetwork`. Every EVM chain resolves the same `evm` key, so a chain allowlist adds maintenance without adding safety. Request no other permissions: allowlisting reviewers reject unused ones.

`maxRequestTime` is 15 s: a lookup makes one round of parallel calls, and each call may try four endpoints with a 3 s timeout.

### Libraries

- `@metamask/abi-utils` and `@metamask/utils` for ABI encoding, hex and CAIP helpers, and EIP-55 checksums.
- `@scure/base` and `@noble/hashes` (audited, already used by MetaMask) for base58check and bech32 validation.
- Dependencies are pinned to exact versions, per the [security guidelines](https://docs.metamask.io/snaps/learn/best-practices/security-guidelines/).

---

## 4. Detailed behaviour

### 4.1 Forward lookup

1. If `domain` is missing (an address lookup), return `null`.
2. **Normalize:** `trim()`, `toLowerCase()`. It must match `^[a-z0-9-]+\.qie$`. The extension's registration UI only allows `a-z0-9-` (premium names: `a-z0-9`) and min length 2–3, so lowercasing is safe.
3. `network = getNetwork(chainId)`. If `null`, return `null`.
4. Call `resolveMetadata(name, key)` on **both** Metadata contracts in parallel (`Promise.all`; a revert resolves to `null`). Prefer the Wallet result, then Hovr. Treat a revert, `""` or the zero address as empty.
5. If the key is `evm` and both are empty, repeat with key `qie`.
6. **Validate the address format** for that key. The extension's send flow doesn't, so the Snap must. Port the validators from `ui/app/pages/domain/domain-settings.tsx:75-169`:
   - EVM: `isAddress`, and return the checksummed form.
   - Solana: base58, 32 bytes.
   - Bitcoin: bech32 `bc1…`, or a base58check P2PKH/P2SH address. Use the testnet prefixes `tb1`/`m`/`n`/`2` when the chain is testnet4.
   - TRON: `T…` base58check, version byte `0x41`.
7. Return `{ resolvedAddresses: [{ resolvedAddress, protocol: "QIE ID", domainName: name }] }`. Otherwise return `null`.

### 4.2 Reverse lookup

Not supported for now. Address lookups return `null`. If it is added later, use `resolve(address)` on the Default Domain Resolver and only return a name that forward-resolves back to the same address, since anyone can set a default name.

### 4.3 RPC client

- **Body:** `POST` with `{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{to,data},"latest"]}`.
- **Order:** try `rpc1mainnet` through `rpc4mainnet` in turn.
- **Failover:** move to the next RPC on network errors, timeouts or HTTP 5xx. **Don't** fail over on a JSON-RPC execution revert; treat that as "empty".
- **Timeout:** 3 s per attempt (`AbortSignal.timeout`), so the whole lookup stays under `maxRequestTime`.
- **CORS:** Snap requests have a `null` origin, so the RPC must answer with `Access-Control-Allow-Origin: *`. All four QIE RPCs do (checked 2026-10-19).

### 4.4 Errors

- Never throw to MetaMask. Return `null` on any failure; MetaMask then shows "no resolution".
- No console logging in the Snap source.
- Strip all `console.*` calls before publishing. Allowlisting requires this.

---

## 5. Phased delivery

| Phase                  | Work                                                                                                                                                                                                                                                                                                 | Output                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **0. Spike (½–1 day)** | Minimal Snap on Flask that logs every `onNameLookup` request. Test: EVM networks (Ethereum, Polygon, QIE 1990), Solana, Bitcoin, the new multichain send; uppercase input; does the send field lowercase input; how `domainName` is displayed                                                        | Confirmed `chainId` behaviour + list of networks where lookup actually fires |
| **1. Scaffold**        | `npx @metamask/create-snap`, set `proposedName: "QIE ID"` (must not contain "MetaMask"/"Snap"), icon SVG, manifest permissions above                                                                                                                                                                 | Buildable repo                                                               |
| **2. Resolver core**   | `chains.ts`, `normalize.ts`, `rpc.ts`, `abi.ts`, `resolver.ts`, `validators.ts` as pure modules                                                                                                                                                                                                      | Unit-tested core                                                             |
| **3. Handler**         | `onNameLookup` wiring (forward only)                                                                                                                                                                                                                                                                 | Working Snap on Flask                                                        |
| **4. Tests**           | `@metamask/snaps-jest` with mocked `fetch`: wallet hit, hovr hit, hovr revert, both empty, `qie` fallback, zero address, bad address format, RPC failover, timeout, non-`.qie` input, unsupported chain, address lookups ignored. Plus one live integration test against mainnet with a known QIE ID | CI green                                                                     |
| **5. Hardening**       | Bundle-size check, remove logs, run Snapper (`sayfer-io/Snapper`), README with support contact                                                                                                                                                                                                       | Release candidate                                                            |
| **6. Publish**         | Matching `version` in `package.json` and the manifest. Check `repository.url` and `packageName`. Run `mm-snap build` to refresh `shasum`, `npm publish` from `packages/snap` only, verify with the Snap Install Tester on Flask                                                                      | `npm:@qie-blockchain/qie-id-snap` live                                       |
| **7. Allowlist**       | Submit the Snaps Directory form (go.metamask.io/snaps-directory-request): public repo, npm URL, descriptions, screenshots, demo video, support contact. No third-party audit is needed (no key-management APIs). Every new version must be **re-submitted**                                          | Installable in stock MetaMask                                                |

**Status (2026-10-19):** Phases 1–5 are done, apart from the Snapper scan. Lookups were verified with `@metamask/snaps-jest` against QIE Mainnet. Phase 0 (manual Flask checks) and Phases 6–7 remain.

**Rough effort:** 1–1.5 weeks of engineering for Phases 0–6. Phase 7 depends on MetaMask's review queue (it needs at least two approvals), so plan for weeks, not days.

---

## 6. Open questions for the team

1. **`.hovr` names:** should the Snap also match the `.hovr` TLD? The README mentions `.hovr` zones, but the extension's send flow only triggers on `.qie`.
2. **Testnet:** the extension calls the _mainnet_ contract addresses over the QIE testnet RPC. Do these contracts exist on testnet (1983)? If not, the Snap should always use mainnet, which is what this plan assumes.
3. **Per-chain EVM addresses:** today all EVM chains share one `evm` record. Is per-chain EVM mapping (e.g. a different address on BSC) planned? If so, define the key format now, for example `evm:56`, and have the Snap try it before `evm`.
4. **npm scope / publisher:** which npm org publishes the package (e.g. `@qie/qie-id-snap`), and who is the support contact for the Directory listing?
5. **Contract upgrades:** the addresses are hardcoded in the extension. If they can change, an upgrade means a new Snap version plus re-allowlisting. Is a registry or lookup contract worth adding?

---

## 7. Risks

| Risk                                                | Mitigation                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| MetaMask doesn't call name lookup in non-EVM sends  | Phase 0 confirms this early. EVM support alone still covers the main case             |
| QIE RPC downtime → no resolution                    | Rotate across 4 RPCs, short per-attempt timeouts                                      |
| Wrong-address sends from stale or malformed records | No persistent cache, strict per-network format validation, checksummed EVM output     |
| Reverse lookup out of scope                         | Address lookups return `null`; see 4.2 for the safe design if it is added             |
| Allowlist delay blocks launch                       | Start the Directory submission as soon as Phase 6 ships. Use Flask for internal demos |
