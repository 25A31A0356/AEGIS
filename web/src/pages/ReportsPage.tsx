import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from '../context/LocationContext';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../context/AuthContext';
import { ReportService } from '../services/reportService';
import { CitizenReport, ReportHazardType, ReportMediaItem, ReportSeverity } from '../types/report';

export const ReportsPage: React.FC = () => {
  const { selectedLocation } = useLocation();
  const { user } = useAuth();
  const { dict } = useTranslation();

  const [reports, setReports] = useState<CitizenReport[]>(() => ReportService.getAllReports());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeMediaPreview, setActiveMediaPreview] = useState<string | null>(null);

  // Form State
  const [hazardType, setHazardType] = useState<ReportHazardType>('flood');
  const [district, setDistrict] = useState(selectedLocation?.name || 'Visakhapatnam');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ReportSeverity>('moderate');
  const [mediaList, setMediaList] = useState<ReportMediaItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ReportService.fetchLiveReports().then((list) => {
      if (list && list.length >= 0) {
        setReports(list);
      }
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await ReportService.uploadMediaToObjectStorage(file);
        setMediaList((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      console.warn('File upload error:', err);
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMediaItem = (id: string) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const newReport = await ReportService.submitReport({
        hazardType: hazardType,
        hazardLabel: hazardType.replace(/_/g, ' ').toUpperCase(),
        severity: severity,
        location: {
          city: district,
          district: district,
          state: selectedLocation?.stateName || 'Andhra Pradesh',
          address: address.trim() ? address : `${district} Sector`,
          lat: selectedLocation?.coordinates?.[0] || 17.6868,
          lng: selectedLocation?.coordinates?.[1] || 83.2185,
        },
        description: description,
        media: mediaList,
        reporter: {
          name: user?.name || 'Citizen Observer',
          isAnonymous: !user?.name,
        },
      });

      setSubmitSuccess(true);
      setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);

      setTimeout(() => {
        setSubmitSuccess(false);
        setIsReportModalOpen(false);
        setDescription('');
        setAddress('');
        setMediaList([]);
      }, 1200);
    } catch (err) {
      console.warn('Report submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (reportId: string, type: 'UPVOTE' | 'DOWNVOTE') => {
    await ReportService.voteReport(reportId, type);
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            upvotes: type === 'UPVOTE' ? (r.upvotes || 0) + 1 : r.upvotes,
            downvotes: type === 'DOWNVOTE' ? (r.downvotes || 0) + 1 : r.downvotes,
          };
        }
        return r;
      })
    );
  };

  const categories = [
    { id: 'all', label: 'All User Reports' },
    { id: 'flood', label: 'Flood' },
    { id: 'fire', label: 'Fire' },
    { id: 'cyclone', label: 'Cyclone' },
    { id: 'road_blocked', label: 'Road Blocked' },
    { id: 'landslide', label: 'Landslide' },
    { id: 'building_damage', label: 'Building Damage' },
    { id: 'waterlogging', label: 'Waterlogging' },
    { id: 'power_failure', label: 'Power Failure' },
    { id: 'other', label: 'Other' },
  ];

  const filteredReports = reports.filter((r) => {
    if (selectedCategory === 'all') return true;
    const cat = (r.hazardType || r.category || '').toLowerCase();
    return cat === selectedCategory || cat.includes(selectedCategory);
  });

  const getSeverityStyle = (sev: ReportSeverity) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'moderate':
      case 'medium':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'low':
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* 1. Header & Submission Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {dict.communitySignal || 'Citizen Incident Reports'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ground-truth incident reports submitted exclusively by citizens and emergency volunteers.
          </p>
        </div>

        <button
          onClick={() => {
            setDistrict(selectedLocation?.name || 'Visakhapatnam');
            setIsReportModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>{dict.reportHazardShort || 'Report Incident'}</span>
        </button>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {c.label} {c.id === 'all' && `(${reports.length})`}
          </button>
        ))}
      </div>

      {/* 3. User Reports Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {dict.recentReports || 'Recent User-Uploaded Reports'} ({filteredReports.length})
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Source: <strong className="text-emerald-600 dark:text-emerald-400">Citizen Submissions Only</strong>
          </span>
        </div>

        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-md space-y-3.5 flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-white/20"
              >
                <div className="space-y-3">
                  {/* Top Bar: Category & Severity */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                        {report.hazardLabel || report.hazardType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border ${getSeverityStyle(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {report.timestamp}
                    </span>
                  </div>

                  {/* Reporter badge */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                    <span>Uploaded by <strong className="text-slate-800 dark:text-slate-200">{report.reporter?.name || 'Citizen Observer'}</strong></span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Uploaded Media Thumbnails */}
                  {report.media && report.media.length > 0 && (
                    <div className="pt-1">
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {report.media.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            onClick={() => setActiveMediaPreview(item.url)}
                            className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 cursor-pointer hover:opacity-90 shrink-0 bg-slate-100 dark:bg-white/5 flex items-center justify-center relative group"
                          >
                            {item.fileType?.includes('video') || item.url?.endsWith('.mp4') ? (
                              <div className="flex flex-col items-center justify-center text-slate-500">
                                <span className="material-symbols-outlined text-xl">play_circle</span>
                                <span className="text-[9px] font-mono">Video</span>
                              </div>
                            ) : (
                              <img src={item.url} alt="Incident media" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-base">zoom_in</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Location, ID & Voting */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 truncate max-w-[200px]">
                    <span className="material-symbols-outlined text-xs text-red-500 shrink-0">location_on</span>
                    <span className="truncate">{report.location?.address || report.location?.city || report.location?.state}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleVote(report.id, 'UPVOTE')}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center gap-1 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
                      title="Confirm this incident"
                    >
                      <span className="material-symbols-outlined text-xs text-emerald-500">thumb_up</span>
                      <span>{report.upvotes || 0}</span>
                    </button>
                    <span className="font-mono text-[10px] text-slate-400">{report.id.slice(0, 14)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">fact_check</span>
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No Citizen Incident Reports Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This section exclusively contains on-ground reports uploaded by citizens and volunteers. No reports have been submitted for this category yet.
              </p>
            </div>
            <button
              onClick={() => {
                setDistrict(selectedLocation?.name || 'Visakhapatnam');
                setIsReportModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Submit the First Report</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Fullscreen Media Preview Modal */}
      {activeMediaPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setActiveMediaPreview(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-black" onClick={(e) => e.stopPropagation()}>
            <img src={activeMediaPreview} alt="Full Evidence" className="w-full h-full object-contain max-h-[80vh]" />
            <button
              onClick={() => setActiveMediaPreview(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Incident Submission Modal */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 font-sans space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">campaign</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {dict.sendReport || 'Upload Citizen Incident Report'}
                </h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {submitSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                Report uploaded successfully! Added to citizen report feed.
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Incident Hazard Category
                </label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value as ReportHazardType)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                >
                  <option value="flood">Flood & Inundation</option>
                  <option value="fire">Fire / Industrial Hazard</option>
                  <option value="cyclone">Cyclone & Storm Wind</option>
                  <option value="road_blocked">Road Blockage / Accident</option>
                  <option value="landslide">Landslide & Mudflow</option>
                  <option value="building_damage">Building Damage / Collapse</option>
                  <option value="waterlogging">Waterlogging & Drainage</option>
                  <option value="power_failure">Power Grid Failure</option>
                  <option value="other">Other Incident</option>
                </select>
              </div>

              {/* Severity Level */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Severity Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'moderate', 'high', 'critical'] as ReportSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-xl text-[11px] font-bold uppercase transition-all capitalize ${
                        severity === sev
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                          : 'bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  District / Locality
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none"
                  placeholder="e.g. Visakhapatnam Beach Road"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exact Landmark / Street Address (Optional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none"
                  placeholder="e.g. Near R.K. Beach Junction"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Incident Description & Field Details
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white focus:outline-none"
                  placeholder="Describe ground severity, road impassability, water depth, or assistance required..."
                />
              </div>

              {/* Media Upload */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attach Photo / Video Evidence
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-emerald-500">add_a_photo</span>
                    <span>{isUploadingMedia ? 'Uploading...' : 'Add Photos / Videos'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {mediaList.length} attachment(s)
                  </span>
                </div>

                {/* Previews of attached items */}
                {mediaList.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
                    {mediaList.map((item) => (
                      <div key={item.id} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 bg-slate-100">
                        {item.fileType?.includes('video') ? (
                          <div className="w-full h-full bg-slate-800 text-white flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">videocam</span>
                          </div>
                        ) : (
                          <img src={item.url} alt="Attached" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaItem(item.id)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submitter Info */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Reporter: <strong>{user?.name || 'Citizen Observer'}</strong></span>
                <span>GPS: <strong>Auto-tagged</strong></span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingMedia}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-bold transition-all cursor-pointer shadow-xs mt-2"
              >
                {isSubmitting ? 'Submitting Report...' : 'Submit Citizen Incident Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
