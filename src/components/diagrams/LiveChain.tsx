import { useEffect, useState } from "react";

// A self-driving visualization of the invariants a blockchain actually enforces:
// transactions wait in a mempool, get mined into blocks, each block links to the
// previous one by hash, confirmations accumulate with depth, and the tip is never
// final -- occasionally it gets orphaned by a reorg and its transactions return to
// the mempool. Nothing here is a real chain; it is a faithful mental model.

interface Block {
  id: number;
  height: number;
  hash: string;
  prevHash: string;
  txCount: number;
  orphan?: boolean;
}

interface ChainState {
  blocks: Block[];
  mempool: number;
  lastEvent: string;
  nextId: number;
}

const MAX_BLOCKS = 7;
const FINALITY_DEPTH = 4; // confirmations to be considered final here
const MAX_MEMPOOL = 14;
const TICK_MS = 1800;

function randHex(chars: number): string {
  let s = "";
  for (let i = 0; i < chars; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}
function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initialState(): ChainState {
  const blocks: Block[] = [];
  let prev = "0x" + randHex(60);
  for (let i = 0; i < 4; i++) {
    const hash = "0x" + randHex(60);
    blocks.push({ id: i, height: 6_400_000 + i, hash, prevHash: prev, txCount: randInt(2, 6) });
    prev = hash;
  }
  return { blocks, mempool: 5, lastEvent: "mining…", nextId: 100 };
}

// Pure state transition for one tick (kept free of other setState calls).
function tick(s: ChainState): ChainState {
  const blocks = s.blocks.filter((b) => !b.orphan); // clear any previous orphan
  const tip = blocks[blocks.length - 1];

  if (blocks.length >= 3 && Math.random() < 0.16) {
    const orphaned = blocks.map((b, i) => (i === blocks.length - 1 ? { ...b, orphan: true } : b));
    return {
      ...s,
      blocks: orphaned,
      mempool: Math.min(s.mempool + tip.txCount, MAX_MEMPOOL),
      lastEvent: `reorg · block ${tip.height} orphaned, its tx return to the mempool`,
    };
  }

  const take = Math.min(s.mempool, randInt(2, 5));
  const next: Block = {
    id: s.nextId,
    height: tip.height + 1,
    hash: "0x" + randHex(60),
    prevHash: tip.hash,
    txCount: take,
  };
  return {
    blocks: [...blocks, next].slice(-MAX_BLOCKS),
    mempool: Math.min(Math.max(s.mempool - take, 0) + randInt(1, 4), MAX_MEMPOOL),
    lastEvent: `block ${next.height} mined · ${take} tx included`,
    nextId: s.nextId + 1,
  };
}

export function LiveChain() {
  const [state, setState] = useState<ChainState>(initialState);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setState((s) => tick(s)), TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  const { blocks, mempool, lastEvent } = state;
  const solid = blocks.filter((b) => !b.orphan);
  const tipHeight = solid.length ? solid[solid.length - 1].height : 0;

  function statusOf(b: Block): { cls: string; confs: number } {
    if (b.orphan) return { cls: "orphan", confs: 0 };
    const confs = tipHeight - b.height + 1;
    if (confs >= FINALITY_DEPTH) return { cls: "finalized", confs };
    if (confs <= 1) return { cls: "pending", confs };
    return { cls: "confirmed", confs };
  }

  return (
    <div className="diagram">
      <div className="diagram-title">
        <span>live chain — mempool → blocks → confirmations → finality</span>
        <button
          className="btn"
          style={{ marginLeft: "auto", padding: "3px 10px", fontSize: 11 }}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "pause" : "play"}
        </button>
      </div>

      <div className="chain-wrap">
        <div className="mempool">
          <div className="mp-label">mempool · {mempool} pending tx</div>
          <div className="mp-txs">
            {Array.from({ length: mempool }).map((_, i) => (
              <span key={i} className="tx-dot" style={{ animationDelay: `${(i % 6) * 0.12}s` }} />
            ))}
            {mempool === 0 && <span className="faint" style={{ fontSize: 12 }}>empty</span>}
          </div>
        </div>

        <div className="chain-row">
          {blocks.map((b, i) => {
            const s = statusOf(b);
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "stretch" }}>
                {i > 0 && <div className="link" aria-hidden />}
                <div className={`block ${s.cls}`}>
                  <div className="bh">#{b.height}</div>
                  <div className="bhash">{shortHash(b.hash)}</div>
                  <div className="bhash" style={{ opacity: 0.7 }}>
                    ↖ prev {shortHash(b.prevHash)}
                  </div>
                  <div className="bmeta">
                    <span>{b.txCount} tx</span>
                    <span className="conf">{b.orphan ? "orphan" : `${s.confs} conf`}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="legend">
        <span><span className="swatch" style={{ background: "var(--warn)" }} />new tip (1 conf)</span>
        <span><span className="swatch" style={{ background: "var(--accent)" }} />confirming</span>
        <span><span className="swatch" style={{ background: "var(--accent-2)" }} />final (≥{FINALITY_DEPTH} confs)</span>
        <span><span className="swatch" style={{ background: "var(--danger)" }} />orphaned by reorg</span>
      </div>
      <div className="diagram-caption">
        Each block commits to the previous block's hash, so history is tamper-evident. The tip is
        never final: a reorg can orphan it and its transactions rejoin the mempool — which is exactly
        why apps wait for confirmations. <span className="mono">{lastEvent}</span>
      </div>
    </div>
  );
}
