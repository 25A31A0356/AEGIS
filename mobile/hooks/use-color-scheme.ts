import { useThemeContext } from "@/lib/theme-provider";

export function useColorScheme() {
  try {
    return useThemeContext().colorScheme;
  } catch {
    return "light";
  }
}

