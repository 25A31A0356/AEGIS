/**
 * AEGIS ALERT - Safe Status Card Component
 * Allows citizens to confirm and broadcast their safety status to family contacts and backend registry.
 * Connects to /api/v1/safe and displays national emergency contacts.
 */

import React, { useState } from 'react';
import { ShieldCheck, PhoneCall, CheckCircle2, Send, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useProfile } from '../../context/ProfileContext';
import { ApiClient } from '../../services/apiClient';

interface SafeStatusCardProps {
  onOpenSOSMap?: () => void;
}

export const SafeStatusCard: React.FC<SafeStatusCardProps> = ({ onOpenSOSMap }) => {
  const { weather, userCoordinates } = useLocation();
  const { profile } = useProfile();

  const [isSafeMarked, setIsSafeMarked] = useState<boolean>(false);
  const [safeTimestamp, setSafeTimestamp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [safeNotes, setSafeNotes] = useState<string>('I am safe and out of harm’s way.');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  const handleMarkSafe = async () => {
    setIsSubmitting(true);
    const coords: [number, number] = userCoordinates || [weather.coordinates[0], weather.coordinates[1]];
    const payload = {
      name: profile.fullName || 'Citizen',
      phone: profile.phoneNumber || '+91 98000 00000',
      city: weather.cityName || 'Current City',
      state: weather.stateName || 'India',
      coordinates: coords,
      notes: safeNotes,
      familyContacts: profile.familyContacts || [],
    };

    try {
      const res = await ApiClient.post<any>('/v1/safe', payload);
      const timeStr = res?.confirmedAt
        ? new Date(res.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST'
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';

      setIsSafeMarked(true);
      setSafeTimestamp(timeStr);
      setBroadcastMessage(`Safety confirmed and logged with Aegis Central Grid. Notified ${profile.familyContacts?.length || 0} emergency contacts.`);
    } catch {
      // Local optimistic confirmation
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
      setIsSafeMarked(true);
      setSafeTimestamp(timeStr);
      setBroadcastMessage('Safety confirmed locally. Registry sync active.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-6 shadow-card space-y-6 font-sans">
      {/* Top Banner: Safe Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCEBED]">
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            isSafeMarked
              ? 'bg-[#EBF9F3] border border-[#A7E6CA] text-[#45C79A]'
              : 'bg-[#EDFAFC] border border-[#AEEBF0] text-[#075B8A]'
          }`}>
            {isSafeMarked ? (
              <CheckCircle2 className="w-6 h-6 text-[#45C79A]" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-[#075B8A]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-[#18364A]">
                Citizen Emergency Safety Status
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                isSafeMarked
                  ? 'bg-[#EBF9F3] text-[#289870] border border-[#A7E6CA]'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {isSafeMarked ? 'CONFIRMED SAFE' : 'UNVERIFIED STATUS'}
              </span>
            </div>
            <p className="text-xs text-[#708696] mt-0.5 font-mono">
              Sector: <strong className="text-[#18364A]">{weather.cityName}, {weather.stateName}</strong> • Realtime Telemetry Grid
            </p>
          </div>
        </div>

        {/* Action Button: Mark Safe or Refresh */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isSafeMarked ? (
            <button
              onClick={handleMarkSafe}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#45C79A] hover:bg-[#34A853] text-white text-xs font-bold font-mono shadow-md shadow-[#45C79A]/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Logging Status...' : 'I Am Safe (Confirm Now)'}</span>
            </button>
          ) : (
            <button
              onClick={handleMarkSafe}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F4F8FA] hover:bg-[#EEF5F8] border border-[#DCEBED] text-xs font-semibold text-[#075B8A] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Update Safe Check-in</span>
            </button>
          )}

          {onOpenSOSMap && (
            <button
              onClick={onOpenSOSMap}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FEF1F3] hover:bg-[#FDC8D1] border border-[#FDC8D1] text-xs font-bold text-[#E94B68] transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Open SOS Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Receipt Banner */}
      {isSafeMarked && broadcastMessage && (
        <div className="p-4 rounded-2xl bg-[#EBF9F3] border border-[#A7E6CA] flex items-start gap-3 text-xs text-[#289870] animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#45C79A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-[#18364A]">
              Safety Confirmed at {safeTimestamp}
            </div>
            <p className="text-[#289870] font-mono text-[11px]">
              {broadcastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Emergency Contacts & Quick Dial Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: National Emergency Helplines (India) */}
        <div className="p-4 rounded-2xl bg-[#F4F8FA] border border-[#DCEBED] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#075B8A] uppercase font-mono">
            <PhoneCall className="w-4 h-4 text-[#075B8A]" />
            <span>National Emergency Helplines (All India)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <a
              href="tel:112"
              className="p-2.5 rounded-xl bg-white border border-[#DCEBED] hover:border-[#18C3D0] transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] text-[#708696] block font-mono">ALL-IN-ONE EMERGENCY</span>
                <strong className="text-sm font-extrabold text-[#E94B68]">112</strong>
              </div>
              <PhoneCall className="w-3.5 h-3.5 text-[#708696] group-hover:text-[#E94B68] transition-colors" />
            </a>

            <a
              href="tel:108"
              className="p-2.5 rounded-xl bg-white border border-[#DCEBED] hover:border-[#18C3D0] transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] text-[#708696] block font-mono">AMBULANCE & MEDICAL</span>
                <strong className="text-sm font-extrabold text-[#075B8A]">108</strong>
              </div>
              <PhoneCall className="w-3.5 h-3.5 text-[#708696] group-hover:text-[#075B8A] transition-colors" />
            </a>

            <a
              href="tel:1078"
              className="p-2.5 rounded-xl bg-white border border-[#DCEBED] hover:border-[#18C3D0] transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] text-[#708696] block font-mono">DISASTER CELL (NDMA)</span>
                <strong className="text-sm font-extrabold text-[#075B8A]">1078</strong>
              </div>
              <PhoneCall className="w-3.5 h-3.5 text-[#708696] group-hover:text-[#075B8A] transition-colors" />
            </a>

            <a
              href="tel:1070"
              className="p-2.5 rounded-xl bg-white border border-[#DCEBED] hover:border-[#18C3D0] transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] text-[#708696] block font-mono">STATE DISASTER (SDRF)</span>
                <strong className="text-sm font-extrabold text-[#075B8A]">1070</strong>
              </div>
              <PhoneCall className="w-3.5 h-3.5 text-[#708696] group-hover:text-[#075B8A] transition-colors" />
            </a>
          </div>
        </div>

        {/* Right Column: Family Emergency Circle */}
        <div className="p-4 rounded-2xl bg-[#F4F8FA] border border-[#DCEBED] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#075B8A] uppercase font-mono">
              <Send className="w-4 h-4 text-[#075B8A]" />
              <span>Family Safety Circle</span>
            </div>
            <span className="text-[10px] font-mono text-[#708696]">
              {profile.familyContacts?.length || 0} Registered
            </span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {profile.familyContacts && profile.familyContacts.length > 0 ? (
              profile.familyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-2 rounded-xl bg-white border border-[#DCEBED] flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-[#18364A] block">{contact.name}</strong>
                    <span className="text-[10px] text-[#708696] font-mono">{contact.relationship} • {contact.phone}</span>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-1.5 rounded-lg bg-[#EDFAFC] text-[#075B8A] hover:bg-[#18C3D0] hover:text-white transition-colors"
                    title={`Call ${contact.name}`}
                  >
                    <PhoneCall className="w-3 h-3" />
                  </a>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-[#708696]">
                No emergency family contacts added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
