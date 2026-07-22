// The seam. The app reads the chain only through this port, so the concrete
// data source (a public testnet, a local node, or a deterministic simulation)
// is a localized swap that never reaches the UI or the domain logic.

import type { Address, Hex } from "viem";

export type ChainSourceId = "simulated" | "sepolia" | "local";

export interface ChainSource {
  id: ChainSourceId;
  label: string;
  chainId: number;
  /** Whether this adapter makes real network calls (vs. a local simulation). */
  live: boolean;
  note: string;
}

export const CHAIN_SOURCES: ChainSource[] = [
  {
    id: "simulated",
    label: "Simulated",
    chainId: 11155111,
    live: false,
    note: "Deterministic in-browser data. Zero network, zero secrets, always available.",
  },
  {
    id: "sepolia",
    label: "Sepolia (public RPC)",
    chainId: 11155111,
    live: true,
    note: "Real reads against a public Sepolia endpoint. Requires network access.",
  },
  {
    id: "local",
    label: "Local node",
    chainId: 31337,
    live: true,
    note: "A node on http://127.0.0.1:8545 (anvil / hardhat).",
  },
];

/** A single eth_call, exposed so the UI can show the raw JSON-RPC shape. */
export interface RawCall {
  method: "eth_call";
  to: Address;
  data: Hex;
  result: Hex;
}

export interface Erc20State {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  /** Present only when a holder was queried. */
  balanceOf?: { holder: Address; raw: bigint };
  /** The underlying calls, for the "read = eth_call" teaching panel. */
  calls: RawCall[];
}

export interface ChainReader {
  readonly source: ChainSource;
  /** eth_chainId */
  getChainId(): Promise<number>;
  /** eth_blockNumber — the chain tip. */
  getBlockNumber(): Promise<bigint>;
  /** eth_getBalance — native ETH balance in wei. */
  getBalance(address: Address): Promise<bigint>;
  /** eth_call against an ERC-20, decoded via its ABI. */
  readErc20(token: Address, holder?: Address): Promise<Erc20State>;
}
