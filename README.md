# onchain-lab

[![Live demo](https://img.shields.io/badge/live%20demo-open-16c784?style=flat-square)](https://campustudio.github.io/onchain-lab/)
![React](https://img.shields.io/badge/React-19-4c8dff?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square)
![Network](https://img.shields.io/badge/network-testnet%20only-16c784?style=flat-square)
![Secrets](https://img.shields.io/badge/secrets-none-16c784?style=flat-square)

A hands-on, **provider-neutral** reference for the parts of blockchain engineering that _don't_
change. Chains, L2s, wallet SDKs, and client libraries churn constantly; the mental model
underneath them does not. onchain-lab demonstrates that durable core end to end — and treats every
concrete chain or library as a replaceable **vehicle** kept behind a port.

> **[▶ Open the live demo](https://campustudio.github.io/onchain-lab/)** — deployed to GitHub Pages
> on every push to `main`.

> **Testnet only. No secrets.** The lab never touches mainnet value, never asks for a real private
> key or seed phrase, and runs with zero configuration.

## Why this exists

Most "blockchain" tutorials teach a specific library on a specific chain, and age out in a year.
This project inverts that: it captures the invariants and uses today's tooling only to make them
concrete.

| Layer | Vehicle (replaceable) | Durable core (what this lab shows) |
| --- | --- | --- |
| Cryptography | which curve lib / wallet SDK | key → address derivation, keccak-256, ECDSA, EIP-191/712, ecrecover, HD wallets |
| Protocol | which chain / L2 | accounts, nonce, gas (EIP-1559), tx lifecycle, finality/reorg, JSON-RPC, read vs write |
| Contracts | Solidity version / framework | ABI as data contract, calldata encode/decode, events as a log, token semantics, deterministic state machine |
| Security | the exploit of the week | verify-don't-trust, reentrancy, access control, replay (nonce/chainId/EIP-712 domain), approval risk, key custody |
| App / systems | ethers vs viem vs wagmi | on-chain → off-chain indexing, reorg-safe idempotent ingestion, tx-state UX, provider-neutral RPC, read-model projection |

## Approach: frontend-first, then a backend when the frontend earns it

A surprising amount of the durable core lives in the browser: wallets and keys, signing and
verification, JSON-RPC reads, contract read/write, and the transaction-state UX. So the lab is built
**frontend-first** and ships value immediately with zero backend. A backend indexer is introduced
_only once_ the client-side approach visibly hits its limits (deep history, persistence,
reliability) — the same evolution real dApps go through, from direct RPC calls to a dedicated
indexer.

**Track A — frontend (in progress, published as it grows)**

- ✅ `01` Keys & Signing — client-side cryptography: derive an address, hash, sign (EIP-191/712), verify. **Live now.**
- 🚧 `02` Read — provider-neutral RPC reads of on-chain state, ABI decoding.
- ⬜ `03` Transactions — build, estimate, sign, broadcast, and watch `pending → confirmed → finalized`.
- ⬜ `04` Indexer (client) — project events into an in-browser read model, and feel its limits.

**Track B — backend (later)**

- Contracts (ERC-20 + a small business contract) with tests, then a reorg-safe, idempotent indexer
  into a read model, served by a typed API with live updates.

## Architecture: ports & adapters

Concrete chains and libraries sit behind interfaces, so swapping them is a localized change — never
a UI or core-logic rewrite.

```
UI (React sections)
  └─ features        (keys, read, transactions, indexer)
       └─ lib         (crypto, encoding — framework-agnostic)
            └─ ports  (Transport / RPC provider interface  ← the seam)
                 └─ adapters  (PublicTestnet | LocalNode | Simulated)
   domain (pure types + the invariant model) ← depended on by all, depends on nothing
```

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build
```

No environment variables are required to run the lab. See [`.env.example`](.env.example) for the
optional testnet RPC override used from slice `02` onward.

## Security posture

See [`SECURITY.md`](SECURITY.md). In short: testnet only, ephemeral in-browser keys, no secrets in
the client, and nothing that can move real funds.

## License

[MIT](LICENSE) © 2026 Ethan Du
