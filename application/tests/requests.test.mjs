import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestRouting, routeJourney, waitForRetry} from '../client/src/demo/requests.mjs';

test('an eight-location journey preserves order with one in-flight segment', async () => {
  let active = 0, peak = 0;
  const segments = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const result = await routeJourney(segments, async segment => {
    active++; peak = Math.max(peak, active);
    await new Promise(resolve => setImmediate(resolve));
    active--; return segment;
  }, new AbortController().signal);
  assert.deepEqual(result, segments); assert.equal(peak, 1);
  await assert.rejects(routeJourney([...segments, 'h'], () => assert.fail('must reject before requesting'), new AbortController().signal), /at most 8/);
});

test('cancelling a journey prevents subsequent segments from being requested', async () => {
  const controller = new AbortController(); const calls = [];
  await assert.rejects(routeJourney([1,2,3,4], async segment => {
    calls.push(segment); controller.abort(); return segment;
  }, controller.signal), {name: 'AbortError'});
  assert.deepEqual(calls, [1]);
});

test('rate limiting waits for Retry-After and recovers without concurrent retries', async () => {
  let calls = 0; const waits = [], notices = [];
  const result = await requestRouting('route', {}, {
    fetchImpl: async () => ++calls === 1
      ? new Response('{"error":"rate limited"}', {status:429,headers:{'Retry-After':'60'}})
      : new Response('{"ok":true}'),
    wait: async ms => {waits.push(ms);}, onWait: seconds => notices.push(seconds),
  });
  assert.deepEqual(result, {ok:true}); assert.equal(calls, 2);
  assert.deepEqual(waits, [60000]); assert.deepEqual(notices, [60]);
});

test('retries are bounded and non-429 errors are surfaced immediately', async () => {
  for (const status of [429,400,503]) {
    let calls = 0;
    await assert.rejects(requestRouting('isochrone', {}, {
      fetchImpl: async () => {calls++; return new Response('{"error":"unavailable"}', {status});},
      wait: async () => {},
    }), /unavailable/);
    assert.equal(calls, status === 429 ? 3 : 1);
  }
});

test('cancel interrupts a rate-limit wait without another request', async () => {
  const controller = new AbortController(); let calls = 0;
  await assert.rejects(requestRouting('route', {}, {
    signal: controller.signal,
    fetchImpl: async () => {calls++; return new Response('{}', {status:429});},
    onWait: () => queueMicrotask(() => controller.abort()),
    wait: waitForRetry,
  }), {name:'AbortError'});
  assert.equal(calls,1);
});
