// Module-level cache for Lottie animation data.
// Survives component unmount/remount so animations don't re-fetch on tab switch.
const cache: Record<string, any> = {};
const inflight: Record<string, Promise<any>> = {};

export function getCachedAnimation(id: string): any | undefined {
  return cache[id];
}

export function getAllCached(): Record<string, any> {
  return { ...cache };
}

export async function fetchAnimation(id: string, url: string): Promise<any> {
  if (cache[id]) return cache[id];

  // Deduplicate concurrent fetches for the same id
  if (!inflight[id]) {
    inflight[id] = fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        cache[id] = data;
        delete inflight[id];
        return data;
      })
      .catch(err => {
        delete inflight[id];
        throw err;
      });
  }

  return inflight[id];
}
