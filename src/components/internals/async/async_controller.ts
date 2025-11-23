/**
 * AsyncController
 *
 * A small utility to lazily create and cache a Promise produced by a
 * provided factory function. Consumers can invalidate the cached promise
 * (so the next call to getFuture() will recreate it) and register listeners
 * that are notified when invalidateAndNotify() is called.
 *
 * This mirrors the semantics of the Dart/Flutter AsyncController in the
 * original codebase but implemented in lightweight TypeScript.
 */

export type Listener = () => void;

export class AsyncController<T> {
    private _futureCreator?: (() => Promise<T>) | null;
    private _isDirty = true;
    private _currentPromise: Promise<T> | null = null;
    private _listeners: Set<Listener> = new Set();

    constructor(futureCreator?: (() => Promise<T>) | null) {
        this._futureCreator = futureCreator ?? null;
        // Intentionally do NOT call the creator here to avoid double-calls
        // when a controller is not provided (matches the Dart behaviour).
        // _currentPromise = this._futureCreator?.();
    }

    /** Replace the future factory. Does not automatically create the future. */
    setFutureCreator(futureCreator: () => Promise<T>) {
        this._futureCreator = futureCreator;
        // mark dirty so next getFuture will call the new factory
        this._isDirty = true;
    }

    /** Invalidate the cached promise so next getFuture recreates it. */
    invalidate() {
        this._isDirty = true;
        this._currentPromise = null;
    }

    /** Invalidate and notify registered listeners. */
    invalidateAndNotify() {
        this.invalidate();
        this.notifyListeners();
    }

    /**
     * Returns the cached Promise if present, otherwise calls the factory
     * to create a new one. Returns null if no factory is set.
     */
    getFuture(): Promise<T> | null {
        if (this._isDirty) {
            this._currentPromise = this._futureCreator ? this._futureCreator() : null;
            this._isDirty = false;
            return this._currentPromise;
        }

        return this._currentPromise;
    }

    /** Register a listener to be notified on invalidateAndNotify. */
    addListener(listener: Listener) {
        this._listeners.add(listener);
    }

    /** Remove a previously registered listener. */
    removeListener(listener: Listener) {
        this._listeners.delete(listener);
    }

    /** Notify all registered listeners. */
    notifyListeners() {
        // Copy listeners to avoid mutation during iteration
        const listeners = Array.from(this._listeners);
        for (const l of listeners) {
            try {
                l();
            } catch (err) {
                // Swallow listener errors to avoid breaking notification loop
                // Users can log if they want; keep this utility robust.
                // eslint-disable-next-line no-console
                console.error('AsyncController listener threw:', err);
            }
        }
    }

    /** Convenience: check whether there is an active promise cached. */
    hasCached(): boolean {
        return this._currentPromise !== null && !this._isDirty;
    }

    /** Dispose all listeners and clear internal state. */
    dispose() {
        this._listeners.clear();
        this._currentPromise = null;
        this._futureCreator = null;
    }
}

export default AsyncController;
