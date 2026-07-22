// The ABI is the data contract of a smart contract: a typed schema for encoding
// calls and decoding results and events. It is the same idea as an OpenAPI spec
// or a protobuf definition -- an invariant that outlives any client library.

import {
  encodeFunctionData,
  encodeFunctionResult,
  decodeFunctionResult,
  formatUnits,
  type Abi,
  type Hex,
} from "viem";

/** Minimal ERC-20 read interface. A standard interface is a durable data contract. */
export const ERC20_ABI = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const satisfies Abi;

/** Encode a function call into calldata (the `data` field of an eth_call / tx). */
export function encodeCall(functionName: string, args: readonly unknown[] = []): Hex {
  return encodeFunctionData({ abi: ERC20_ABI, functionName: functionName as never, args: args as never });
}

/** Decode the ABI-encoded result of an eth_call back into a typed value. */
export function decodeCall(functionName: string, data: Hex): unknown {
  return decodeFunctionResult({ abi: ERC20_ABI, functionName: functionName as never, data });
}

/** Encode a return value the way a node would (used by the simulated adapter). */
export function encodeResult(functionName: string, value: unknown): Hex {
  return encodeFunctionResult({ abi: ERC20_ABI, functionName: functionName as never, result: value as never });
}

/** Human-readable token amount from a raw uint256 and decimals. */
export function formatToken(raw: bigint, decimals: number): string {
  return formatUnits(raw, decimals);
}
