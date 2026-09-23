import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, role, switchRole, login, logout, isLoading } = useAuth();
  const [email, setEmail] = useState('officer.rajesh@ndma.gov.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>(role);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, selectedRole);
    setStatusMsg(`Signed in successfully as ${selectedRole.toUpperCase()}`);
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#27272a] overflow-hidden font-sans grid grid-cols-1 md:grid-cols-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Professional Branding & Info (2 cols) */}
        <div className="md:col-span-2 bg-slate-900 text-white p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/10 text-white text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OFFICIAL DISASTER PORTAL
            </div>
            <h2 className="text-xl font-bold font-sans tracking-tight">AEGIS ALERT</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Intelligent Multi-Hazard Disaster Management, Early Warning & Emergency Response Platform.
            </p>
          </div>

          <div className="space-y-2 z-10 pt-6">
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
              <span className="font-semibold text-white">Republic of India</span>
              <p className="text-[10px] text-slate-400 mt-0.5">NDRF &bull; IMD &bull; CWC &bull; INCOIS Connected</p>
            </div>
            <p className="text-[10px] text-slate-400">
              Authorized personnel credentials protected by RBAC encryption.
            </p>
          </div>
        </div>

        {/* Right Side: Clean Login Form (3 cols) */}
        <div className="md:col-span-3 p-6 space-y-4 bg-white dark:bg-[#111111]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Account Sign In</h3>
              <p className="text-xs text-slate-500 dark:text-[#a1a1aa]">Access operational controls and live feeds</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b]"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {statusMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="name@ndma.gov.in"
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
                  className="text-[11px] text-slate-600 dark:text-[#a1a1aa] hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                Operational Clearance Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#27272a] bg-white dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="citizen">Public Citizen (SOS & Reporting)</option>
                <option value="operator">Operations Desk Operator (Command & Dispatch)</option>
                <option value="responder">Field Rescue Responder (Live Telemetry)</option>
                <option value="official">Disaster Official (Advisories & Authorizations)</option>
                <option value="admin">System Administrator (Root Clearance)</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 text-slate-600 dark:text-[#a1a1aa]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded accent-slate-900 dark:accent-white"
                />
                Remember me
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password recovery link dispatched to registered agency email.'); }} className="text-slate-600 dark:text-[#a1a1aa] hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black text-xs font-bold transition-colors cursor-pointer shadow-xs mt-2"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to AEGIS ALERT'}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center">
            By signing in you agree to National Disaster Response Protocols & Privacy Guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
