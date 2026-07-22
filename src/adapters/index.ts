import type { ChainReader, ChainSourceId } from "@/ports/chain.ts";
import { createSimulatedReader } from "@/adapters/simulatedReader.ts";
import { createViemReader } from "@/adapters/viemReader.ts";

/** Pick a ChainReader implementation for a source id. The one place the app
 *  chooses a concrete adapter; everything else depends only on the port. */
export function createReader(id: ChainSourceId): ChainReader {
  return id === "simulated" ? createSimulatedReader() : createViemReader(id);
}
