import React, { useState, useEffect, useRef } from 'react';
import { Search, X, AlertTriangle, MapPin, PhoneCall, Building, ChevronRight } from 'lucide-react';
import { DEMO_HAZARDS } from '../../data/demoHazards';
import { DEMO_STATES } from '../../data/demoStates';
import { DEMO_SHELTERS } from '../../data/demoShelters';
import { useLocation } from '../../context/LocationContext';
import { SOSService } from '../../services/sosService';
import { LocationService, LocationSearchResult } from '../../services/locationService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSelectHazard?: (hazardId: string) => void;
  onSelectSOS?: (sosId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectHazard,
  onSelectSOS,
}) => {
  const [query, setQuery] = useState('');
  const { setSelectedStateById, selectLocationItem } = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [matchedDistricts, setMatchedDistricts] = useState<LocationSearchResult[]>([]);

  const realBeacons = SOSService.getBeacons();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setMatchedDistricts([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setMatchedDistricts([]);
      return;
    }
    LocationService.searchLocations(query.trim()).then((res) => {
      setMatchedDistricts(res.slice(0, 6));
    });
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Filter Hazards
  const matchingHazards = q
    ? DEMO_HAZARDS.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.categoryName.toLowerCase().includes(q) ||
          h.location.state.toLowerCase().includes(q) ||
          h.location.district.toLowerCase().includes(q)
      ).slice(0, 4)
    : DEMO_HAZARDS.slice(0, 3);

  // Filter States
  const matchingStates = q
    ? DEMO_STATES.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.capital.toLowerCase().includes(q) ||
          s.id.toLowerCase() === q ||
          s.keyDistricts.some((d) => d.name.toLowerCase().includes(q))
      ).slice(0, 4)
    : DEMO_STATES.slice(0, 4);

  // Filter Real Active SOS Beacons (Zero fake beacons)
  const matchingSOS = q
    ? realBeacons.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.emergencyTitle.toLowerCase().includes(q) ||
          b.district.toLowerCase().includes(q) ||
          b.state.toLowerCase().includes(q)
      )
    : realBeacons.slice(0, 3);

  // Filter Shelters
  const matchingShelters = q
    ? DEMO_SHELTERS.filter(
        (sh) =>
          sh.name.toLowerCase().includes(q) ||
          sh.state.toLowerCase().includes(q) ||
          sh.district.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#075B8A]/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#071828] rounded-[24px] shadow-float border border-[#DCEBED] dark:border-[#1E3347] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-[#DCEBED] dark:border-[#1E3347] bg-[#F4F8FA] dark:bg-[#0B1E30]">
          <Search className="w-5 h-5 text-[#075B8A] dark:text-[#18C3D0] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hazards, 780+ Indian districts, states, SOS IDs, or shelters..."
            className="w-full bg-transparent text-xs sm:text-sm text-[#18364A] dark:text-slate-100 placeholder:text-[#708696] dark:placeholder:text-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-[#708696] hover:text-[#18364A] dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-[10px] font-mono bg-white dark:bg-[#071828] hover:bg-[#EEF5F8] dark:hover:bg-[#0B1E30] text-[#708696] dark:text-slate-400 px-2 py-1 rounded-lg border border-[#DCEBED] dark:border-[#1E3347]"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-5 divide-y divide-[#DCEBED]/60 dark:divide-[#1E3347]/60">
          {/* District Search Results across 780+ Districts */}
          {matchedDistricts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#708696] dark:text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#075B8A] dark:text-[#18C3D0]" />
                <span>Pan-India Districts ({matchedDistricts.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedDistricts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      selectLocationItem(item);
                      onClose();
                      onNavigate('homepage');
                    }}
                    className="p-3 rounded-2xl hover:bg-[#F4F8FA] dark:hover:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] hover:border-[#18C3D0] cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#18364A] dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0]">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-[#708696] dark:text-slate-400 font-mono">
                        {item.stateName} ({item.stateId})
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#EDFAFC] dark:bg-[#075B8A]/30 text-[#075B8A] dark:text-[#18C3D0]">
                      {item.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hazards Section */}
          {matchingHazards.length > 0 && (
            <div className="pt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#708696] dark:text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F4C84A]" />
                <span>Active Hazards & Advisories ({matchingHazards.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchingHazards.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      if (onSelectHazard) onSelectHazard(item.id);
                      onNavigate('hazards');
                    }}
                    className="p-3 rounded-2xl hover:bg-[#F4F8FA] dark:hover:bg-[#0B1E30] border border-transparent hover:border-[#18C3D0] cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                          item.severity === 'critical'
                            ? 'bg-[#E94B68] animate-pulse'
                            : item.severity === 'warning'
                            ? 'bg-[#F4C84A]'
                            : 'bg-[#18C3D0]'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold text-[#18364A] dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0] transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[10.5px] text-[#708696] dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{item.location.state} • {item.location.district}</span>
                          <span>•</span>
                          <span className="bg-[#EDFAFC] dark:bg-[#075B8A]/30 text-[#075B8A] dark:text-[#18C3D0] px-1.5 py-0.5 rounded text-[9px] font-bold">
                            {item.categoryName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#708696] dark:text-slate-400 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0] transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* States & Urban Centers Section */}
          {matchingStates.length > 0 && (
            <div className="pt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#708696] dark:text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#075B8A] dark:text-[#18C3D0]" />
                <span>States & Monitored Regions ({matchingStates.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingStates.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setSelectedStateById(st.id);
                      onClose();
                      onNavigate('homepage');
                    }}
                    className="p-3 rounded-2xl hover:bg-[#F4F8FA] dark:hover:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] hover:border-[#18C3D0] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#18364A] dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0]">
                        {st.name} ({st.id})
                      </div>
                      <div className="text-[10px] text-[#708696] dark:text-slate-400 font-mono">
                        Capital: {st.capital} • {st.populationCrores} Cr Pop
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                        st.riskLevel === 'critical'
                          ? 'bg-[#FEF1F3] dark:bg-red-950/40 text-[#E94B68] border-[#FDC8D1] dark:border-red-800'
                          : st.riskLevel === 'warning'
                          ? 'bg-[#FFFBF0] dark:bg-amber-950/40 text-[#B78809] dark:text-amber-400 border-[#FDE8A4] dark:border-amber-800'
                          : 'bg-[#EFFCF6] dark:bg-emerald-950/40 text-[#1E8A63] dark:text-emerald-400 border-[#B7F1DC] dark:border-emerald-800'
                      }`}
                    >
                      {st.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real SOS Distress Beacons (0 Fake Beacons) */}
          {matchingSOS.length > 0 && (
            <div className="pt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#708696] dark:text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#E94B68]" />
                <span>Live Emergency SOS Beacons ({matchingSOS.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchingSOS.map((sos) => (
                  <div
                    key={sos.id}
                    onClick={() => {
                      if (onSelectSOS) onSelectSOS(sos.id);
                      onClose();
                      onNavigate('sos');
                    }}
                    className="p-3 rounded-2xl hover:bg-[#FEF1F3]/40 dark:hover:bg-red-950/20 border border-[#DCEBED] dark:border-[#1E3347] hover:border-[#E94B68] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#18364A] dark:text-slate-100 flex items-center gap-2">
                        <span className="font-mono text-[#E94B68] bg-[#FEF1F3] dark:bg-red-950/40 border border-[#FDC8D1] dark:border-red-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          {sos.id}
                        </span>
                        <span>{sos.emergencyTitle}</span>
                      </div>
                      <div className="text-[10.5px] text-[#708696] dark:text-slate-400 mt-0.5 font-mono">
                        {sos.locationName} • Triage: {sos.triageStatus.toUpperCase()}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#708696] dark:text-slate-400 group-hover:text-[#E94B68]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shelters */}
          {matchingShelters.length > 0 && (
            <div className="pt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#708696] dark:text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#075B8A] dark:text-[#18C3D0]" />
                <span>Evacuation Shelters & Relief Camps</span>
              </div>
              <div className="space-y-1.5">
                {matchingShelters.map((sh) => (
                  <div
                    key={sh.id}
                    onClick={() => {
                      onClose();
                      onNavigate('live-map');
                    }}
                    className="p-3 rounded-2xl hover:bg-[#F4F8FA] dark:hover:bg-[#0B1E30] border border-[#DCEBED] dark:border-[#1E3347] cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#18364A] dark:text-slate-100">{sh.name}</div>
                      <div className="text-[10px] text-[#708696] dark:text-slate-400 font-mono">
                        {sh.district}, {sh.state} • Cap: {sh.capacityPersons}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-[#EDFAFC] dark:bg-[#075B8A]/30 text-[#075B8A] dark:text-[#18C3D0] border border-[#AEEBF0] dark:border-[#1E3347] px-2 py-0.5 rounded-full font-bold">
                      {sh.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#F4F8FA] dark:bg-[#0B1E30] border-t border-[#DCEBED] dark:border-[#1E3347] text-[10px] text-[#708696] dark:text-slate-400 flex items-center justify-between font-mono">
          <span>Navigate with ↵ or click item</span>
          <span>Pan-India Grid: 28 States • 8 UTs • 780+ Districts • Google Maps GIS</span>
        </div>
      </div>
    </div>
  );
};
