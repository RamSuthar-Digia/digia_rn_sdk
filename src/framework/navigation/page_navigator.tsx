// import React, { useState, useCallback } from 'react';
// import { View } from 'react-native';

// /**
//  * Page navigation manager - Flutter-like imperative navigation
//  * No need to pre-define screens like Stack.Navigator
//  */

// interface PageRoute {
//     key: string;
//     pageId: string;
//     params?: any;
//     element: React.ReactElement;
// }

// let navigationStack: PageRoute[] = [];
// let updateStackCallback: ((stack: PageRoute[]) => void) | null = null;

// /**
//  * Register the stack update callback
//  */
// export function registerNavigationStackCallback(callback: (stack: PageRoute[]) => void) {
//     updateStackCallback = callback;
// }

// /**
//  * Push a new page onto the navigation stack
//  */
// export function pushPage(pageId: string, pageElement: React.ReactElement, params?: any) {
//     const route: PageRoute = {
//         key: `${pageId}_${Date.now()}`,
//         pageId,
//         params,
//         element: pageElement,
//     };

//     navigationStack.push(route);
//     updateStackCallback?.(navigationStack);
// }

// /**
//  * Pop the current page from the navigation stack
//  */
// export function popPage(): boolean {
//     if (navigationStack.length <= 1) {
//         return false; // Can't pop the last page
//     }

//     navigationStack.pop();
//     updateStackCallback?.(navigationStack);
//     return true;
// }

// /**
//  * Replace the current page with a new one
//  */
// export function replacePage(pageId: string, pageElement: React.ReactElement, params?: any) {
//     if (navigationStack.length === 0) {
//         pushPage(pageId, pageElement, params);
//         return;
//     }

//     const route: PageRoute = {
//         key: `${pageId}_${Date.now()}`,
//         pageId,
//         params,
//         element: pageElement,
//     };

//     navigationStack[navigationStack.length - 1] = route;
//     updateStackCallback?.(navigationStack);
// }

// /**
//  * Pop until a condition is met
//  */
// export function popUntil(predicate: (route: PageRoute) => boolean): boolean {
//     let foundIndex = -1;

//     for (let i = navigationStack.length - 1; i >= 0; i--) {
//         if (predicate(navigationStack[i])) {
//             foundIndex = i;
//             break;
//         }
//     }

//     if (foundIndex >= 0 && foundIndex < navigationStack.length - 1) {
//         navigationStack = navigationStack.slice(0, foundIndex + 1);
//         updateStackCallback?.(navigationStack);
//         return true;
//     }

//     return false;
// }

// /**
//  * Get the current navigation stack
//  */
// export function getNavigationStack(): PageRoute[] {
//     return [...navigationStack];
// }

// /**
//  * Check if can go back
//  */
// export function canGoBack(): boolean {
//     return navigationStack.length > 1;
// }

// /**
//  * Set the initial page
//  */
// export function setInitialPage(pageId: string, pageElement: React.ReactElement, params?: any) {
//     navigationStack = [{
//         key: `${pageId}_initial`,
//         pageId,
//         params,
//         element: pageElement,
//     }];
//     updateStackCallback?.(navigationStack);
// }

// /**
//  * PageNavigator component - renders the current page stack
//  */
// export const PageNavigator: React.FC<{ children?: React.ReactElement }> = ({ children }) => {
//     const [stack, setStack] = useState<PageRoute[]>(() => {
//         if (children) {
//             return [{
//                 key: 'initial',
//                 pageId: 'initial',
//                 element: children,
//             }];
//         }
//         return [];
//     });

//     React.useEffect(() => {
//         registerNavigationStackCallback(setStack);

//         if (children && stack.length === 0) {
//             setInitialPage('initial', children);
//         }
//     }, [children]);

//     if (stack.length === 0) {
//         return null;
//     }

//     // Render only the top page (current page)
//     const currentPage = stack[stack.length - 1];

//     return <View style={{ flex: 1 }} key={currentPage.key}>{currentPage.element}</View>;
// };
