export const CONFIG_TTL = 10 * 60 * 1000;

const store = new Map<string, { expires: number; value: Promise<unknown> }>();

export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const value = load().catch((err: unknown) => {
    store.delete(key);
    throw err;
  });
  store.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

export function clearMemoryCache(): void {
  store.clear();
}
