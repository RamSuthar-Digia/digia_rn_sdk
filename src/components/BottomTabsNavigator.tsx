import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getDUIFactory } from './ui_factory';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

export type BottomTabEntry = {
    /** Unique route name for the tab (shown by navigator) */
    name: string;
    /** If provided, the SDK pageId to render inside this tab */
    pageId?: string;
    /** Alternatively, a custom React component to render for the tab */
    component?: React.ComponentType<any>;
    /** Optional initial params passed to the tab route */
    initialParams?: any;
    /** Optional screen options for the tab screen */
    options?: any;
};

export const BottomTabsNavigator: React.FC<{
    tabs: BottomTabEntry[];
    initialRouteName?: string;
}> = ({ tabs, initialRouteName }) => {
    const factory = getDUIFactory();

    return (
        <Tab.Navigator initialRouteName={initialRouteName}>
            {tabs.map((t) => {
                const ScreenComp: React.ComponentType<any> = t.component
                    ? t.component
                    : ({ route }: any) => {
                        // If pageId provided, render a DUI page; otherwise show fallback
                        const pageArgs = route?.params?.pageArgs ?? null;
                        const options = route?.params?.options ?? undefined;
                        if ((t as any).pageId) {
                            return factory.createPage((t as any).pageId!, pageArgs, options as any);
                        }
                        // If component is a React node factory, call it
                        if (typeof t.component === 'function') {
                            const C = t.component as any;
                            return <C />;
                        }
                        return (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text>No page defined for tab {t.name}</Text>
                            </View>
                        );
                    };

                return (
                    <Tab.Screen
                        key={t.name}
                        name={t.name}
                        component={ScreenComp as any}
                        initialParams={t.initialParams}
                        options={t.options}
                    />
                );
            })}
        </Tab.Navigator>
    );
};

export default BottomTabsNavigator;
