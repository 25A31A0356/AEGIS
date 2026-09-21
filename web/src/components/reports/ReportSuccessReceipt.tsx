import React from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Clock,
  MapPin,
  Flame,
  PlusCircle,
} from 'lucide-react';
import { CitizenReport } from '../../types/report';

interface ReportSuccessReceiptProps {
  report: CitizenReport;
  onFileAnother: () => void;
  onViewAllReports?: () => void;
}

export const ReportSuccessReceipt: React.FC<ReportSuccessReceiptProps> = ({
  report,
  onFileAnother,
  onViewAllReports,
}) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(report.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-6 sm:p-8 shadow-elevated max-w-2xl mx-auto my-4 text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Top Success Badge */}
      <div className="w-16 h-16 rounded-full bg-[#EFFCF6] border-2 border-[#B7F1DC] text-[#1E8A63] flex items-center justify-center mx-auto mb-4 shadow-sm">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-[#18364A] font-sans tracking-tight">
        Report submitted successfully.
      </h2>
      <p className="text-xs sm:text-sm text-[#708696] mt-1 max-w-md mx-auto leading-relaxed">
        Your verified hazard intelligence report has been dispatched to district emergency operations and NDMA monitoring grids.
      </p>

      {/* Receipt Card */}
      <div className="my-6 p-5 rounded-2xl bg-[#F4F8FA] border border-[#DCEBED] text-left space-y-3 font-sans">
        {/* Report ID row */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED]">
          <span className="text-[11px] font-mono font-bold uppercase text-[#708696]">
            Report ID:
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm text-[#075B8A]">
              {report.id}
            </span>
            <button
              onClick={handleCopyId}
              className="p-1 rounded-md text-[#708696] hover:text-[#075B8A] hover:bg-white transition-colors"
              title="Copy ID"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-[#45C79A]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Hazard */}
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#DCEBED]/60">
          <span className="text-[#708696] font-medium">Hazard:</span>
          <span className="font-bold text-[#18364A] flex items-center gap-1.5 capitalize">
            <Flame className="w-3.5 h-3.5 text-[#E94B68]" />
            {report.hazardLabel || report.hazardType}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start justify-between text-xs pb-2 border-b border-[#DCEBED]/60">
          <span className="text-[#708696] font-medium shrink-0 mr-2">Location:</span>
          <span className="font-semibold text-[#18364A] text-right truncate max-w-xs flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#075B8A] shrink-0" />
            {report.location.address}
          </span>
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#DCEBED]/60">
          <span className="text-[#708696] font-medium">Timestamp:</span>
          <span className="font-mono text-[#18364A]">{report.timestamp}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-[#708696] font-medium">Status:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFFBF0] text-[#B78809] border border-[#FDE8A4] font-mono font-bold uppercase text-[10px]">
            <Clock className="w-3 h-3 text-[#F4C84A] animate-pulse" />
            <span>Pending Review</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onFileAnother}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#075B8A] hover:bg-[#0B6E9E] text-white font-bold text-xs shadow-md transition-all active:scale-98"
        >
          <PlusCircle className="w-4 h-4 text-[#18C3D0]" />
          <span>File Another Report</span>
        </button>

        {onViewAllReports && (
          <button
            onClick={onViewAllReports}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#F4F8FA] hover:bg-[#EEF5F8] text-[#18364A] border border-[#DCEBED] font-semibold text-xs transition-all"
          >
            <span>View All Incident Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
