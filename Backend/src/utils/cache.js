class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      return null;
    }

    return item.value;
  }

  getStale(key) {
    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > (item.staleUntil || item.expiresAt)) {
      this.store.delete(key);
      return null;
    }

    return item?.value || null;
  }

  set(key, value, ttlMs, staleTtlMs = ttlMs) {
    const now = Date.now();

    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
      staleUntil: now + Math.max(ttlMs, staleTtlMs),
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  stats() {
    const now = Date.now();
    let activeEntries = 0;
    let staleEntries = 0;

    this.store.forEach((item, key) => {
      if (now > (item.staleUntil || item.expiresAt)) {
        this.store.delete(key);
      } else if (now <= item.expiresAt) {
        activeEntries += 1;
      } else {
        staleEntries += 1;
      }
    });

    return {
      activeEntries,
      staleEntries,
      provider: "memory",
    };
  }
}

export const cache = new MemoryCache();
