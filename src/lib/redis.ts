// Fallback Memory Cache
class MemoryRedis {
  private cache = new Map<string, { value: string; expiresAt: number | null }>();

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    try {
      return JSON.parse(item.value) as T;
    } catch {
      return item.value as unknown as T;
    }
  }

  async set(key: string, value: any, options?: { ex?: number; px?: number }): Promise<'OK'> {
    let expiresAt: number | null = null;
    if (options?.ex) {
      expiresAt = Date.now() + options.ex * 1000;
    } else if (options?.px) {
      expiresAt = Date.now() + options.px;
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    this.cache.set(key, { value: stringValue, expiresAt });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const val = await this.get<number>(key);
    const newVal = (Number(val) || 0) + 1;
    await this.set(key, newVal);
    return newVal;
  }

  async decr(key: string): Promise<number> {
    const val = await this.get<number>(key);
    const newVal = (Number(val) || 0) - 1;
    await this.set(key, newVal);
    return newVal;
  }

  async del(key: string): Promise<number> {
    const exists = this.cache.has(key);
    this.cache.delete(key);
    return exists ? 1 : 0;
  }
}

// Global cached client instance to survive Next.js hot reloads in development
if (!(global as any).redisClient) {
  (global as any).redisClient = new MemoryRedis();
  console.log('System Memory Cache client initialized.');
}

export const redis = (global as any).redisClient;

