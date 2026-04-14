import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as DocumentPicker from 'expo-document-picker';
import { unzip } from 'react-native-zip-archive';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { Shield, Sparkles, User, Lock, Phone, Mail, CheckCircle, Package, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [step, setStep] = useState(1); // 1: IG Import, 2: Identity (Username/Password), 3: Contact
  const [loading, setLoading] = useState(false);
  
  // Step 1: IG Data
  const [igData, setIgData] = useState(null);
  const [categories, setCategories] = useState({
    profile: true,
    posts: true,
    messages: false,
  });
  const [useIgUsername, setUseIgUsername] = useState(true);

  // Step 2: Identity
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3: Contact
  const [contact, setContact] = useState('');
  const [isEmail, setIsEmail] = useState(true);

  const { signUpManual } = useAuthStore();

  const pickZip = async () => {
    try {
      setLoading(true);
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/zip' });
      if (res.canceled) return;

      const zipPath = res.assets[0].uri;
      const targetPath = `${FileSystem.cacheDirectory}unzipped_ig/`;
      
      await unzip(zipPath, targetPath);
      
      const folders = await FileSystem.readDirectoryAsync(targetPath);
      const hasProfile = folders.includes('personal_information');
      const hasPosts = folders.includes('content');
      const hasMessages = folders.includes('messages');

      // Try to extract IG username if possible (simulated for now)
      const mockIgUsername = "insta_user_123";

      setIgData({ path: targetPath, hasProfile, hasPosts, hasMessages, igUsername: mockIgUsername });
      setCategories({ profile: hasProfile, posts: hasPosts, messages: hasMessages });
      setUsername(mockIgUsername);
      
      Alert.alert("Success", "Instagram data recognized!");
    } catch (e) {
      Alert.alert("Error", "Failed to process ZIP. Is this a valid Instagram export?");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 2) {
      if (!username) {
        Alert.alert("Error", "Username is required");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleFinish = async () => {
    if (!contact) {
      Alert.alert("Error", "Please provide a contact method.");
      return;
    }
    setLoading(true);
    const { error } = await signUpManual({ identifier: contact, password, username });
    if (error) {
      Alert.alert("Registration Error", error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  const renderStep1 = () => (
    <MotiView 
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={styles.stepContainer}
    >
      <View style={styles.header}>
        <MotiView animate={{ rotate: loading ? '360deg' : '0deg' }}>
            <Package color={colors.accent} size={64} />
        </MotiView>
        <Text style={styles.title}>PORT YOUR WORLD</Text>
        <Text style={styles.subtitle}>Upload your Instagram export to bring over your history, or start fresh.</Text>
      </View>

      {!igData ? (
        <View>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickZip} disabled={loading}>
                <View style={[styles.btnInner, { backgroundColor: colors.accent }]}>
                    <Sparkles color={colors.black} size={24} />
                    <Text style={styles.uploadBtnText}>IMPORT INSTAGRAM ZIP</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(2)}>
                <View style={[styles.btnInner, { backgroundColor: colors.white }]}>
                    <Text style={styles.skipBtnText}>SKIP TO SAILY</Text>
                    <ArrowRight color={colors.black} size={20} />
                </View>
            </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.importCard}>
          <Text style={styles.cardTitle}>WHAT TO BRING?</Text>
          <TouchableOpacity style={styles.checkRow} onPress={() => setCategories({...categories, profile: !categories.profile})}>
             <CheckCircle color={categories.profile ? colors.success : colors.textMuted} size={24} />
             <Text style={styles.checkText}>Profile & Name</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkRow} onPress={() => setCategories({...categories, posts: !categories.posts})}>
             <CheckCircle color={categories.posts ? colors.success : colors.textMuted} size={24} />
             <Text style={styles.checkText}>Posts & Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkRow} onPress={() => setCategories({...categories, messages: !categories.messages})}>
             <CheckCircle color={categories.messages ? colors.success : colors.textMuted} size={24} />
             <Text style={styles.checkText}>Direct Messages</Text>
          </TouchableOpacity>

          <View style={styles.divider} />
          
          <Text style={styles.cardTitle}>USERNAME</Text>
          <View style={styles.usernameToggle}>
            <TouchableOpacity 
                style={[styles.toggleBtn, useIgUsername && styles.toggleActive]} 
                onPress={() => { setUseIgUsername(true); setUsername(igData.igUsername); }}
            >
                <Text style={[styles.toggleText, useIgUsername && styles.toggleTextActive]}>KEEP IG ID</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.toggleBtn, !useIgUsername && styles.toggleActive]} 
                onPress={() => { setUseIgUsername(false); setUsername(''); }}
            >
                <Text style={[styles.toggleText, !useIgUsername && styles.toggleTextActive]}>NEW ID</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
            <Text style={styles.nextBtnText}>USE THESE SETTINGS</Text>
            <ArrowRight color={colors.black} size={22} />
          </TouchableOpacity>
        </View>
      )}
    </MotiView>
  );

  const renderStep2 = () => (
    <MotiView 
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      style={styles.stepContainer}
    >
      <View style={styles.header}>
        <Shield color={colors.accent} size={64} />
        <Text style={styles.title}>IDENTITY</Text>
        <Text style={styles.subtitle}>Set your Saily ID and your master password.</Text>
      </View>

      <View style={styles.brutalCard}>
        <Text style={styles.inputLabel}>SAILY ID (USERNAME)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. sailor_x" 
          placeholderTextColor={colors.textMuted}
          value={username} onChangeText={setUsername}
        />

        <Text style={styles.inputLabel}>MASTER PASSWORD</Text>
        <TextInput 
          style={styles.input} 
          placeholder="At least 6 chars" 
          placeholderTextColor={colors.textMuted} 
          secureTextEntry 
          value={password} onChangeText={setPassword}
        />

        <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Repeat password" 
          placeholderTextColor={colors.textMuted} 
          secureTextEntry 
          value={confirmPassword} onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
            <Text style={styles.nextBtnText}>VERIFY IDENTITY</Text>
            <ArrowRight color={colors.black} size={22} />
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  const renderStep3 = () => (
    <MotiView 
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.stepContainer}
    >
      <View style={styles.header}>
        <Phone color={colors.accent} size={64} />
        <Text style={styles.title}>CONNECTION</Text>
        <Text style={styles.subtitle}>Add your mobile or email for recovery.</Text>
      </View>

      <View style={styles.tabHeader}>
        <TouchableOpacity style={[styles.tab, isEmail && styles.tabActive]} onPress={() => setIsEmail(true)}>
          <Text style={[styles.tabLabel, isEmail && styles.tabLabelActive]}>EMAIL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, !isEmail && styles.tabActive]} onPress={() => setIsEmail(false)}>
          <Text style={[styles.tabLabel, !isEmail && styles.tabLabelActive]}>MOBILE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.brutalCard}>
        <Text style={styles.inputLabel}>{isEmail ? 'EMAIL ADDRESS' : 'MOBILE NUMBER'}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={isEmail ? "name@server.com" : "+1 ..."} 
          placeholderTextColor={colors.textMuted} 
          value={contact} onChangeText={setContact}
          keyboardType={isEmail ? 'email-address' : 'phone-pad'}
        />

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} disabled={loading}>
            <Text style={styles.finishBtnText}>{loading ? 'LAUNCHING...' : 'START SAILING 🚀'}</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        <MotiView animate={{ backgroundColor: step >= 1 ? colors.accent : colors.white, flex: step >= 1 ? 1 : 0.2 }} style={styles.pBar} />
        <MotiView animate={{ backgroundColor: step >= 2 ? colors.accent : colors.white, flex: step >= 2 ? 1 : 0.2 }} style={styles.pBar} />
        <MotiView animate={{ backgroundColor: step >= 3 ? colors.accent : colors.white, flex: step >= 3 ? 1 : 0.2 }} style={styles.pBar} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <AnimatePresence exitBeforeEnter>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </ScrollView>

      {step > 1 && (
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <ArrowLeft color={colors.white} size={24} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingTop: spacing.xl },
  progress: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginTop: 60, height: 6, gap: 8 },
  pBar: { height: '100%', borderWidth: 1, borderColor: colors.black },
  
  stepContainer: { flex: 1 },
  header: { marginBottom: spacing.xxl, alignItems: 'center' },
  title: { 
    fontFamily: typography.family.black,
    fontSize: 32, color: colors.white, 
    marginTop: 16, marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: { 
    fontFamily: typography.family.bold,
    fontSize: 14, color: colors.textSecondary, 
    textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 20
  },
  
  btnInner: { 
    paddingVertical: 18, 
    paddingHorizontal: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: borders.medium,
    borderColor: colors.black,
    ...shadows.brutalSmall
  },
  uploadBtn: { marginBottom: spacing.md },
  uploadBtnText: { fontFamily: typography.family.black, color: colors.black, fontSize: 16, marginLeft: 12 },
  
  skipBtn: { marginBottom: spacing.md },
  skipBtnText: { fontFamily: typography.family.black, color: colors.black, fontSize: 16, marginRight: 12 },
  
  importCard: { 
    backgroundColor: colors.white, 
    padding: spacing.xl, 
    borderWidth: borders.thick, 
    borderColor: colors.black, 
    ...shadows.brutal 
  },
  cardTitle: { fontFamily: typography.family.black, fontSize: 12, color: colors.black, marginBottom: spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  checkText: { fontFamily: typography.family.bold, color: colors.black, marginLeft: 12, fontSize: 16 },
  divider: { height: 2, backgroundColor: colors.black, marginVertical: 20 },
  
  usernameToggle: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  toggleBtn: { 
    flex: 1, paddingVertical: 12, 
    backgroundColor: colors.white, 
    borderWidth: 2, borderColor: colors.black, 
    alignItems: 'center' 
  },
  toggleActive: { backgroundColor: colors.accent },
  toggleText: { fontFamily: typography.family.black, fontSize: 11, color: colors.black },
  toggleTextActive: { color: colors.black },

  brutalCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderWidth: borders.thick,
    borderColor: colors.black,
    ...shadows.brutal
  },
  inputLabel: { fontFamily: typography.family.black, fontSize: 10, color: colors.black, marginBottom: 8, marginTop: 12 },
  input: { 
    fontFamily: typography.family.bold,
    fontSize: 14, color: colors.black, 
    borderWidth: 2, borderColor: colors.black,
    padding: 14, marginBottom: spacing.sm
  },
  
  tabHeader: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  tab: { 
    flex: 1, paddingVertical: 12, 
    backgroundColor: colors.white, 
    borderWidth: 2, borderColor: colors.black, 
    alignItems: 'center' 
  },
  tabActive: { backgroundColor: colors.accent, ...shadows.brutalSmall },
  tabLabel: { fontFamily: typography.family.black, fontSize: 12, color: colors.black },

  nextBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: colors.accent, 
    paddingVertical: 18, marginTop: spacing.xl, 
    borderWidth: 2, borderColor: colors.black,
    ...shadows.brutalSmall
  },
  nextBtnText: { fontFamily: typography.family.black, color: colors.black, fontSize: 16, marginRight: 12 },
  
  finishBtn: { 
    backgroundColor: colors.accent, 
    paddingVertical: 18, marginTop: spacing.xl, 
    alignItems: 'center', 
    borderWidth: 2, borderColor: colors.black,
    ...shadows.brutalSmall
  },
  finishBtnText: { fontFamily: typography.family.black, color: colors.black, fontSize: 18 },
  
  backBtn: { 
    position: 'absolute', top: 56, left: spacing.xl, 
    width: 44, height: 44, 
    backgroundColor: colors.black, 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.white
  },
});

