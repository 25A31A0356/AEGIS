import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Shield, Lock, CheckCircle2, X, UserCheck, AlertTriangle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, role, switchRole, login, logout, isLoading } = useAuth();
  const [email, setEmail] = useState(user?.email || 'operator.delhi@ndma.gov.in');
  const [selectedRole, setSelectedRole] = useState<UserRole>(role);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (r: UserRole) => {
    setSelectedRole(r);
    switchRole(r);
    setStatusMsg(`Switched role to: ${r.toUpperCase()}`);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, selectedRole);
    setStatusMsg(`Signed in successfully as ${selectedRole.toUpperCase()}`);
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 1000);
  };

  const ROLES: { id: UserRole; title: string; desc: string; color: string; badge: string }[] = [
    {
      id: 'operator',
      title: 'Operations Desk Operator',
      desc: 'Triage active SOS distress calls, dispatch emergency units, review community reports.',
      color: 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200',
      badge: 'DISPATCH CONTROL',
    },
    {
      id: 'official',
      title: 'Disaster Authority Official',
      desc: 'Publish official early warning advisories, authorize AI incident classifications, emergency declarations.',
      color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200',
      badge: 'ALERT & AI AUTHORIZATION',
    },
    {
      id: 'admin',
      title: 'System Administrator',
      desc: 'Root administrative clearance across all agencies, facilities, audits, and configuration.',
      color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
      badge: 'ROOT ACCESS',
    },
    {
      id: 'responder',
      title: 'Field Rescue Responder',
      desc: 'Receive assignments, transmit high-precision live GPS telemetry, execute extraction protocol.',
      color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
      badge: 'TELEMETRY TRANSMITTER',
    },
    {
      id: 'citizen',
      title: 'Public Citizen',
      desc: 'Public view mode: Request SOS emergency rescue, submit hazard reports, view verified advisories.',
      color: 'border-slate-300 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200',
      badge: 'PUBLIC CIVILIAN',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0E1C2A] rounded-3xl p-6 shadow-2xl border border-[#DCEBED] dark:border-[#1E3347] font-sans space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EDFAFC] dark:bg-[#075B8A]/30 border border-[#AEEBF0] dark:border-[#1E3A52] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#075B8A] dark:text-[#18C3D0]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18364A] dark:text-slate-100">
                AEGIS Access Control & RBAC
              </h3>
              <p className="text-xs text-[#708696] dark:text-slate-400">
                Role-Based Operational Clearance Gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Current Active Identity */}
        {user && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#07131D] border border-slate-200 dark:border-[#1E3347] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#18C3D0] text-[#071828] font-black text-xs flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-[#18364A] dark:text-white">{user.name}</p>
                <p className="text-[11px] text-[#708696] dark:text-slate-400">{user.email} • {user.agency}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase bg-[#EDFAFC] dark:bg-[#0E2235] text-[#075B8A] dark:text-[#18C3D0] border border-[#AEEBF0] dark:border-[#1E3A52]">
              {user.role}
            </span>
          </div>
        )}

        {/* Role Selector Grid */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#708696] dark:text-slate-400 uppercase tracking-wider font-mono">
            Select Operational Clearance
          </p>

          <div className="grid grid-cols-1 gap-2">
            {ROLES.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected ? r.color + ' ring-2 ring-sky-500' : 'border-slate-200 dark:border-[#1E3347] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black">{r.title}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 uppercase">
                        {r.badge}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-[#708696] dark:text-slate-400 leading-snug">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#DCEBED] dark:border-[#1E3347] flex items-center justify-between">
          {user ? (
            <button
              onClick={logout}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              Sign Out
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#075B8A] dark:bg-[#18C3D0] text-white dark:text-[#071828] hover:bg-[#0B6E9E] dark:hover:bg-[#14A5B1] transition-all shadow-sm cursor-pointer"
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
