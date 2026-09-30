import { describe, expect, it, vi } from "vitest";
import { createStoredFlag } from "./use-stored-flag";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

const refusingStorage = {
  getItem(): string | null {
    throw new DOMException("The operation is insecure.", "SecurityError");
  },
  setItem(): void {
    throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
  },
};

describe("stored flag", () => {
  it("is lowered until raised, then stays raised for the next page", () => {
    const storage = memoryStorage();
    const flag = createStoredFlag("hint", () => storage);

    expect(flag.isRaised()).toBe(false);
    flag.raise();
    expect(flag.isRaised()).toBe(true);
    expect(createStoredFlag("hint", () => storage).isRaised()).toBe(true);
    expect(createStoredFlag("other-hint", () => storage).isRaised()).toBe(false);
  });

  it("tells the components listening when it is raised", () => {
    const flag = createStoredFlag("hint", memoryStorage);
    const listener = vi.fn();
    const unsubscribe = flag.subscribe(listener);

    flag.raise();
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    flag.raise();
    expect(listener).toHaveBeenCalledOnce();
  });

  it("reads as lowered, and remembers in memory, when the storage refuses", () => {
    const flag = createStoredFlag("hint", () => refusingStorage);

    expect(flag.isRaised()).toBe(false);
    expect(() => flag.raise()).not.toThrow();
    expect(flag.isRaised()).toBe(true);
  });

  it("works when there is no storage at all", () => {
    const flag = createStoredFlag("hint", () => {
      throw new ReferenceError("window is not defined");
    });

    expect(flag.isRaised()).toBe(false);
    flag.raise();
    expect(flag.isRaised()).toBe(true);
  });
});
