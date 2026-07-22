import { INVARIANT_STACK } from "@/domain/invariants.ts";

// The durable stack as a foundation: cryptography is the bedrock, systems sit on
// top. Everything above depends on the layers below, and none of it depends on a
// specific chain or library -- those are the vehicles noted in muted text.

export function StackDiagram() {
  const layers = [...INVARIANT_STACK].reverse(); // systems on top, crypto at the bottom
  const n = layers.length;
  return (
    <div className="stackd">
      {layers.map((l, i) => {
        const depth = (n - i) / n; // deeper layers get a stronger tint
        return (
          <div
            className="slayer"
            key={l.id}
            style={{ ["--depth" as string]: depth.toFixed(2) }}
          >
            <div>
              <div className="sname">{l.layer}</div>
              <div className="svehicle">vehicle: {l.vehicle}</div>
            </div>
            <div className="schips">
              {l.invariants.map((inv) => (
                <span className="chip" key={inv}>
                  {inv}
                </span>
              ))}
            </div>
          </div>
        );
      })}
      <div className="bedrock">↓ each layer depends only on the ones below · none depends on a specific chain or library ↓</div>
    </div>
  );
}
