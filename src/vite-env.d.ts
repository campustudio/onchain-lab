/// <reference types="vite/client" />

interface Window {
  // Injected wallet (EIP-1193), used from FE-2 onward. Optional by design:
  // the lab always works without a wallet via an ephemeral testnet key.
  ethereum?: import("viem").EIP1193Provider;
}
