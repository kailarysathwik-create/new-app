import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { MotiView } from 'moti';

/**
 * NeoButton enforces the definitive Neo-Brutalist interactive physics:
 * When pressed, the element physically shifts DOWN and RIGHT, merging into its shadow.
 */
export default function NeoButton({ 
  onPress, 
  style, 
  children, 
  activeTranslateX = 4, 
  activeTranslateY = 4, 
  activeScale = 1,
  disabled = false,
  ...props 
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => !disabled && setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={!disabled ? onPress : undefined}
      disabled={disabled}
      {...props}
    >
      <MotiView
        animate={{
          scale: pressed ? activeScale : 1,
          translateX: pressed ? activeTranslateX : 0,
          translateY: pressed ? activeTranslateY : 0,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.5 }}
        style={style}
      >
        {children}
      </MotiView>
    </Pressable>
  );
}
