import { useEffect, useState } from "react";
import { Overview } from "@/sections/Overview.tsx";
import { KeysLab } from "@/features/keys/KeysLab.tsx";

interface Section {
  id: string;
  num: string;
  label: string;
  element?: React.ReactNode;
  soon?: string;
}

const SECTIONS: Section[] = [
  { id: "overview", num: "00", label: "Overview", element: <Overview /> },
  { id: "keys", num: "01", label: "Keys & Signing", element: <KeysLab /> },
  { id: "read", num: "02", label: "Read", soon: "FE-2" },
  { id: "tx", num: "03", label: "Transactions", soon: "FE-3" },
  { id: "indexer", num: "04", label: "Indexer (client)", soon: "FE-4" },
];

function useHashSection(): [string, (id: string) => void] {
  const initial = window.location.hash.replace(/^#/, "") || "overview";
  const [id, setId] = useState(initial);
  useEffect(() => {
    const onHash = () => setId(window.location.hash.replace(/^#/, "") || "overview");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (next: string) => {
    window.location.hash = next;
    setId(next);
  };
  return [id, go];
}

function ComingSoon({ slice }: { slice: string }) {
  return (
    <section className="panel">
      <h2>
        Coming in slice <span className="mono">{slice}</span>
      </h2>
      <p className="muted">
        This part of the lab is being built. See the Overview for how the slices fit together.
      </p>
    </section>
  );
}

export function App() {
  const [active, go] = useHashSection();
  const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <h1>
            onchain<span className="dot">·</span>lab
          </h1>
          <span className="tag">durable blockchain fundamentals</span>
        </div>
        <nav className="links">
          <a href="https://github.com/campustudio/onchain-lab" target="_blank" rel="noreferrer">
            Repo
          </a>
        </nav>
      </header>

      <div className="safety">
        <span>🛡️</span>
        <span>
          <strong>Testnet only. No secrets.</strong> This lab never touches mainnet value, never
          asks for a real private key or seed phrase, and runs with zero configuration.
        </span>
      </div>

      <nav className="tabs" role="tablist">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === current.id}
            className={`tab${s.soon ? " soon" : ""}`}
            onClick={() => go(s.id)}
          >
            <span className="num">{s.num}</span>
            {s.label}
            {s.soon && <span className="badge-soon">soon</span>}
          </button>
        ))}
      </nav>

      <main>{current.element ?? <ComingSoon slice={current.soon ?? ""} />}</main>

      <footer className="foot">
        <p>
          onchain-lab · a portfolio project demonstrating the durable fundamentals of blockchain
          engineering · provider-neutral · testnet only · MIT licensed.
        </p>
        <p>
          The tools here (chain, RPC provider, crypto library) are vehicles, chosen for
          demonstration and kept behind ports so they can be swapped without touching the UI or the
          core logic.
        </p>
      </footer>
    </div>
  );
}
