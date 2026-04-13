import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView, AnimatePresence } from 'moti';
import * as DocumentPicker from 'expo-document-picker';
import { unzip } from 'react-native-zip-archive';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { Shield, Sparkles, User, Lock, Phone, Mail, CheckCircle, Package, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1); // 1: IG Import, 2: Identity, 3: Contact
  const [loading, setLoading] = useState(false);
  
  // Step 1: IG Data
  const [igData, setIgData] = useState(null);
  const [categories, setCategories] = useState({
    profile: true,
    posts: true,
    messages: false,
  });

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

      setIgData({ path: targetPath, hasProfile, hasPosts, hasMessages });
      setCategories({ profile: hasProfile, posts: hasPosts, messages: hasMessages });
      
      Alert.alert("Success", "Instagram data recognized!");
    } catch (e) {
      Alert.alert("Error", "Failed to process ZIP. Is this a valid Instagram export?");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 2) {
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
        <Package color={colors.accent} size={48} />
        <Text style={styles.title}>Port your World</Text>
        <Text style={styles.subtitle}>Upload your Instagram ZIP export to automatically bring over your profile and posts.</Text>
      </View>

      {!igData ? (
        <TouchableOpacity style={styles.uploadBtn} onPress={pickZip} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : (
            <View style={styles.btnContent}>
              <Sparkles color={colors.white} size={24} />
              <Text style={styles.uploadBtnText}>Upload Instagram ZIP</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <MotiView 
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.categoryCard}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Text style={styles.cardTitle}>Available to Import:</Text>
          <TouchableOpacity style={styles.checkRow} onPress={() => setCategories({...categories, profile: !categories.profile})}>
             <CheckCircle color={categories.profile ? colors.success : colors.textMuted} size={20} />
             <Text style={styles.checkText}>Profile & Name</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkRow} onPress={() => setCategories({...categories, posts: !categories.posts})}>
             <CheckCircle color={categories.posts ? colors.success : colors.textMuted} size={20} />
             <Text style={styles.checkText}>Post History (Feed)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkRow} onPress={() => setCategories({...categories, messages: !categories.messages})}>
             <CheckCircle color={categories.messages ? colors.success : colors.textMuted} size={20} />
             <Text style={styles.checkText}>Chat Archives</Text>
          </TouchableOpacity>
        </MotiView>
      )}

      <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
        <Text style={styles.nextBtnText}>{igData ? "Use Selected Data" : "Continue to Saily (Skip)"}</Text>
        <ArrowRight color={colors.black} size={20} />
      </TouchableOpacity>
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
        <Shield color={colors.accentSecondary} size={48} />
        <Text style={styles.title}>Secure your Node</Text>
        <Text style={styles.subtitle}>Choose your unique Saily ID and a strong password.</Text>
      </View>

      <View style={styles.inputWrapper}>
        <User color={colors.textMuted} size={20} style={styles.inputIcon} />
        <TextInput 
          style={styles.input} 
          placeholder="Choose Username" 
          placeholderTextColor={colors.textMuted}
          value={username} onChangeText={setUsername}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Lock color={colors.textMuted} size={20} style={styles.inputIcon} />
        <TextInput 
          style={styles.input} 
          placeholder="Secure Password" 
          placeholderTextColor={colors.textMuted} 
          secureTextEntry 
          value={password} onChangeText={setPassword}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Lock color={colors.textMuted} size={20} style={styles.inputIcon} />
        <TextInput 
          style={styles.input} 
          placeholder="Confirm Password" 
          placeholderTextColor={colors.textMuted} 
          secureTextEntry 
          value={confirmPassword} onChangeText={setConfirmPassword}
        />
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
        <Text style={styles.nextBtnText}>Verify & Proceed</Text>
        <ArrowRight color={colors.black} size={20} />
      </TouchableOpacity>
    </MotiView>
  );

  const renderStep3 = () => (
    <MotiView 
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.stepContainer}
    >
      <View style={styles.header}>
        <Phone color={colors.accentWarm} size={48} />
        <Text style={styles.title}>Stay Connected</Text>
        <Text style={styles.subtitle}>Add your mobile or email to recover your account.</Text>
      </View>

      <View style={styles.tabHeader}>
        <TouchableOpacity style={[styles.tab, isEmail && styles.tabActive]} onPress={() => setIsEmail(true)}>
          <Mail color={isEmail ? colors.white : colors.textMuted} size={18} />
          <Text style={[styles.tabLabel, isEmail && styles.tabLabelActive]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, !isEmail && styles.tabActive]} onPress={() => setIsEmail(false)}>
          <Phone color={!isEmail ? colors.white : colors.textMuted} size={18} />
          <Text style={[styles.tabLabel, !isEmail && styles.tabLabelActive]}>Mobile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        {isEmail ? <Mail color={colors.textMuted} size={20} style={styles.inputIcon} /> : <Phone color={colors.textMuted} size={20} style={styles.inputIcon} />}
        <TextInput 
          style={styles.input} 
          placeholder={isEmail ? "your@email.com" : "+1 (555) 000-0000"} 
          placeholderTextColor={colors.textMuted} 
          value={contact} onChangeText={setContact}
          keyboardType={isEmail ? 'email-address' : 'phone-pad'}
        />
      </View>

      <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.finishBtnText}>Launch into Saily 🚀</Text>}
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#1D120B']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.progress}>
        <MotiView 
          animate={{ backgroundColor: step >= 1 ? colors.accent : colors.bgSurface }} 
          style={styles.pBar} 
        />
        <MotiView 
          animate={{ backgroundColor: step >= 2 ? colors.accent : colors.bgSurface }} 
          style={styles.pBar} 
        />
        <MotiView 
          animate={{ backgroundColor: step >= 3 ? colors.accent : colors.bgSurface }} 
          style={styles.pBar} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <AnimatePresence exitBeforeEnter>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </ScrollView>

      {step > 1 && (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <ArrowLeft color={colors.textMuted} size={20} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  progress: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginTop: spacing.xxl, height: 4 },
  pBar: { flex: 1, marginHorizontal: 2, borderRadius: 2 },
  stepContainer: { flex: 1 },
  header: { marginBottom: spacing.xl, alignItems: 'center' },
  title: { 
    fontFamily: typography.family.black,
    fontSize: 28, 
    color: colors.white, 
    marginTop: 16, 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: { 
    fontFamily: typography.family.medium,
    fontSize: 14, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 22 
  },
  
  uploadBtn: { marginTop: spacing.xl, borderRadius: radius.md, overflow: 'hidden', ...shadows.brutal, borderWidth: 2, borderColor: colors.black },
  btnContent: { backgroundColor: colors.accent, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  uploadBtnText: { 
    fontFamily: typography.family.bold,
    color: colors.white, 
    fontSize: 16, 
    marginLeft: 12 
  },
  
  categoryCard: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' },
  cardTitle: { 
    fontFamily: typography.family.bold,
    color: colors.white, 
    marginBottom: spacing.md 
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  checkText: { 
    fontFamily: typography.family.regular,
    color: colors.textSecondary, 
    marginLeft: 12, 
    fontSize: 15 
  },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.glassBorder },
  inputIcon: { marginRight: spacing.sm },
  input: { 
    fontFamily: typography.family.regular,
    flex: 1, 
    paddingVertical: 16, 
    color: colors.white, 
    fontSize: 16 
  },
  
  tabHeader: { flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: 4, marginBottom: spacing.lg },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.glassBorder },
  tabLabel: { 
    fontFamily: typography.family.bold,
    color: colors.textMuted, 
    marginLeft: 8 
  },
  tabLabelActive: { color: colors.white },
  
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.xl, ...shadows.brutal, borderWidth: 2, borderColor: colors.black },
  nextBtnText: { 
    fontFamily: typography.family.black,
    color: colors.black, 
    fontSize: 16, 
    marginRight: 8 
  },
  
  finishBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.xl, alignItems: 'center', ...shadows.brutal, borderWidth: 2, borderColor: colors.black },
  finishBtnText: { 
    fontFamily: typography.family.black,
    color: colors.white, 
    fontSize: 16 
  },
  
  backBtn: { position: 'absolute', bottom: spacing.xxl, left: spacing.xl, flexDirection: 'row', alignItems: 'center' },
  backBtnText: { 
    fontFamily: typography.family.bold,
    color: colors.textMuted, 
    marginLeft: 8 
  },
});
