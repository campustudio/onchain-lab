# Security posture

onchain-lab is a learning and portfolio project. It is designed so that it **cannot** put real
funds or real credentials at risk, by construction.

## Rules this project follows

- **Testnet only.** The lab never targets mainnet and never moves real value.
- **No real keys.** It never asks for, imports, or stores a real private key or seed phrase.
  Interactive key material is **ephemeral** and generated in the browser for demonstration; it is
  clearly labelled as throwaway testnet-only material.
- **No secrets in the client.** There are no API keys, tokens, or credentials committed to the repo
  or embedded in the built app. The only optional configuration is a public testnet RPC URL.
- **Zero-config to run.** The lab works out of the box; nothing sensitive is required.
- **Read-heavy.** Where possible it reads chain state; any writes are testnet transactions signed by
  ephemeral or user-controlled testnet accounts.

## Why the emphasis

Blockchain developers are actively targeted by social-engineering campaigns (fake recruiter
"assignments" that ship malware, requests to import a seed phrase into a demo, etc.). A trustworthy
demo should never normalize pasting real keys into a web page. This project deliberately models the
safe pattern: **the private key is control — treat it accordingly, and never expose it to code you
don't fully trust.**

## Reporting

This is a personal portfolio project. If you spot a security issue in the code, please open an issue
on the repository.
