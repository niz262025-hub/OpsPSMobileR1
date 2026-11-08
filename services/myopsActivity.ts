// Only trusted interaction in a visible document renews the central session.
export function createMyopsActivityTracker() {
  let version = 0;
  let sent = 0;
  return {
    record(event: { isTrusted: boolean }, visible: boolean) { if (event.isTrusted && visible) version++; },
    snapshot() { return { version, active: version > sent }; },
    acknowledge(value: number) { sent = Math.max(sent, value); },
  };
}
