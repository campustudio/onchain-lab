// The durable cryptography of an EVM account, isolated behind one small module.
//
// viem is the *vehicle* here: audited, modern, and boring in the good way. The
// point of this file is the seam -- every crypto primitive the app uses passes
// through these functions, so the underlying library is a localized swap. The
// ideas (keccak, secp256k1 ECDSA, EIP-191/712, ecrecover, HD derivation) are
// the invariants; the import below is not.

import {
  keccak256,
  toHex,
  hashMessage,
  hashTypedData,
  recoverMessageAddress,
  recoverTypedDataAddress,
  type Address,
  type Hex,
  type TypedDataDomain,
} from "viem";
import {
  generatePrivateKey,
  privateKeyToAccount,
  generateMnemonic,
  mnemonicToAccount,
  english,
} from "viem/accounts";

export type { Address, Hex };

export interface Identity {
  /** Testnet/demo only. Ephemeral, generated in-browser, never a real key. */
  privateKey: Hex;
  publicKey: Hex;
  address: Address;
}

/** Generate a throwaway keypair. Demonstrates private key -> public key -> address. */
export function generateIdentity(): Identity {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { privateKey, publicKey: account.publicKey, address: account.address };
}

export interface HdWallet {
  mnemonic: string;
  /** BIP-44 accounts derived at m/44'/60'/0'/0/index. */
  accounts: { index: number; address: Address }[];
}

/** Generate a BIP-39 mnemonic and derive the first few BIP-44 addresses. */
export function generateHdWallet(count = 3): HdWallet {
  const mnemonic = generateMnemonic(english);
  const accounts = Array.from({ length: count }, (_, index) => ({
    index,
    address: mnemonicToAccount(mnemonic, { addressIndex: index }).address,
  }));
  return { mnemonic, accounts };
}

/** keccak-256 of the UTF-8 bytes of a string. The EVM's workhorse hash. */
export function keccakText(input: string): Hex {
  return keccak256(toHex(input));
}

/** EIP-191 personal_sign. Returns the 65-byte signature. */
export async function signPersonalMessage(privateKey: Hex, message: string): Promise<Hex> {
  return privateKeyToAccount(privateKey).signMessage({ message });
}

/** The EIP-191 digest that was actually signed (prefix + keccak). */
export function personalMessageHash(message: string): Hex {
  return hashMessage(message);
}

/** ecrecover for EIP-191: recover the signer address from message + signature. */
export async function recoverPersonalSigner(message: string, signature: Hex): Promise<Address> {
  return recoverMessageAddress({ message, signature });
}

// --- EIP-712 typed data ------------------------------------------------------

export const EIP712_DOMAIN: TypedDataDomain = {
  name: "onchain-lab",
  version: "1",
  chainId: 11155111, // Sepolia testnet
};

export const EIP712_TYPES = {
  Order: [
    { name: "trader", type: "address" },
    { name: "action", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export interface OrderMessage {
  trader: Address;
  action: string;
  amount: bigint;
  nonce: bigint;
}

/** The full typed-data payload a wallet would show the user before signing. */
export function buildTypedData(message: OrderMessage, chainId = EIP712_DOMAIN.chainId) {
  return {
    domain: { ...EIP712_DOMAIN, chainId },
    types: EIP712_TYPES,
    primaryType: "Order" as const,
    message,
  };
}

export async function signTypedOrder(privateKey: Hex, message: OrderMessage): Promise<Hex> {
  return privateKeyToAccount(privateKey).signTypedData(buildTypedData(message));
}

/** The EIP-712 digest: keccak256("\x19\x01" || domainSeparator || hashStruct(message)). */
export function typedDataHash(message: OrderMessage, chainId = EIP712_DOMAIN.chainId): Hex {
  return hashTypedData(buildTypedData(message, chainId));
}

export async function recoverTypedSigner(message: OrderMessage, signature: Hex): Promise<Address> {
  return recoverTypedDataAddress({ ...buildTypedData(message), signature });
}

/** Case-insensitive address comparison (checksum-safe). */
export function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Shorten an address/hash for display: 0x1234…abcd */
export function shorten(value: string, lead = 6, tail = 4): string {
  if (value.length <= lead + tail + 2) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}
