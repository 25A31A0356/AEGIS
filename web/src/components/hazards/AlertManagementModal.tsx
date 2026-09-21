import React, { useState } from 'react';
import { ApiClient } from '../../services/apiClient';
import { Shield, AlertTriangle, CheckCircle2, Clock, X, Radio } from 'lucide-react';

interface AlertManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertCreated: () => void;
}

export const AlertManagementModal: React.FC<AlertManagementModalProps> = ({
  isOpen,
  onClose,
  onAlertCreated,
}) => {
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [hazardType, setHazardType] = useState('floods');
  const [severity, setSeverity] = useState('HIGH');
  const [latitude, setLatitude] = useState('19.0760');
  const [longitude, setLongitude] = useState('72.8777');
  const [radiusKm, setRadiusKm] = useState('50');
  const [district, setDistrict] = useState('Mumbai Suburban');
  const [stateName, setStateName] = useState('Maharashtra');
  const [durationHours, setDurationHours] = useState('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !description.trim()) {
      setErrorMsg('Headline and description are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        headline: headline.trim(),
        description: description.trim(),
        hazard_type: hazardType,
        severity: severity.toUpperCase(),
        latitude: parseFloat(latitude) || 19.0760,
        longitude: parseFloat(longitude) || 72.8777,
        radius_km: parseFloat(radiusKm) || 50,
        district: district.trim(),
        state: stateName.trim(),
        duration_hours: parseInt(durationHours, 10) || 24,
      };

      await ApiClient.post<any>('/alerts', payload);
      onAlertCreated();
      onClose();
    } catch (err: any) {
      console.error('[AlertManagementModal] Alert creation error:', err);
      setErrorMsg(err.message || 'Failed to publish official alert. Verify official role credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0E1C2A] rounded-3xl p-6 shadow-2xl border border-[#DCEBED] dark:border-[#1E3347] font-sans space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCEBED] dark:border-[#1E3347]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#18364A] dark:text-slate-100">
                Authorize Official Disaster Advisory
              </h3>
              <p className="text-xs text-[#708696] dark:text-slate-400">
                Authoritative Civil Defense Alert Dispatch Gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
              Alert Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Flash Flood Emergency Evacuation Notice"
              className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2 font-bold"
              required
            />
          </div>

          <div>
            <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
              Official Directive & Public Guidance
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed instructions for civilian safety, evacuation corridors, and shelter points..."
              className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl p-3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                Hazard Taxonomy
              </label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2"
              >
                <option value="floods">Flooding & Inundation</option>
                <option value="cyclones">Tropical Cyclone</option>
                <option value="earthquakes">Earthquake Seismic Event</option>
                <option value="landslides">Landslide / Mudflow</option>
                <option value="wildfires">Wildfire / Forest Fire</option>
                <option value="lightning">Severe Lightning Storm</option>
                <option value="building_collapse">Structural Collapse</option>
                <option value="chemical">Industrial Chemical Hazard</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2 font-bold"
              >
                <option value="CRITICAL">CRITICAL (Red Alert / Evacuation)</option>
                <option value="HIGH">HIGH (Orange Alert / Preparedness)</option>
                <option value="MODERATE">MODERATE (Yellow Alert / Advisory)</option>
                <option value="LOW">LOW (Green / Informational)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">Radius (km)</label>
              <input
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="font-bold text-[#18364A] dark:text-slate-200 block mb-1">State</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full bg-[#F4F8FA] dark:bg-[#07131D] text-[#18364A] dark:text-slate-200 border border-[#DCEBED] dark:border-[#1E3347] rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#DCEBED] dark:border-[#1E3347] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#708696] hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{isSubmitting ? 'Publishing Alert...' : 'Publish Official Advisory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
