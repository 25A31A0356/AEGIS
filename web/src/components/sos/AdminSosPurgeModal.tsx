import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, Trash2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useSOS } from '../../context/SOSContext';

interface AdminSosPurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSosPurgeModal: React.FC<AdminSosPurgeModalProps> = ({ isOpen, onClose }) => {
  const { adminPurgeAllSOS } = useSOS();

  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [reason, setReason] = useState('Incident Commander Emergency Network Clearance');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim() || !adminPass.trim()) {
      setErrorMessage('Please enter both Admin ID and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await adminPurgeAllSOS(adminId.trim(), adminPass.trim(), reason.trim());
      setSuccessMessage(res.message || `Successfully purged ${res.purged_count} active SOS beacons!`);
      setAdminId('');
      setAdminPass('');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Administrative verification failed. Invalid ID or Password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 text-white space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Master SOS Emergency Wipe
            </h3>
            <p className="text-xs text-slate-400">
              Clear all active distress signals across Web & Mobile App Network
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-red-400" />
              Administrative ID
            </label>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Enter Administrative ID"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              Security Password
            </label>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Enter Security Password"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm tracking-wide shadow-lg shadow-red-900/40 hover:shadow-red-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying & Purging Network...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Execute Master SOS Wipe</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-[10.5px] text-slate-500 text-center font-mono">
          🔒 Restricted Administrative Perk • Incident Command Protocol
        </p>
      </div>
    </div>
  );
};
