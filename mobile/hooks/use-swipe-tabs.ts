import { useRef, useMemo } from "react";
import { PanResponder, GestureResponderEvent, PanResponderGestureState, Platform, Dimensions } from "react-native";
import { useRouter, usePathname, useSegments } from "expo-router";
import * as Haptics from "expo-haptics";

export const TAB_ROUTES = [
  { name: "index", path: "/(tabs)" },
  { name: "safe", path: "/(tabs)/safe" },
  { name: "beacon", path: "/(tabs)/beacon" },
  { name: "reports", path: "/(tabs)/reports" },
  { name: "ask", path: "/(tabs)/ask" },
] as const;

export type TabName = typeof TAB_ROUTES[number]["name"];

interface UseSwipeTabsOptions {
  enabled?: boolean;
  activeTab?: TabName;
  swipeThreshold?: number;
  edgeOnly?: boolean;
}

/**
 * Universal Swipe Tab Gesture Handler
 * Enables fluid left/right swipe navigation across tabs:
 * Home (index) <-> Maps (safe) <-> Beacon (beacon) <-> Reports (reports) <-> AI Aegis (ask)
 */
export function useSwipeTabs(options: UseSwipeTabsOptions = {}) {
  const {
    enabled = true,
    swipeThreshold = 45,
    edgeOnly = false,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  // Determine current active tab
  const currentTabName = useMemo<TabName>(() => {
    if (options.activeTab) return options.activeTab;

    const segmentTab = segments[segments.length - 1] as string;
    if (segmentTab === "safe") return "safe";
    if (segmentTab === "beacon") return "beacon";
    if (segmentTab === "reports") return "reports";
    if (segmentTab === "ask") return "ask";

    if (pathname.includes("/safe")) return "safe";
    if (pathname.includes("/beacon")) return "beacon";
    if (pathname.includes("/reports")) return "reports";
    if (pathname.includes("/ask")) return "ask";

    return "index";
  }, [options.activeTab, segments, pathname]);

  const currentIndex = TAB_ROUTES.findIndex((t) => t.name === currentTabName);

  const navigateToTab = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= TAB_ROUTES.length) return;
    const target = TAB_ROUTES[targetIndex];

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch {}

    router.replace(target.path as any);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (!enabled) return false;

        const { dx, dy, x0 } = gestureState;
        const screenWidth = Dimensions.get("window").width;

        // If edgeOnly is active, only trigger if swipe starts from the outer edges
        if (edgeOnly && x0 > 60 && x0 < screenWidth - 60) {
          return false;
        }

        // Only capture distinct horizontal swipe gestures (|dx| significantly larger than |dy|)
        const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.6;
        const isSignificant = Math.abs(dx) > 15;

        return isHorizontal && isSignificant;
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (!enabled) return;

        const { dx, vx } = gestureState;
        const isFastSwipe = Math.abs(vx) > 0.35 && Math.abs(dx) > 25;
        const isLongSwipe = Math.abs(dx) > swipeThreshold;

        if (isFastSwipe || isLongSwipe) {
          if (dx < 0) {
            // Swiped Left -> Move to Next Tab (Home -> Maps -> Beacon -> Reports -> AI)
            if (currentIndex >= 0 && currentIndex < TAB_ROUTES.length - 1) {
              navigateToTab(currentIndex + 1);
            }
          } else if (dx > 0) {
            // Swiped Right -> Move to Previous Tab (AI -> Reports -> Beacon -> Maps -> Home)
            if (currentIndex > 0) {
              navigateToTab(currentIndex - 1);
            }
          }
        }
      },
    })
  ).current;

  return {
    panHandlers: enabled ? panResponder.panHandlers : {},
    currentTabName,
    currentIndex,
    goToNextTab: () => navigateToTab(currentIndex + 1),
    goToPrevTab: () => navigateToTab(currentIndex - 1),
    goToTab: (tab: TabName) => {
      const idx = TAB_ROUTES.findIndex((t) => t.name === tab);
      if (idx !== -1) navigateToTab(idx);
    },
  };
}
