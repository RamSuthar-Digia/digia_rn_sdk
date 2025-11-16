import React, { createContext, useContext } from 'react';
import { StateContext } from './state_context';
/**
 * React Context for providing StateContext throughout the component tree.
 * 
 * React Native equivalent of Flutter's InheritedWidget pattern.
 * This context is used primarily for accessing the StateContext to call
 * setValue/setValues, rather than for reading state variables directly.
 * 
 * State changes trigger re-renders via StateContext's EventEmitter pattern,
 * not through React Context updates.
 */
const StateContextContext = createContext<StateContext | null>(null);

/**
 * Props for StateContextProvider component.
 */
interface StateContextProviderProps {
  stateContext: StateContext;
  children: React.ReactNode;
}

/**
 * Provides access to a StateContext throughout the component tree.
 * 
 * This provider component makes a StateContext instance available to
 * all descendant components via React Context.
 * 
 * @example
 * ```typescript
 * const stateContext = new StateContext('myComponent', {
 *   initialState: { count: 0 }
 * });
 * 
 * function App() {
 *   return (
 *     <StateContextProvider stateContext={stateContext}>
 *       <MyComponent />
 *     </StateContextProvider>
 *   );
 * }
 * 
 * function MyComponent() {
 *   const state = useStateContext();
 *   
 *   const increment = () => {
 *     const count = state.getValue('count') as number;
 *     state.setValue('count', count + 1);
 *   };
 *   
 *   return <Button title="Increment" onPress={increment} />;
 * }
 * ```
 */
export const StateContextProvider: React.FC<StateContextProviderProps> = ({
  stateContext,
  children,
}) => {
  return (
    <StateContextContext.Provider value={stateContext}>
      {children}
    </StateContextContext.Provider>
  );
};

/**
 * Hook to access the nearest StateContext from the component tree.
 * 
 * @returns The StateContext instance, or null if not found
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const stateContext = useStateContext();
 *   
 *   if (!stateContext) {
 *     return <Text>No state context found</Text>;
 *   }
 *   
 *   const count = stateContext.getValue('count');
 *   return <Text>Count: {count}</Text>;
 * }
 * ```
 */
export function useStateContext(): StateContext | null {
  return useContext(StateContextContext);
}

/**
 * Hook to access the StateContext with a required assertion.
 * 
 * Throws an error if no StateContext is found in the tree.
 * Use this when you expect a StateContext to always be present.
 * 
 * @returns The StateContext instance
 * @throws Error if no StateContextProvider is found
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const stateContext = useRequiredStateContext();
 *   
 *   // Safe to use without null checks
 *   const count = stateContext.getValue('count');
 *   return <Text>Count: {count}</Text>;
 * }
 * ```
 */
export function useRequiredStateContext(): StateContext {
  const context = useContext(StateContextContext);
  if (context === null) {
    throw new Error(
      'useRequiredStateContext must be used within a StateContextProvider'
    );
  }
  return context;
}

/**
 * Static helper functions for StateContext access (Flutter-style API).
 * 
 * Note: These are provided for API compatibility but React hooks
 * (useStateContext, useRequiredStateContext) are preferred.
 */
export class StateContextHelper {
  /**
   * Finds a StateContext with the specified namespace.
   * 
   * @param context - The StateContext to search from
   * @param namespace - The namespace to find
   * @returns StateContext with matching namespace, or undefined
   * 
   * @example
   * ```typescript
   * function MyComponent() {
   *   const currentState = useRequiredStateContext();
   *   const parentState = StateContextHelper.findStateByName(
   *     currentState,
   *     'parentComponent'
   *   );
   * }
   * ```
   */
  static findStateByName(
    stateContext: StateContext | null,
    namespace: string
  ): StateContext | null {
    const ctx = stateContext;
    if (!ctx) return null;
    return ctx.findAncestorContext(namespace) ?? null;
  }

  /**
   * Finds the origin StateContext (the topmost context in the hierarchy).
   * 
   * @param context - The StateContext to search from
   * @returns The origin (root) StateContext
   * 
   * @example
   * ```typescript
   * function MyComponent() {
   *   const currentState = useRequiredStateContext();
   *   const rootState = StateContextHelper.getOriginState(currentState);
   * }
   * ```
   */
  static getOriginState(
    stateContext: StateContext | null
  ): StateContext {
    const ctx = stateContext;
    if (!ctx) {
      throw new Error('No StateContext found in component tree');
    }
    return ctx.originContext;
  }
}
