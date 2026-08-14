import { renderHook } from "@testing-library/react";
import { useIdempotencyKey } from "../useIdempotencyKey";

describe("useIdempotencyKey", () => {
  it("returns a stable key (<=64 chars) while the payload fingerprint is unchanged", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const key1 = result.current.getKey("payload-A");
    const key2 = result.current.getKey("payload-A");
    expect(key1).toEqual(expect.any(String));
    expect(key1.length).toBeGreaterThan(0);
    expect(key1.length).toBeLessThanOrEqual(64);
    expect(key2).toBe(key1);
  });

  it("regenerates the key when the payload fingerprint changes", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const key1 = result.current.getKey("payload-A");
    const key2 = result.current.getKey("payload-B");
    expect(key2).not.toBe(key1);
    // …and stays stable for the new fingerprint.
    expect(result.current.getKey("payload-B")).toBe(key2);
  });

  it("issues a fresh key for the same fingerprint after reset()", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const key1 = result.current.getKey("payload-A");
    result.current.reset();
    const key2 = result.current.getKey("payload-A");
    expect(key2).not.toBe(key1);
  });
});
