// A deterministic, offline implementation of the ChainReader port.
//
// This is the default source so the lab always works with zero network and zero
// secrets. It still produces *real* ABI-encoded calldata and results, so the
// "read = eth_call" panel shows the genuine wire shape -- only the transport is
// faked.

import { getAddress, type Address } from "viem";
import { CHAIN_SOURCES, type ChainReader, type Erc20State, type RawCall } from "@/ports/chain.ts";
import { encodeCall, encodeResult } from "@/lib/abi.ts";

const source = CHAIN_SOURCES.find((s) => s.id === "simulated")!;

const DEMO_TOKEN = getAddress("0x1111111111111111111111111111111111111111");
const DEMO_META: Record<string, { name: string; symbol: string; decimals: number; supply: bigint }> = {
  [DEMO_TOKEN.toLowerCase()]: {
    name: "OnchainLab Demo Token",
    symbol: "OLD",
    decimals: 18,
    supply: 1_000_000n * 10n ** 18n,
  },
};

/** Deterministic pseudo-balance derived from an address, so it's stable per input. */
function pseudoBalance(seed: string, decimals: number): bigint {
  let acc = 0n;
  for (const ch of seed.toLowerCase()) acc = (acc * 131n + BigInt(ch.charCodeAt(0))) % 1_000_000n;
  return acc * 10n ** BigInt(decimals);
}

export function createSimulatedReader(): ChainReader {
  const start = Date.now();
  return {
    source,
    async getChainId() {
      return source.chainId;
    },
    async getBlockNumber() {
      // ~12s block time, a plausible Sepolia-ish height that advances while open.
      return 6_400_000n + BigInt(Math.floor((Date.now() - start) / 12_000));
    },
    async getBalance(address: Address) {
      return pseudoBalance(address, 18) / 1000n; // fractional ETH-ish
    },
    async readErc20(token: Address, holder?: Address): Promise<Erc20State> {
      const meta = DEMO_META[token.toLowerCase()] ?? DEMO_META[DEMO_TOKEN.toLowerCase()];
      const calls: RawCall[] = [
        mkCall(token, "name", [], encodeResult("name", meta.name)),
        mkCall(token, "symbol", [], encodeResult("symbol", meta.symbol)),
        mkCall(token, "decimals", [], encodeResult("decimals", meta.decimals)),
        mkCall(token, "totalSupply", [], encodeResult("totalSupply", meta.supply)),
      ];
      const state: Erc20State = {
        address: token,
        name: meta.name,
        symbol: meta.symbol,
        decimals: meta.decimals,
        totalSupply: meta.supply,
        calls,
      };
      if (holder) {
        const raw = pseudoBalance(holder, meta.decimals);
        calls.push(mkCall(token, "balanceOf", [holder], encodeResult("balanceOf", raw)));
        state.balanceOf = { holder, raw };
      }
      return state;
    },
  };
}

function mkCall(to: Address, fn: string, args: readonly unknown[], result: `0x${string}`): RawCall {
  return { method: "eth_call", to, data: encodeCall(fn, args), result };
}
