import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Plus, ShieldAlert, Fingerprint, EyeOff } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';

const { width } = Dimensions.get('window');

export default function VaultScreen() {
  const [items, setItems] = useState([]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#0A0515']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
            <Lock color={colors.accentSecondary} size={28} style={{ marginRight: 12 }} />
            <Text style={styles.title}>Private Vault</Text>
        </View>
        <Text style={styles.subtitle}>On-Device Neural Encryption</Text>
      </View>

      <View style={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <View style={styles.iconCircle}>
                    <EyeOff color={colors.accent} size={40} />
                </View>
                <Text style={styles.emptyTitle}>Your Vault is Empty</Text>
                <Text style={styles.emptyText}>
                    Photos and videos added here are encrypted and completely hidden from your phone's gallery.
                </Text>
                
                <TouchableOpacity style={styles.addBtn}>
                    <LinearGradient
                        colors={[colors.accent, colors.accentSecondary]}
                        start={{x:0, y:0}} end={{x:1, y:1}}
                        style={styles.addBtnGradient}
                    >
                        <Plus color={colors.white} size={24} />
                        <Text style={styles.addBtnText}>Secure New Media</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </BlurView>

            <View style={styles.securityBadge}>
                <Fingerprint color={colors.success} size={16} />
                <Text style={styles.securityText}>Biometric Protection Active</Text>
            </View>
          </View>
        ) : (
          <FlatList
             data={items}
             numColumns={3}
             renderItem={() => <View style={styles.itemPlaceholder} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: typography.size.xl, fontWeight: '900', color: colors.white, letterSpacing: 1 },
  subtitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  
  content: { flex: 1, paddingHorizontal: spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  emptyTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: spacing.xl },
  
  addBtn: { width: '100%', ...shadows.brutal, borderRadius: radius.md, borderWidth: 2, borderColor: colors.black },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  addBtnText: { color: colors.white, fontWeight: 'bold', marginLeft: 8, fontSize: 15 },
  
  securityBadge: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
  securityText: { color: colors.success, fontSize: 12, marginLeft: 6, fontWeight: '600' },
  
  itemPlaceholder: { flex: 1, aspectRatio: 1, margin: 2, backgroundColor: colors.bgSurface },
});
