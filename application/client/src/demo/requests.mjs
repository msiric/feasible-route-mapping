export const MAX_LOCATIONS = 8;

/** Run one segment at a time; never fill the small routing server's queue. */
export async function routeJourney(segments, fetchSegment, signal, onProgress = (index, total) => {}) {
  if (segments.length >= MAX_LOCATIONS) throw new Error(`Choose at most ${MAX_LOCATIONS} locations.`);
  const results = [];
  for (const [index, segment] of segments.entries()) {
    signal.throwIfAborted();
    onProgress(index + 1, segments.length);
    results.push(await fetchSegment(segment, signal));
  }
  signal.throwIfAborted();
  return results;
}

export function waitForRetry(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, milliseconds);
    signal.addEventListener('abort', cancel, {once: true});
  });
}

// Routing and contour requests are read-only. Retry only explicit backpressure,
// at most twice, respecting the gateway's one-minute rate-limit window.
export async function requestRouting(action, params, {
  signal = new AbortController().signal,
  onWait = seconds => {},
  fetchImpl = fetch,
  wait = waitForRetry,
} = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    signal.throwIfAborted();
    const response = await fetchImpl('/api/' + action, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(params), signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
    });
    if (response.ok) return response.json();
    const data = await response.json().catch(() => ({}));
    const retryAfter = response.headers.get('Retry-After');
    const seconds = retryAfter === null ? 3 : Number(retryAfter);
    if (response.status === 429 && attempt < 2 && Number.isFinite(seconds) && seconds >= 0 && seconds <= 60) {
      onWait(Math.max(1, seconds));
      await wait(Math.max(1, seconds) * 1000, signal);
      continue;
    }
    throw new Error(data.error || 'The free routing server is starting or busy. Please retry shortly.');
  }
}
