import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { VirtualWidget } from '../base/VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import { CommonProps } from '../../framework/models/common_props';
import { Props } from '../../framework/models/props';
import { ScaffoldProps } from '../widget_props/scafold_props';



// Context
export class VWScaffold extends VirtualStatelessWidget<ScaffoldProps> {
    constructor(options: {
        props: ScaffoldProps;
        commonProps?: CommonProps;
        parentProps?: Props;
        parent?: VirtualWidget;
        childGroups?: Map<string, VirtualWidget[]>;
        refName?: string;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const appBarWidget = this.childOf('appBar');
        const bodyWidget = this.childOf('body');

        const bgColor = payload.evalColorExpr(this.props.scaffoldBackgroundColor) ?? undefined;
        const enableSafeArea = payload.evalExpr<boolean>(this.props.enableSafeArea) ?? true;

        const SimpleScaffold: React.FC = () => {
            // Some consumer apps may not have react-native-safe-area-context
            // properly linked or available at runtime. Fall back to safe
            // no-op components to avoid crashing the app.
            // const SafeView: React.ComponentType<any> = (SafeAreaView as any) || View;
            const renderAppBar = () => {
                if (!appBarWidget) return null;
                return appBarWidget.toWidget(payload);
            };

            const renderBody = () => {
                const bodyContent = bodyWidget ? bodyWidget.toWidget(payload) : <View style={{ flex: 1 }} />;
                const content = enableSafeArea ? (
                    <SafeAreaView style={{ flex: 1 }}>
                        {bodyContent}
                    </SafeAreaView>
                ) : bodyContent;

                return (
                    <View style={{ flex: 1 }}>
                        {content}
                    </View>
                );
            };

            return (
                <View style={[styles.scaffold, { backgroundColor: bgColor }]}>
                    {renderAppBar()}
                    {renderBody()}
                </View>
            );
        };

        return <SimpleScaffold />;
    }



    // Note: Simplified scaffold - only renders an optional appBar and the body.
}


// Styles
const styles = StyleSheet.create({
    scaffold: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    collapsedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        justifyContent: 'center',
    },
    collapsedHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        flex: 1,
    },
    collapsedTitle: {
        flex: 1,
    },
    collapsedTitleText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    collapsedActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    bottomNavBar: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
});
