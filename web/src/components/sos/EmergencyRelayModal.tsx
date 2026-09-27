import React, { useState } from 'react';
import { OfflineRelayData } from '../../services/offlineRelayService';
import { useSOS } from '../../context/SOSContext';
import { AlertTriangle, MapPin, Radio, HeartPulse, CheckCircle2, X } from 'lucide-react';

interface EmergencyRelayModalProps {
  relayData: OfflineRelayData;
  onClose: () => void;
  onPublished?: (sosId: string) => void;
}

export const EmergencyRelayModal: React.FC<EmergencyRelayModalProps> = ({
  relayData,
  onClose,
  onPublished,
}) => {
  const { createNewSOSBeacon } = useSOS();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // CRITICAL: Publish using the VICTIM'S location and details from offline SMS
      await createNewSOSBeacon({
        emergencyType: relayData.emergency_type || 'general_distress',
        emergencyTitle: `OFFLINE RELAY: ${relayData.short_message || 'Emergency Distress Signal'}`,
        personsCount: 1,
        locationName: relayData.address || `${relayData.latitude.toFixed(4)}, ${relayData.longitude.toFixed(4)}`,
        district: relayData.district || 'Distress Zone',
        state: 'India',
        coordinates: [relayData.latitude, relayData.longitude],
        medicalConditions: `Blood: ${relayData.blood_group || 'Unknown'} | Med: ${relayData.medical_notes || 'None'} | Relayed via Offline SMS by Family`,
      });

      setIsSuccess(true);
      if (onPublished) {
        onPublished(relayData.idempotency_key || 'relayed-sos');
      }
    } catch (err: any) {
      console.error('[EmergencyRelayModal] Publish error:', err);
      setErrorMsg(err?.message || 'Failed to broadcast SOS beacon to network. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-red-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow Header Background */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white tracking-wider">
                OFFLINE SMS RELAY
              </span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-ping" /> Proxy Publishing
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Publish SOS for {relayData.caller_name || 'Family Member'}
            </h2>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">SOS Broadcast Active!</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                {relayData.caller_name}&apos;s emergency distress beacon is now live on the AEGIS Responder Radar with their exact GPS coordinates. Nearby responders have been alerted.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg"
            >
              View on Live SOS Map
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-4 text-xs space-y-2">
              <p className="text-slate-200 font-medium leading-relaxed">
                <strong className="text-white font-bold">{relayData.caller_name || 'The victim'}</strong> is currently in an offline area with <strong className="text-red-400">no internet connection</strong>. Their phone dispatched this emergency relay token via cellular SMS.
              </p>
              <p className="text-slate-400 text-[11px]">
                Confirming below will publish their distress signal using <strong className="text-amber-300">their exact offline GPS location</strong> (not your current location).
              </p>
            </div>

            {/* Victim Coordinates & Details Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-slate-200">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Victim GPS Coordinates:</span>
                  <div className="font-mono text-emerald-400 text-[11px] font-bold mt-0.5">
                    {relayData.latitude.toFixed(5)}° N, {relayData.longitude.toFixed(5)}° E
                  </div>
                  {relayData.address && (
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {relayData.address}
                    </div>
                  )}
                </div>
              </div>

              {(relayData.blood_group || relayData.medical_notes) && (
                <div className="flex items-start gap-2 text-slate-200 pt-2 border-t border-white/5">
                  <HeartPulse className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Medical Info:</span>
                    <div className="text-slate-300 text-[11px] mt-0.5">
                      Blood: <strong className="text-white">{relayData.blood_group || 'O+'}</strong> {relayData.medical_notes ? `| ${relayData.medical_notes}` : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Radio className="w-4 h-4 animate-spin" />
                    <span>Publishing to Radar...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>🚨 Publish Victim&apos;s SOS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
