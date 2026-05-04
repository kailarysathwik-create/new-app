import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, typography, borders, shadows } from '../../theme/tokens';
import { Mic } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SignalOverlay({ active }) {
  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ─── THE GLOWING TRAIL ─────────────────────────────────────────────── */}
      <MotiView
        from={{ opacity: 0.3, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1.01 }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 1200,
          reverse: true,
        }}
        style={styles.glowBorder}
      />

      {/* ─── TRAVELLING POINT ─────────────────────────────────────────────── */}
      <MotiView
        from={{ left: 0, top: 0 }}
        animate={{
          left: [0, width, width, 0, 0],
          top: [0, 0, height, height, 0],
        }}
        transition={{
          loop: true,
          duration: 4000,
          type: 'timing',
        }}
        style={styles.trailPoint}
      />

      {/* ─── SIGNAL STATUS ────────────────────────────────────────────────── */}
      <View style={styles.statusWrap}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={styles.statusPill}
        >
          <Mic color={colors.white} size={16} strokeWidth={3} />
          <Text style={styles.statusText}>HARBOUR SIGNAL ACTIVE</Text>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ loop: true, duration: 1500 }}
            style={styles.liveDot}
          />
        </MotiView>
        <Text style={styles.disclaimer}>REAL-TIME · ENCRYPTED · UNSAVED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 6,
    borderColor: colors.accentWarm,
    opacity: 0.6,
    backgroundColor: 'transparent',
    shadowColor: colors.accentWarm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  trailPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: colors.accent,
    borderRadius: 6,
    shadowColor: colors.accent,
    shadowRadius: 12,
    shadowOpacity: 1,
    elevation: 10,
    zIndex: 100,
  },
  statusWrap: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: colors.accentWarm,
    gap: 10,
    ...shadows.brutal,
  },
  statusText: {
    fontFamily: typography.family.black,
    color: colors.white,
    fontSize: 12,
    letterSpacing: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  disclaimer: {
    marginTop: 8,
    fontFamily: typography.family.bold,
    color: colors.black,
    fontSize: 9,
    letterSpacing: 0.5,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
