// The philosophy of this lab, encoded as data.
//
// Blockchain tooling churns fast (chains, L2s, web3.js -> ethers -> viem/wagmi,
// wallet SDKs, account-abstraction standards). Chasing it is a treadmill. What
// this lab captures instead is the column that does NOT change: the fundamental
// mental model. Concrete chains and libraries are "vehicles" -- deliberately
// swappable, kept behind ports.

export interface InvariantLayer {
  id: string;
  layer: string;
  /** Things that change; used only as a vehicle, never the skill itself. */
  vehicle: string;
  /** The durable ideas this lab demonstrates and that survive tool churn. */
  invariants: string[];
}

export const INVARIANT_STACK: InvariantLayer[] = [
  {
    id: "crypto",
    layer: "Cryptography",
    vehicle: "which curve library / wallet SDK",
    invariants: [
      "private key -> public key -> address derivation",
      "keccak-256 hashing",
      "ECDSA signing (secp256k1)",
      "EIP-191 & EIP-712 typed-data signing",
      "signature verification / ecrecover",
      "HD wallets (BIP-32/39/44)",
    ],
  },
  {
    id: "protocol",
    layer: "Protocol",
    vehicle: "which chain / which L2",
    invariants: [
      "accounts, nonces, gas & fee markets (EIP-1559)",
      "the transaction lifecycle",
      "blocks, confirmations, finality, reorgs",
      "JSON-RPC as the stable interface",
      "read (call) vs write (transaction)",
    ],
  },
  {
    id: "contract",
    layer: "Contracts",
    vehicle: "Solidity version / framework",
    invariants: [
      "ABI as the data contract",
      "calldata encoding & decoding",
      "events as an immutable log",
      "token-standard semantics (ownership / allowance / transfer)",
      "a contract is a deterministic state machine",
    ],
  },
  {
    id: "security",
    layer: "Security",
    vehicle: "the specific exploit of the week",
    invariants: [
      "trust model: verify, don't trust",
      "reentrancy & access control",
      "replay protection (nonce / chainId / EIP-712 domain)",
      "approval risk",
      "custody: the private key is control",
    ],
  },
  {
    id: "app",
    layer: "App / systems",
    vehicle: "ethers vs viem vs wagmi",
    invariants: [
      "on-chain -> off-chain indexing",
      "reorg-safe, idempotent event ingestion",
      "transaction-state UX",
      "provider-neutral RPC access (ports & adapters)",
      "read-model projection (event sourcing)",
    ],
  },
];
