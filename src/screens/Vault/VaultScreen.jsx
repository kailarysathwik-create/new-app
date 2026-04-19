import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from 'expo-router';
import { Plus, ShieldCheck, FileImage, Trash2, FolderUp } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borders } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { uploadToHarbour, listUserBerth } from '../../lib/cloudNode';
import GridBackground from '../../components/ui/GridBackground';

function FileCard({ item, index }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 60, type: 'spring' }}
      style={styles.fileCard}
    >
      {item.thumbnailUri ? (
        <Image source={{ uri: item.thumbnailUri }} style={styles.fileThumb} />
      ) : (
        <View style={styles.filePlaceholder}>
          <FileImage color={colors.accent} size={28} />
        </View>
      )}
      <View style={styles.fileNameTag}>
        <Text style={styles.fileNameText} numberOfLines={1}>
          {item.name || 'harbour-file'}
        </Text>
      </View>
      <View style={styles.fileInfo}>
        <ShieldCheck size={8} color={colors.success} />
        <Text style={styles.fileCipher}>CIPHERED</Text>
      </View>
      <TouchableOpacity style={styles.fileDelete}>
        <Trash2 size={14} color={colors.accentWarm} />
      </TouchableOpacity>
    </MotiView>
  );
}

function HarbourStatus({ fileCount }) {
  const usedGB = (fileCount * 3) / 1024;
  const vaultLimitGB = 5;
  const pct = Math.min((usedGB / vaultLimitGB) * 100, 100);

  return (
    <View style={styles.harbourCard}>
      <View style={styles.harbourTop}>
        <Image
          source={require('../../../assets/images/vaultlogo.png')}
          style={{ width: 16, height: 16 }}
          resizeMode="contain"
        />
        <Text style={styles.harbourTitle}>PRIVATE BERTH CAPACITY</Text>
        <View style={styles.harbourBadge}>
          <Text style={styles.harbourBadgeText}>5GB SECURE</Text>
        </View>
      </View>

      <View style={styles.harbourBar}>
        <LinearGradient
          colors={[colors.accent, colors.accentSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.harbourBarFill, { width: `${Math.max(pct, 0.5)}%` }]}
        />
      </View>

      <View style={styles.harbourMeta}>
        <Text style={styles.harbourMetaText}>
          {usedGB.toFixed(2)} GB of {vaultLimitGB} GB
        </Text>
        <Text style={styles.harbourMetaText}>{fileCount} items</Text>
      </View>
    </View>
  );
}

export default function VaultScreen() {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your Private Vault',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        Alert.alert('Access Denied', 'Authentication required.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) authenticate();
    }, [isAuthenticated])
  );

  const loadBerth = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    setLoading(true);
    const { files, error } = await listUserBerth(user.id);
    if (error) {
      Alert.alert('Harbour unavailable', error.message || 'Could not load your Drive berth.');
      setItems([]);
    } else {
      setItems(files || []);
    }
    setLoading(false);
  }, [user, isAuthenticated]);

  useEffect(() => {
    loadBerth();
  }, [loadBerth]);

  const secureSelectedAsset = async ({ uri, name, mimeType }) => {
    if (!user?.id) return;

    try {
      setUploading(true);
      const { error, viaFallback } = await uploadToHarbour(uri, name, user.id, {
        mimeType,
      });
      if (error) throw error;

      if (viaFallback) {
        Alert.alert('Uploaded', 'Harbour service is offline, so this file was uploaded via backup storage.');
      }

      await loadBerth();
    } catch (e) {
      Alert.alert('Failed to Secure', e?.message || 'Unknown upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleSecureMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    await secureSelectedAsset({
      uri: asset.uri,
      name: asset.fileName || `vault_${Date.now()}.${asset.mimeType?.split('/')[1] || 'bin'}`,
      mimeType: asset.mimeType || 'application/octet-stream',
    });
  };

  const handleSecureFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    await secureSelectedAsset({
      uri: asset.uri,
      name: asset.name || `vault_file_${Date.now()}`,
      mimeType: asset.mimeType || 'application/octet-stream',
    });
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.lockedWrap]}>
        <GridBackground fill="#F7E3BE" stroke="rgba(255,92,0,0.12)" />
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <Image
            source={require('../../../assets/images/vaultlogo.png')}
            style={{ width: 64, height: 64 }}
            resizeMode="contain"
          />
        </MotiView>
        <Text style={[styles.title, styles.lockedTitle]}>VAULT LOCKED</Text>
        <TouchableOpacity style={[styles.addBtn, styles.lockedButton]} onPress={authenticate}>
          <Text style={styles.addBtnText}>UNLOCK VAULT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GridBackground fill="#F7E3BE" stroke="rgba(255,92,0,0.12)" />

      <View style={styles.wrap}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Image
              source={require('../../../assets/images/vaultlogo.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            <Text style={styles.title}>PRIVATE VAULT</Text>
          </View>
          <Text style={styles.subtitle}>ENCRYPTED · SECURE · PRIVATE</Text>
        </View>

        <HarbourStatus fileCount={items.length} />

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.addBtn, styles.actionButton]}
            onPress={handleSecureMedia}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator color={colors.black} size="small" />
                <Text style={styles.addBtnText}>ANCHORING...</Text>
              </>
            ) : (
              <>
                <Plus color={colors.black} size={20} strokeWidth={3} />
                <Text style={styles.addBtnText}>SECURE MEDIA</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addBtn, styles.actionButton, styles.fileBtn]}
            onPress={handleSecureFile}
            disabled={uploading}
          >
            <FolderUp color={colors.black} size={20} strokeWidth={3} />
            <Text style={styles.addBtnText}>SECURE FILE</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' }}
              style={styles.emptyCard}
            >
              <Image
                source={require('../../../assets/images/vaultlogo.png')}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>YOUR BERTH IS CLEAR</Text>
              <Text style={styles.emptyText}>
                Secure your first photo, video, or file.{'\n'}It will be encrypted and anchored to the Harbour.
              </Text>
            </MotiView>
          </View>
        ) : (
          <FlatList
            data={items}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <FileCard item={item} index={index} />}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E3BE',
  },
  lockedWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrap: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 980 : '100%',
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.family.black,
    fontSize: 22,
    color: colors.black,
    letterSpacing: 2,
  },
  lockedTitle: {
    marginTop: 24,
    fontSize: 13,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#6C584C',
    letterSpacing: 1,
  },
  harbourCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderWidth: borders.thick,
    borderColor: colors.black,
    padding: spacing.md,
    ...shadows.brutalOrange,
  },
  harbourTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 8,
  },
  harbourTitle: {
    fontFamily: typography.family.black,
    fontSize: 11,
    color: colors.black,
    flex: 1,
    letterSpacing: 2,
  },
  harbourBadge: {
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.black,
  },
  harbourBadgeText: {
    fontFamily: typography.family.black,
    fontSize: 8,
    color: colors.black,
    letterSpacing: 1,
  },
  harbourBar: {
    height: 8,
    backgroundColor: '#ddd',
    borderWidth: 1,
    borderColor: colors.black,
    overflow: 'hidden',
  },
  harbourBarFill: {
    height: '100%',
  },
  harbourMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  harbourMetaText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: '#6C584C',
  },
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  addBtn: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: borders.medium,
    borderColor: colors.black,
    gap: 8,
    ...shadows.brutalSmall,
  },
  actionButton: {
    flex: 1,
  },
  lockedButton: {
    paddingHorizontal: 40,
    marginTop: 40,
  },
  fileBtn: {
    backgroundColor: '#FFE7BF',
  },
  addBtnText: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 14,
    letterSpacing: 1,
  },
  grid: {
    padding: spacing.sm,
    paddingBottom: 120,
  },
  fileCard: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 3,
    backgroundColor: '#FFF8EB',
    borderWidth: borders.thin,
    borderColor: colors.black,
    overflow: 'hidden',
  },
  fileThumb: {
    width: '100%',
    height: '100%',
  },
  filePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0D1',
  },
  fileNameTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 30,
    backgroundColor: '#FFF8EB',
    borderWidth: 2,
    borderColor: colors.black,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  fileNameText: {
    color: colors.black,
    fontFamily: typography.family.black,
    fontSize: 8,
  },
  fileInfo: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  fileCipher: {
    fontFamily: typography.family.black,
    fontSize: 7,
    color: colors.success,
    letterSpacing: 0.5,
  },
  fileDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 3,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyCard: {
    backgroundColor: '#FFF8EB',
    borderWidth: borders.thick,
    borderColor: colors.black,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.brutalOrange,
    width: '100%',
    maxWidth: 360,
  },
  emptyTitle: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 16,
    letterSpacing: 2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.family.regular,
    color: '#5C4634',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
