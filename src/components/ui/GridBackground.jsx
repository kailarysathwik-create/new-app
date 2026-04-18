import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

export default function GridBackground({
  fill = 'transparent',
  stroke = 'rgba(255,255,255,0.06)',
}) {
  const { width, height } = Dimensions.get('window');

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={stroke}
              strokeWidth="1.5"
            />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#grid)" />
      </Svg>
    </View>
  );
}
