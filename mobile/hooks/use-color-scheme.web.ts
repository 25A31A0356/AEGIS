import { useThemeContext } from "@/lib/theme-provider";

/**
 * Returns the active color scheme from ThemeProvider for web
 */
export function useColorScheme() {
  try {
    return useThemeContext().colorScheme;
  } catch {
    return "light";
  }
}

