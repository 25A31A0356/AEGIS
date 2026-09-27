import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { AegisLogo } from '../components/common/AegisLogo';

export const LoginPage: React.FC = () => {
  const { login, register, googleLogin, requestForgotPasswordOtp, resetPasswordWithOtp, isLoading } = useAuth();
  const { updateProfile } = useProfile();

  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google & Facebook Account Chooser Modal states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isCustomGoogleMode, setIsCustomGoogleMode] = useState(false);

  // Forgot Password Modal States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [fpStep, setFpStep] = useState<1 | 2>(1);
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [showFpPassword, setShowFpPassword] = useState(false);
  const [showFpConfirmPassword, setShowFpConfirmPassword] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpStatusMsg, setFpStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!email.trim() || !password.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your email and password.' });
      return;
    }
    try {
      await login(email.trim(), password.trim());
      const extractedName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      updateProfile({ fullName: extractedName });
      setStatusMsg({ type: 'success', text: 'Login successful! Connecting to command center...' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Invalid email or password. Please try again or create an account.' });
    }
  };

  // Submit Signup
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!email.trim() || !password.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your email and password.' });
      return;
    }
    if (password.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }
    try {
      const finalName = fullName.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      await register(finalName, email.trim(), password.trim());
      updateProfile({ fullName: finalName, phoneNumber: '+91 XXXXXXXXXX' });
      setStatusMsg({ type: 'success', text: 'Account created successfully! Connecting...' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Signup failed. User may already exist. Please login.' });
    }
  };

  const openForgotPassword = () => {
    setFpEmail(email.trim());
    setFpOtp('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpStep(1);
    setFpStatusMsg(null);
    setShowForgotPasswordModal(true);
  };

  const handleRequestFpOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail.trim()) {
      setFpStatusMsg({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }
    try {
      setFpLoading(true);
      setFpStatusMsg(null);
      await requestForgotPasswordOtp(fpEmail.trim().toLowerCase());
      setFpStatusMsg({ type: 'success', text: `6-digit OTP sent to ${fpEmail.trim()}. Enter it below.` });
      setFpStep(2);
    } catch (err: any) {
      setFpStatusMsg({ type: 'error', text: err?.message || 'Failed to send OTP. Please verify your email.' });
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpOtp.trim() || fpOtp.trim().length !== 6) {
      setFpStatusMsg({ type: 'error', text: 'Please enter the 6-digit OTP received in your email.' });
      return;
    }
    if (!fpNewPassword || fpNewPassword.length < 6) {
      setFpStatusMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpStatusMsg({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }
    try {
      setFpLoading(true);
      setFpStatusMsg(null);
      await resetPasswordWithOtp(fpEmail.trim().toLowerCase(), fpOtp.trim(), fpNewPassword);
      setFpStatusMsg({ type: 'success', text: 'Password reset successful! Logging you in...' });
      const extractedName = fpEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      updateProfile({ fullName: extractedName });
      setTimeout(() => {
        setShowForgotPasswordModal(false);
      }, 1000);
    } catch (err: any) {
      setFpStatusMsg({ type: 'error', text: err?.message || 'Invalid or expired OTP. Please try again.' });
    } finally {
      setFpLoading(false);
    }
  };

  const performGoogleAuth = async (targetEmail: string, targetName: string) => {
    setShowGoogleModal(false);
    setIsCustomGoogleMode(false);
    setStatusMsg(null);
    try {
      await googleLogin(targetEmail.trim().toLowerCase(), targetName.trim());
      updateProfile({ fullName: targetName.trim(), phoneNumber: '+91 XXXXXXXXXX' });
      setStatusMsg({ type: 'success', text: `Google Authentication Verified for ${targetEmail}!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Google authentication failed.' });
    }
  };

  const performFacebookAuth = async (targetEmail: string, targetName: string) => {
    setShowFacebookModal(false);
    setStatusMsg(null);
    try {
      await googleLogin(targetEmail.trim().toLowerCase(), targetName.trim());
      updateProfile({ fullName: targetName.trim(), phoneNumber: '+91 XXXXXXXXXX' });
      setStatusMsg({ type: 'success', text: `Facebook Authentication Verified for ${targetEmail}!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Facebook authentication failed.' });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#000000] p-4 font-sans select-none relative">
      {/* Top Center Logo & Title */}
      <div className="mb-6 flex flex-col items-center text-center text-white">
        <AegisLogo size="lg" showSubtitle={true} />
      </div>

      {/* Clean White Card matching Reference Image */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-7 sm:p-9 text-slate-900 border border-neutral-800/40 animate-in fade-in zoom-in-95 duration-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-slate-900 tracking-tight">
          {isSignup ? 'Signup' : 'Login'}
        </h1>

        {/* Status Alerts */}
        {statusMsg && (
          <div className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 border ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            <span className="material-symbols-outlined text-sm">
              {statusMsg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {!isSignup ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={openForgotPassword}
                className="text-xs text-slate-500 hover:text-blue-600 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-70"
            >
              {isLoading ? 'Signing In...' : 'Login'}
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-slate-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    setStatusMsg(null);
                  }}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Signup
                </button>
              </span>
            </div>
          </form>
        ) : (
          /* 2. SIGNUP FORM */
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name (optional)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-70"
            >
              {isLoading ? 'Creating Account...' : 'Signup'}
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    setStatusMsg(null);
                  }}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Login
                </button>
              </span>
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-medium">Or</span>
          </div>
        </div>

        {/* Social Buttons Matching Reference Image */}
        <div className="space-y-3">
          {/* Facebook */}
          <button
            type="button"
            onClick={() => setShowFacebookModal(true)}
            className="w-full py-3 rounded-xl bg-[#4267B2] hover:bg-[#365899] text-white font-semibold text-sm flex items-center justify-center gap-3 transition cursor-pointer shadow-sm active:scale-98"
          >
            <div className="w-5 h-5 rounded-full bg-white text-[#4267B2] font-bold text-xs flex items-center justify-center">
              f
            </div>
            <span>Login with Facebook</span>
          </button>

          {/* Google */}
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            className="w-full py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 transition cursor-pointer shadow-sm active:scale-98"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Login with Google</span>
          </button>
        </div>
      </div>

      {/* INTERACTIVE FORGOT PASSWORD / OTP RESET MODAL */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-7 sm:p-8 text-slate-900 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">lock_reset</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Reset Password</h3>
                  <p className="text-[11px] text-slate-500">Universal AEGIS Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 cursor-pointer transition font-bold"
              >
                ✕
              </button>
            </div>

            {fpStatusMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 border ${fpStatusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <span className="material-symbols-outlined text-sm shrink-0">
                  {fpStatusMsg.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{fpStatusMsg.text}</span>
              </div>
            )}

            {fpStep === 1 ? (
              /* Step 1: Enter Email & Request OTP */
              <form onSubmit={handleRequestFpOtp} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered email address. We will dispatch a 6-digit verification OTP to securely reset your password.
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="w-full py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm transition cursor-pointer shadow-sm active:scale-98 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {fpLoading ? 'Sending OTP Code...' : 'Send OTP Code'}
                </button>
              </form>
            ) : (
              /* Step 2: Enter OTP & New Password */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-blue-600 font-semibold">Verification Code Sent</p>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{fpEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFpStep(1); setFpStatusMsg(null); }}
                    className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full px-4 py-3 text-center tracking-[0.3em] font-mono font-bold text-lg rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
                  <input
                    type={showFpPassword ? 'text' : 'password'}
                    required
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFpPassword(!showFpPassword)}
                    className="absolute right-3 top-[32px] text-slate-400 hover:text-slate-600 p-1 cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showFpPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
                  <input
                    type={showFpConfirmPassword ? 'text' : 'password'}
                    required
                    value={fpConfirmPassword}
                    onChange={(e) => setFpConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFpConfirmPassword(!showFpConfirmPassword)}
                    className="absolute right-3 top-[32px] text-slate-400 hover:text-slate-600 p-1 cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showFpConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="w-full py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm transition cursor-pointer shadow-sm active:scale-98 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {fpLoading ? 'Resetting Password...' : 'Update Password & Log In'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleRequestFpOtp}
                    disabled={fpLoading}
                    className="text-xs text-slate-500 hover:text-blue-600 font-medium cursor-pointer"
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REALISTIC GOOGLE SIGN-IN MODAL (Matches Real Google Account Chooser) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 text-slate-800 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="font-bold text-sm text-slate-800">Sign in with Google</span>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">Choose an account to continue to <strong>AEGIS ALERT</strong>:</p>

            {!isCustomGoogleMode ? (
              <div className="space-y-2 mb-4">
                {/* Account 1: Fast One-Click Choice */}
                <button
                  onClick={() => performGoogleAuth(email.trim() || 'citizen.emergency@gmail.com', fullName.trim() || 'Verified Citizen')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center gap-3 text-left transition group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {(fullName.trim() || email.trim() || 'C')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                      {fullName.trim() || (email.trim() ? email.split('@')[0] : 'Verified Citizen')}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {email.trim() || 'citizen.emergency@gmail.com'}
                    </p>
                  </div>
                </button>

                {/* Account 2: Responder / Official Choice */}
                <button
                  onClick={() => performGoogleAuth('responder.desk@gmail.com', 'Emergency Responder')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center gap-3 text-left transition group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    R
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">Emergency Responder</p>
                    <p className="text-[11px] text-slate-500 truncate">responder.desk@gmail.com</p>
                  </div>
                </button>

                {/* Use Another Account */}
                <button
                  onClick={() => setIsCustomGoogleMode(true)}
                  className="w-full p-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 flex items-center gap-3 text-left transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-base">
                    <span className="material-symbols-outlined text-lg">person_add</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Use another account</p>
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Google Email Address</label>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="First and Last Name"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomGoogleMode(false)}
                    className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => performGoogleAuth(customGoogleEmail || 'citizen.google@gmail.com', customGoogleName || 'Citizen User')}
                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>English (United States)</span>
              <div className="flex gap-3">
                <span className="hover:underline cursor-pointer">Help</span>
                <span className="hover:underline cursor-pointer">Privacy</span>
                <span className="hover:underline cursor-pointer">Terms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REALISTIC FACEBOOK SIGN-IN MODAL */}
      {showFacebookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-2xl p-6 text-slate-800 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#3b5998] text-white flex items-center justify-center font-bold text-xs">
                  f
                </div>
                <span className="font-bold text-sm text-[#3b5998]">Log in with Facebook</span>
              </div>
              <button onClick={() => setShowFacebookModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              AEGIS ALERT is requesting access to your name and email address.
            </p>

            <button
              onClick={() => performFacebookAuth(email.trim() || 'citizen.fb@facebook.com', fullName.trim() || 'Facebook Citizen')}
              className="w-full py-3 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition mb-3"
            >
              <span>Continue as {fullName.trim() || (email.trim() ? email.split('@')[0] : 'Citizen')}</span>
            </button>

            <button
              onClick={() => setShowFacebookModal(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer Credentials Note */}
      <div className="mt-6 text-xs text-white/80 font-medium flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">verified_user</span>
        <span>AEGIS Universal Disaster Management &bull; 112 Compatible</span>
      </div>
    </div>
  );
};
