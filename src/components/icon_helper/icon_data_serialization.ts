





export const getIconDetails = (iconMap: any): { name: string; family: string } | null => {
  const { pack, key } = iconMap;

  // Map packs to @expo/vector-icons families
  // Now supports 15+ icon families with 10,000+ icons
  const packToFamily: { [key: string]: string } = {
    'material': 'MaterialIcons',
    'materialCommunity': 'MaterialCommunityIcons',  // 7,000+ icons!
    'cupertino': 'Ionicons',
    'fontAwesome': 'FontAwesome',
    'fontAwesomeIcons': 'FontAwesome5',
    'fontAwesome5': 'FontAwesome5',
    'fontAwesome6': 'FontAwesome6',
    'lineAwesomeIcons': 'FontAwesome5',
    'antDesign': 'AntDesign',
    'entypo': 'Entypo',
    'evilIcons': 'EvilIcons',
    'feather': 'Feather',
    'fontisto': 'Fontisto',
    'foundation': 'Foundation',
    'octicons': 'Octicons',
    'simpleLineIcons': 'SimpleLineIcons',
    'zocial': 'Zocial',
    'custom': iconMap.family || 'MaterialIcons'
  };

  const family = packToFamily[pack];

  if (!family) {
    console.warn(`Unknown icon pack: ${pack}, defaulting to MaterialIcons`);
    return { name: key, family: 'MaterialIcons' };
  }

  return { name: key, family };
};

