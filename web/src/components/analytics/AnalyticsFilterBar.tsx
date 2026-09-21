import React, { useState } from 'react';
import {
  MapPin,
  Flame,
  Calendar,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { AnalyticsFilterState } from '../../services/analyticsService';
import { ExportService, ExportDataPayload } from '../../services/exportService';

interface AnalyticsFilterBarProps {
  filter: AnalyticsFilterState;
  onFilterChange: (newFilter: Partial<AnalyticsFilterState>) => void;
  exportPayload: ExportDataPayload;
}

const HAZARD_OPTIONS = [
  { id: 'all', label: 'All Hazards' },
  { id: 'cyclone', label: 'Cyclone & Wind' },
  { id: 'flood', label: 'Flash Flood & Rain' },
  { id: 'earthquake', label: 'Earthquake (Seismic)' },
  { id: 'heatwave', label: 'Heatwave (Thermal)' },
  { id: 'landslide', label: 'Landslide (Slope)' },
];

const DATE_OPTIONS = [
  { id: '24h', label: 'Last 24 Hours' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'ytd', label: 'Year to Date (2026)' },
];

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filter,
  onFilterChange,
  exportPayload,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleExport = (type: 'pdf' | 'csv' | 'word') => {
    setIsExportOpen(false);
    if (type === 'csv') ExportService.exportToCSV(exportPayload);
    else if (type === 'pdf') ExportService.exportToPDF(exportPayload);
    else if (type === 'word') ExportService.exportToWord(exportPayload);
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 shadow-card mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: 3 Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* 1. Location Selector */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#708696] mb-1.5">
              Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#075B8A] absolute left-3.5 top-2.5 pointer-events-none" />
              <select
                value={filter.location}
                onChange={(e) => onFilterChange({ location: e.target.value })}
                className="w-full pl-9 pr-8 py-2 bg-[#F4F8FA] hover:bg-[#EEF5F8] border border-[#DCEBED] rounded-full text-xs font-semibold text-[#18364A] appearance-none focus:outline-none focus:border-[#18C3D0] transition-colors cursor-pointer"
              >
                <option value="all">📍 All India (National Overview)</option>
                <option value="hyderabad">Hyderabad, Telangana</option>
                <option value="mumbai">Mumbai, Maharashtra</option>
                <option value="delhi">New Delhi, Delhi NCR</option>
                <option value="bhubaneswar">Bhubaneswar, Odisha</option>
                <option value="chennai">Chennai, Tamil Nadu</option>
                <option value="kolkata">Kolkata, West Bengal</option>
                <option value="guwahati">Guwahati, Assam</option>
                <option value="kochi">Kochi, Kerala</option>
                <option value="jaipur">Jaipur, Rajasthan</option>
                <option value="bengaluru">Bengaluru, Karnataka</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#708696] absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 2. Hazard Selector */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#708696] mb-1.5">
              Hazard
            </label>
            <div className="relative">
              <Flame className="w-4 h-4 text-[#075B8A] absolute left-3.5 top-2.5 pointer-events-none" />
              <select
                value={filter.hazard}
                onChange={(e) => onFilterChange({ hazard: e.target.value })}
                className="w-full pl-9 pr-8 py-2 bg-[#F4F8FA] hover:bg-[#EEF5F8] border border-[#DCEBED] rounded-full text-xs font-semibold text-[#18364A] appearance-none focus:outline-none focus:border-[#18C3D0] transition-colors cursor-pointer"
              >
                {HAZARD_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#708696] absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 3. Date Range Selector */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#708696] mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#075B8A] absolute left-3.5 top-2.5 pointer-events-none" />
              <select
                value={filter.dateRange}
                onChange={(e) => onFilterChange({ dateRange: e.target.value })}
                className="w-full pl-9 pr-8 py-2 bg-[#F4F8FA] hover:bg-[#EEF5F8] border border-[#DCEBED] rounded-full text-xs font-semibold text-[#18364A] appearance-none focus:outline-none focus:border-[#18C3D0] transition-colors cursor-pointer"
              >
                {DATE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#708696] absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Download Analytics Button with Dropdown */}
        <div className="relative pt-2 lg:pt-5 shrink-0">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#075B8A] hover:bg-[#0B6E9E] text-white font-bold text-xs shadow-md shadow-[#075B8A]/20 transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-[#18C3D0]" />
            <span>Download Analytics</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/80" />
          </button>

          {/* Functional Export Dropdown */}
          {isExportOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-float border border-[#DCEBED] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-[#708696] border-b border-[#DCEBED] mb-1">
                Choose Export Format
              </div>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#18364A] hover:bg-[#F4F8FA] rounded-xl transition-colors text-left group"
              >
                <FileText className="w-4 h-4 text-[#E94B68] group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold">PDF Document</div>
                  <div className="text-[10px] text-[#708696]">Print-ready intelligence report</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#18364A] hover:bg-[#F4F8FA] rounded-xl transition-colors text-left group"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#45C79A] group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold">Excel (CSV)</div>
                  <div className="text-[10px] text-[#708696]">Raw tabular dataset</div>
                </div>
              </button>
              <button
                onClick={() => handleExport('word')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#18364A] hover:bg-[#F4F8FA] rounded-xl transition-colors text-left group"
              >
                <FileCode className="w-4 h-4 text-[#075B8A] group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold">Word Document</div>
                  <div className="text-[10px] text-[#708696]">Formatted editable briefing</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
