// TimerController - TypeScript equivalent of the Dart implementation
// Provides a simple stream-like subscribe API and control methods.

import { ExprInstance } from "@digia/expr-rn";

export type Subscription = {
    unsubscribe: () => void;
};

export type StreamLike = {
    subscribe: (fn: (value: number) => void) => Subscription;
};

export class TimerController implements ExprInstance {
    readonly initialValue: number;
    readonly updateInterval: number; // milliseconds
    readonly isCountDown: boolean;
    readonly duration: number; // number of ticks (not ms)

    private _listeners: Set<(v: number) => void> = new Set();
    private _timerId: ReturnType<typeof setInterval> | null = null;
    private _tickCount = 0;
    private _currentValue: number;
    private _isRunning = false;

    constructor(options: {
        initialValue: number;
        updateInterval: number;
        isCountDown: boolean;
        duration: number;
    }) {
        this.initialValue = options.initialValue;
        this.updateInterval = options.updateInterval;
        this.isCountDown = options.isCountDown;
        this.duration = options.duration;
        this._currentValue = this.initialValue;
    }

    // Stream-like object exposing a subscribe method
    get stream(): StreamLike {
        return {
            subscribe: (fn: (v: number) => void) => {
                this._listeners.add(fn);
                // Emit current value immediately on subscribe (similar to Behavior)
                fn(this._currentValue);
                return { unsubscribe: () => this._listeners.delete(fn) };
            },
        };
    }

    // Expose current tick value
    get currentValue(): number {
        return this._currentValue;
    }

    private _emit(value: number) {
        this._currentValue = value;
        for (const l of Array.from(this._listeners)) {
            try {
                l(value);
            } catch (e) {
                // swallow listener errors
                // console.warn('TimerController listener error', e);
            }
        }
    }

    start() {
        if (this._isRunning) return;
        this._isRunning = true;

        // Determine tickCount based on currentValue to support resume
        this._tickCount = this.isCountDown
            ? this.initialValue - this._currentValue
            : this._currentValue - this.initialValue;

        // Emit the current (initial) value immediately
        this._emit(this._currentValue);

        this._timerId = setInterval(() => {
            this._tickCount += 1;
            const value = this.isCountDown
                ? this.initialValue - this._tickCount
                : this.initialValue + this._tickCount;

            this._emit(value);

            if (this._tickCount >= this.duration) {
                this._stopInternal();
            }
        }, this.updateInterval);
    }

    private _stopInternal() {
        if (this._timerId != null) {
            clearInterval(this._timerId as ReturnType<typeof setInterval>);
            this._timerId = null;
        }
        this._isRunning = false;
    }

    reset() {
        this._stopInternal();
        this._currentValue = this.initialValue;
        this._isRunning = false;
        this.start();
    }

    pause() {
        if (!this._isRunning) return;
        if (this._timerId != null) clearInterval(this._timerId as ReturnType<typeof setInterval>);
        this._timerId = null;
        this._isRunning = false;
    }

    resume() {
        if (this._isRunning) return;
        // start() will compute tickCount from _currentValue and resume
        this.start();
    }

    dispose() {
        this._stopInternal();
        this._listeners.clear();
    }

    // Provide fields for expression evaluation if needed
    getField(name: string): any {
        switch (name) {
            case 'currentValue':
                return this.currentValue;
            default:
                return null;
        }
    }
}

export default TimerController;

