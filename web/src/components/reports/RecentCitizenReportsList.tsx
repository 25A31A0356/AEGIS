import React, { useState } from 'react';
import { MapPin, CheckCircle2, XCircle, AlertTriangle, Link2, Eye, ShieldCheck, ShieldAlert, Video, Image as ImageIcon } from 'lucide-react';
import { CitizenReport } from '../../types/report';
import { ReportService } from '../../services/reportService';
import { useTranslation } from '../../i18n/useTranslation';

interface RecentCitizenReportsListProps {
  onSelectReport?: (report: CitizenReport) => void;
  onVerifyReport?: (report: CitizenReport) => void;
  onRejectReport?: (report: CitizenReport) => void;
  onLinkReport?: (report: CitizenReport) => void;
  externalReports?: CitizenReport[];
  isLoading?: boolean;
}

export const RecentCitizenReportsList: React.FC<RecentCitizenReportsListProps> = ({
  onSelectReport,
  onVerifyReport,
  onRejectReport,
  onLinkReport,
  externalReports,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [localReports, setLocalReports] = useState<CitizenReport[]>(() => ReportService.getAllReports());
  const [filter, setFilter] = useState<'all' | 'unverified' | 'verified' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // If externalReports are not provided, fetch locally
  React.useEffect(() => {
    if (externalReports !== undefined) return;
    let isMounted = true;
    ReportService.fetchReportsFromApi().then((serverReports) => {
      if (isMounted && serverReports) {
        setLocalReports(serverReports);
      }
    }).catch((err) => {
      console.warn('[RecentCitizenReportsList] Failed to fetch server reports:', err);
    });
    return () => {
      isMounted = false;
    };
  }, [externalReports]);

  const reports = externalReports !== undefined ? externalReports : localReports;

  const filtered = reports.filter((r) => {
    if (filter === 'verified' && !r.isVerified) return false;
    if (filter === 'unverified' && (r.isVerified || r.status === 'rejected')) return false;
    if (filter === 'rejected' && r.status !== 'rejected') return false;

    if (categoryFilter !== 'all') {
      const cat = (r.category || r.hazardType || '').toUpperCase();
      if (cat !== categoryFilter) return false;
    }
    return true;
  });

  const getStatusBadge = (report: CitizenReport) => {
    if (report.status === 'rejected' || report.verificationStatus === 'REJECTED') {
      return {
        cls: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
        label: 'Rejected',
        icon: <ShieldAlert className="w-3 h-3" />
      };
    }
    if (report.isVerified || report.verificationStatus === 'VERIFIED') {
      return {
        cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
        label: 'Verified Community',
        icon: <ShieldCheck className="w-3 h-3" />
      };
    }
    return {
      cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
      label: 'Unverified Citizen',
      icon: <AlertTriangle className="w-3 h-3" />
    };
  };

  const getSeverityBadge = (severity: CitizenReport['severity']) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-amber-500 text-white';
      case 'moderate':
      case 'medium':
        return 'bg-sky-500 text-white';
      case 'low':
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="bg-white dark:bg-[#0E1C2A] rounded-[24px] border border-[#DCEBED] dark:border-[#1E3347] p-5 sm:p-6 shadow-card space-y-4 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DCEBED] dark:border-[#1E3347] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18C3D0] animate-pulse" />
            <h3 className="text-sm font-bold text-[#18364A] dark:text-slate-100 font-sans">
              {t('reports.title', 'Citizen Ground-Truth Incident Queue')} ({reports.length})
            </h3>
          </div>
          <p className="text-xs text-[#708696] dark:text-slate-400 mt-0.5">
            Strict Source Taxonomy: <span className="font-semibold text-[#075B8A] dark:text-[#18C3D0]">COMMUNITY_REPORT</span> (Isolated from Official Disaster Warnings).
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#F4F8FA] dark:bg-[#07131D] p-1 rounded-full border border-[#DCEBED] dark:border-[#1E3347]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-[#075B8A] text-white shadow-sm'
                  : 'text-[#708696] dark:text-slate-400 hover:text-[#18364A]'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setFilter('unverified')}
              className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                filter === 'unverified'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-[#708696] dark:text-slate-400 hover:text-amber-500'
              }`}
            >
              Unverified ({reports.filter(r => !r.isVerified && r.status !== 'rejected').length})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                filter === 'verified'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#708696] dark:text-slate-400 hover:text-emerald-500'
              }`}
            >
              Verified ({reports.filter(r => r.isVerified).length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                filter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[#708696] dark:text-slate-400 hover:text-rose-500'
              }`}
            >
              Rejected ({reports.filter(r => r.status === 'rejected').length})
            </button>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#18C3D0]"
          >
            <option value="all">All 9 Categories</option>
            <option value="FLOOD">Flood</option>
            <option value="FIRE">Fire</option>
            <option value="ROAD_BLOCKED">Road Blocked</option>
            <option value="LANDSLIDE">Landslide</option>
            <option value="BUILDING_DAMAGE">Building Damage</option>
            <option value="WATERLOGGING">Waterlogging</option>
            <option value="POWER_FAILURE">Power Failure</option>
            <option value="MISSING_PERSON">Missing Person</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#F4F8FA] dark:bg-[#07131D] border border-[#DCEBED] dark:border-[#1E3347] transition-colors">
          <p className="text-xs font-bold text-[#18364A] dark:text-slate-200">
            {t('reports.noReports', 'No incident reports match the selected filters.')}
          </p>
          <p className="text-[11px] text-[#708696] dark:text-slate-400 mt-0.5">
            Reports submitted from citizen mobile devices or mock test runs appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((report) => {
            const badge = getStatusBadge(report);
            const hasMedia = report.media && report.media.length > 0;
            const hasVideo = report.mediaType === 'VIDEO' || report.media?.some(m => m.fileType?.includes('video') || m.url?.endsWith('.mp4'));

            return (
              <div
                key={report.id}
                className="group p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#07131D] hover:bg-[#EEF5F8] dark:hover:bg-[#132335] border border-[#DCEBED] dark:border-[#1E3347] hover:border-[#18C3D0] dark:hover:border-[#18C3D0] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Report ID, Verification Status & Severity */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DCEBED] dark:border-[#1E3347]">
                    <span className="text-[10px] font-mono font-bold text-[#075B8A] dark:text-[#18C3D0] truncate max-w-[120px]">
                      {report.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${getSeverityBadge(report.severity)}`}>
                        {report.severity}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.cls}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Hazard Title & Description */}
                  <h4 className="text-xs font-bold text-[#18364A] dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0] transition-colors line-clamp-1">
                    {report.title || report.hazardLabel || report.hazardType}
                  </h4>
                  <p className="text-xs text-[#708696] dark:text-slate-300 leading-relaxed line-clamp-2 mt-1">
                    {report.description}
                  </p>

                  {/* Linked SOS / Incident tags if present */}
                  {(report.linkedSosId || report.linkedIncidentId) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {report.linkedSosId && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-mono bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
                          <Link2 className="w-2.5 h-2.5" /> SOS: {report.linkedSosId.slice(0, 8)}...
                        </span>
                      )}
                      {report.linkedIncidentId && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-mono bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                          <Link2 className="w-2.5 h-2.5" /> INC: {report.linkedIncidentId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  )}

                  {/* Media Indicator */}
                  {hasMedia && (
                    <div className="flex items-center gap-1 text-[10px] text-[#075B8A] dark:text-[#18C3D0] font-semibold mt-2">
                      {hasVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      <span>{report.media.length} Attachment{report.media.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Location, Timestamp & Operator Action Buttons */}
                <div className="pt-2 mt-3 border-t border-[#DCEBED] dark:border-[#1E3347] space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-[#708696] dark:text-slate-400 font-mono">
                    <span className="truncate max-w-[140px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#E94B68] shrink-0" />
                      {report.location.city || report.location.district || 'Pan-India'}, {report.location.state || 'IN'}
                    </span>
                    <span>{report.timestamp}</span>
                  </div>

                  {/* Quick Action Controls */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      onClick={() => onSelectReport && onSelectReport(report)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#EFF9FF] dark:bg-[#07131D] text-[#075B8A] dark:text-[#18C3D0] hover:bg-[#DCEBED] transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Details
                    </button>

                    <div className="flex items-center gap-1">
                      {!report.isVerified && report.status !== 'rejected' && (
                        <>
                          <button
                            onClick={() => onVerifyReport && onVerifyReport(report)}
                            title="Verify Community Report"
                            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Verify
                          </button>
                          <button
                            onClick={() => onRejectReport && onRejectReport(report)}
                            title="Reject Report"
                            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onLinkReport && onLinkReport(report)}
                        title="Link to SOS / Incident"
                        className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
                      >
                        <Link2 className="w-3 h-3" /> Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
