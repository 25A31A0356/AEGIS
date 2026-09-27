import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AegisLogo } from "@/components/aegis-logo";
import { useEmergencyProfile } from "@/lib/emergency-profile";
import { AegisApiService } from "@/lib/services/aegis-api";
import * as Auth from "@/lib/_core/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { updateProfile } = useEmergencyProfile();

  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [facebookModalVisible, setFacebookModalVisible] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Forgot Password Modal States
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [fpStep, setFpStep] = useState<1 | 2>(1);
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [showFpPassword, setShowFpPassword] = useState(false);
  const [showFpConfirmPassword, setShowFpConfirmPassword] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpStatusMsg, setFpStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const saveSessionAndProceed = async (token: string, userName: string, userEmail: string, userPhone?: string) => {
    try {
      await Auth.setSessionToken(token);
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.localStorage.setItem("aegis_auth_token", token);
        window.localStorage.setItem("app_session_token", token);
      }
      // If user had existing profile on backend, keep backend authoritative
      if (userName && userName !== userEmail.split("@")[0]) {
        await updateProfile({
          fullName: userName,
          ...(userPhone ? { phoneNumber: userPhone } : {}),
        });
      }
      setStatusMsg({ type: "success", text: `Welcome, ${userName || 'Citizen'}! Connecting to AEGIS...` });
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 300);
    } catch (e) {
      console.warn("Session saving failed:", e);
      router.replace("/(tabs)");
    }
  };

  const handleLoginSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setStatusMsg({ type: "error", text: "Please enter your email and password." });
      return;
    }
    try {
      setIsLoading(true);
      setStatusMsg(null);
      const res = await AegisApiService.loginUser(email.trim().toLowerCase(), password.trim());
      if (res?.success === false || res?.error) {
        setStatusMsg({ type: "error", text: res?.message || res?.error?.message || "Account not found or invalid credentials. Please Sign Up first." });
        return;
      }
      const data = res?.data || res;
      const token = data?.access_token || data?.token;
      if (token) {
        const u = data.user || {};
        const name = u.full_name || u.name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
        await saveSessionAndProceed(token, name, email.trim().toLowerCase(), u.phone);
      } else {
        setStatusMsg({ type: "error", text: res?.message || "Account not found with this email. Please Sign Up first." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "Login failed. Please check your credentials or create an account." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setStatusMsg({ type: "error", text: "Please enter your email and password." });
      return;
    }
    if (password.length < 6) {
      setStatusMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setStatusMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    try {
      setIsLoading(true);
      setStatusMsg(null);
      const finalName = fullName.trim() || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
      const res = await AegisApiService.registerUser({
        full_name: finalName,
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: "citizen",
      });
      if (res?.success === false || res?.error) {
        setStatusMsg({ type: "error", text: res?.message || res?.error?.message || "An account with this email already exists. Please Sign In." });
        return;
      }
      const data = res?.data || res;
      const token = data?.access_token || data?.token;
      if (token) {
        await saveSessionAndProceed(token, finalName, email.trim().toLowerCase());
      } else {
        setStatusMsg({ type: "success", text: "Account created successfully! Please Sign In." });
        setIsSignup(false);
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "Signup failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const openForgotPasswordModal = () => {
    setFpEmail(email.trim());
    setFpOtp("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpStep(1);
    setFpStatusMsg(null);
    setForgotPasswordModalVisible(true);
  };

  const handleRequestResetOtp = async () => {
    if (!fpEmail.trim()) {
      setFpStatusMsg({ type: "error", text: "Please enter your registered email." });
      return;
    }
    try {
      setFpLoading(true);
      setFpStatusMsg(null);
      const res = await AegisApiService.requestForgotPasswordOtp(fpEmail.trim().toLowerCase());
      if (res?.success === false || res?.error) {
        setFpStatusMsg({ type: "error", text: res?.message || res?.error?.message || "Failed to send reset code." });
        return;
      }
      setFpStatusMsg({ type: "success", text: `6-digit OTP sent to ${fpEmail.trim()}.` });
      setFpStep(2);
    } catch (err: any) {
      setFpStatusMsg({ type: "error", text: err?.message || "Failed to send reset OTP." });
    } finally {
      setFpLoading(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!fpOtp.trim() || fpOtp.trim().length !== 6) {
      setFpStatusMsg({ type: "error", text: "Please enter the 6-digit OTP code." });
      return;
    }
    if (!fpNewPassword || fpNewPassword.length < 6) {
      setFpStatusMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpStatusMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    try {
      setFpLoading(true);
      setFpStatusMsg(null);
      const res = await AegisApiService.resetPasswordWithOtp({
        email: fpEmail.trim().toLowerCase(),
        otp: fpOtp.trim(),
        new_password: fpNewPassword,
      });
      if (res?.success === false || res?.error) {
        setFpStatusMsg({ type: "error", text: res?.message || res?.error?.message || "Invalid or expired OTP." });
        return;
      }
      const data = res?.data || res;
      const token = data?.access_token || data?.token;
      setFpStatusMsg({ type: "success", text: "Password reset successful! Logging in..." });
      const userName = data?.user?.full_name || fpEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
      setTimeout(async () => {
        setForgotPasswordModalVisible(false);
        if (token) {
          await saveSessionAndProceed(token, userName, fpEmail.trim().toLowerCase(), data?.user?.phone);
        } else {
          setEmail(fpEmail.trim());
          setPassword("");
          setStatusMsg({ type: "success", text: "Password updated successfully! Please login with your new password." });
        }
      }, 900);
    } catch (err: any) {
      setFpStatusMsg({ type: "error", text: err?.message || "Password reset failed. Please check the OTP." });
    } finally {
      setFpLoading(false);
    }
  };

  const executeGoogleAuth = async (targetEmail: string, targetName: string) => {
    setGoogleModalVisible(false);
    setIsCustomMode(false);
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await AegisApiService.googleAuth({
        email: targetEmail.trim().toLowerCase(),
        full_name: targetName.trim(),
        google_id: `g_${Date.now()}`,
      });
      if (res?.success === false || res?.error) {
        setStatusMsg({ type: "error", text: res?.message || "Google authentication failed" });
        return;
      }
      const data = res?.data || res;
      const token = data?.access_token || data?.token;
      if (token) {
        await saveSessionAndProceed(token, targetName.trim(), targetEmail.trim().toLowerCase());
      } else {
        setStatusMsg({ type: "error", text: "Google authentication response incomplete." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "Google login failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const executeFacebookAuth = async (targetEmail: string, targetName: string) => {
    setFacebookModalVisible(false);
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await AegisApiService.googleAuth({
        email: targetEmail.trim().toLowerCase(),
        full_name: targetName.trim(),
        google_id: `fb_${Date.now()}`,
      });
      const data = res?.data || res;
      const token = data?.access_token || data?.token;
      if (token) {
        await saveSessionAndProceed(token, targetName.trim(), targetEmail.trim().toLowerCase());
      } else {
        setStatusMsg({ type: "error", text: "Facebook authentication response incomplete." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "Facebook login failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Top Center Logo & Title with White AEGIS text */}
          <View style={styles.header}>
            <AegisLogo size="lg" showSubtitle={true} textColor="#FFFFFF" subtitleColor="#94A3B8" />
          </View>

          {/* Clean White Card Matching Web */}
          <View style={styles.card}>
            <Text style={styles.title}>{isSignup ? "Signup" : "Login"}</Text>

            {/* Status Alert */}
            {statusMsg && (
              <View style={[styles.alertBox, statusMsg.type === "success" ? styles.alertSuccess : styles.alertError]}>
                <Text style={[styles.alertText, statusMsg.type === "success" ? styles.alertTextSuccess : styles.alertTextError]}>
                  {statusMsg.text}
                </Text>
              </View>
            )}

            {/* Form Inputs */}
            {isSignup && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name (optional)"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { paddingRight: 45 }]}
                placeholder={isSignup ? "Create password" : "Password"}
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <IconSymbol
                  name={showPassword ? "eye.slash" : "eye"}
                  size={18}
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            {isSignup && (
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { paddingRight: 45 }]}
                  placeholder="Confirm password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <IconSymbol
                    name={showConfirmPassword ? "eye.slash" : "eye"}
                    size={18}
                    color="#94a3b8"
                  />
                </Pressable>
              </View>
            )}

            {!isSignup && (
              <View style={styles.forgotRow}>
                <Pressable onPress={openForgotPasswordModal}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              </View>
            )}

            {/* Primary Action Button */}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
              onPress={isSignup ? handleSignupSubmit : handleLoginSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>{isSignup ? "Signup" : "Login"}</Text>
              )}
            </Pressable>

            {/* Toggle Login/Signup */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleText}>
                {isSignup ? "Already have an account? " : "Don't have an account? "}
              </Text>
              <Pressable onPress={() => { setIsSignup(!isSignup); setStatusMsg(null); }}>
                <Text style={styles.toggleLink}>{isSignup ? "Login" : "Signup"}</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <Pressable
              style={({ pressed }) => [styles.facebookButton, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
              onPress={() => setFacebookModalVisible(true)}
              disabled={isLoading}
            >
              <View style={styles.facebookIcon}>
                <Text style={styles.facebookIconText}>f</Text>
              </View>
              <Text style={styles.facebookButtonText}>Login with Facebook</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
              onPress={() => setGoogleModalVisible(true)}
              disabled={isLoading}
            >
              <View style={styles.googleIconCircle}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <Path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <Path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <Path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </Svg>
              </View>
              <Text style={styles.googleButtonText}>Login with Google</Text>
            </Pressable>
          </View>

          {/* Footer Credentials Note with shield icon */}
          <View style={styles.footerNote}>
            <IconSymbol name="checkmark.shield.fill" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>
              AEGIS Universal Disaster Management • 112 Compatible
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FORGOT PASSWORD / OTP RESET MODAL */}
      <Modal visible={forgotPasswordModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={styles.fpIconCircle}>
                  <IconSymbol name="lock.fill" size={16} color="#0284c7" />
                </View>
                <Text style={styles.googleModalTitle}>Reset Password</Text>
              </View>
              <Pressable onPress={() => setForgotPasswordModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {/* Status in modal */}
            {fpStatusMsg && (
              <View style={[styles.alertBox, fpStatusMsg.type === "success" ? styles.alertSuccess : styles.alertError, { marginBottom: 12 }]}>
                <Text style={[styles.alertText, fpStatusMsg.type === "success" ? styles.alertTextSuccess : styles.alertTextError]}>
                  {fpStatusMsg.text}
                </Text>
              </View>
            )}

            {fpStep === 1 ? (
              <View>
                <Text style={styles.modalSubtitle}>
                  Enter your registered email address to receive a 6-digit verification code.
                </Text>

                <TextInput
                  style={styles.customInput}
                  placeholder="Registered Email"
                  placeholderTextColor="#94a3b8"
                  value={fpEmail}
                  onChangeText={setFpEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Pressable
                  style={[styles.primaryButton, { marginTop: 4, marginBottom: 8 }]}
                  onPress={handleRequestResetOtp}
                  disabled={fpLoading}
                >
                  {fpLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Reset Code</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={styles.codeSentBanner}>
                  <Text style={styles.codeSentLabel}>Code sent to: {fpEmail}</Text>
                  <Pressable onPress={() => { setFpStep(1); setFpStatusMsg(null); }}>
                    <Text style={styles.changeEmailText}>Change</Text>
                  </Pressable>
                </View>

                <TextInput
                  style={[styles.customInput, styles.otpInput]}
                  placeholder="6-Digit OTP"
                  placeholderTextColor="#94a3b8"
                  value={fpOtp}
                  onChangeText={(t) => setFpOtp(t.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { paddingRight: 45 }]}
                    placeholder="New Password (min 6 chars)"
                    placeholderTextColor="#94a3b8"
                    value={fpNewPassword}
                    onChangeText={setFpNewPassword}
                    secureTextEntry={!showFpPassword}
                  />
                  <Pressable
                    onPress={() => setShowFpPassword(!showFpPassword)}
                    style={styles.eyeButton}
                  >
                    <IconSymbol
                      name={showFpPassword ? "eye.slash" : "eye"}
                      size={18}
                      color="#94a3b8"
                    />
                  </Pressable>
                </View>

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { paddingRight: 45 }]}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#94a3b8"
                    value={fpConfirmPassword}
                    onChangeText={setFpConfirmPassword}
                    secureTextEntry={!showFpConfirmPassword}
                  />
                  <Pressable
                    onPress={() => setShowFpConfirmPassword(!showFpConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <IconSymbol
                      name={showFpConfirmPassword ? "eye.slash" : "eye"}
                      size={18}
                      color="#94a3b8"
                    />
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.primaryButton, { marginTop: 4, marginBottom: 8 }]}
                  onPress={handleConfirmResetPassword}
                  disabled={fpLoading}
                >
                  {fpLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Update Password & Sign In</Text>
                  )}
                </Pressable>

                <Pressable onPress={handleRequestResetOtp} style={{ alignItems: "center", paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, color: "#2563eb", fontWeight: "600" }}>Resend OTP Code</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* GOOGLE ACCOUNT SELECTOR MODAL */}
      <Modal visible={googleModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </Svg>
                <Text style={styles.googleModalTitle}>Sign in with Google</Text>
              </View>
              <Pressable onPress={() => { setGoogleModalVisible(false); setIsCustomMode(false); }}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>Choose an account to continue to AEGIS ALERT:</Text>

            {!isCustomMode ? (
              <View style={styles.accountList}>
                <Pressable
                  style={styles.accountItem}
                  onPress={() => executeGoogleAuth(email.trim() || "citizen.emergency@gmail.com", fullName.trim() || "Verified Citizen")}
                >
                  <View style={[styles.accountAvatar, { backgroundColor: "#2563eb" }]}>
                    <Text style={styles.accountAvatarText}>
                      {(fullName.trim() || email.trim() || "C")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{fullName.trim() || "Verified Citizen"}</Text>
                    <Text style={styles.accountEmail}>{email.trim() || "citizen.emergency@gmail.com"}</Text>
                  </View>
                </Pressable>

                <Pressable
                  style={styles.accountItem}
                  onPress={() => executeGoogleAuth("responder.official@gmail.com", "Emergency Responder")}
                >
                  <View style={[styles.accountAvatar, { backgroundColor: "#10b981" }]}>
                    <Text style={styles.accountAvatarText}>R</Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>Emergency Responder</Text>
                    <Text style={styles.accountEmail}>responder.official@gmail.com</Text>
                  </View>
                </Pressable>

                <Pressable style={styles.addAccountItem} onPress={() => setIsCustomMode(true)}>
                  <Text style={styles.addAccountText}>+ Use another Google account</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.customContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter Google email"
                  placeholderTextColor="#94a3b8"
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.customInput}
                  placeholder="Your Full Name"
                  placeholderTextColor="#94a3b8"
                  value={customName}
                  onChangeText={setCustomName}
                />
                <View style={styles.modalActions}>
                  <Pressable style={styles.modalCancel} onPress={() => setIsCustomMode(false)}>
                    <Text style={styles.modalCancelText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalConfirm}
                    onPress={() => executeGoogleAuth(customEmail || "citizen.google@gmail.com", customName || "Citizen User")}
                  >
                    <Text style={styles.modalConfirmText}>Sign In</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* FACEBOOK MODAL */}
      <Modal visible={facebookModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={styles.facebookIconSmall}>
                  <Text style={styles.facebookIconTextSmall}>f</Text>
                </View>
                <Text style={[styles.googleModalTitle, { color: "#3b5998" }]}>Log in with Facebook</Text>
              </View>
              <Pressable onPress={() => setFacebookModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>AEGIS ALERT is requesting access to your basic profile:</Text>

            <Pressable
              style={[styles.primaryButton, { backgroundColor: "#1877f2", marginTop: 8 }]}
              onPress={() => executeFacebookAuth(email.trim() || "citizen.facebook@gmail.com", fullName.trim() || "Facebook Citizen")}
            >
              <Text style={styles.primaryButtonText}>
                Continue as {fullName.trim() || (email.trim() ? email.split("@")[0] : "Citizen")}
              </Text>
            </Pressable>

            <Pressable style={styles.modalCancel} onPress={() => setFacebookModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0f172a",
    marginBottom: 22,
    letterSpacing: -0.5,
  },
  alertBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertSuccess: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
  },
  alertError: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderWidth: 1,
  },
  alertText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  alertTextSuccess: {
    color: "#065f46",
  },
  alertTextError: {
    color: "#9f1239",
  },
  inputContainer: {
    marginBottom: 14,
  },
  passwordContainer: {
    marginBottom: 14,
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    padding: 6,
  },
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 12,
    color: "#64748b",
  },
  primaryButton: {
    backgroundColor: "#0284c7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 12,
    color: "#475569",
  },
  toggleLink: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563eb",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  facebookButton: {
    backgroundColor: "#3b5998",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  facebookIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  facebookIconSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3b5998",
    justifyContent: "center",
    alignItems: "center",
  },
  facebookIconTextSmall: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12,
  },
  facebookIconText: {
    color: "#3b5998",
    fontWeight: "bold",
    fontSize: 12,
  },
  facebookButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconCircle: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  googleButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  footerNote: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fpIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },
  googleModalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#64748b",
    padding: 4,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 18,
  },
  codeSentBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  codeSentLabel: {
    fontSize: 11,
    color: "#1e40af",
    fontWeight: "600",
  },
  changeEmailText: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "bold",
  },
  otpInput: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 6,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  accountList: {
    marginBottom: 12,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  accountAvatarText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },
  accountEmail: {
    fontSize: 11,
    color: "#64748b",
  },
  addAccountItem: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    alignItems: "center",
    marginTop: 4,
  },
  addAccountText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
  },
  customContainer: {
    marginBottom: 12,
  },
  customInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0f172a",
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    marginTop: 6,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    marginTop: 6,
  },
  modalConfirmText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
});
