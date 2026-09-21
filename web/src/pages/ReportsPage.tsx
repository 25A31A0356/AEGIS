/**
 * AEGIS ALERT — Community Incident Reports & Verification Center (Web Operations)
 * Provides authoritative ground-truth citizen incident queue, media inspection,
 * operator verification, rejection with reason, and SOS/Incident cross-linking.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { RecentCitizenReportsList } from '../components/reports/RecentCitizenReportsList';
import { ReportService } from '../services/reportService';
import { CitizenReport, ReportSeverity } from '../types/report';
import {
  RefreshCw,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Link2,
  CheckCircle2,
  XCircle,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Info,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Selected report for Details drawer / modal
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  // Operator Action Modals
  const [verifyingReport, setVerifyingReport] = useState<CitizenReport | null>(null);
  const [rejectingReport, setRejectingReport] = useState<CitizenReport | null>(null);
  const [linkingReport, setLinkingReport] = useState<CitizenReport | null>(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  // Form states for modals
  const [verifySeverity, setVerifySeverity] = useState<ReportSeverity>('high');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Unsubstantiated / Insufficient Evidence');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [linkSosId, setLinkSosId] = useState('');
  const [linkIncidentId, setLinkIncidentId] = useState('');
  const [linkNotes, setLinkNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const fetched = await ReportService.fetchReportsFromApi();
      if (fetched && fetched.length >= 0) {
        setReports(fetched);
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.warn('[ReportsPage] Failed to fetch reports:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReports();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const handleManualRefresh = () => {
    setIsLoading(true);
    fetchReports();
  };

  const handleOpenVerify = (report: CitizenReport) => {
    setVerifyingReport(report);
    setVerifySeverity(report.severity || 'high');
    setVerifyNotes('Verified on-ground situational bulletin by emergency controller.');
  };

  const handleConfirmVerify = async () => {
    if (!verifyingReport) return;
    setActionLoading(true);
    try {
      const updated = await ReportService.verifyReport(verifyingReport.id, {
        severity: verifySeverity.toUpperCase(),
        operator_notes: verifyNotes,
      });
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedReport?.id === updated.id) setSelectedReport(updated);
      setVerifyingReport(null);
    } catch (e) {
      alert(`Verification failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (report: CitizenReport) => {
    setRejectingReport(report);
    setRejectionReason('Unsubstantiated / Insufficient Evidence');
    setRejectionNotes('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingReport) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a valid rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await ReportService.rejectReport(rejectingReport.id, {
        rejection_reason: rejectionReason,
        operator_notes: rejectionNotes,
      });
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedReport?.id === updated.id) setSelectedReport(updated);
      setRejectingReport(null);
    } catch (e) {
      alert(`Rejection failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenLink = (report: CitizenReport) => {
    setLinkingReport(report);
    setLinkSosId(report.linkedSosId || '');
    setLinkIncidentId(report.linkedIncidentId || '');
    setLinkNotes('Linked to operations incident.');
  };

  const handleConfirmLink = async () => {
    if (!linkingReport) return;
    setActionLoading(true);
    try {
      const updated = await ReportService.linkReport(linkingReport.id, {
        linked_sos_id: linkSosId.trim() || undefined,
        linked_incident_id: linkIncidentId.trim() || undefined,
        operator_notes: linkNotes,
      });
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedReport?.id === updated.id) setSelectedReport(updated);
      setLinkingReport(null);
    } catch (e) {
      alert(`Linking failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-[1720px] mx-auto space-y-6 font-sans select-none pb-8">
      {/* Page Header */}
      <PageHeader
        title="Community Reports & Ground-Truth Intel"
        subtitle="Citizen-submitted incident bulletins across India with operator verification, media storage, and SOS cross-linking."
        badge="COMMUNITY INTEL"
        badgeVariant="cyan"
      />

      {/* Strict Taxonomy & Source Distinction Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 bg-[#EFF9FF] dark:bg-[#07131D] border border-[#AEEBF0] dark:border-[#1E3347] rounded-2xl px-5 py-4">
          <Smartphone className="w-5 h-5 text-[#18C3D0] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#075B8A] dark:text-[#18C3D0]">
              Provenance: COMMUNITY_REPORT (Citizen Ground-Truth)
            </p>
            <p className="text-[11px] text-[#708696] dark:text-slate-400 mt-0.5">
              Citizen reports are tagged as <span className="font-semibold text-amber-600 dark:text-amber-400">UNVERIFIED</span> or <span className="font-semibold text-emerald-600 dark:text-emerald-400">VERIFIED</span> community intel. They are strictly isolated and never masquerade as official meteorological or disaster agency alerts.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-amber-50 dark:bg-[#1A1608] border border-amber-200 dark:border-amber-900/50 rounded-2xl px-5 py-4 justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Official Warnings vs Community Intel
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                Official disaster bulletins originate from IMD, CWC, and NDMA feeds under the Alerts view. Operators can verify citizen reports and elevate their trust score without altering official broadcast channels.
              </p>
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#075B8A] hover:bg-[#0B6E9E] disabled:opacity-60 text-white text-xs font-bold transition-all self-center"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Ingested Reports', value: reports.length, color: 'text-[#18C3D0]' },
          { label: 'Unverified / Pending', value: reports.filter((r) => !r.isVerified && r.status !== 'rejected').length, color: 'text-amber-500' },
          { label: 'Verified by Operations', value: reports.filter((r) => r.isVerified).length, color: 'text-emerald-500' },
          { label: 'Rejected / Discarded', value: reports.filter((r) => r.status === 'rejected').length, color: 'text-rose-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#0E1C2A] border border-[#DCEBED] dark:border-[#1E3347] rounded-2xl p-4 shadow-card">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] font-semibold text-[#708696] dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Reports List */}
      <RecentCitizenReportsList
        externalReports={reports}
        isLoading={isLoading}
        onSelectReport={setSelectedReport}
        onVerifyReport={handleOpenVerify}
        onRejectReport={handleOpenReject}
        onLinkReport={handleOpenLink}
      />

      {/* Report Detail Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#0E1C2A] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-[#DCEBED] dark:border-[#1E3347]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#075B8A] dark:text-[#18C3D0]">
                    {selectedReport.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedReport.sourceType || 'COMMUNITY_REPORT'}
                  </span>
                  {selectedReport.isVerified ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      VERIFIED
                    </span>
                  ) : selectedReport.status === 'rejected' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      REJECTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      UNVERIFIED
                    </span>
                  )}
                </div>
                <h2 className="text-base font-black text-[#18364A] dark:text-slate-100 mt-1.5">
                  {selectedReport.title || selectedReport.hazardLabel || selectedReport.hazardType}
                </h2>
                <p className="text-xs text-[#708696] dark:text-slate-400">{selectedReport.location?.address}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-full hover:bg-[#F4F8FA] dark:hover:bg-[#132335] text-[#708696]"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#708696] dark:text-slate-400">DESCRIPTION</p>
              <p className="text-sm text-[#18364A] dark:text-slate-200 leading-relaxed bg-[#F4F8FA] dark:bg-[#07131D] p-3.5 rounded-2xl">
                {selectedReport.description}
              </p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#F4F8FA] dark:bg-[#07131D] p-3 rounded-xl">
                <span className="text-[10px] text-[#708696] block">CATEGORY</span>
                <span className="font-bold text-[#18364A] dark:text-slate-200">
                  {selectedReport.category || selectedReport.hazardType}
                </span>
              </div>
              <div className="bg-[#F4F8FA] dark:bg-[#07131D] p-3 rounded-xl">
                <span className="text-[10px] text-[#708696] block">SEVERITY</span>
                <span className="font-bold text-[#18364A] dark:text-slate-200 uppercase">
                  {selectedReport.severity}
                </span>
              </div>
              <div className="bg-[#F4F8FA] dark:bg-[#07131D] p-3 rounded-xl">
                <span className="text-[10px] text-[#708696] block">COORDINATES</span>
                <span className="font-mono text-[11px] text-[#18364A] dark:text-slate-200">
                  {selectedReport.location.lat.toFixed(4)}, {selectedReport.location.lng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Operator Notes & Rejection details if available */}
            {selectedReport.rejectionReason && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs">
                <p className="font-bold text-rose-800 dark:text-rose-300">Rejection Reason</p>
                <p className="text-rose-700 dark:text-rose-400 mt-0.5">{selectedReport.rejectionReason}</p>
              </div>
            )}
            {selectedReport.operatorNotes && (
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs">
                <p className="font-bold text-sky-800 dark:text-sky-300">Operator Review Notes</p>
                <p className="text-sky-700 dark:text-sky-400 mt-0.5">{selectedReport.operatorNotes}</p>
              </div>
            )}

            {/* Media Vault Attachments */}
            {selectedReport.media && selectedReport.media.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#708696] dark:text-slate-400">MEDIA VAULT ATTACHMENTS</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedReport.media.map((m) => {
                    const isVideo = m.fileType?.includes('video') || m.url?.endsWith('.mp4');
                    return (
                      <div
                        key={m.id}
                        onClick={() => setActiveMediaUrl(m.url)}
                        className="relative group rounded-xl overflow-hidden border border-[#DCEBED] dark:border-[#1E3347] bg-black aspect-video cursor-pointer"
                      >
                        {isVideo ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                            <Video className="w-8 h-8 opacity-80 group-hover:scale-110 transition-transform" />
                            <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/70 px-1 rounded">VIDEO</span>
                          </div>
                        ) : (
                          <img
                            src={m.url}
                            alt={m.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23222" width="100" height="100"/><text fill="%23888" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10">Photo Preview</text></svg>';
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-[#DCEBED] dark:border-[#1E3347] flex flex-wrap items-center justify-between gap-2">
              <a
                href={`https://maps.google.com/?q=${selectedReport.location?.lat},${selectedReport.location?.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#075B8A] dark:text-[#18C3D0] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View on Google Maps
              </a>

              <div className="flex items-center gap-2">
                {!selectedReport.isVerified && selectedReport.status !== 'rejected' && (
                  <>
                    <button
                      onClick={() => handleOpenVerify(selectedReport)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                    >
                      Verify Report
                    </button>
                    <button
                      onClick={() => handleOpenReject(selectedReport)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm"
                    >
                      Reject Report
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleOpenLink(selectedReport)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#075B8A] hover:bg-[#0B6E9E] text-white transition-all shadow-sm"
                >
                  Link to SOS / Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operator Verification Dialog */}
      {verifyingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0E1C2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-[#DCEBED] dark:border-[#1E3347]">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-[#18364A] dark:text-slate-100">
                Verify Community Incident Report
              </h3>
            </div>
            <p className="text-xs text-[#708696] dark:text-slate-400">
              Verifying promotes report to <span className="font-semibold text-emerald-600">VERIFIED</span> trust level and displays it on the verified operations grid.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                  Confirmed Severity Level
                </label>
                <select
                  value={verifySeverity}
                  onChange={(e) => setVerifySeverity(e.target.value as ReportSeverity)}
                  className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2"
                >
                  <option value="low">LOW</option>
                  <option value="moderate">MODERATE</option>
                  <option value="high">HIGH</option>
                  <option value="critical">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                  Operator Verification Notes
                </label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  placeholder="Enter confirmation details..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setVerifyingReport(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#708696] hover:bg-[#F4F8FA] dark:hover:bg-[#132335]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerify}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
              >
                {actionLoading ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operator Rejection Dialog */}
      {rejectingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0E1C2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-[#DCEBED] dark:border-[#1E3347]">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-[#18364A] dark:text-slate-100">
                Reject Citizen Incident Report
              </h3>
            </div>
            <p className="text-xs text-[#708696] dark:text-slate-400">
              Rejected reports will be archived with the reason provided and excluded from active responder maps.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                  Rejection Reason (Required)
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2"
                >
                  <option value="Unsubstantiated / Insufficient Evidence">Unsubstantiated / Insufficient Evidence</option>
                  <option value="Duplicate Submission">Duplicate Submission</option>
                  <option value="Spam / Prank Report">Spam / Prank Report</option>
                  <option value="Incident Resolved / Outdated">Incident Resolved / Outdated</option>
                  <option value="Incorrect Geospatial Location">Incorrect Geospatial Location</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl p-3 focus:outline-none focus:border-rose-500"
                  placeholder="Optional internal audit remarks..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingReport(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#708696] hover:bg-[#F4F8FA] dark:hover:bg-[#132335]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operator Cross-Link Dialog */}
      {linkingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0E1C2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-[#DCEBED] dark:border-[#1E3347]">
            <div className="flex items-center gap-2 text-[#075B8A] dark:text-[#18C3D0]">
              <Link2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-[#18364A] dark:text-slate-100">
                Cross-Link Report to SOS or Incident
              </h3>
            </div>
            <p className="text-xs text-[#708696] dark:text-slate-400">
              Associate this ground-truth report with an active emergency SOS beacon or a major disaster incident cluster.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                  Linked SOS Beacon ID (Optional)
                </label>
                <input
                  type="text"
                  value={linkSosId}
                  onChange={(e) => setLinkSosId(e.target.value)}
                  placeholder="e.g. sos_98fbc892..."
                  className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                  Linked Master Incident ID (Optional)
                </label>
                <input
                  type="text"
                  value={linkIncidentId}
                  onChange={(e) => setLinkIncidentId(e.target.value)}
                  placeholder="e.g. inc_mumbai_floods_2026..."
                  className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                  Linking Notes
                </label>
                <textarea
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl p-3 focus:outline-none focus:border-[#18C3D0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setLinkingReport(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#708696] hover:bg-[#F4F8FA] dark:hover:bg-[#132335]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLink}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#075B8A] hover:bg-[#0B6E9E] text-white disabled:opacity-60"
              >
                {actionLoading ? 'Saving...' : 'Save Associations'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Fullscreen Lightbox */}
      {activeMediaUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setActiveMediaUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveMediaUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-rose-400 font-bold text-sm bg-black/50 px-3 py-1 rounded-full"
            >
              ✕ Close
            </button>
            {activeMediaUrl.endsWith('.mp4') ? (
              <video
                src={activeMediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/20"
              />
            ) : (
              <img
                src={activeMediaUrl}
                alt="Media Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
