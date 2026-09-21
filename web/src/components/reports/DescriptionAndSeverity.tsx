import React from 'react';
import { Check } from 'lucide-react';
import { ReportSeverity } from '../../types/report';

interface DescriptionAndSeverityProps {
  description: string;
  onChangeDescription: (desc: string) => void;
  severity: ReportSeverity;
  onChangeSeverity: (sev: ReportSeverity) => void;
  peopleAffected: string;
  onChangePeopleAffected: (val: string) => void;
  isRoadBlocked: boolean | 'partial';
  onChangeRoadBlocked: (val: boolean | 'partial') => void;
  isImmediateDanger: boolean;
  onChangeImmediateDanger: (val: boolean) => void;
  reporterName: string;
  onChangeReporterName: (name: string) => void;
  isAnonymous: boolean;
  onChangeIsAnonymous: (anon: boolean) => void;
}

const SEVERITIES: Array<{
  id: ReportSeverity;
  label: string;
  desc: string;
  badgeClass: string;
  activeClass: string;
}> = [
  {
    id: 'low',
    label: 'Low',
    desc: 'Minor nuisance, no immediate threat to life or property',
    badgeClass: 'bg-[#EFFCF6] text-[#1E8A63] border-[#B7F1DC]',
    activeClass: 'border-[#45C79A] ring-2 ring-[#45C79A]/20 bg-[#EFFCF6]/30',
  },
  {
    id: 'medium',
    label: 'Medium',
    desc: 'Traffic disrupted, property risk, localized damage',
    badgeClass: 'bg-[#FFFBF0] text-[#B78809] border-[#FDE8A4]',
    activeClass: 'border-[#F4C84A] ring-2 ring-[#F4C84A]/20 bg-[#FFFBF0]/30',
  },
  {
    id: 'high',
    label: 'High',
    desc: 'Rapidly escalating threat, evacuations needed, severe damage',
    badgeClass: 'bg-[#FEF1F3] text-[#E94B68] border-[#FDC8D1]',
    activeClass: 'border-[#E94B68] ring-2 ring-[#E94B68]/20 bg-[#FEF1F3]/30',
  },
  {
    id: 'critical',
    label: 'Critical',
    desc: 'Life-threatening emergency, trapped citizens, immediate rescue',
    badgeClass: 'bg-[#E94B68] text-white border-transparent',
    activeClass: 'border-[#E94B68] ring-4 ring-[#E94B68]/30 bg-[#FEF1F3]',
  },
];

export const DescriptionAndSeverity: React.FC<DescriptionAndSeverityProps> = ({
  description,
  onChangeDescription,
  severity,
  onChangeSeverity,
  peopleAffected,
  onChangePeopleAffected,
  isRoadBlocked,
  onChangeRoadBlocked,
  isImmediateDanger,
  onChangeImmediateDanger,
  reporterName,
  onChangeReporterName,
  isAnonymous,
  onChangeIsAnonymous,
}) => {
  return (
    <div className="space-y-6 mb-6">
      {/* 1. Large Description Box */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card">
        <div className="pb-3 mb-4 border-b border-[#DCEBED]">
          <h3 className="text-base sm:text-lg font-bold text-[#18364A] font-sans">
            Step 4: Describe what you observed
          </h3>
          <p className="text-xs text-[#708696] mt-0.5">
            Provide specific observations such as water depth, trapped vehicles, electrical sparks, or road conditions.
          </p>
        </div>

        <textarea
          rows={4}
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Describe what you observed in detail (e.g., 3 feet of water at junction, tree fallen over electricity pole, traffic completely halted, 5-6 families stranded)..."
          className="w-full p-4 bg-[#F4F8FA] border border-[#DCEBED] rounded-2xl text-xs sm:text-sm text-[#18364A] placeholder:text-[#708696] focus:outline-none focus:border-[#18C3D0] focus:bg-white transition-all leading-relaxed"
        />
        <div className="flex justify-between items-center text-[11px] text-[#708696] mt-1.5 font-mono">
          <span>Minimum 10 characters required</span>
          <span>{description.length} characters</span>
        </div>
      </div>

      {/* 2. Severity Classification */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card">
        <div className="pb-3 mb-4 border-b border-[#DCEBED]">
          <h3 className="text-base sm:text-lg font-bold text-[#18364A] font-sans">
            Step 5: How severe is the incident?
          </h3>
          <p className="text-xs text-[#708696] mt-0.5">
            Accurate severity classification helps emergency teams prioritize resource dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SEVERITIES.map((s) => {
            const isSelected = severity === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeSeverity(s.id)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${s.activeClass} shadow-md`
                    : 'bg-[#F4F8FA] hover:bg-[#EEF5F8] border-[#DCEBED]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${s.badgeClass}`}
                  >
                    {s.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#075B8A]" />}
                </div>
                <p className="text-[11px] text-[#708696] leading-snug">
                  {s.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Optional Impact Context & Submitter Details */}
      <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card space-y-4">
        <div className="pb-2 border-b border-[#DCEBED]">
          <h3 className="text-sm font-bold text-[#18364A] font-sans">
            Optional Details & Context
          </h3>
          <p className="text-[11px] text-[#708696] mt-0.5">
            Help first responders assess immediate danger and logistical access.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* People Affected Estimate */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-[#708696] uppercase mb-1.5">
              People Affected
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['1-5', '5-20', '20-50', '50+'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChangePeopleAffected(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    peopleAffected === opt
                      ? 'bg-[#075B8A] text-white border-[#075B8A]'
                      : 'bg-[#F4F8FA] text-[#18364A] border-[#DCEBED] hover:bg-[#EEF5F8]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Road Blockage */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-[#708696] uppercase mb-1.5">
              Road Blocked?
            </label>
            <div className="flex gap-1.5">
              {[
                { val: true, label: 'Yes (Blocked)' },
                { val: 'partial' as const, label: 'Partial' },
                { val: false, label: 'No' },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => onChangeRoadBlocked(opt.val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    isRoadBlocked === opt.val
                      ? 'bg-[#075B8A] text-white border-[#075B8A]'
                      : 'bg-[#F4F8FA] text-[#18364A] border-[#DCEBED] hover:bg-[#EEF5F8]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Immediate Danger Toggle */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-[#708696] uppercase mb-1.5">
              Immediate Danger?
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onChangeImmediateDanger(true)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  isImmediateDanger
                    ? 'bg-[#E94B68] text-white border-[#E94B68] shadow-xs'
                    : 'bg-[#F4F8FA] text-[#18364A] border-[#DCEBED]'
                }`}
              >
                ⚠️ Yes, High Danger
              </button>
              <button
                type="button"
                onClick={() => onChangeImmediateDanger(false)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  !isImmediateDanger
                    ? 'bg-[#45C79A] text-white border-[#45C79A]'
                    : 'bg-[#F4F8FA] text-[#18364A] border-[#DCEBED]'
                }`}
              >
                No, Controlled
              </button>
            </div>
          </div>
        </div>

        {/* Submitter Name / Anonymous Toggle */}
        <div className="pt-3 border-t border-[#DCEBED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="anon-check"
              checked={isAnonymous}
              onChange={(e) => onChangeIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-[#075B8A] focus:ring-[#18C3D0]"
            />
            <label htmlFor="anon-check" className="text-xs text-[#18364A] font-medium cursor-pointer">
              Submit report anonymously (do not publish my name)
            </label>
          </div>

          {!isAnonymous && (
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={reporterName}
                onChange={(e) => onChangeReporterName(e.target.value)}
                placeholder="Your Full Name (optional)"
                className="w-full px-3 py-1.5 bg-[#F4F8FA] border border-[#DCEBED] rounded-full text-xs text-[#18364A] placeholder:text-[#708696] focus:outline-none focus:border-[#18C3D0]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
