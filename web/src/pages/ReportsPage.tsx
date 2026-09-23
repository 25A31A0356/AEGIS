import React, { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../context/AuthContext';
import { ReportService } from '../services/reportService';
import { CitizenReport, ReportHazardType } from '../types/report';

export const ReportsPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const { user } = useAuth();
  const { dict } = useTranslation();

  const [reports, setReports] = useState<CitizenReport[]>(() => ReportService.getAllReports());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'flood' | 'fire' | 'cyclone' | 'road_blocked'>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form State
  const [hazardType, setHazardType] = useState<ReportHazardType>('flood');
  const [district, setDistrict] = useState(selectedLocation?.name || 'Visakhapatnam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    ReportService.fetchReportsFromApi().then((list) => {
      if (list && list.length > 0) setReports(list);
    });
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ReportService.submitReport({
        hazardType: hazardType,
        hazardLabel: hazardType.replace('_', ' ').toUpperCase(),
        severity: 'medium',
        location: {
          city: district,
          district: district,
          state: selectedLocation?.stateName || 'Andhra Pradesh',
          address: `${district} Sector`,
          lat: selectedLocation?.coordinates?.[0] || 17.68,
          lng: selectedLocation?.coordinates?.[1] || 83.21,
        },
        description: description,
        media: [],
      });
      setSubmitSuccess(true);
      const updated = await ReportService.fetchReportsFromApi();
      if (updated) setReports(updated);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsReportModalOpen(false);
        setDescription('');
      }, 1500);
    } catch (err) {
      console.warn('Report submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = selectedFilter === 'all'
    ? reports
    : reports.filter((r) => r.hazardType === selectedFilter);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {dict.communitySignal || 'Community Disaster Reports'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#a1a1aa] mt-0.5">
            Verified field intelligence from on-ground citizens, volunteers, and local authorities.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>{dict.reportHazardShort || 'Report Incident'}</button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'flood', 'fire', 'cyclone', 'road_blocked'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              selectedFilter === filter
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-[#a1a1aa] hover:bg-slate-100 dark:hover:bg-[#18181b]'
            }`}
          >
            {filter === 'all' ? 'All Incident Feeds' : filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Reports Feed */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-700 dark:text-[#a1a1aa] uppercase tracking-wider">
          {dict.recentReports || 'Recent Ground Reports'}
        </h2>

        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#27272a] shadow-xs dark:shadow-md space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        report.status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                          : report.status === 'pending_verification' || report.status === 'pending_review'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-[#18181b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#27272a]'
                      }`}
                    >
                      {report.status?.replace('_', ' ') || 'Community Report'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {report.hazardLabel || report.hazardType}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Recent</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-[#a1a1aa] leading-relaxed">
                  {report.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-[#27272a] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#71717a]">
                  <span>Location: <strong className="text-slate-800 dark:text-white">{report.location?.city || report.location?.district || 'Local Sector'}, {report.location?.state}</strong></span>
                  <span className="font-mono">ID: {report.id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-[#a1a1aa] bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#27272a]">
            No community reports registered for the selected filter.
          </div>
        )}
      </div>

      {/* Incident Submission Modal */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#27272a] p-6 font-sans space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#27272a]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-800 dark:text-slate-200 text-xl">campaign</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{dict.sendReport || 'Submit Incident Report'}</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {submitSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                Report submitted successfully and queued for verification.
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Incident Hazard Type
                </label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value as ReportHazardType)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white"
                >
                  <option value="flood">Flood & Inundation</option>
                  <option value="fire">Fire / Industrial Threat</option>
                  <option value="cyclone">Cyclone & High Wind</option>
                  <option value="building_damage">Building Damage / Collapse</option>
                  <option value="road_blocked">Road Blockage / Accident</option>
                  <option value="landslide">Landslide / Mudflow</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Location (District / Area)
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white"
                  placeholder="e.g. Visakhapatnam Beach Road"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Incident Details & Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white"
                  placeholder="Describe severity, casualties, affected roads, or stranded individuals..."
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] text-[11px] text-slate-500 dark:text-[#71717a]">
                Timestamp: <strong>Current time automatically tagged with GPS coordinates.</strong>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black font-bold transition-colors cursor-pointer shadow-xs mt-2"
              >
                {isSubmitting ? 'Submitting Report...' : 'Submit Incident to AEGIS Network'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
