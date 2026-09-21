import { describe, expect, it } from "vitest";
import { loadMapModule } from "../lib/map-support";

describe("loadMapModule", () => {
  it("returns the map module when the native module is available", () => {
    const module = { default: "MapView", Marker: "Marker", Polyline: "Polyline" };
    expect(loadMapModule(() => module)).toEqual(module);
  });

  it("returns null when Expo Go cannot load the native map module", () => {
    expect(loadMapModule(() => { throw new Error("RNMapsAirModule missing"); })).toBeNull();
  });
});
