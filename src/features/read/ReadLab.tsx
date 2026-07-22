import { useMemo, useState } from "react";
import { formatEther, getAddress, type Address } from "viem";
import { CHAIN_SOURCES, type ChainSourceId, type Erc20State } from "@/ports/chain.ts";
import { createReader } from "@/adapters/index.ts";
import { formatToken } from "@/lib/abi.ts";
import { ValueRow } from "@/components/ui.tsx";
import { shorten } from "@/lib/crypto.ts";

const DEMO_TOKEN = "0x1111111111111111111111111111111111111111";
const DEMO_HOLDER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

function safeAddress(value: string): Address | null {
  try {
    return getAddress(value.trim());
  } catch {
    return null;
  }
}

export function ReadLab() {
  const [sourceId, setSourceId] = useState<ChainSourceId>("simulated");
  const reader = useMemo(() => createReader(sourceId), [sourceId]);
  const source = CHAIN_SOURCES.find((s) => s.id === sourceId)!;

  return (
    <div className="stack">
      <section className="panel">
        <h2>Read</h2>
        <p className="lead">
          Reading the chain needs no account, no gas, and no signature — it is just a query to a
          node over JSON-RPC. Everything here goes through one small <span className="mono">
          ChainReader
          </span>{" "}
          port, so the data source is a drop-down, not a rewrite.
        </p>
        <div className="callout">
          <strong>Read vs write.</strong> A read (<span className="mono">eth_call</span> /{" "}
          <span className="mono">eth_getBalance</span>) asks a node to evaluate something against
          current state and costs nothing. A write (a transaction) must be signed and mined, costs
          gas, and changes state. This tab is entirely reads; writes come in the next tab.
        </div>

        <label htmlFor="source">Data source (the swappable adapter)</label>
        <select
          id="source"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value as ChainSourceId)}
          style={{ maxWidth: 320 }}
        >
          {CHAIN_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>
          {source.live ? "● live network" : "○ simulated (offline)"} · chainId {source.chainId} ·{" "}
          {source.note}
        </p>
      </section>

      <ChainTip key={`tip-${sourceId}`} reader={reader} />
      <BalanceReader key={`bal-${sourceId}`} reader={reader} />
      <Erc20Reader key={`erc-${sourceId}`} reader={reader} live={source.live} />
    </div>
  );
}

type Reader = ReturnType<typeof createReader>;

function useAsyncAction<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<T>) {
    setBusy(true);
    setError("");
    try {
      setData(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return { data, error, busy, run };
}

function ChainTip({ reader }: { reader: Reader }) {
  const { data, error, busy, run } = useAsyncAction<{ chainId: number; block: bigint }>();
  return (
    <section className="panel">
      <h3>1 · Chain tip — eth_blockNumber / eth_chainId</h3>
      <div className="row">
        <button
          className="btn primary"
          disabled={busy}
          onClick={() =>
            run(async () => ({
              chainId: await reader.getChainId(),
              block: await reader.getBlockNumber(),
            }))
          }
        >
          {busy ? "reading…" : "Read chain tip"}
        </button>
      </div>
      {data && (
        <div className="kv" style={{ marginTop: 14 }}>
          <dt>chainId</dt>
          <dd>{data.chainId}</dd>
          <dt>block number</dt>
          <dd>{data.block.toString()}</dd>
        </div>
      )}
      {error && <ErrorNote message={error} />}
    </section>
  );
}

function BalanceReader({ reader }: { reader: Reader }) {
  const [address, setAddress] = useState(DEMO_HOLDER);
  const { data, error, busy, run } = useAsyncAction<bigint>();
  const addr = safeAddress(address);
  return (
    <section className="panel">
      <h3>2 · Native balance — eth_getBalance</h3>
      <label htmlFor="bal-addr">Address</label>
      <input id="bal-addr" type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
      <div className="row" style={{ marginTop: 10 }}>
        <button
          className="btn primary"
          disabled={busy || !addr}
          onClick={() => addr && run(() => reader.getBalance(addr))}
        >
          {busy ? "reading…" : "Read balance"}
        </button>
        {!addr && address && <span className="faint" style={{ fontSize: 12 }}>invalid address</span>}
      </div>
      {data !== null && (
        <div className="kv" style={{ marginTop: 14 }}>
          <dt>balance (wei)</dt>
          <dd>{data.toString()}</dd>
          <dt>balance (ETH)</dt>
          <dd>{formatEther(data)}</dd>
        </div>
      )}
      {error && <ErrorNote message={error} />}
    </section>
  );
}

function Erc20Reader({ reader, live }: { reader: Reader; live: boolean }) {
  const [token, setToken] = useState(DEMO_TOKEN);
  const [holder, setHolder] = useState(DEMO_HOLDER);
  const { data, error, busy, run } = useAsyncAction<Erc20State>();
  const tokenAddr = safeAddress(token);
  const holderAddr = holder.trim() ? safeAddress(holder) : undefined;

  return (
    <section className="panel">
      <h3>3 · ERC-20 state — eth_call decoded through the ABI</h3>
      <div className="callout">
        <strong>The ABI is the data contract.</strong> Each field below is a separate{" "}
        <span className="mono">eth_call</span>: the function name + args are ABI-encoded into
        calldata, the node returns ABI-encoded bytes, and the ABI decodes them back into typed
        values. A standard interface like ERC-20 is a durable contract that outlives any client
        library.
      </div>
      <div className="grid cols-2">
        <div>
          <label htmlFor="erc-token">Token address</label>
          <input id="erc-token" type="text" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div>
          <label htmlFor="erc-holder">Holder (optional, for balanceOf)</label>
          <input
            id="erc-holder"
            type="text"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
        </div>
      </div>
      {live && (
        <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>
          On a live source, use a token actually deployed on that network. The default demo token
          only exists in the Simulated source.
        </p>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        <button
          className="btn primary"
          disabled={busy || !tokenAddr}
          onClick={() => tokenAddr && run(() => reader.readErc20(tokenAddr, holderAddr ?? undefined))}
        >
          {busy ? "reading…" : "Read token"}
        </button>
      </div>

      {data && (
        <div style={{ marginTop: 16 }}>
          <div className="kv">
            <dt>name</dt>
            <dd>{data.name}</dd>
            <dt>symbol</dt>
            <dd>{data.symbol}</dd>
            <dt>decimals</dt>
            <dd>{data.decimals}</dd>
            <dt>total supply</dt>
            <dd>
              {formatToken(data.totalSupply, data.decimals)} {data.symbol}
            </dd>
            {data.balanceOf && (
              <>
                <dt>balanceOf {shorten(data.balanceOf.holder)}</dt>
                <dd>
                  {formatToken(data.balanceOf.raw, data.decimals)} {data.symbol}
                </dd>
              </>
            )}
          </div>

          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: "pointer", color: "var(--text-dim)", fontSize: 13 }}>
              Raw JSON-RPC ({data.calls.length} × eth_call)
            </summary>
            <div style={{ marginTop: 12 }}>
              {data.calls.map((c, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div className="faint" style={{ fontSize: 11, marginBottom: 4 }}>
                    {c.method} → {shorten(c.to)}
                  </div>
                  <ValueRow label="calldata (data)" value={c.data} />
                  <ValueRow label="result (abi-encoded)" value={c.result} />
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      {error && <ErrorNote message={error} />}
    </section>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="callout warn" style={{ marginTop: 14 }}>
      Read failed: <span className="mono">{message}</span>
      <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>
        Live public RPC endpoints can rate-limit or block browser requests. Switch the data source
        back to <strong>Simulated</strong> to explore offline.
      </div>
    </div>
  );
}
