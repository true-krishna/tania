type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Notifies that the session cannot be recovered and the user must sign in
 * again. Fired only by the Apollo error link when the session is cleared
 * after a failed refresh (src/lib/apollo/client.ts) — explicit logout does
 * its own routing.
 */
export function notifySessionExpired(): void {
  // Iterate a snapshot so a listener may unsubscribe mid-notification.
  for (const listener of [...listeners]) listener();
}

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
