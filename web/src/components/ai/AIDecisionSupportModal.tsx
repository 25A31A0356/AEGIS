import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/apiClient';
import { Sparkles, CheckCircle2, XCircle, Clock, X, AlertTriangle, Shield } from 'lucide-react';

interface AIDecisionSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AIDecisionAuditRecord {
  id: string;
  request_id: string;
  model_provider: string;
  task_type: string;
  input_summary?: string;
  output_payload: any;
  confidence: number;
  authorization_status: 'PENDING_OFFICIAL_REVIEW' | 'AUTHORIZED' | 'REJECTED';
  authorized_by?: string;
  authorized_at?: string;
  created_at: string;
}

export const AIDecisionSupportModal: React.FC<AIDecisionSupportModalProps> = ({ isOpen, onClose }) => {
  const [audits, setAudits] = useState<AIDecisionAuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('Reviewed and authorized by official command');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadAudits() {
      setIsLoading(true);
      try {
        const res = await ApiClient.get<any>('/ai/audit');
        const list = Array.isArray(res) ? res : (res?.data || []);
        setAudits(list);
      } catch (err) {
        console.warn('[AIDecisionSupportModal] Failed to load AI audits:', err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAudits();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuthorize = async (auditId: string, isApproved: boolean) => {
    setActionLoadingId(auditId);
    try {
      await ApiClient.post(`/ai/audit/${auditId}/authorize`, {
        approved: isApproved,
        notes: reviewNotes,
      });

      setAudits((prev) =>
        prev.map((a) =>
          a.id === auditId
            ? {
                ...a,
                authorization_status: isApproved ? 'AUTHORIZED' : 'REJECTED',
                authorized_by: 'OFFICIAL_COMMAND',
                authorized_at: new Date().toISOString(),
              }
            : a
        )
      );

      setStatusMsg(`AI decision successfully marked as ${isApproved ? 'AUTHORIZED' : 'REJECTED'}`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('[AIDecisionSupportModal] Authorization error:', err);
      setStatusMsg('Failed to update authorization status. Ensure official credentials.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#0E1C2A] rounded-3xl p-6 shadow-2xl border border-[#DCEBED] dark:border-[#1E3347] font-sans space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18364A] dark:text-slate-100">
                AI Decision Support & Official Review Hub
              </h3>
              <p className="text-xs text-[#708696] dark:text-slate-400">
                Rigorous Human-in-the-Loop Verification for AI Disaster Inferences
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
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800 text-xs font-semibold text-purple-800 dark:text-purple-300">
            {statusMsg}
          </div>
        )}

        {/* Informational Guardrail Banner */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#07131D] border border-slate-200 dark:border-[#1E3347] text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
          <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <span>
            <strong>Authoritative Guardrail:</strong> AI inferences cannot automatically publish official alerts or override emergency protocols without human official authorization.
          </span>
        </div>

        {/* Audit List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Querying /api/v1/ai/audit decision logs...
            </div>
          ) : audits.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#07131D] text-center text-xs text-slate-400">
              No AI decision logs recorded in this session.
            </div>
          ) : (
            audits.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-[#1E3347] bg-white dark:bg-[#0B1E30] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 uppercase">
                      {a.task_type}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Model: {a.model_provider}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      a.authorization_status === 'AUTHORIZED'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : a.authorization_status === 'REJECTED'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {a.authorization_status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#07131D] font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
                  <pre>{JSON.stringify(a.output_payload, null, 2)}</pre>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Confidence: <strong>{(a.confidence * 100).toFixed(0)}%</strong></span>
                  <span>{new Date(a.created_at).toLocaleString()}</span>
                </div>

                {a.authorization_status === 'PENDING_OFFICIAL_REVIEW' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleAuthorize(a.id, false)}
                      disabled={actionLoadingId === a.id}
                      className="px-3 py-1.5 rounded-xl font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAuthorize(a.id, true)}
                      disabled={actionLoadingId === a.id}
                      className="px-4 py-1.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm"
                    >
                      Authorize Decision
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#DCEBED] dark:border-[#1E3347] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
