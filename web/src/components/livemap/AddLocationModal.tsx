import React, { useState } from 'react';
import {
  X,
  MapPin,
  Plus,
  Search,
  Home,
  Briefcase,
  Users,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { SavedLocationItem } from '../../services/locationService';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLocation: (location: Omit<SavedLocationItem, 'id'>) => void;
}

const PRESET_CITIES = [
  { name: 'Mumbai (South)', stateName: 'Maharashtra', district: 'Mumbai City', coords: [18.9220, 72.8347] as [number, number], riskScore: 74, riskLevel: 'High' as const },
  { name: 'New Delhi (Central)', stateName: 'Delhi', district: 'New Delhi', coords: [28.6139, 77.2090] as [number, number], riskScore: 58, riskLevel: 'Medium' as const },
  { name: 'Bengaluru (Urban)', stateName: 'Karnataka', district: 'Bengaluru Urban', coords: [12.9716, 77.5946] as [number, number], riskScore: 42, riskLevel: 'Medium' as const },
  { name: 'Chennai (Coastal)', stateName: 'Tamil Nadu', district: 'Chennai', coords: [13.0827, 80.2707] as [number, number], riskScore: 82, riskLevel: 'High' as const },
  { name: 'Kolkata (Hooghly Basin)', stateName: 'West Bengal', district: 'Kolkata', coords: [22.5726, 88.3639] as [number, number], riskScore: 68, riskLevel: 'High' as const },
  { name: 'Guwahati (Brahmaputra)', stateName: 'Assam', district: 'Kamrup Metropolitan', coords: [26.1445, 91.7362] as [number, number], riskScore: 91, riskLevel: 'Critical' as const },
  { name: 'Kochi (Kerala Coast)', stateName: 'Kerala', district: 'Ernakulam', coords: [9.9312, 76.2673] as [number, number], riskScore: 48, riskLevel: 'Medium' as const },
  { name: 'Puri (Odisha Coast)', stateName: 'Odisha', district: 'Puri', coords: [19.8135, 85.8312] as [number, number], riskScore: 94, riskLevel: 'Critical' as const },
];

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onAddLocation,
}) => {
  const [customName, setCustomName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'home' | 'work' | 'family' | 'other'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<(typeof PRESET_CITIES)[0] | null>(null);

  if (!isOpen) return null;

  const filteredPresets = PRESET_CITIES.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.stateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset) return;

    onAddLocation({
      name: customName.trim() || selectedPreset.name,
      category: selectedCategory,
      coordinates: selectedPreset.coords,
      stateName: selectedPreset.stateName,
      district: selectedPreset.district,
      riskScore: selectedPreset.riskScore,
      riskLevel: selectedPreset.riskLevel,
      weatherSnippet: '29°C • Live Telemetry Active',
    });

    setCustomName('');
    setSelectedPreset(null);
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#075B8A]/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-[24px] shadow-float border border-[#DCEBED] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#075B8A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18C3D0] text-[#075B8A] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide text-white">
                Add Saved Location
              </h3>
              <p className="text-[11px] text-[#A7D7E8]">
                Save places for 1-click map centering and alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-sans text-xs">
          {/* Category Selector */}
          <div>
            <label className="block font-bold text-[#18364A] text-xs mb-1.5 uppercase font-mono tracking-wider">
              Location Type:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'home' as const, label: 'Home', icon: Home },
                { id: 'work' as const, label: 'Work', icon: Briefcase },
                { id: 'family' as const, label: 'Family', icon: Users },
                { id: 'other' as const, label: 'Other', icon: Bookmark },
              ].map((c) => {
                const Icon = c.icon;
                const isSel = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#18C3D0] border-[#18C3D0] text-[#075B8A] font-bold shadow-xs'
                        : 'bg-[#F4F8FA] border-[#DCEBED] text-[#708696] hover:bg-[#EDFAFC]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px]">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Label (Optional) */}
          <div>
            <label className="block font-bold text-[#18364A] text-xs mb-1 uppercase font-mono tracking-wider">
              Custom Name (Optional):
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. My Apartment, Bandra Office, Grandma's House"
              className="w-full bg-[#F4F8FA] border border-[#DCEBED] rounded-xl px-3.5 py-2 text-xs text-[#18364A] focus:outline-none focus:border-[#18C3D0] focus:ring-1 focus:ring-[#18C3D0]"
            />
          </div>

          {/* Preset City Search */}
          <div>
            <label className="block font-bold text-[#18364A] text-xs mb-1 uppercase font-mono tracking-wider">
              Select City / Region:
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-[#708696] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Indian cities or states..."
                className="w-full bg-[#F4F8FA] border border-[#DCEBED] rounded-xl pl-8 pr-3 py-2 text-xs text-[#18364A] focus:outline-none focus:border-[#18C3D0]"
              />
            </div>

            {/* List */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPreset?.name === preset.name;
                return (
                  <div
                    key={preset.name}
                    onClick={() => setSelectedPreset(preset)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EDFAFC] border-[#18C3D0] text-[#075B8A]'
                        : 'bg-[#F4F8FA] border-[#DCEBED] hover:bg-[#EEF5F8] text-[#18364A]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{preset.name}</div>
                      <div className="text-[10px] text-[#708696]">{preset.stateName}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          preset.riskLevel === 'Critical'
                            ? 'bg-[#E94B68]/15 text-[#E94B68]'
                            : preset.riskLevel === 'High'
                            ? 'bg-[#F4C84A]/30 text-[#946800]'
                            : 'bg-[#45C79A]/20 text-[#0B6E4F]'
                        }`}
                      >
                        {preset.riskLevel}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#18C3D0]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#DCEBED]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#708696] hover:bg-[#F4F8FA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedPreset}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#075B8A] hover:bg-[#0B6E9E] disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Location</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
