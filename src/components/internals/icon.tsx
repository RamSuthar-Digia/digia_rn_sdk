import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Octicons from 'react-native-vector-icons/Octicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Zocial from 'react-native-vector-icons/Zocial';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


export interface SimpleIconProps {
    name: string;
    family: string;
    size?: number;
    color?: string;
    style?: any;
}

export const SimpleIcon: React.FC<SimpleIconProps> = ({
    name,
    family,
    size = 24,
    color = '#000000',
    style
}) => {


    const iconProps = { name: name, size, color, style };
    switch (family) {
        case 'MaterialIcons':
            return <MaterialIcons {...iconProps} />;
        case 'MaterialCommunityIcons':
            return <MaterialCommunityIcons {...iconProps} />;
        case 'Ionicons':
            return <Ionicons {...iconProps} />;
        case 'FontAwesome':
            return <FontAwesome {...iconProps} />;
        case 'FontAwesome5':
            return <FontAwesome5 {...iconProps} />;
        case 'FontAwesome6':
            return <FontAwesome6 {...iconProps} />;
        case 'AntDesign':
            return <AntDesign {...iconProps} />;
        case 'Entypo':
            return <Entypo {...iconProps} />;
        case 'EvilIcons':
            return <EvilIcons {...iconProps} />;
        case 'Feather':
            return <Feather {...iconProps} />;
        case 'Fontisto':
            return <Fontisto {...iconProps} />;
        case 'Foundation':
            return <Foundation {...iconProps} />;
        case 'Octicons':
            return <Octicons {...iconProps} />;
        case 'SimpleLineIcons':
            return <SimpleLineIcons {...iconProps} />;
        case 'Zocial':
            return <Zocial {...iconProps} />;
        default:
            // Fallback to MaterialIcons
            return <MaterialIcons {...iconProps} />;
    }
};