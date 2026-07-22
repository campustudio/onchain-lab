// A live implementation of the ChainReader port, backed by JSON-RPC over HTTP.
//
// viem is the vehicle; the app never sees it. Reads go through real eth_call /
// eth_getBalance / eth_blockNumber requests, and the ERC-20 reads deliberately
// use raw calls (encode calldata -> eth_call -> decode) so the "read = eth_call"
// panel reflects exactly what goes over the wire.

import { createPublicClient, http, defineChain, type Address, type Hex } from "viem";
import { sepolia } from "viem/chains";
import {
  CHAIN_SOURCES,
  type ChainReader,
  type ChainSourceId,
  type Erc20State,
  type RawCall,
} from "@/ports/chain.ts";
import { decodeCall, encodeCall } from "@/lib/abi.ts";

const localChain = defineChain({
  id: 31337,
  name: "Local Node",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
});

const DEFAULT_SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

export function createViemReader(id: Exclude<ChainSourceId, "simulated">): ChainReader {
  const source = CHAIN_SOURCES.find((s) => s.id === id)!;
  const chain = id === "local" ? localChain : sepolia;
  const url =
    id === "local"
      ? "http://127.0.0.1:8545"
      : (import.meta.env.VITE_TESTNET_RPC_URL as string | undefined) ?? DEFAULT_SEPOLIA_RPC;

  const client = createPublicClient({ chain, transport: http(url) });

  async function rawCall(to: Address, fn: string, args: readonly unknown[]) {
    const data = encodeCall(fn, args);
    const { data: result } = await client.call({ to, data });
    return { call: { method: "eth_call", to, data, result: result ?? "0x" } as RawCall, result };
  }

  return {
    source,
    getChainId: () => client.getChainId(),
    getBlockNumber: () => client.getBlockNumber(),
    getBalance: (address: Address) => client.getBalance({ address }),
    async readErc20(token: Address, holder?: Address): Promise<Erc20State> {
      const calls: RawCall[] = [];
      const read = async (fn: string, args: readonly unknown[] = []) => {
        const { call, result } = await rawCall(token, fn, args);
        calls.push(call);
        return decodeCall(fn, (result ?? "0x") as Hex);
      };

      const [name, symbol, decimals, totalSupply] = (await Promise.all([
        read("name"),
        read("symbol"),
        read("decimals"),
        read("totalSupply"),
      ])) as [string, string, number, bigint];

      const state: Erc20State = { address: token, name, symbol, decimals, totalSupply, calls };
      if (holder) {
        state.balanceOf = { holder, raw: (await read("balanceOf", [holder])) as bigint };
      }
      return state;
    },
  };
}
