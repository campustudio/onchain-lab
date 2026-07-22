import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn"
      style={{ padding: "4px 8px", fontSize: 11 }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable; ignore */
        }
      }}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

/** A labelled, monospace, copyable readout row. */
export function ValueRow({
  label,
  value,
  copyable = true,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <label style={{ margin: 0 }}>{label}</label>
        {copyable && value ? <CopyButton value={value} /> : null}
      </div>
      <div
        className="mono"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 12.5,
          wordBreak: "break-all",
          color: value ? "var(--text)" : "var(--text-faint)",
          minHeight: 34,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={`pill ${ok ? "ok" : "bad"}`}>{children}</span>;
}
