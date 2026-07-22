import { useMemo, useState } from "react";
import {
  buildTypedData,
  generateHdWallet,
  generateIdentity,
  keccakText,
  personalMessageHash,
  recoverPersonalSigner,
  recoverTypedSigner,
  sameAddress,
  shorten,
  signPersonalMessage,
  signTypedOrder,
  typedDataHash,
  type HdWallet,
  type Hex,
  type Identity,
  type OrderMessage,
} from "@/lib/crypto.ts";
import { ValueRow, Verdict } from "@/components/ui.tsx";

export function KeysLab() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [revealKey, setRevealKey] = useState(false);

  return (
    <div className="stack">
      <section className="panel">
        <h2>Keys &amp; Signing</h2>
        <p className="lead">
          Everything here runs in your browser, with no chain and no backend. It is the most durable
          layer of the whole stack: the maths of keys and signatures is the same on every EVM chain
          and predates every library you'll use to reach it.
        </p>
        <div className="callout warn">
          The keys generated here are <strong>ephemeral and for demonstration only</strong>. Never
          paste a real private key or seed phrase into any web page — including this one. The private
          key <em>is</em> the account; whoever holds it controls the funds.
        </div>
      </section>

      <IdentityPanel
        identity={identity}
        onGenerate={() => {
          setIdentity(generateIdentity());
          setRevealKey(false);
        }}
        revealKey={revealKey}
        onToggleReveal={() => setRevealKey((v) => !v)}
      />

      <HdWalletPanel />

      <HashPanel />

      <PersonalSignPanel identity={identity} />

      <TypedDataPanel identity={identity} />
    </div>
  );
}

function Explain({ children }: { children: React.ReactNode }) {
  return <div className="callout">{children}</div>;
}

function IdentityPanel({
  identity,
  onGenerate,
  revealKey,
  onToggleReveal,
}: {
  identity: Identity | null;
  onGenerate: () => void;
  revealKey: boolean;
  onToggleReveal: () => void;
}) {
  return (
    <section className="panel">
      <h3>1 · Identity — key → public key → address</h3>
      <Explain>
        An EVM address is not random: it is the last 20 bytes of the keccak-256 hash of the public
        key, which is itself derived from the private key over the secp256k1 curve. The derivation
        only runs one way. Generate a throwaway identity to see the chain of values.
      </Explain>
      <div className="row">
        <button className="btn primary" onClick={onGenerate}>
          {identity ? "Regenerate ephemeral key" : "Generate ephemeral key"}
        </button>
        {identity && (
          <button className="btn" onClick={onToggleReveal}>
            {revealKey ? "Hide private key" : "Reveal private key"}
          </button>
        )}
      </div>
      {identity && (
        <div style={{ marginTop: 16 }}>
          <ValueRow
            label="Private key (ephemeral, testnet demo only)"
            value={revealKey ? identity.privateKey : "•".repeat(66)}
            copyable={revealKey}
          />
          <ValueRow label="Public key (uncompressed, 65 bytes)" value={identity.publicKey} />
          <ValueRow label="Address (last 20 bytes of keccak(publicKey))" value={identity.address} />
        </div>
      )}
    </section>
  );
}

function HdWalletPanel() {
  const [wallet, setWallet] = useState<HdWallet | null>(null);
  const [reveal, setReveal] = useState(false);
  return (
    <section className="panel">
      <h3>2 · HD wallet — one seed, many accounts (BIP-32/39/44)</h3>
      <Explain>
        A single mnemonic seeds a deterministic tree of keys. Every account below comes from the
        same phrase at path <span className="mono">m/44'/60'/0'/0/index</span>. This is why a wallet
        can show "Account 1, 2, 3…" from one backup — and why that backup is everything.
      </Explain>
      <div className="row">
        <button
          className="btn primary"
          onClick={() => {
            setWallet(generateHdWallet(3));
            setReveal(false);
          }}
        >
          {wallet ? "Regenerate wallet" : "Generate HD wallet"}
        </button>
        {wallet && (
          <button className="btn" onClick={() => setReveal((v) => !v)}>
            {reveal ? "Hide mnemonic" : "Reveal mnemonic"}
          </button>
        )}
      </div>
      {wallet && (
        <div style={{ marginTop: 16 }}>
          <ValueRow
            label="Mnemonic (ephemeral, testnet demo only)"
            value={reveal ? wallet.mnemonic : "•••• •••• •••• …"}
            copyable={reveal}
          />
          <div className="kv" style={{ marginTop: 8 }}>
            {wallet.accounts.map((a) => (
              <div key={a.index} style={{ display: "contents" }}>
                <dt>account #{a.index}</dt>
                <dd>{a.address}</dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function HashPanel() {
  const [input, setInput] = useState("hello onchain-lab");
  const hash = useMemo(() => (input ? keccakText(input) : ""), [input]);
  return (
    <section className="panel">
      <h3>3 · keccak-256 — the EVM's workhorse hash</h3>
      <Explain>
        keccak-256 is everywhere on-chain: address derivation, function selectors, event topics,
        storage slots, and the digests you sign. It is deterministic and one-way — a single changed
        character produces a completely different hash.
      </Explain>
      <label htmlFor="hash-input">Input (UTF-8)</label>
      <input
        id="hash-input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="type anything"
      />
      <div style={{ marginTop: 12 }}>
        <ValueRow label="keccak256(utf8Bytes(input))" value={hash} />
      </div>
    </section>
  );
}

function PersonalSignPanel({ identity }: { identity: Identity | null }) {
  const [message, setMessage] = useState("I control this account.");
  const [signature, setSignature] = useState<Hex | "">("");
  const [signedMessage, setSignedMessage] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [recovered, setRecovered] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const digest = useMemo(() => (message ? personalMessageHash(message) : ""), [message]);

  async function sign() {
    if (!identity) return;
    setBusy(true);
    try {
      const sig = await signPersonalMessage(identity.privateKey, message);
      setSignature(sig);
      setSignedMessage(message);
      setVerifyMessage(message);
      setRecovered("");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!signature) return;
    const addr = await recoverPersonalSigner(verifyMessage, signature);
    setRecovered(addr);
  }

  const match = recovered && identity ? sameAddress(recovered, identity.address) : false;

  return (
    <section className="panel">
      <h3>4 · Sign &amp; verify — EIP-191 personal_sign</h3>
      <Explain>
        Signing proves control of a private key without revealing it. Anyone can then recover the
        signer's address from the message and signature (<span className="mono">ecrecover</span>) —
        no key, no server, no trust required. Edit the message on the verify side to watch the
        signature stop matching: a signature binds to the exact bytes that were signed.
      </Explain>
      {!identity && <p className="faint">Generate an identity above to sign.</p>}

      <label htmlFor="sign-msg">Message to sign</label>
      <textarea
        id="sign-msg"
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" onClick={sign} disabled={!identity || busy || !message}>
          Sign message
        </button>
      </div>
      <div style={{ marginTop: 14 }}>
        <ValueRow label="EIP-191 digest (what is actually signed)" value={digest} />
        <ValueRow label="Signature (r,s,v — 65 bytes)" value={signature} />
      </div>

      {signature && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
          }}
        >
          <label htmlFor="verify-msg">Verify: message a verifier believes was signed</label>
          <textarea
            id="verify-msg"
            rows={2}
            value={verifyMessage}
            onChange={(e) => setVerifyMessage(e.target.value)}
          />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={verify}>
              Recover signer
            </button>
            {verifyMessage !== signedMessage && (
              <span className="faint" style={{ fontSize: 12 }}>
                message differs from what was signed
              </span>
            )}
          </div>
          {recovered && (
            <div style={{ marginTop: 12 }}>
              <ValueRow label="Recovered signer address" value={recovered} />
              <div className="row">
                <Verdict ok={match}>
                  {match ? "matches the expected signer" : "does not match — signature is invalid"}
                </Verdict>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TypedDataPanel({ identity }: { identity: Identity | null }) {
  const [action, setAction] = useState("buy");
  const [amount, setAmount] = useState("100");
  const [nonce, setNonce] = useState("1");
  const [chainOverride, setChainOverride] = useState(false);
  const [signature, setSignature] = useState<Hex | "">("");
  const [recovered, setRecovered] = useState("");
  const [busy, setBusy] = useState(false);

  const order = useMemo<OrderMessage | null>(() => {
    if (!identity) return null;
    try {
      return {
        trader: identity.address,
        action,
        amount: BigInt(amount || "0"),
        nonce: BigInt(nonce || "0"),
      };
    } catch {
      return null;
    }
  }, [identity, action, amount, nonce]);

  const typedData = order ? buildTypedData(order) : null;
  const digest = order ? typedDataHash(order) : "";

  async function sign() {
    if (!identity || !order) return;
    setBusy(true);
    try {
      const sig = await signTypedOrder(identity.privateKey, order);
      setSignature(sig);
      setRecovered("");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!signature || !order) return;
    // Recover against the (possibly tampered) domain to show the domain binding.
    const addr = await recoverTypedSigner(order, signature);
    setRecovered(addr);
  }

  const match = recovered && identity ? sameAddress(recovered, identity.address) : false;

  return (
    <section className="panel">
      <h3>5 · Structured signing — EIP-712 typed data</h3>
      <Explain>
        Raw <span className="mono">personal_sign</span> shows the user an opaque blob. EIP-712 signs
        a typed, human-readable struct instead, and mixes in a <strong>domain separator</strong>{" "}
        (name, version, chainId). That domain is replay protection: the same order signed for a
        different chainId produces a different digest, so a signature can't be replayed across
        chains or apps.
      </Explain>
      {!identity && <p className="faint">Generate an identity above to sign.</p>}

      <div className="grid cols-3">
        <div>
          <label htmlFor="td-action">action</label>
          <select id="td-action" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="buy">buy</option>
            <option value="sell">sell</option>
          </select>
        </div>
        <div>
          <label htmlFor="td-amount">amount (uint256)</label>
          <input
            id="td-amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>
        <div>
          <label htmlFor="td-nonce">nonce (uint256)</label>
          <input
            id="td-nonce"
            type="text"
            value={nonce}
            onChange={(e) => setNonce(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>
      </div>

      {typedData && (
        <div style={{ marginTop: 14 }}>
          <label>Typed data a wallet would display</label>
          <pre
            className="mono"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 12,
              overflowX: "auto",
              margin: "6px 0 0",
            }}
          >
            {JSON.stringify(
              {
                domain: {
                  ...typedData.domain,
                  chainId: chainOverride ? 1 : typedData.domain.chainId,
                },
                primaryType: typedData.primaryType,
                message: {
                  trader: order?.trader,
                  action: order?.action,
                  amount: amount,
                  nonce: nonce,
                },
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={sign} disabled={!identity || busy || !order}>
          Sign order
        </button>
        <label className="row" style={{ margin: 0, textTransform: "none", letterSpacing: 0 }}>
          <input
            type="checkbox"
            checked={chainOverride}
            onChange={(e) => setChainOverride(e.target.checked)}
            style={{ width: "auto" }}
          />
          <span className="faint" style={{ fontSize: 12 }}>
            show digest for chainId 1 (illustrates domain binding)
          </span>
        </label>
      </div>

      <div style={{ marginTop: 14 }}>
        <ValueRow label="EIP-712 digest — chainId 11155111 (Sepolia)" value={digest} />
        {chainOverride && order && (
          <ValueRow
            label="EIP-712 digest — same order, chainId 1 (differs!)"
            value={typedDataHash(order, 1)}
          />
        )}
        <ValueRow label="Signature" value={signature} />
      </div>

      {chainOverride && (
        <p className="faint" style={{ fontSize: 12 }}>
          Same trader, action, amount and nonce — only the domain's chainId changed, yet the digest
          is completely different. A signature is bound to its domain, so it cannot be replayed on
          another chain or app. That is the replay protection EIP-712 buys you.
        </p>
      )}

      {signature && (
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={verify}>
            Recover signer
          </button>
          {recovered && (
            <div style={{ marginTop: 12 }}>
              <ValueRow label="Recovered signer" value={recovered} />
              <Verdict ok={match}>
                {match ? `matches ${shorten(identity!.address)}` : "does not match"}
              </Verdict>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
