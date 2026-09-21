import { useState, useEffect, useCallback, useRef } from "react";
import {
  SosIncident,
  NearbySosOffer,
  CreateSosPayload,
  SosEmergencyCategory,
  SosLifecycleDisplayState,
} from "@/lib/services/aegis-types";
import { AegisApiService } from "@/lib/services/aegis-api";
import { AegisRealtime } from "@/lib/services/aegis-realtime";
import { useAppPreferences } from "@/lib/app-preferences";
import { useEmergencyProfile } from "@/lib/emergency-profile";
import { getResponsibleLocation } from "@/lib/services/aegis-location";
import { getLocalSosIncident } from "@/lib/services/aegis-cache";

export function useAegisSosResponder() {
  const { isNearbyResponderEnabled } = useAppPreferences();
  const { profile } = useEmergencyProfile();

  const [activeIncident, setActiveIncident] = useState<SosIncident | null>(null);
  const [assignedIncident, setAssignedIncident] = useState<SosIncident | null>(null);
  const [incomingOffers, setIncomingOffers] = useState<NearbySosOffer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const myResponderIdRef = useRef<string>(`resp-${profile.fullName?.replace(/\s+/g, "_") || "volunteer"}`);
  const locationPollTimerRef = useRef<any>(null);

  // Restore active SOS from persistent local cache on mount
  useEffect(() => {
    async function restoreLocal() {
      try {
        const local = await getLocalSosIncident();
        if (local && local.status !== "RESOLVED" && local.status !== "CANCELLED") {
          setActiveIncident(local);
        }
      } catch (e) {
        console.warn("[useAegisSosResponder] Error restoring local SOS:", e);
      }
    }
    void restoreLocal();
  }, []);

  // 1. Fetch Incoming Offers for Candidate Responders
  const refreshOffers = useCallback(async () => {
    if (!isNearbyResponderEnabled) {
      setIncomingOffers([]);
      return;
    }
    try {
      const loc = await getResponsibleLocation();
      const offers = await AegisApiService.getNearbySosOffers(
        myResponderIdRef.current,
        loc.latitude,
        loc.longitude
      );
      // Filter out if currently the requester of that incident
      const filtered = offers.filter(
        (o) => !activeIncident || o.sosId !== activeIncident.id
      );
      setIncomingOffers(filtered);
    } catch (e) {
      console.warn("[useAegisSosResponder] refreshOffers error:", e);
    }
  }, [isNearbyResponderEnabled, activeIncident]);

  // Initial and periodic offer polling
  useEffect(() => {
    if (isNearbyResponderEnabled) {
      void refreshOffers();
      const interval = setInterval(refreshOffers, 12000);
      return () => clearInterval(interval);
    } else {
      setIncomingOffers([]);
    }
  }, [isNearbyResponderEnabled, refreshOffers]);

  // 2. Real-Time SSE Listener for SOS Events
  useEffect(() => {
    const unsubscribe = AegisRealtime.onEvent((event) => {
      if (!event.type.startsWith("sos.")) return;

      const data = event.data;
      if (!data) return;

      switch (event.type) {
        case "sos.created": {
          const inc = data as SosIncident;
          // If we created it, update active incident
          if (activeIncident && activeIncident.id === inc.id) {
            setActiveIncident(inc);
          } else if (isNearbyResponderEnabled) {
            // Check if eligible nearby offer
            void refreshOffers();
          }
          break;
        }

        case "sos.offered":
        case "sos.updated": {
          if (activeIncident && data.sosId === activeIncident.id) {
            setActiveIncident((prev) => (prev ? { ...prev, ...data } : null));
          }
          if (isNearbyResponderEnabled) {
            void refreshOffers();
          }
          break;
        }

        case "sos.accepted": {
          const { sosId, assignedResponder, route, status } = data;
          if (activeIncident && activeIncident.id === sosId) {
            setActiveIncident((prev) =>
              prev
                ? {
                    ...prev,
                    assignedResponder,
                    route,
                    status: status || "RESPONDER_EN_ROUTE",
                    updatedAt: new Date().toISOString(),
                  }
                : null
            );
          }
          if (assignedIncident && assignedIncident.id === sosId) {
            setAssignedIncident((prev) =>
              prev
                ? {
                    ...prev,
                    assignedResponder,
                    route,
                    status: status || "RESPONDER_EN_ROUTE",
                  }
                : null
            );
          }
          // Remove from candidate offers if claimed
          setIncomingOffers((prev) => prev.filter((o) => o.sosId !== sosId));
          break;
        }

        case "sos.location_updated": {
          const { sosId, role, coords, distanceKm, etaMinutes, status } = data;
          if (activeIncident && activeIncident.id === sosId) {
            setActiveIncident((prev) => {
              if (!prev) return null;
              if (role === "responder" && prev.assignedResponder) {
                return {
                  ...prev,
                  status: status || prev.status,
                  assignedResponder: {
                    ...prev.assignedResponder,
                    location: { ...prev.assignedResponder.location, ...coords },
                    distanceKm: distanceKm ?? prev.assignedResponder.distanceKm,
                    etaMinutes: etaMinutes ?? prev.assignedResponder.etaMinutes,
                  },
                };
              }
              return prev;
            });
          }
          if (assignedIncident && assignedIncident.id === sosId) {
            setAssignedIncident((prev) => {
              if (!prev) return null;
              if (role === "requester") {
                return {
                  ...prev,
                  location: { ...prev.location, ...coords },
                  status: status || prev.status,
                };
              }
              return prev;
            });
          }
          break;
        }

        case "sos.on_site": {
          const { sosId } = data;
          if (activeIncident && activeIncident.id === sosId) {
            setActiveIncident((prev) => (prev ? { ...prev, status: "ON_SITE" } : null));
          }
          if (assignedIncident && assignedIncident.id === sosId) {
            setAssignedIncident((prev) => (prev ? { ...prev, status: "ON_SITE" } : null));
          }
          break;
        }

        case "sos.resolved":
        case "sos.cancelled":
        case "sos.expired": {
          const { sosId } = data;
          if (activeIncident && activeIncident.id === sosId) {
            setActiveIncident(null);
          }
          if (assignedIncident && assignedIncident.id === sosId) {
            setAssignedIncident(null);
          }
          setIncomingOffers((prev) => prev.filter((o) => o.sosId !== sosId));
          break;
        }
      }
    });

    return () => unsubscribe();
  }, [activeIncident, assignedIncident, isNearbyResponderEnabled, refreshOffers]);

  // 3. Periodic Live Location Broadcast when SOS is Active or Assigned
  useEffect(() => {
    if (!activeIncident && !assignedIncident) {
      if (locationPollTimerRef.current) clearInterval(locationPollTimerRef.current);
      return;
    }

    locationPollTimerRef.current = setInterval(async () => {
      try {
        const loc = await getResponsibleLocation();
        if (activeIncident) {
          void AegisApiService.updateSosLocation(activeIncident.id, "requester", {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            address: loc.label,
          });
        } else if (assignedIncident) {
          void AegisApiService.updateSosLocation(assignedIncident.id, "responder", {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            address: loc.label,
          });
        }
      } catch {}
    }, 15000);

    return () => {
      if (locationPollTimerRef.current) clearInterval(locationPollTimerRef.current);
    };
  }, [activeIncident, assignedIncident]);

  // 4. Trigger Outgoing SOS
  const triggerSos = async (options?: {
    category?: SosEmergencyCategory;
    note?: string;
    familyContacts?: { name: string; phone: string; relationship?: string }[];
  }) => {
    setIsSubmitting(true);
    try {
      const loc = await getResponsibleLocation();
      const payload: CreateSosPayload = {
        category: options?.category || "general",
        note: options?.note || `${profile.fullName || "User"} requires immediate emergency assistance.`,
        peopleCount: profile.peopleCount || 1,
        bloodGroup: profile.bloodGroup,
        medicalNotes: profile.medicalNotes,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        address: loc.label,
        area: loc.label ? loc.label.split(",")[0] : "Live Sector",
        familyContacts: options?.familyContacts,
        searchRadiusKm: 10,
        requesterName: profile.fullName || "Aegis User",
      };

      const res = await AegisApiService.createSosIncident(payload);
      if (res.incident) {
        setActiveIncident(res.incident);
      }
      return res;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Accept Incoming Nearby SOS Offer
  const acceptOffer = async (offer: NearbySosOffer) => {
    setIsAccepting(true);
    setAcceptError(null);
    try {
      const loc = await getResponsibleLocation();
      const res = await AegisApiService.acceptSosIncident(offer.sosId, {
        id: myResponderIdRef.current,
        name: profile.fullName || "Community Responder",
        phone: profile.phoneNumber,
        badge: "Verified Community Responder",
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        address: loc.label,
      });

      if (!res.success) {
        const errMsg = res.alreadyAccepted
          ? "This SOS has already been accepted."
          : res.error || "Failed to accept SOS.";
        setAcceptError(errMsg);
        // Remove from offers list
        setIncomingOffers((prev) => prev.filter((o) => o.sosId !== offer.sosId));
        return { success: false, error: errMsg };
      }

      if (res.incident) {
        setAssignedIncident({
          ...res.incident,
          location: res.authorizedLocation || res.incident.location,
          route: res.route,
        });
      }

      // Remove accepted offer from prospective list
      setIncomingOffers((prev) => prev.filter((o) => o.sosId !== offer.sosId));
      return { success: true, incident: res.incident, route: res.route };
    } finally {
      setIsAccepting(false);
    }
  };

  // 6. Decline Nearby Offer
  const declineOffer = async (offer: NearbySosOffer) => {
    setIncomingOffers((prev) => prev.filter((o) => o.sosId !== offer.sosId));
    await AegisApiService.declineSosIncident(offer.sosId, myResponderIdRef.current);
  };

  // 7. Cancel Active SOS
  const cancelActiveSos = async (reason?: string) => {
    if (!activeIncident) return;
    const sosId = activeIncident.id;
    setActiveIncident(null);
    await AegisApiService.updateSosStatus(sosId, "CANCELLED", reason || "Cancelled by requester");
  };

  // 8. Resolve SOS (Mark Safe / Completed)
  const resolveActiveSos = async () => {
    const targetId = activeIncident?.id || assignedIncident?.id;
    if (!targetId) return;
    setActiveIncident(null);
    setAssignedIncident(null);
    await AegisApiService.updateSosStatus(targetId, "RESOLVED");
  };

  // 9. Derive accurate 7-stage SOS Lifecycle Display State
  let lifecycleDisplayState: SosLifecycleDisplayState | undefined = undefined;
  if (activeIncident) {
    if (activeIncident.status === "RESOLVED") {
      lifecycleDisplayState = "RESOLVED";
    } else if (isSyncing) {
      lifecycleDisplayState = "SYNCING";
    } else if (activeIncident.isPending) {
      lifecycleDisplayState = "OFFLINE — SYNC PENDING";
    } else if (
      activeIncident.assignedResponder &&
      (activeIncident.status === "RESPONDER_EN_ROUTE" || activeIncident.status === "ON_SITE")
    ) {
      lifecycleDisplayState = "RESPONDER ACKNOWLEDGED";
    } else if (
      activeIncident.familyAlert &&
      (activeIncident.familyAlert.status === "DELIVERED" || activeIncident.familyAlert.notifiedCount > 0)
    ) {
      lifecycleDisplayState = "CONTACTS NOTIFIED";
    } else if (activeIncident.status === "MATCHING") {
      lifecycleDisplayState = "SERVER RECEIVED";
    } else {
      lifecycleDisplayState = "SOS ACTIVE";
    }
  }

  // 10. Sync Pending Offline Actions
  const syncPendingQueue = async () => {
    setIsSyncing(true);
    try {
      const res = await AegisApiService.syncOfflineQueue();
      if (activeIncident?.isPending) {
        const updated = await AegisApiService.getSosIncident(activeIncident.id);
        if (updated) {
          setActiveIncident(updated);
        }
      }
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  // 11. Submit Safe Check-in (Preserving active SOS incident logs)
  const submitSafeCheckIn = async (message?: string, shelterId?: string, shelterName?: string) => {
    const loc = await getResponsibleLocation();
    const res = await AegisApiService.submitSafeCheckIn({
      userId: profile.fullName || "usr-me",
      userName: profile.fullName || "Aegis User",
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      address: loc.label,
      state: loc.state,
      district: loc.district,
      message: message || profile.customSafeMessage || "I am currently safe and secure.",
      shelterId,
      shelterName,
      familyContacts: profile.familyContacts?.map((f) => ({
        name: f.name,
        phone: f.phone,
        relationship: f.relationship,
      })),
    });

    // If an SOS was active, resolve it cleanly without deleting log history
    if (activeIncident) {
      await resolveActiveSos();
    }

    return res;
  };

  return {
    activeIncident,
    assignedIncident,
    incomingOffers,
    isSubmitting,
    isAccepting,
    acceptError,
    isSyncing,
    lifecycleDisplayState,
    triggerSos,
    acceptOffer,
    declineOffer,
    cancelActiveSos,
    resolveActiveSos,
    refreshOffers,
    syncPendingQueue,
    submitSafeCheckIn,
  };
}

