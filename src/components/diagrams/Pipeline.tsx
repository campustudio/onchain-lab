// A small, reusable flow diagram that reflects live values. Each step lights up
// as its value becomes available and the connectors animate to show data moving
// through the transform. Used for the key-derivation and signing flows.

export interface PipeStep {
  title: string;
  value?: string;
  note?: string;
  /** Visual state of this step. */
  state?: "idle" | "active" | "ok" | "bad";
}

export function Pipeline({
  steps,
  flowing = false,
  vertical = false,
}: {
  steps: PipeStep[];
  flowing?: boolean;
  vertical?: boolean;
}) {
  return (
    <div className={`pipe${vertical ? " vertical" : ""}`}>
      {steps.map((s, i) => {
        const state = s.state ?? (s.value ? "active" : "idle");
        const cls =
          state === "ok" ? "active ok" : state === "bad" ? "active bad" : state === "active" ? "active" : "";
        return (
          <div key={i} style={{ display: "flex", alignItems: "stretch", flex: vertical ? "none" : "1 1 0" }}>
            {i > 0 && <div className={`pconn${flowing ? " flow" : ""}`} aria-hidden />}
            <div className={`pstep ${cls}`} style={{ flex: "1 1 0" }}>
              <div className="pt">{s.title}</div>
              {s.value !== undefined && <div className="pv" title={s.value}>{s.value || "—"}</div>}
              {s.note && <div className="pn">{s.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
