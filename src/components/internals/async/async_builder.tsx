import React from 'react';
import AsyncController from './async_controller';

export interface AsyncBuilderState<T> {
    data?: T | null;
    error?: any;
    loading: boolean;
}

export interface AsyncBuilderProps<T> {
    initialData?: T | null;
    controller?: AsyncController<T> | null;
    futureFactory?: (() => Promise<T>) | null;
    /**
     * Builder receives the current snapshot-like state and should return a React node.
     */
    builder: (state: AsyncBuilderState<T>) => React.ReactNode;
}

/**
 * AsyncBuilder - React/React Native equivalent of the Flutter AsyncBuilder.
 *
 * It accepts an external `controller` or creates its own using `futureFactory`.
 * It subscribes to controller notifications and re-loads the underlying
 * promise when invalidated.
 */
export function AsyncBuilder<T>(props: AsyncBuilderProps<T>): JSX.Element | null {
    const { initialData = null, controller: externalController = null, futureFactory, builder } = props;

    const internalControllerRef = React.useRef<AsyncController<T> | null>(null);
    const currentControllerRef = React.useRef<AsyncController<T> | null>(null);
    const loadIdRef = React.useRef(0);

    const [snapshot, setSnapshot] = React.useState<AsyncBuilderState<T>>({
        data: initialData,
        error: undefined,
        loading: false,
    });

    // Helper to create or re-use controller
    const setupController = React.useCallback(() => {
        // If an external controller is provided, prefer it.
        if (externalController) {
            currentControllerRef.current = externalController;
        } else {
            // Create internal controller if not created yet
            if (!internalControllerRef.current) {
                internalControllerRef.current = new AsyncController<T>(futureFactory ?? null);
            } else if (futureFactory) {
                // If factory changed, update controller's creator
                internalControllerRef.current.setFutureCreator(futureFactory);
            }

            currentControllerRef.current = internalControllerRef.current;
        }
    }, [externalController, futureFactory]);

    const teardownController = React.useCallback(() => {
        const ctrl = currentControllerRef.current;
        if (!ctrl) return;
        ctrl.removeListener(_rebuild);
        // Do not dispose internal controller automatically; keep behaviour small.
        currentControllerRef.current = null;
    }, []);

    // Load and attach to the controller's promise.
    const load = React.useCallback(() => {
        const ctrl = currentControllerRef.current;
        const loadId = ++loadIdRef.current;

        if (!ctrl) {
            setSnapshot((s) => ({ ...s, loading: false }));
            return;
        }

        const p = ctrl.getFuture();
        if (!p) {
            setSnapshot((s) => ({ ...s, loading: false }));
            return;
        }

        setSnapshot((s) => ({ ...s, loading: true }));

        p.then((result) => {
            if (loadId !== loadIdRef.current) return; // stale
            setSnapshot({ data: result, error: undefined, loading: false });
        }).catch((err) => {
            if (loadId !== loadIdRef.current) return; // stale
            setSnapshot({ data: null, error: err, loading: false });
        });
    }, []);

    // Listener invoked when controller notifies invalidation
    const _rebuild = React.useCallback(() => {
        // Re-run load to attach to new promise
        load();
        // Also trigger a state update so builder can re-run immediately if needed
        setSnapshot((s) => ({ ...s }));
    }, [load]);

    // Effect: create/setup controller and subscribe
    React.useEffect(() => {
        setupController();

        const ctrl = currentControllerRef.current;
        if (ctrl) {
            ctrl.addListener(_rebuild);
        }

        // initial load
        load();

        return () => {
            if (ctrl) {
                ctrl.removeListener(_rebuild);
            }
        };
        // We intentionally omit _rebuild from deps to avoid re-subscribing the same function
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setupController, load]);

    // Handle change of external controller or futureFactory (recreate subscription)
    React.useEffect(() => {
        // If the controller instance changed (external controller swapped),
        // re-setup subscriptions.
        const prev = currentControllerRef.current;
        if ((externalController && externalController !== prev) || (!externalController && prev === null)) {
            teardownController();
            setupController();
            const ctrl = currentControllerRef.current;
            if (ctrl) ctrl.addListener(_rebuild);
            load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalController, futureFactory]);

    // Keep initialData in sync when it changes
    React.useEffect(() => {
        setSnapshot((s) => ({ ...s, data: initialData }));
    }, [initialData]);

    return <>{builder(snapshot)}</>;
}

export default AsyncBuilder;
