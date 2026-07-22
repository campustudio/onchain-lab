import { INVARIANT_STACK } from "@/domain/invariants.ts";

export function Overview() {
  return (
    <div className="stack">
      <section className="panel">
        <h2>What this lab is</h2>
        <p className="lead">
          <strong>onchain-lab</strong> is a hands-on, provider-neutral reference for the parts of
          blockchain engineering that <em>don't</em> change. Chains, L2s, and libraries come and go;
          the mental model underneath them — keys and signatures, the transaction lifecycle, the ABI
          as a data contract, and keeping an off-chain read model in sync with the chain — does not.
          This lab demonstrates that durable core end to end, and treats every concrete chain or
          library as a replaceable <span className="mono">vehicle</span> kept behind a port.
        </p>
        <div className="callout">
          Built frontend-first: the early slices run entirely in the browser with zero backend, then
          a backend indexer is introduced only once the client-side approach visibly hits its
          limits — the same way real dApps evolve from direct RPC calls to a dedicated indexer.
        </div>
      </section>

      <section className="panel">
        <h2>The durable stack it demonstrates</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: -4 }}>
          Each layer lists the ideas worth keeping (they survive tool churn) and, in muted text, the
          churning vehicle used only to demonstrate them.
        </p>
        <div className="grid cols-2" style={{ marginTop: 14 }}>
          {INVARIANT_STACK.map((l) => (
            <div className="invariant" key={l.id}>
              <div className="layer">{l.layer}</div>
              <ul>
                {l.invariants.map((inv) => (
                  <li key={inv}>{inv}</li>
                ))}
              </ul>
              <div className="vehicle">
                vehicle (replaceable): {l.vehicle}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>How to read the tabs</h2>
        <div className="grid cols-2">
          <div>
            <h3>Track A — frontend-first</h3>
            <ul className="muted" style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 18 }}>
              <li><strong>Keys &amp; Signing</strong> — pure client-side cryptography, no chain.</li>
              <li><strong>Read</strong> — provider-neutral RPC reads of on-chain state.</li>
              <li><strong>Transactions</strong> — build, sign, broadcast, and watch the lifecycle.</li>
              <li><strong>Indexer (client)</strong> — project events into a read model, in the browser.</li>
            </ul>
          </div>
          <div>
            <h3>Track B — backend, later</h3>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
              A reorg-safe, idempotent indexer and typed API arrive once the client-side indexer
              hits its limits (deep history, persistence, reliability). Introduced gradually, each
              step motivated by a concrete limitation felt in Track A.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
