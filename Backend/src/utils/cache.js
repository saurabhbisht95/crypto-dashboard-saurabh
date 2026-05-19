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
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  stats() {
    const now = Date.now();
    let activeEntries = 0;

    this.store.forEach((item, key) => {
      if (now > item.expiresAt) {
        this.store.delete(key);
      } else {
        activeEntries += 1;
      }
    });

    return {
      activeEntries,
      provider: "memory",
    };
  }
}

export const cache = new MemoryCache();
