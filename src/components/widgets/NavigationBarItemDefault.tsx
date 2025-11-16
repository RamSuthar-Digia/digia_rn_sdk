import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { VirtualLeafStatelessWidget } from '../base/VirtualLeafStatelessWidget';
import { Props } from '../../framework/models/props';
import { RenderPayload } from '../../framework/render_payload';

/**
 * Simple default navigation bar item. Expects props:
 * { label?: string, icon?: { uri?: string } }
 */
export class VWNavigationBarItemDefault extends VirtualLeafStatelessWidget<Props> {
    constructor(options: { props: Props; refName?: string } & any) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const label = this.props.getString('label') ?? '';
        const icon = this.props.get('icon');

        const iconNode = icon && typeof icon === 'object' && icon['uri'] ? (
            <Image source={{ uri: icon['uri'] }} style={styles.icon} />
        ) : (
            <Text style={styles.iconPlaceholder}>◉</Text>
        );

        return (
            <View style={styles.container}>
                {iconNode}
                {label ? <Text style={styles.label}>{label}</Text> : null}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    icon: { width: 20, height: 20, marginBottom: 2 },
    iconPlaceholder: { fontSize: 18, color: '#666' },
    label: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default VWNavigationBarItemDefault;
