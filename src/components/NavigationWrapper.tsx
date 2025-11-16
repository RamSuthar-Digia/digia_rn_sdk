import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { navigatorRef } from '../framework/navigation/ref';
import { getDUIFactory } from './ui_factory';
import { View, Text, StyleSheet } from 'react-native';
import { DUIPageScreen } from './DUIPageScreen';

const Stack = createStackNavigator();

export type ExtraScreen = {
    name: string;
    component: React.ComponentType<any>;
    options?: any;
};

export const NavigationWrapper: React.FC<{
    initialRouteName?: string;
    initialParams?: any;
    extraScreens?: ExtraScreen[];
    children?: React.ReactNode;
}> = ({ initialRouteName = 'DUIPage', initialParams, extraScreens = [], children }) => {
    const factory = getDUIFactory();

    // Try to read page ids from the runtime config provider. We guard with `any`
    // because ConfigProvider doesn't expose a pages list in the abstract API.
    let pageIds: string[] = [];
    try {
        const provider: any = factory?.configProvider;
        const pagesMap = provider?.config?.pages ?? provider?.config?.pages;
        if (pagesMap && typeof pagesMap === 'object') {
            pageIds = Object.keys(pagesMap);
        }
    } catch (e) {
        // ignore and fallback below
    }

    // Decide initial route: prefer explicit prop, then provider initial route, then first page, then fallback to DUIPage
    const providerInitial = (factory && (factory as any).configProvider && (factory as any).configProvider.getInitialRoute)
        ? (factory as any).configProvider.getInitialRoute()
        : undefined;

    const computedInitialRoute = initialRouteName || providerInitial || pageIds[0] || 'DUIPage';

    const NoPagesScreen: React.FC = () => (
        <View style={styles.center}>
            <Text style={styles.message}>No pages defined in DUI config.</Text>
        </View>
    );

    return (
        <NavigationContainer ref={navigatorRef as any}>
            <Stack.Navigator initialRouteName={computedInitialRoute}>
                {/* Register a Stack.Screen for each page found in the DUI config. */}
                {pageIds.length > 0 ? (
                    pageIds.map((pageId) => {
                        const PageComponent: React.FC<any> = ({ route }: any) => {
                            // route.params may contain pageArgs and options passed when navigating
                            const pageArgs = route?.params?.pageArgs ?? null;
                            const options = route?.params?.options ?? undefined;
                            return getDUIFactory().createPage(pageId, pageArgs, options as any);
                        };

                        return (
                            <Stack.Screen
                                key={pageId}
                                name={pageId}
                                component={PageComponent}
                                options={{ headerShown: false }}
                            />
                        );
                    })
                ) : (
                    // Fallback: if no pages are present in config, show a helpful placeholder screen
                    <Stack.Screen name="NoPages" component={NoPagesScreen} options={{ headerShown: false }} />
                )}

                {/* Allow consumers to register additional app-specific screens if needed */}
                {extraScreens.map((s) => (
                    <Stack.Screen key={s.name} name={s.name} component={s.component} options={s.options} />
                ))}
            </Stack.Navigator>

            {children}
        </NavigationContainer>
    );
};

export default NavigationWrapper;

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
    },
    message: {
        fontSize: 16,
        color: '#333',
    },
});
