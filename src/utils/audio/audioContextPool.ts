interface PooledAudioContext {
  context: AudioContext;
  inUse: boolean;
  lastUsed: number;
  createdAt: number;
}

class AudioContextPool {
  private pools = new Map<string, PooledAudioContext>();
  private maxPoolSize = 3;
  private maxIdleTime = 30000; // 30 seconds
  private cleanupInterval: number | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  getContext(key: string = 'default'): AudioContext {
    let pooled = this.pools.get(key);

    if (!pooled || pooled.context.state === 'closed') {
      const context = new AudioContext();
      pooled = {
        context,
        inUse: true,
        lastUsed: Date.now(),
        createdAt: Date.now(),
      };
      this.pools.set(key, pooled);
    } else {
      pooled.inUse = true;
      pooled.lastUsed = Date.now();
    }

    if (pooled.context.state === 'suspended') {
      pooled.context.resume().catch(console.warn);
    }

    return pooled.context;
  }

  releaseContext(key: string = 'default'): void {
    const pooled = this.pools.get(key);
    if (pooled) {
      pooled.inUse = false;
      pooled.lastUsed = Date.now();
    }
  }

  closeContext(key: string): void {
    const pooled = this.pools.get(key);
    if (pooled) {
      pooled.context.close().catch(console.warn);
      this.pools.delete(key);
    }
  }

  suspendContext(key: string): void {
    const pooled = this.pools.get(key);
    if (pooled && pooled.context.state === 'running') {
      pooled.context.suspend().catch(console.warn);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupIdleContexts();
    }, 10000); // Check every 10 seconds
  }

  private cleanupIdleContexts(): void {
    const now = Date.now();

    for (const [key, pooled] of this.pools.entries()) {
      const idleTime = now - pooled.lastUsed;

      if (!pooled.inUse && idleTime > this.maxIdleTime) {
        pooled.context.close().catch(console.warn);
        this.pools.delete(key);
      }
    }

    if (this.pools.size > this.maxPoolSize) {
      const oldestKey = this.getOldestUnusedContext();
      if (oldestKey) {
        this.closeContext(oldestKey);
      }
    }
  }

  private getOldestUnusedContext(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, pooled] of this.pools.entries()) {
      if (!pooled.inUse && pooled.lastUsed < oldestTime) {
        oldestTime = pooled.lastUsed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    for (const [key] of this.pools.entries()) {
      this.closeContext(key);
    }
    this.pools.clear();
  }

  getStats(): {
    activeContexts: number;
    totalContexts: number;
    memoryUsage: number; // Estimated in MB
  } {
    const activeContexts = Array.from(this.pools.values()).filter(
      p => p.inUse
    ).length;

    const totalContexts = this.pools.size;

    const memoryUsage = totalContexts * 2; // Rough estimate: 2MB per context

    return {
      activeContexts,
      totalContexts,
      memoryUsage,
    };
  }
}

export const audioContextPool = new AudioContextPool();
