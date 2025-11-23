import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { VirtualWidget } from '../base/VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import { CommonProps } from '../../framework/models/common_props';
import { Props } from '../../framework/models/props';
import { ScaffoldProps } from '../widget_props/scafold_props';



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
        const appBarWidget = this.childOf("appBar");
        const bodyWidget = this.childOf("body");

        const bgColor =
            payload.evalColorExpr(this.props.scaffoldBackgroundColor) ?? undefined;
        const enableSafeArea =
            payload.evalExpr<boolean>(this.props.enableSafeArea) ?? true;

        // AppBar
        const AppBarElement = appBarWidget
            ? appBarWidget.toWidget(payload)
            : null;

        // Body
        const BodyElement = bodyWidget
            ? bodyWidget.toWidget(payload)
            : <View style={{ flex: 1 }} />;

        // Wrap BOTH in SafeArea if required
        const Content = (
            <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {AppBarElement}
                <View style={{ flex: 1, alignContent: 'stretch' }}>
                    {BodyElement}
                </View>
            </View>
        );

        const WrappedContent = enableSafeArea ? (
            // <SafeAreaView style={{ flex: 1 }}>
            // {
            Content

            // }
            // </SafeAreaView>
        ) : (
            Content
        );

        return (
            // <SafeAreaProvider>
            <View style={[styles.scaffold, { backgroundColor: bgColor }]}>
                {WrappedContent}
            </View>
            // </SafeAreaProvider>
        );
    }
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
