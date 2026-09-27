type Entry = { expiresAt: number; promise: Promise<unknown> };
const entries = new Map<string, Entry>();

export async function withIdempotency<T>(key: string, operation: () => Promise<T>, ttlMs = 60_000): Promise<T> {
  const now = Date.now();
  for (const [storedKey, entry] of entries) if (entry.expiresAt <= now) entries.delete(storedKey);
  const existing = entries.get(key);
  if (existing && existing.expiresAt > now) return existing.promise as Promise<T>;
  const promise = operation();
  entries.set(key, { expiresAt: now + ttlMs, promise });
  try {
    return await promise;
  } catch (error) {
    entries.delete(key);
    throw error;
  }
}

export function resetIdempotencyForTests() {
  entries.clear();
}
