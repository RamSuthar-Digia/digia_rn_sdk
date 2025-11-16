// import React from 'react';
// import { View, LayoutChangeEvent, LayoutRectangle } from 'react-native';

// type Constraints = {
//     minWidth?: number;
//     maxWidth?: number;
//     minHeight?: number;
//     maxHeight?: number;
// };

// type ConstraintContextValue = {
//     constraints: Constraints;
//     layout?: LayoutRectangle; // Actual measured size
// } | null;

// export const ConstraintContext = React.createContext<ConstraintContextValue>(null);

// /**
//  * ConstraintProvider: Provides manual constraints (without measuring)
//  * Use this when you know the constraints but don't need to measure the container
//  */
// export const ConstraintProvider = (props: { constraints: Constraints; children?: React.ReactNode }) => {
//     const { constraints, children } = props;
//     const parent = React.useContext(ConstraintContext);
//     const value = parent ?? { constraints };
//     return (
//         <ConstraintContext.Provider value={value}>
//             {children}
//         </ConstraintContext.Provider>
//     );
// };

// /**
//  * useConstraints: Get constraints from nearest ConstraintProvider or MeasuredBox
//  */
// export const useConstraints = () => {
//     const ctx = React.useContext(ConstraintContext);
//     return ctx?.constraints ?? null;
// };

// /**
//  * useLayout: Get measured layout from nearest MeasuredBox
//  */
// export const useLayout = () => {
//     const ctx = React.useContext(ConstraintContext);
//     return ctx?.layout ?? null;
// };

// /**
//  * ConstrainedBox: Provides constraints and renders a View with those constraints
//  */
// export const ConstrainedBox = (props: { constraints: Constraints; children?: React.ReactNode }) => {
//     const { constraints, children } = props;
//     const parent = React.useContext(ConstraintContext);
//     const merged = parent ?? { constraints };
//     return (
//         <ConstraintContext.Provider value={merged}>
//             <View style={{
//                 minWidth: constraints.minWidth,
//                 maxWidth: constraints.maxWidth,
//                 minHeight: constraints.minHeight,
//                 maxHeight: constraints.maxHeight,
//             }}>
//                 {children}
//             </View>
//         </ConstraintContext.Provider>
//     );
// };

// /**
//  * MeasuredBox: Measures its own size and provides it as constraints to children
//  * This is the KEY component that solves your issue!
//  * 
//  * Usage:
//  *   <MeasuredBox>
//  *     <Row>
//  *       <Image />
//  *       <Flexible><Text /></Flexible>  // Text will know the available width!
//  *     </Row>
//  *   </MeasuredBox>
//  */
// export const MeasuredBox = (props: { children?: React.ReactNode; style?: any }) => {
//     const { children, style } = props;
//     const [measured, setMeasured] = React.useState<LayoutRectangle | null>(null);
//     const parent = React.useContext(ConstraintContext);

//     const onLayout = React.useCallback((e: LayoutChangeEvent) => {
//         const layout = e.nativeEvent.layout;
//         setMeasured((prev) => {
//             // Only update if dimensions changed
//             if (prev && prev.width === layout.width && prev.height === layout.height) {
//                 return prev;
//             }
//             return layout;
//         });
//     }, []);

//     // Build constraints from measured size
//     const value: ConstraintContextValue = React.useMemo(() => {
//         if (!measured) return parent;

//         const constraints: Constraints = {
//             minWidth: 0,
//             maxWidth: measured.width,
//             minHeight: 0,
//             maxHeight: measured.height,
//         };

//         return { constraints, layout: measured };
//     }, [measured, parent]);

//     return (
//         <View style={style} onLayout={onLayout}>
//             {measured ? (
//                 <ConstraintContext.Provider value={value}>
//                     {children}
//                 </ConstraintContext.Provider>
//             ) : null}
//         </View>
//     );
// };
