import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, login, register, sendOtp, verifyOtp, googleLogin, logout, isLoading } = useAuth();
  const { updateProfile } = useProfile();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'otp' | 'google'>('signin');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [demoOtpValue, setDemoOtpValue] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!email.trim() || !password.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your email and password.' });
      return;
    }
    try {
      await login(email, password, selectedRole);
      setStatusMsg({ type: 'success', text: 'Signed in successfully to AEGIS ALERT.' });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Invalid email or password. You can Create Account if you are new.' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in your full name, email, and password.' });
      return;
    }
    if (password.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    try {
      await register(fullName, email, password, selectedRole);
      updateProfile({ fullName: fullName.trim() });
      setStatusMsg({ type: 'success', text: 'Account created successfully! Welcome to AEGIS.' });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Registration failed. Email might already exist.' });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!email.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your email address to receive OTP.' });
      return;
    }
    const res = await sendOtp(email, fullName);
    if (res.success) {
      setOtpDispatched(true);
      if (res.otp_code) {
        setDemoOtpValue(res.otp_code);
      }
      setStatusMsg({ type: 'success', text: `Verification OTP generated and sent to ${email}.` });
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Failed to send OTP.' });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!otpCode.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter the 6-digit OTP code.' });
      return;
    }
    try {
      await verifyOtp(email, otpCode, fullName, selectedRole);
      if (fullName.trim()) {
        updateProfile({ fullName: fullName.trim() });
      }
      setStatusMsg({ type: 'success', text: 'OTP verified successfully! Access granted.' });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Invalid OTP code. Try 123456 or request new OTP.' });
    }
  };

  const handleGoogleAuth = async () => {
    setStatusMsg(null);
    const googleMail = email.trim() || prompt('Enter your Google Account Email for instant sign-in:') || '';
    if (!googleMail.trim()) return;

    const gName = fullName.trim() || googleMail.split('@')[0].replace('.', ' ').toUpperCase();
    try {
      await googleLogin(googleMail, gName);
      updateProfile({ fullName: gName });
      setStatusMsg({ type: 'success', text: `Authenticated with Google as ${googleMail}!` });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Google authentication failed.' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#27272a] overflow-hidden font-sans grid grid-cols-1 md:grid-cols-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: National Emergency Platform Info (2 cols) */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#05070a] via-[#0d1017] to-[#05070a] text-white p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/10 text-white text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AUTHENTICATION GATEWAY
            </div>
            <h2 className="text-xl font-black font-sans tracking-tight">AEGIS ALERT</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time Early Warning, SOS Dispatch & Multi-Hazard Response System.
            </p>
          </div>

          <div className="space-y-2 z-10 pt-6">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 space-y-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-sm">security</span>
                Verified Identities
              </span>
              <p className="text-[10px] text-slate-400">
                Accounts are registered directly into the persistent AEGIS security database with end-to-end token encryption.
              </p>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              NDMA &bull; SDRF &bull; IMD &bull; 112 Compatible
            </p>
          </div>
        </div>

        {/* Right Side: Auth Forms & Tabs (3 cols) */}
        <div className="md:col-span-3 p-6 space-y-4 bg-white dark:bg-[#111111] max-h-[85vh] overflow-y-auto">
          {/* Header and Close */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {authMode === 'signin' && 'Sign In to Access'}
                {authMode === 'signup' && 'Create New Account'}
                {authMode === 'otp' && 'Server OTP Verification'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#a1a1aa]">
                {authMode === 'signin' && 'Enter your credentials to access your dashboard'}
                {authMode === 'signup' && 'Register your name and email for emergency services'}
                {authMode === 'otp' && 'Passwordless verification code issued by server'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b] cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-[#18181b] p-1 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setStatusMsg(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${authMode === 'signin' ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setStatusMsg(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${authMode === 'signup' ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('otp'); setStatusMsg(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${authMode === 'otp' ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              OTP Code
            </button>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}>
              <span className="material-symbols-outlined text-sm">
                {statusMsg.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#a1a1aa]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 dark:text-[#a1a1aa] hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Account Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="citizen">Public Citizen (SOS, Reports & Family Safety)</option>
                  <option value="operator">Operations Desk Operator (Command & Dispatch)</option>
                  <option value="responder">Field Rescue Responder (SDRF / NDRF)</option>
                  <option value="official">Disaster Management Official</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
              >
                {isLoading ? 'Signing In...' : 'Sign In to AEGIS ALERT'}
              </button>
            </form>
          )}

          {/* TAB 2: CREATE ACCOUNT (REGISTER) */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Your Full Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Create Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="citizen">Public Citizen</option>
                  <option value="responder">Volunteer / Community Responder</option>
                  <option value="operator">Emergency Operator</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
              >
                {isLoading ? 'Creating Account...' : 'Create Real Account'}
              </button>
            </form>
          )}

          {/* TAB 3: OTP VERIFICATION */}
          {authMode === 'otp' && (
            <div className="space-y-3">
              {!otpDispatched ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                      Your Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                      Email for OTP Code
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none"
                      placeholder="name@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    {isLoading ? 'Generating OTP...' : 'Send OTP from Server'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  {demoOtpValue && (
                    <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs">
                      <span className="font-bold">Server OTP Code:</span> <code className="font-mono text-sm font-black px-1.5 py-0.5 rounded bg-sky-200/60 dark:bg-sky-900/60">{demoOtpValue}</code>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                      Enter 6-Digit Server OTP for {email}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-3 py-2.5 text-center text-lg tracking-widest font-mono font-black rounded-xl border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="••••••"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpDispatched(false)}
                      className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#27272a] text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Change Email
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      {isLoading ? 'Verifying...' : 'Verify OTP & Access'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Social Sign-In: Google Option */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#27272a] space-y-2">
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-[#27272a] hover:bg-slate-50 dark:hover:bg-[#18181b] flex items-center justify-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
