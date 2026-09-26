import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";
import { useSwipeTabs, TabName } from "@/hooks/use-swipe-tabs";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
  /**
   * Enable horizontal swipe navigation across main tabs (Home <-> Maps <-> Beacon <-> Reports <-> Ask).
   * Default: true
   */
  enableSwipeTabs?: boolean;
  /**
   * Specific active tab name (optional override)
   */
  activeTab?: TabName;
  /**
   * If true, swipe gesture only triggers when starting from screen edges.
   */
  edgeOnlySwipe?: boolean;
}

/**
 * A container component that properly handles SafeArea, background colors,
 * and high-performance horizontal swipe navigation across all main tabs.
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  enableSwipeTabs = true,
  activeTab,
  edgeOnlySwipe = false,
  style,
  ...props
}: ScreenContainerProps) {
  const { panHandlers } = useSwipeTabs({
    enabled: enableSwipeTabs,
    activeTab,
    edgeOnly: edgeOnlySwipe,
  });

  return (
    <View
      className={cn("flex-1 bg-background", containerClassName)}
      {...panHandlers}
      {...props}
    >
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
