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

  // Filter Real Active SOS Beacons
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#111111] rounded-[24px] shadow-2xl border border-slate-200 dark:border-[#27272a] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#0a0a0c]">
          <Search className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hazards, 780+ Indian districts, states, SOS IDs, or shelters..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-[10px] font-mono bg-white dark:bg-[#18181b] hover:bg-slate-100 dark:hover:bg-[#27272a] text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-[#27272a]"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-5 divide-y divide-slate-100 dark:divide-[#27272a]">
          {/* District Search Results */}
          {matchedDistricts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Pan-India Districts ({matchedDistricts.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedDistricts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      selectLocationItem(item);
                      onClose();
                      onNavigate('home');
                    }}
                    className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#18181b] border border-slate-200 dark:border-[#27272a] cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:underline">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.stateName} ({item.stateId})
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#27272a] text-slate-800 dark:text-slate-200">
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Active Hazards & Advisories ({matchingHazards.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchingHazards.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      if (onSelectHazard) onSelectHazard(item.id);
                      onNavigate('maps');
                    }}
                    className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#18181b] border border-transparent hover:border-slate-300 dark:hover:border-[#3f3f46] cursor-pointer flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                          item.severity === 'critical'
                            ? 'bg-red-500 animate-pulse'
                            : item.severity === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:underline">
                          {item.title}
                        </div>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{item.location.state} • {item.location.district}</span>
                          <span>•</span>
                          <span className="bg-slate-100 dark:bg-[#18181b] text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            {item.categoryName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

          
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-[#0a0a0c] border-t border-slate-200 dark:border-[#27272a] text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <span>Navigate with ↵ or click item</span>
          <span>Pan-India Grid: 28 States • 8 UTs • 780+ Districts</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
